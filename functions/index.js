const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

// ──────────────────────────────────────────────
// PAYSTACK SECRET KEY
// ──────────────────────────────────────────────
const PAYSTACK_SK = process.env.NODE_ENV === "production"
  ? process.env.PAYSTACK_LIVE_KEY
  : process.env.PAYSTACK_TEST_KEY;

if (!PAYSTACK_SK) {
  throw new Error("❌ PAYSTACK SECRET KEY IS MISSING. Add it to your .env file as PAYSTACK_LIVE_KEY / PAYSTACK_TEST_KEY");
}

console.log("PAYSTACK MODE →", PAYSTACK_SK.includes("sk_live") ? "LIVE" : "TEST");

// ──────────────────────────────────────────────
// EMAIL SETUP (Nodemailer)
// ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ──────────────────────────────────────────────
// RAW BODY CAPTURE HELPER (critical for Paystack webhook signature)
// ──────────────────────────────────────────────
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ──────────────────────────────────────────────
// INITIALIZE PAYSTACK PAYMENT
// ──────────────────────────────────────────────
exports.initializePaystack = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "POST");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  if (req.method !== "POST") return res.status(405).send("Not Allowed");

  try {
    const { email, amount, reference, bookingId } = req.body;
    if (!email || !amount || !reference || !bookingId) {
      return res.status(400).json({ error: "Missing required fields (email, amount, reference, bookingId)" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        reference,
        callback_url: "roomlink://payment-success",
        metadata: {
          bookingId,                    // Main key used by webhook
        },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SK}` } }
    );

    return res.json({ url: response.data.data.authorization_url });
  } catch (err) {
    console.error("Init Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ──────────────────────────────────────────────
// VERIFY PAYSTACK PAYMENT (client-side fallback)
// ──────────────────────────────────────────────
exports.verifyPaystackPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const { reference, bookingId } = data;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SK}` },
    });

    const result = response.data;
    if (result.data.status !== "success") throw new Error("Payment failed");

    await db.collection("bookings").doc(bookingId).update({
      status: "confirmed",
      paymentStatus: "paid",
      paymentReference: reference,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      amountPaid: result.data.amount / 100,
      customerEmail: result.data.customer.email,
    });

    return { success: true };
  } catch (err) {
    console.error("Verify failed:", err.message);
    throw new functions.https.HttpsError("internal", "Payment verification failed");
  }
});

// ──────────────────────────────────────────────
// CREATE VIRTUAL ACCOUNT FOR NEW USERS
// ──────────────────────────────────────────────
exports.createUserVirtualAccount = functions.auth.user().onCreate(async (user) => {
  console.log("🔥 New Auth user created:", user.uid, user.email);

  try {
    const customerRes = await axios.post(
      "https://api.paystack.co/customer",
      { email: user.email, first_name: user.displayName || "User" },
      { headers: { Authorization: `Bearer ${PAYSTACK_SK}`, "Content-Type": "application/json" } }
    );

    const customerCode = customerRes.data.data.customer_code;
    console.log("✅ Paystack customer created:", customerCode);

    const accRes = await axios.post(
      "https://api.paystack.co/dedicated_account",
      {
        customer: customerCode,
        preferred_bank: "titan-paystack",
        currency: "NGN",
        first_name: user.displayName?.split(" ")[0] || "User",
        last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SK}`, "Content-Type": "application/json" } }
    );

    const acc = accRes.data.data;
    console.log("✅ Virtual account created:", acc.account_number);

    await db.collection("wallets").doc(user.uid).set({
      accountNumber: acc.account_number,
      accountName: acc.account_name,
      bankName: acc.bank.name,
      customerCode: customerCode,
      depositBalance: 0,
      earningsBalance: 0,
      totalBalance: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Wallet saved for user:", user.uid);
  } catch (err) {
    console.error("❌ Virtual Account Error:", err.response?.data || err.message);
  }
});

// ──────────────────────────────────────────────
// PAYSTACK WEBHOOK — SECURE & FIXED FOR BOOKINGS
// ──────────────────────────────────────────────
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers["x-paystack-signature"];

    if (!signature) {
      console.error("Webhook: Missing x-paystack-signature header");
      return res.sendStatus(400);
    }

    // Verify signature
    const computedSignature = crypto
      .createHmac("sha512", PAYSTACK_SK)
      .update(rawBody)
      .digest("hex");

    if (computedSignature !== signature) {
      console.error("Webhook: Invalid signature", {
        received: signature.substring(0, 20) + "...",
        computed: computedSignature.substring(0, 20) + "...",
      });
      return res.sendStatus(401);
    }

    // Parse event
    let event;
    try {
      event = JSON.parse(rawBody.toString());
    } catch (parseErr) {
      console.error("Webhook: Invalid JSON payload", parseErr);
      return res.sendStatus(400);
    }

    console.log("Webhook verified → event:", event.event);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100;
      const email = data.customer?.email;
      const metadata = data.metadata || {};
      const bookingId = metadata.bookingId || metadata.orderId; // fallback for old transactions

      console.log("Charge success →", { reference, amount, email, bookingId, metadata });

      // 1. Wallet deposit
      if (email) {
        const snap = await db.collection("users").where("email", "==", email).limit(1).get();
        if (!snap.empty) {
          const userRef = snap.docs[0].ref;
          await userRef.update({
            depositBalance: admin.firestore.FieldValue.increment(amount),
          });

          await db.collection("wallet_logs").add({
            userId: snap.docs[0].id,
            type: "deposit",
            amount,
            reference,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`💰 Wallet credited ₦${amount} for ${email}`);
        }
      }

      // 2. Billboard payment
      if (reference.startsWith("billboard_")) {
        const parts = reference.split("_");
        if (parts.length >= 3) {
          const userId = parts[1];
          await db.doc(`users/${userId}`).set(
            {
              adsPaid: true,
              adsPaidAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          await db.collection("adPayments").add({
            userId,
            reference,
            amount,
            status: "success",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`BILLBOARD UNLOCKED for user ${userId}`);
        }
      }

      // 3. Booking update (hotel/room bookings)
      if (bookingId) {
        const bookingRef = db.collection("bookings").doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (bookingSnap.exists) {
          const current = bookingSnap.data();
          if (current.status === "pending_payment" || current.status === "pending") {
            await bookingRef.update({
              status: "confirmed",
              paymentStatus: "paid",
              paymentReference: reference,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              amountPaid: amount,
              gatewayResponse: data.gateway_response || null,
              paystackTransactionId: data.id || null,
            });
            console.log(`Booking ${bookingId} confirmed & updated (ref: ${reference})`);
          } else {
            console.log(`Booking ${bookingId} already processed (status: ${current.status})`);
          }
        } else {
          console.warn(`Booking not found: ${bookingId}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook general error:", err.message);
    res.sendStatus(200); // always 200 to stop Paystack retries
  }
});

// ──────────────────────────────────────────────
// REPORT SYSTEM
// ──────────────────────────────────────────────
exports.reportListing = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const reporterId = context.auth.uid;
  const { listingId, reason, comment, imageUrl } = data;

  const listingRef = db.doc(`listings/${listingId}`);

  return db.runTransaction(async (tx) => {
    const dup = await tx.get(
      db.collection("reports").where("listingId", "==", listingId).where("reporterId", "==", reporterId).limit(1)
    );

    if (!dup.empty) throw new functions.https.HttpsError("already-exists", "Already reported");

    const reportsSnap = await tx.get(db.collection("reports").where("listingId", "==", listingId));
    const newCount = reportsSnap.size + 1;

    const reportRef = db.collection("reports").doc();
    tx.set(reportRef, {
      listingId,
      reporterId,
      reason,
      comment: comment || null,
      imageUrl: imageUrl || null,
      reportedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
    });

    if (newCount >= 7) {
      tx.update(listingRef, {
        hidden: true,
        hiddenAt: admin.firestore.FieldValue.serverTimestamp(),
        hiddenReason: "too_many_reports",
      });
    }

    return { success: true };
  });
});

// ──────────────────────────────────────────────
// CHAT PUSH NOTIFICATIONS (using fcmToken)
// ──────────────────────────────────────────────
exports.sendChatNotification = functions
  .region("europe-west2")
  .firestore
  .document("messages/{msgId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { senderId, receiverId, content, type, listingId } = message;

    if (!receiverId || senderId === receiverId) return null;

    try {
      const recipientSnap = await db.doc(`users/${receiverId}`).get();
      const token = recipientSnap.data()?.fcmToken;

      if (!token) {
        console.log(`No fcmToken for user ${receiverId}`);
        return null;
      }

      const senderSnap = await db.doc(`users/${senderId}`).get();
      const senderName = senderSnap.data()?.displayName || "Someone";

      const payload = {
        notification: {
          title: `New message from ${senderName}`,
          body: type === "image" ? "Sent an image" : (content || "").substring(0, 100),
          sound: "default",
          badge: "1",
        },
        data: {
          type: "message",
          screen: "Messages",
          params: JSON.stringify({ listingId }),
        },
        apns: { payload: { aps: { contentAvailable: true } } },
        android: { priority: "high" },
        token,
      };

      await admin.messaging().send(payload);
      console.log(`Chat notification sent successfully to ${receiverId}`);
    } catch (error) {
      console.error("Error sending chat notification:", error.code, error.message);

      if (error.code === "messaging/registration-token-not-registered" ||
          error.code === "messaging/invalid-registration-token") {
        await db.doc(`users/${receiverId}`).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
        console.log(`Removed invalid fcmToken for ${receiverId}`);
      }
    }
  });

// ──────────────────────────────────────────────
// COMMENT / REPLY NOTIFICATIONS (using fcmToken)
// ──────────────────────────────────────────────
exports.notifyOnNewComment = functions
  .region("europe-west2")
  .firestore
  .document("listings/{listingId}/comments/{commentId}")
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const listingId = context.params.listingId;
    const commentId = context.params.commentId;

    console.log(`[COMMENT] New comment/reply created: ${commentId} on listing ${listingId} by ${comment.userName || "Unknown"}`);

    if (!comment.text || !comment.userId) return null;

    try {
      const listingSnap = await db.doc(`listings/${listingId}`).get();
      if (!listingSnap.exists) {
        console.log(`[COMMENT] Listing ${listingId} not found`);
        return null;
      }

      const ownerId = listingSnap.data().userId;
      if (!ownerId || ownerId === comment.userId) {
        console.log(`[COMMENT] No owner or self-comment - skipping`);
      } else {
        const ownerSnap = await db.doc(`users/${ownerId}`).get();
        const ownerToken = ownerSnap.data()?.fcmToken;

        if (ownerToken) {
          const isReply = !!comment.replyToCommentId;
          const title = isReply ? "New Reply on Your Listing" : "New Comment on Your Listing";
          const body = `${comment.userName || "Someone"}: ${comment.text.substring(0, 60)}${comment.text.length > 60 ? "..." : ""}`;

          const payload = {
            notification: { title, body },
            data: {
              type: isReply ? "reply" : "comment",
              listingId,
              commentId,
            },
            android: { priority: "high" },
            apns: { headers: { "apns-priority": "10" } },
            token: ownerToken,
          };

          await admin.messaging().send(payload);
          console.log(`[COMMENT] Notification sent to owner ${ownerId}`);
        }
      }

      if (comment.replyToCommentId) {
        const parentSnap = await db.doc(`listings/${listingId}/comments/${comment.replyToCommentId}`).get();
        if (parentSnap.exists) {
          const parentAuthorId = parentSnap.data().userId;
          if (parentAuthorId && parentAuthorId !== comment.userId) {
            const parentUserSnap = await db.doc(`users/${parentAuthorId}`).get();
            const parentToken = parentUserSnap.data()?.fcmToken;

            if (parentToken) {
              const payload = {
                notification: {
                  title: "New Reply to Your Comment",
                  body: `${comment.userName || "Someone"} replied: ${comment.text.substring(0, 60)}${comment.text.length > 60 ? "..." : ""}`,
                },
                data: {
                  type: "reply",
                  listingId,
                  commentId,
                },
                android: { priority: "high" },
                apns: { headers: { "apns-priority": "10" } },
                token: parentToken,
              };

              await admin.messaging().send(payload);
              console.log(`[COMMENT] Reply notification sent to ${parentAuthorId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("[COMMENT] Notification error:", error.code, error.message);
    }

    return null;
  });

// ──────────────────────────────────────────────
// EVENT SCHEDULING NOTIFICATION (NEW)
// Sends push to host when tenant schedules an event
// ──────────────────────────────────────────────
exports.notifyHostOnEventSchedule = functions
  .region("europe-west2")
  .firestore
  .document("events/{eventId}")
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const eventId = context.params.eventId;

    const {
      listingId,
      listingTitle,
      tenantId,
      tenantName,
      hostId,
      title,
      notes,
      phoneNumber,
      dateTime,
    } = event;

    if (!hostId || !tenantId || hostId === tenantId) {
      console.log("Invalid event: missing hostId or self-schedule");
      return null;
    }

    try {
      const hostSnap = await db.doc(`users/${hostId}`).get();
      const hostToken = hostSnap.data()?.fcmToken;

      if (!hostToken) {
        console.log(`No fcmToken for host ${hostId}`);
        return null;
      }

      const eventDate = new Date(dateTime.seconds * 1000);
      const formattedDate = eventDate.toLocaleString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const payload = {
        notification: {
          title: "New Event Request",
          body: `${tenantName || "A tenant"} requested to view "${listingTitle || "your property"}" on ${formattedDate}`,
        },
        data: {
          type: "event_request",
          eventId,
          listingId,
          tenantId,
          phoneNumber: phoneNumber || "Not provided",
        },
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" } },
        token: hostToken,
      };

      await admin.messaging().send(payload);
      console.log(`Event schedule notification sent to host ${hostId} for event ${eventId}`);

      // Optional: Confirmation to tenant
      const tenantSnap = await db.doc(`users/${tenantId}`).get();
      const tenantToken = tenantSnap.data()?.fcmToken;

      if (tenantToken) {
        const tenantPayload = {
          notification: {
            title: "Event Request Sent",
            body: `Your viewing request for "${listingTitle}" has been sent to the host!`,
          },
          data: { type: "event_sent", eventId },
          android: { priority: "high" },
          token: tenantToken,
        };
        await admin.messaging().send(tenantPayload);
        console.log(`Confirmation sent to tenant ${tenantId}`);
      }
    } catch (error) {
      console.error("Event notification error:", error.code, error.message);

      if (error.code === "messaging/registration-token-not-registered" ||
          error.code === "messaging/invalid-registration-token") {
        await db.doc(`users/${hostId}`).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
        console.log(`Removed invalid fcmToken for host ${hostId}`);
      }
    }

    return null;
  });

// ──────────────────────────────────────────────
// CONTACT FORM SUBMISSION
// ──────────────────────────────────────────────
exports.submitContact = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await db.collection("contact_submissions").add({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      source: "website",
    });

    console.log(`New contact from ${email}`);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"RoomLink Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Contact Message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>`,
      });
    }

    return res.status(200).json({ success: true, message: "Message received!" });
  } catch (error) {
    console.error("Contact error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// MAILER SEND OTP FOR SIGNUP / EMAIL VERIFICATION
// ──────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendSignupOTP = functions.https.onCall(async (data, context) => {
  const { email, name } = data;

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }

  const otp = generateOTP();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000);

  await db.collection("otps").doc(email).set({
    otp,
    expiresAt,
    attempts: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const mailRef = db.collection("emails").doc();
  await mailRef.set({
    to: [
      {
        email: email.trim(),
        name: name || "User"
      }
    ],
    personalization: [
      {
        email: email.trim(),
        data: {
          otp: otp,
          name: name || "User",
          app_name: "RoomLink"
        }
      },
    ],
  });

  console.log(`OTP ${otp} queued for ${email} (name: ${name || "User"})`);

  return {
    success: true,
    message: "OTP sent! Check your email (and spam folder)."
  };
});

exports.verifySignupOTP = functions.https.onCall(async (data, context) => {
  const { email, otp } = data;

  if (!email || !otp) {
    throw new functions.https.HttpsError("invalid-argument", "Email and OTP are required");
  }

  const otpRef = db.collection("otps").doc(email);
  const otpDoc = await otpRef.get();

  if (!otpDoc.exists) {
    throw new functions.https.HttpsError("not-found", "No active OTP found for this email");
  }

  const stored = otpDoc.data();

  if (stored.expiresAt.toMillis() < Date.now()) {
    await otpRef.delete();
    throw new functions.https.HttpsError("deadline-exceeded", "OTP has expired");
  }

  if (stored.otp !== otp.trim()) {
    await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new functions.https.HttpsError("invalid-argument", "Invalid OTP");
  }

  const userId = context.auth?.uid || email;

  await db.collection("users").doc(userId).set(
    {
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await otpRef.delete();

  return {
    success: true,
    message: "Email verified successfully!"
  };
});

// ──────────────────────────────────────────────
// WELCOME EMAIL ON NEW USER CREATION (via MailerSend extension)
// ──────────────────────────────────────────────
exports.sendWelcomeEmail = functions
  .region("europe-west2")
  .auth.user()
  .onCreate(async (user) => {
    if (!user.email) {
      console.log("No email found for new user → skipping welcome email");
      return null;
    }

    const displayName = user.displayName || "New RoomLink User";

    const welcomeDoc = {
      to: [
        {
          email: user.email,
          name: displayName
        }
      ],
      template_id: "x2p0347j5yk4zdrn",
      personalization: [
        {
          email: user.email,
          data: {
            otp: "N/A",
            name: displayName,
            app_name: "RoomLink"
          },
        },
      ],
    };

    const collectionName = "emails";

    try {
      await db.collection(collectionName).add(welcomeDoc);
      console.log(`Welcome email queued for ${user.email} (UID: ${user.uid})`);
    } catch (error) {
      console.error("Error queuing welcome email:", error);
    }

    return null;
  });
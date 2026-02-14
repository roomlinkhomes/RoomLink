const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config(); // Load .env

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
// INITIALIZE PAYSTACK PAYMENT
// ──────────────────────────────────────────────
exports.initializePaystack = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "POST");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  if (req.method !== "POST") return res.status(405).send("Not Allowed");

  try {
    const { email, amount, reference, orderId } = req.body;
    if (!email || !amount || !reference) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      { email, amount, reference, callback_url: "roomlink://payment-success", metadata: { orderId } },
      { headers: { Authorization: `Bearer ${PAYSTACK_SK}` } }
    );

    return res.json({ url: response.data.data.authorization_url });
  } catch (err) {
    console.error("Init Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ──────────────────────────────────────────────
// VERIFY PAYSTACK PAYMENT
// ──────────────────────────────────────────────
exports.verifyPaystackPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const { reference, orderId } = data;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SK}` },
    });

    const result = response.data;
    if (result.data.status !== "success") throw new Error("Payment failed");

    await db.collection("orders").doc(orderId).update({
      status: "paid",
      paymentReference: reference,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      customerEmail: result.data.customer.email,
      amountPaid: result.data.amount / 100,
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
// PAYSTACK WEBHOOK
// ──────────────────────────────────────────────
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const event = req.body;

  try {
    console.log("Webhook received:", event.event);

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const amount = event.data.amount / 100;
      console.log("Payment success:", reference, "Amount: ₦" + amount);

      const email = event.data.customer.email;
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`💰 Wallet credited for ${email} with ₦${amount}`);
      }

      if (reference.startsWith("billboard_")) {
        const parts = reference.split("_");
        if (parts.length >= 3) {
          const userId = parts[1];
          console.log("Billboard payment detected. Unlocking for user:", userId);

          await db.doc(`users/${userId}`).set(
            {
              adsPaid: true,
              adsPaidAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log(`BILLBOARD UNLOCKED for user ${userId}`);

          await db.collection("adPayments").add({
            userId,
            reference,
            amount,
            status: "success",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.sendStatus(500);
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
// CHAT PUSH NOTIFICATIONS (your existing one - untouched)
// ──────────────────────────────────────────────
exports.sendChatNotification = functions.firestore
  .document("messages/{msgId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { senderId, receiverId, content, type, listingId } = message;

    if (!receiverId || senderId === receiverId) return null;

    try {
      // Get recipient's token
      const recipientSnap = await db.doc(`users/${receiverId}`).get();
      const token = recipientSnap.data()?.pushToken;
      if (!token) {
        console.log(`No push token for user ${receiverId}`);
        return null;
      }

      // Get sender details
      const senderSnap = await db.doc(`users/${senderId}`).get();
      const senderName = senderSnap.data()?.displayName || 'Someone';

      const payload = {
        notification: {
          title: `New message from ${senderName}`,
          body: type === 'image' ? 'Sent an image' : (content || '').substring(0, 100),
          sound: 'default',
          badge: '1',
        },
        data: {
          type: 'message',
          screen: 'Messages',
          params: JSON.stringify({ listingId }),
        },
        apns: { payload: { aps: { contentAvailable: true } } },
        android: { priority: 'high' },
        token,
      };

      await admin.messaging().send(payload);
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });

// ──────────────────────────────────────────────
// NEW: COMMENT / REPLY NOTIFICATIONS (added now)
// ──────────────────────────────────────────────
exports.notifyOnNewComment = functions.firestore
  .document("listings/{listingId}/comments/{commentId}")
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const listingId = context.params.listingId;
    const commentId = context.params.commentId;

    console.log(`[COMMENT] New comment/reply created: ${commentId} on listing ${listingId} by ${comment.userName}`);

    // Skip if no text or no user
    if (!comment.text || !comment.userId) return null;

    try {
      // 1. Get listing owner
      const listingSnap = await db.doc(`listings/${listingId}`).get();
      if (!listingSnap.exists) {
        console.log(`[COMMENT] Listing ${listingId} not found`);
        return null;
      }

      const ownerId = listingSnap.data().userId;
      if (!ownerId || ownerId === comment.userId) {
        console.log(`[COMMENT] No owner or self-comment - skipping owner notification`);
      } else {
        // Get owner's push token
        const ownerSnap = await db.doc(`users/${ownerId}`).get();
        const ownerToken = ownerSnap.data()?.pushToken;

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
          console.log(`[COMMENT] Notification sent to listing owner ${ownerId}`);
        } else {
          console.log(`[COMMENT] Owner ${ownerId} has no pushToken`);
        }
      }

      // 2. If it's a reply → notify the person being replied to
      if (comment.replyToCommentId) {
        const parentSnap = await db.doc(`listings/${listingId}/comments/${comment.replyToCommentId}`).get();
        if (parentSnap.exists) {
          const parentAuthorId = parentSnap.data().userId;

          if (parentAuthorId && parentAuthorId !== comment.userId) {
            const parentUserSnap = await db.doc(`users/${parentAuthorId}`).get();
            const parentToken = parentUserSnap.data()?.pushToken;

            if (parentToken) {
              const title = "New Reply to Your Comment";
              const body = `${comment.userName || "Someone"} replied: ${comment.text.substring(0, 60)}${comment.text.length > 60 ? "..." : ""}`;

              const payload = {
                notification: { title, body },
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
            } else {
              console.log(`[COMMENT] Replied-to user ${parentAuthorId} has no pushToken`);
            }
          }
        }
      }

    } catch (error) {
      console.error("[COMMENT] Notification error:", error);
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

    // Optional: Send email notification
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
  // Optional: uncomment if you want only authenticated users to request OTP
  // if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

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
          app_name: "RoomLink"  // adjust if your template uses a different variable name
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

  // OTP correct → mark user as verified
  // Change collection/doc path to match your actual users setup
  const userId = context.auth?.uid || email; // fallback to email if no auth context
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
  .region("europe-west2")  // ← Change only if your extension was installed in a different region
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

      // Recommended: Use a MailerSend template
      template_id: "x2p0347j5yk4zdrn", // ← your template ID (keep or update)
      personalization: [
        {
          email: user.email,
          data: {
            otp: otp,
            name: displayName,
            app_name: "RoomLink"
          },
        },
      ],
    };

    const collectionName = "emails"; // ← Confirm this is the same as in your extension config

    try {
      await db.collection(collectionName).add(welcomeDoc);
      console.log(`Welcome email queued for ${user.email} (UID: ${user.uid})`);
    } catch (error) {
      console.error("Error queuing welcome email:", error);
    }

    return null;
  });
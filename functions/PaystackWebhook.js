const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Helper to read raw body (required for signature verification)
const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
};

exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    console.log("Invalid method:", req.method);
    return res.status(405).send("Method Not Allowed");
  }

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error("Failed to read raw body:", err);
    return res.sendStatus(400);
  }

  // Get secret key from Firebase config (set with: firebase functions:config:set paystack.secret="sk_...")
  const secret = functions.config().paystack?.secret;
  if (!secret) {
    console.error("Paystack secret not configured. Run: firebase functions:config:set paystack.secret='sk_...'");
    return res.sendStatus(500);
  }

  // Verify Paystack signature using RAW body
  const computedHash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  const receivedSignature = req.headers["x-paystack-signature"];

  if (computedHash !== receivedSignature) {
    console.error("Invalid Paystack signature", {
      received: receivedSignature ? receivedSignature.substring(0, 20) + "..." : "missing",
      computed: computedHash.substring(0, 20) + "...",
    });
    return res.status(401).send("Invalid signature");
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    console.error("Invalid JSON in webhook payload:", err);
    return res.sendStatus(400);
  }

  console.log("Webhook verified → event:", event.event);

  if (event.event === "charge.success") {
    const data = event.data;
    const reference = data.reference;
    const amountNgn = data.amount / 100;
    const email = data.customer?.email || "unknown";
    const metadata = data.metadata || {};
    const bookingIdFromMeta = metadata.bookingId || metadata.orderId;

    console.log("Payment success:", {
      reference,
      amount: amountNgn,
      email,
      bookingIdFromMeta,
      metadata,
    });

    // ──────────────────────────────────────────────
    // 1. Try to update booking by bookingId from metadata
    // ──────────────────────────────────────────────
    let bookingUpdated = false;

    if (bookingIdFromMeta) {
      const bookingRef = db.collection("bookings").doc(bookingIdFromMeta);
      try {
        const bookingSnap = await bookingRef.get();
        if (bookingSnap.exists) {
          const current = bookingSnap.data();
          if (["pending_payment", "pending"].includes(current.status?.toLowerCase())) {
            await bookingRef.update({
              status: "confirmed",
              paymentStatus: "paid",
              paymentReference: reference,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              amountPaid: amountNgn,
              gatewayResponse: data.gateway_response || null,
              paystackTransactionId: data.id || null,
            });
            console.log(`SUCCESS: Booking ${bookingIdFromMeta} updated to confirmed (ref: ${reference})`);
            bookingUpdated = true;
          } else {
            console.log(`Booking ${bookingIdFromMeta} already processed (status: ${current.status})`);
          }
        } else {
          console.warn(`Booking not found by ID: ${bookingIdFromMeta}`);
        }
      } catch (err) {
        console.error("Error updating booking by ID:", err);
      }
    }

    // ──────────────────────────────────────────────
    // 2. Fallback: Search for booking by paymentReference (if metadata missing)
    // ──────────────────────────────────────────────
    if (!bookingUpdated) {
      console.log("No bookingId in metadata → searching by paymentReference:", reference);
      try {
        const bookingsSnap = await db.collection("bookings")
          .where("paymentReference", "==", reference)
          .limit(1)
          .get();

        if (!bookingsSnap.empty) {
          const bookingRef = bookingsSnap.docs[0].ref;
          const current = bookingsSnap.docs[0].data();

          if (["pending_payment", "pending"].includes(current.status?.toLowerCase())) {
            await bookingRef.update({
              status: "confirmed",
              paymentStatus: "paid",
              paymentReference: reference,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              amountPaid: amountNgn,
              gatewayResponse: data.gateway_response || null,
            });
            console.log(`SUCCESS: Booking found & updated via reference ${reference}`);
          } else {
            console.log(`Booking already processed (status: ${current.status})`);
          }
        } else {
          console.warn(`No booking found for reference: ${reference}`);
        }
      } catch (err) {
        console.error("Fallback search/update failed:", err);
      }
    }

    // ──────────────────────────────────────────────
    // 3. Wallet deposit (your existing logic)
    // ──────────────────────────────────────────────
    if (email !== "unknown") {
      try {
        const userSnap = await db.collection("users")
          .where("email", "==", email)
          .limit(1)
          .get();

        if (!userSnap.empty) {
          const userRef = userSnap.docs[0].ref;
          await userRef.update({
            depositBalance: admin.firestore.FieldValue.increment(amountNgn),
          });

          await db.collection("wallet_logs").add({
            userId: userSnap.docs[0].id,
            type: "deposit",
            amount: amountNgn,
            reference,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`Wallet credited ₦${amountNgn} for ${email}`);
        }
      } catch (err) {
        console.error("Wallet update failed:", err);
      }
    }

    // ──────────────────────────────────────────────
    // 4. Billboard unlock (your existing logic)
    // ──────────────────────────────────────────────
    if (reference.startsWith("billboard_")) {
      const parts = reference.split("_");
      if (parts.length >= 3) {
        const userId = parts[1];
        console.log("Billboard payment → unlocking ads for:", userId);

        try {
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
            amount: amountNgn,
            status: "success",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`Billboard unlocked for user ${userId}`);
        } catch (err) {
          console.error("Billboard unlock failed:", err);
        }
      }
    }
  } else {
    console.log("Non-success event ignored:", event.event);
  }

  // ALWAYS respond 200 — Paystack will retry forever if you don't
  return res.sendStatus(200);
});
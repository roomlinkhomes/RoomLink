const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify Paystack signature
  const secret = functions.config().paystack.secret;
  if (!secret) {
    console.error("Paystack secret not set. Run: firebase functions:config:set paystack.secret='sk_live_...'");
    return res.status(500).send("Server configuration error");
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.log("Invalid Paystack signature");
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const reference = event.data.reference;
    console.log("Payment success received for reference:", reference);

    // 1. Update regular order if exists
    try {
      const ordersSnapshot = await db.collection("orders")
        .where("paymentReference", "==", reference)
        .get();

      if (!ordersSnapshot.empty) {
        const orderDoc = ordersSnapshot.docs[0].ref;
        await orderDoc.update({
          status: "paid",
          paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("Regular order marked as PAID:", reference);
      } else {
        console.log("No regular order found for reference:", reference);
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }

    // 2. UNLOCK BILLBOARD for billboard payments
    if (reference.startsWith("billboard_")) {
      const parts = reference.split("_");
      if (parts.length >= 3) {
        const userId = parts[1];
        console.log("Billboard payment detected. Unlocking for user:", userId);

        try {
          await db.doc(`users/${userId}`).set(
            {
              adsPaid: true,
              adsPaidAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`SUCCESS: adsPaid = true set for user ${userId}`);

          // Log ad payment
          await db.collection("adPayments").add({
            userId,
            reference,
            amount: event.data.amount / 100,
            status: "success",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log("Ad payment logged");
        } catch (error) {
          console.error("FAILED to unlock billboard for user:", userId, error);
        }
      } else {
        console.log("Invalid billboard reference format:", reference);
      }
    }
  } else {
    console.log("Ignored event:", event.event);
  }

  // Always respond 200 to Paystack
  return res.sendStatus(200);
});
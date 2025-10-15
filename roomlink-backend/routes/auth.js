// routes/auth.js
const express = require("express");
const admin = require("../firebase");
const axios = require("axios");

const router = express.Router();

/**
 * ✅ SIGNUP (unchanged)
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const userRecord = await admin.auth().createUser({ email, password });

    const actionCodeSettings = {
      url: "http://localhost:3000/login",
      handleCodeInApp: false,
    };

    const link = await admin
      .auth()
      .generateEmailVerificationLink(email, actionCodeSettings);

    console.log("👉 Verification link:", link);

    return res.status(201).json({
      message: "User created. Verification email link generated.",
      uid: userRecord.uid,
      link,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ LOGIN (new flow)
 * Frontend sends: { email, password }
 * Backend logs user in using Firebase REST API
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // 🔹 Sign in via Firebase REST API
    const firebaseResp = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, localId } = firebaseResp.data;

    // 🔹 Verify the token using Admin SDK
    const decoded = await admin.auth().verifyIdToken(idToken);

    const user = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
    };

    return res.status(200).json({
      message: "Login successful",
      token: idToken,
      ...user,
    });
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    return res.status(401).json({
      error:
        error.response?.data?.error?.message ||
        "Invalid email or password.",
    });
  }
});

module.exports = router;

// utils/claimUsername.js
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig"; // adjust path if needed

/**
 * Atomically claims a username and attaches it to the user document.
 * Creates the user doc if it doesn't exist yet.
 * 
 * @param {string} username - The desired username (will be cleaned/lowercased)
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export const claimUsername = async (username) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user");
  }

  const uid = user.uid;
  const cleanUsername = username.trim().toLowerCase();

  if (cleanUsername.length < 5) {
    throw new Error("Username must be at least 5 characters");
  }

  // Optional: stricter validation (you can expand this)
  if (!/^[a-z][a-z0-9_]{4,}$/.test(cleanUsername)) {
    throw new Error("Username must start with a lowercase letter and contain only letters, numbers, or underscore");
  }

  const usernameRef = doc(db, "usernames", cleanUsername);
  const userRef = doc(db, "users", uid);

  try {
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);

      if (usernameDoc.exists()) {
        throw new Error("USERNAME_TAKEN");
      }

      // Reserve the username
      transaction.set(usernameRef, {
        uid,
        createdAt: serverTimestamp(),
      });

      // Create or update the user document safely
      transaction.set(
        userRef,
        {
          username: cleanUsername,
          updatedAt: serverTimestamp(),
          // If you want to preserve / add other fields, do it here
          // (merge: true prevents overwriting unrelated existing fields)
        },
        { merge: true }
      );
    });

    return { success: true };
  } catch (error) {
    if (error.message === "USERNAME_TAKEN") {
      return { success: false, message: "Username already taken" };
    }
    console.error("claimUsername transaction failed:", error);
    throw error; // let caller handle other errors
  }
};
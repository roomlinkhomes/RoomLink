import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

async function claimUsername(username) {
  const uid = auth.currentUser.uid;
  const cleanUsername = username.trim().toLowerCase();

  const usernameRef = doc(db, "usernames", cleanUsername);
  const userRef = doc(db, "users", uid);

  try {
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);

      if (usernameDoc.exists()) {
        throw "USERNAME_TAKEN";
      }

      transaction.set(usernameRef, {
        uid,
        createdAt: serverTimestamp(),
      });

      transaction.update(userRef, {
        username: cleanUsername,
      });
    });

    return { success: true };
  } catch (error) {
    if (error === "USERNAME_TAKEN") {
      return { success: false, message: "Username already taken" };
    }
    throw error;
  }
}

export { claimUsername };

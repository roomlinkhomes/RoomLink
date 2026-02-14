// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyATm08xqtzXsiftaxlq9zvB7pPPXaePDTI",
  authDomain: "roomlink-homes.firebaseapp.com",
  projectId: "roomlink-homes",
  storageBucket: "roomlink-homes.appspot.com",
  messagingSenderId: "796064439495",
  appId: "1:796064439495:web:6b99c970d933238967f2e2",
  measurementId: "G-3G5QVNNR7K",
};

// ✅ Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
	

// firebaseConfig.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyATm08xqtzXsiftaxlq9zvB7pPPXaePDTI",
  authDomain: "roomlink-homes.firebaseapp.com",
  projectId: "roomlink-homes",
  storageBucket: "roomlink-homes.firebasestorage.app",
  messagingSenderId: "796064439495",
  appId: "1:796064439495:web:6b99c970d933238967f2e2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Use persistent auth for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

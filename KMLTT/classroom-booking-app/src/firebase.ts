// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzB-WpwF24Qx4G5csIOSGaYAD5WKK2Q4U",
  authDomain: "classroombooking-website.firebaseapp.com",
  projectId: "classroombooking-website",
  storageBucket: "classroombooking-website.firebasestorage.app",
  messagingSenderId: "802218541431",
  appId: "1:802218541431:web:cbb5025c1f268c280aa172",
  measurementId: "G-9GNRVLQGQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreDb = getFirestore(app);

export { app, auth, firestoreDb };

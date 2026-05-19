// firebase.js

import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_I5dVLV35j-RXc3CZjxRLLsm8yPP6_MY",
  authDomain: "findash-pribadi.firebaseapp.com",
  projectId: "findash-pribadi",
  storageBucket: "findash-pribadi.firebasestorage.app",
  messagingSenderId: "734509736596",
  appId: "1:734509736596:web:68d4780792128497908a81"
};


const app = initializeApp(firebaseConfig);

// FIRESTORE
export const db = getFirestore(app);

// AUTH
export const auth = getAuth(app);
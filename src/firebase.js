// firebase.js

import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth";


// api untuk penggunaan pribadi
const firebaseConfig = {
  apiKey: "AIzaSyD_I5dVLV35j-RXc3CZjxRLLsm8yPP6_MY",
  authDomain: "findash-pribadi.firebaseapp.com",
  projectId: "findash-pribadi",
  storageBucket: "findash-pribadi.firebasestorage.app",
  messagingSenderId: "734509736596",
  appId: "1:734509736596:web:68d4780792128497908a81"
};

// api untuk penggunaan public
// const firebaseConfig = {
//     apiKey: "AIzaSyDR-5YoFeUCoA9C5ZK_VgTEqJfbQ4CZ9QU",
//     authDomain: "portofolio-9a0e4.firebaseapp.com",
//     projectId: "portofolio-9a0e4",
//     storageBucket: "portofolio-9a0e4.firebasestorage.app",
//     messagingSenderId: "310533678422",
//     appId: "1:310533678422:web:b837f06c104a0807e3a2f7"
// };

const app = initializeApp(firebaseConfig);

// FIRESTORE
export const db = getFirestore(app);

// AUTH
export const auth = getAuth(app);
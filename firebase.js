import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPBYW-SiAH5-QKw3jvNLgbJie3MUmi8sU",
  authDomain: "digital-attendance-manag-845ea.firebaseapp.com",
  projectId: "digital-attendance-manag-845ea",
  storageBucket: "digital-attendance-manag-845ea.firebasestorage.app",
  messagingSenderId: "590180443705",
  appId: "1:590180443705:web:d4ad6c2225baf212b0cfe8",
  measurementId: "G-K2VKBN4LYP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
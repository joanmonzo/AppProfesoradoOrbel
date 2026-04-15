import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBQ0RXZMaRIeDLfA7TJNi9YiAeYFl1YEuY",
  authDomain: "appprofesorado.firebaseapp.com",
  projectId: "appprofesorado",
  storageBucket: "appprofesorado.firebasestorage.app",
  messagingSenderId: "579306310987",
  appId: "1:579306310987:web:bacd2e54828bd6c5e0ecce",
  measurementId: "G-BSP556P3J7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const analytics = getAnalytics(app);
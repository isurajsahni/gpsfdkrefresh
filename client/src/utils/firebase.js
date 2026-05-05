import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB0L41Eycq725nZf5GLMaKr6xZE2WYAqSk",
  authDomain: "gpsfdk-b8032.firebaseapp.com",
  projectId: "gpsfdk-b8032",
  storageBucket: "gpsfdk-b8032.firebasestorage.app",
  messagingSenderId: "673485436726",
  appId: "1:673485436726:web:5c22e66f1e109164c96597",
  measurementId: "G-TMW9GYPS5S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0S70IlVSW8tzBnMHJTONdjd4PDnXpG7c",
  authDomain: "jcikl-account.firebaseapp.com",
  projectId: "jcikl-account",
  storageBucket: "jcikl-account.firebasestorage.app",
  messagingSenderId: "337297956797",
  appId: "1:337297956797:web:7cf09cb5972f5b83afbcd4",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const auth = getAuth(app)

export { app, db, auth }

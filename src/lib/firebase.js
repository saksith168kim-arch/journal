import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyALBeJkLAdXRvf8BWK49M01Xjk-ee644Dg",
  authDomain: "journal-8916f.firebaseapp.com",
  projectId: "journal-8916f",
  storageBucket: "journal-8916f.firebasestorage.app",
  messagingSenderId: "513959791576",
  appId: "1:513959791576:web:82fa909d75e61ade8a80ad",
  measurementId: "G-NKW3117218",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

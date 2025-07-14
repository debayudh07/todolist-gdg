/*eslint-disable*/
"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBdM1km1gJnoPCiyF3f7vQxJS3KQ0bFwJ8",
  authDomain: "blog-app-342b7.firebaseapp.com",
  projectId: "blog-app-342b7",
  storageBucket: "blog-app-342b7.firebasestorage.app",
  messagingSenderId: "573507840144",
  appId: "1:573507840144:web:c20cbc544b911513169015",
  measurementId: "G-QRZV27L6F3",
}

/* ------------------------------------------------------------------
   ❗ We mark this file with `"use client"` so it is evaluated only in
   the browser bundle.  That prevents SSR from touching browser-only
   SDKs (Auth/Analytics/Firestore) and avoids registration errors.
------------------------------------------------------------------ */

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

/* Auth (browser only) */
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

/* Firestore (browser only) */
export const db = getFirestore(app)

/* Storage (browser only) */
export const storage = getStorage(app)

/* Analytics (optional, browser only) */
export let analytics: ReturnType<typeof getAnalytics> | null = null
if (typeof window !== "undefined") {
  /* `isSupported` prevents crashes on unsupported browsers/environments */
  isSupported().then((ok: any) => {
    if (ok) analytics = getAnalytics(app)
  })
}

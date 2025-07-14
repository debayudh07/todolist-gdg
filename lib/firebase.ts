/*eslint-disable*/
"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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

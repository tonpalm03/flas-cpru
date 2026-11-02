/**
 * Firebase ของเว็บคณะ (โปรเจกต์เดียวกับระบบหลัก) — ระบบแผนใช้ login, Firestore และ Storage ชุดเดียวกัน
 * ค่ามาจาก .env.local ของเว็บหลัก (vite.config.ts: envDir '..', envPrefix NEXT_PUBLIC_FIREBASE_)
 */
import { getApp, getApps, initializeApp } from "firebase/app"
import { connectAuthEmulator, getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"
import { connectStorageEmulator, getStorage } from "firebase/storage"

const env = import.meta.env

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// ทดสอบในเครื่องกับ Firebase emulator (firebase.admin-test.json) — ตั้ง VITE_FIREBASE_EMULATOR=1 ตอนรัน vite dev เท่านั้น
if (import.meta.env.DEV && env.VITE_FIREBASE_EMULATOR === "1") {
  connectAuthEmulator(auth, "http://127.0.0.1:9097", { disableWarnings: true })
  connectFirestoreEmulator(db, "127.0.0.1", 8087)
  connectStorageEmulator(storage, "127.0.0.1", 9197)
}

let ready: Promise<User | null> | null = null

/** ผู้ใช้ที่ login อยู่ หลัง Firebase อ่าน login เดิมจากเบราว์เซอร์เสร็จแล้ว (ก่อนนั้น currentUser ยังเป็น null) */
export function authReady(): Promise<User | null> {
  if (!ready) {
    ready = new Promise((resolve) => {
      const stop = onAuthStateChanged(auth, (user) => {
        stop()
        resolve(user)
      })
    })
  }
  return ready.then(() => auth.currentUser)
}

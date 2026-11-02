/**
 * ผู้ใช้ของระบบแผน = บัญชีของเว็บคณะ (Firestore users/{uid}) — ไม่มีบัญชีแยก
 * บทบาทของระบบแผนแปลงจากยศในระบบหลัก (ตรงกับ isPlanOfficer / canViewAllPlans ใน firestore.rules)
 */
import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import type { User } from "firebase/auth"
import type { SessionUser } from "../lib/currentUser"
import type { Role } from "../types/plan"
import { db } from "./firebase"

export const FACULTY_NAME = "คณะศิลปศาสตร์และวิทยาศาสตร์"

type Profile = Record<string, any>

/** แผนงาน/แอดมิน → เจ้าหน้าที่แผน · คณบดี → คณบดี · รองคณบดี/ผู้บริหาร → ดูภาพรวม (ลงนามบนกระดาษ) · อื่น ๆ → อาจารย์ผู้เสนอโครงการ */
export function planRole(profile: Profile): Role {
  const roles: string[] = Array.isArray(profile.roles) ? profile.roles : []
  if (["admin", "staff_plan"].includes(profile.role) || roles.some((r) => r === "แอดมิน" || r === "แผนงาน")) return "officer"
  if (profile.role === "dean" || roles.includes("คณบดี")) return "dean"
  if (roles.some((r) => r === "รองคณบดี" || r === "ผู้บริหาร")) return "plan_head"
  return "teacher"
}

/** SessionUser.id ของระบบเดิมเป็นตัวเลข — ใช้ค่าที่คงที่ต่อบัญชีจาก uid */
function numericId(uid: string): number {
  let hash = 0
  for (const char of uid) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash)
}

export function toSessionUser(uid: string, profile: Profile, email = ""): SessionUser {
  const mail = String(profile.email || email || "")
  return {
    id: numericId(uid),
    username: mail.split("@")[0] || uid,
    display_name: String(profile.name || profile.signatureName || mail.split("@")[0] || "ผู้ใช้"),
    role: planRole(profile),
    department: String(profile.department || ""),
    faculty: FACULTY_NAME,
    position: String(profile.position || profile.roleTitle || ""),
    phone: String(profile.phoneNumber || ""),
  }
}

export interface Actor {
  uid: string
  user: SessionUser
}

export async function loadActor(user: User): Promise<Actor> {
  const snap = await getDoc(doc(db, "users", user.uid))
  const profile = snap.exists() ? snap.data() : {}
  if (profile.status === "suspended") throw Object.assign(new Error("บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ"), { status: 403 })
  return { uid: user.uid, user: toSessionUser(user.uid, profile, user.email || "") }
}

export async function listUsers() {
  const snap = await getDocs(collection(db, "users"))
  return snap.docs
    .map((d) => ({ ...toSessionUser(d.id, d.data()), is_active: d.data().status !== "suspended" }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name, "th"))
}

/**
 * ผู้ใช้ที่ login อยู่ — จุดเดียวที่ระบบอื่นอ่านว่า "ใครกำลังใช้งาน"
 * ตอนนี้ login กับ backend ของระบบแผน (/auth/login) ระหว่างรอระบบ login กลางของทีม
 * วันที่เปลี่ยนไปใช้ระบบกลาง ให้แก้ไฟล์นี้ (และ services/authService.ts) ที่เดียว
 */
import { useSyncExternalStore } from "react"
import { Role, UserRoleInfo } from "../types/plan"

export interface SessionUser {
  id: number
  username: string
  display_name: string
  role: Role
  department: string
  faculty: string
  position: string
  phone: string
}

export interface Session {
  token: string
  user: SessionUser
}

export const roleLabels: Record<Role, { label: string; short: string }> = {
  teacher: { label: "อาจารย์ผู้รับผิดชอบโครงการ", short: "อาจารย์" },
  head: { label: "ประธานสาขาวิชา", short: "ประธานสาขา" },
  officer: { label: "เจ้าหน้าที่แผนและนโยบาย", short: "เจ้าหน้าที่แผน" },
  plan_head: { label: "หัวหน้างานแผน", short: "หัวหน้างานแผน" },
  dean: { label: "คณบดี", short: "คณบดี" },
}

const STORAGE_KEY = "fastcpru.session"
const listeners = new Set<() => void>()

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Session) : null
    return parsed?.token && parsed.user?.role ? parsed : null
  } catch {
    return null
  }
}

let session: Session | null = loadSession()

export function getSession(): Session | null {
  return session
}

export function setSession(next: Session | null): void {
  session = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // เบราว์เซอร์ปิด storage — ใช้ได้จนกว่าจะปิดแท็บ
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: render ใหม่เมื่อ login / logout / session หมดอายุ */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession)
}

export function getCurrentUser(): { role: Role; info: UserRoleInfo } {
  const user = session?.user
  const role: Role = user?.role ?? "teacher"
  return {
    role,
    info: {
      ...roleLabels[role],
      name: user?.display_name ?? "",
      department: user?.department ?? "",
      faculty: user?.faculty,
      position: user?.position ?? "",
      phone: user?.phone ?? "",
    },
  }
}

export function authHeaders(): Record<string, string> {
  return session ? { Authorization: `Bearer ${session.token}` } : {}
}

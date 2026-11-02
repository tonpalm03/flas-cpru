import { apiJson } from "../lib/api"
import { SessionUser } from "../lib/currentUser"
import { Role } from "../types/plan"

export interface ManagedUser extends SessionUser {
  is_active: boolean
}

export interface UserInput {
  username?: string
  display_name: string
  role: Role
  department: string
  position: string
  phone: string
}

/** บัญชีที่เพิ่งสร้าง/รีเซ็ต พร้อมรหัสเริ่มต้น (แสดงครั้งเดียว) */
export interface IssuedCredential {
  username: string
  display_name: string
  role: Role
  department: string
  password: string
}

export interface ImportResult {
  created: IssuedCredential[]
  errors: { line: number; username: string; message: string }[]
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })

export const userService = {
  list(): Promise<ManagedUser[]> {
    return apiJson<ManagedUser[]>("/users")
  },

  async create(input: UserInput): Promise<IssuedCredential> {
    const data = await apiJson<{ user: ManagedUser; password: string }>("/users", json("POST", input))
    const { username, display_name, role, department } = data.user
    return { username, display_name, role, department, password: data.password }
  },

  update(username: string, changes: Partial<UserInput> & { is_active?: boolean }): Promise<ManagedUser> {
    return apiJson<ManagedUser>(`/users/${encodeURIComponent(username)}`, json("PATCH", changes))
  },

  async resetPassword(user: ManagedUser): Promise<IssuedCredential> {
    const data = await apiJson<{ password: string }>(`/users/${encodeURIComponent(user.username)}/reset-password`, json("POST", {}))
    return { username: user.username, display_name: user.display_name, role: user.role, department: user.department, password: data.password }
  },

  importCsv(file: File): Promise<ImportResult> {
    const form = new FormData()
    form.append("file", file)
    return apiJson<ImportResult>("/users/import", { method: "POST", body: form })
  },
}

const CSV_HEADER = ["username", "display_name", "role", "department", "position", "phone", "password"]

function downloadCsv(fileName: string, rows: string[][]): void {
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  // BOM ให้ Excel เปิดภาษาไทยได้ถูก
  const blob = new Blob(["﻿" + rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** แบบฟอร์มรายชื่อเปล่า (มีแต่หัวตาราง — แถวตัวอย่างอาจถูกนำเข้าเป็นบัญชีจริงถ้าลืมลบ) ให้เจ้าหน้าที่กรอกใน Excel */
export function downloadUserTemplate(): void {
  downloadCsv("แบบฟอร์มรายชื่อผู้ใช้_ระบบแผน.csv", [CSV_HEADER])
}

/** ใบรายชื่อพร้อมรหัสเริ่มต้นสำหรับแจกผู้ใช้ */
export function downloadCredentials(credentials: IssuedCredential[]): void {
  downloadCsv("รหัสผ่านเริ่มต้น_ระบบแผน.csv", [
    ["username", "display_name", "role", "department", "password"],
    ...credentials.map((c) => [c.username, c.display_name, c.role, c.department, c.password]),
  ])
}

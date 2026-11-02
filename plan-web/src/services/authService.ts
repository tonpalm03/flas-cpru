import { ApiError, apiJson } from "../lib/api"
import { SessionUser, getSession, setSession } from "../lib/currentUser"

export const authService = {
  async login(username: string, password: string): Promise<void> {
    const data = await apiJson<{ token: string; user: SessionUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
    setSession({ token: data.token, user: data.user })
  },

  async logout(): Promise<void> {
    try {
      await apiJson("/auth/logout", { method: "POST" })
    } catch {
      // session หมดอายุไปแล้วก็ออกจากระบบฝั่งเว็บต่อได้
    }
    setSession(null)
  },

  /** ตอนเปิดหน้าเว็บ: ใช้ login ของเว็บคณะที่ค้างอยู่ (ไม่ต้อง login ซ้ำ) และอัปเดตข้อมูลผู้ใช้ — ไม่ได้ login → กลับหน้า login */
  async refresh(): Promise<void> {
    try {
      const user = await apiJson<SessionUser>("/auth/me")
      setSession({ token: getSession()?.token || "firebase", user })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setSession(null)
      throw error
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiJson("/auth/password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
  },
}

import { Page, expect, test as base } from "@playwright/test"

// บัญชีทดสอบจาก `manage_users.py seed-demo` (username = ชื่อบทบาท) — start-backend.mjs สร้างให้ทุกครั้ง
export const API = `http://127.0.0.1:${process.env.E2E_API_PORT || 8011}/api/v1`
export const DEMO_PASSWORD = "demo-pass-2570"

const tokens = new Map<string, string>()
const passwords = new Map<string, string>()

/** จำรหัสผ่านของบัญชีที่ชุดทดสอบสร้างเอง (บัญชีทดสอบปกติใช้ DEMO_PASSWORD) */
export function rememberPassword(username: string, password: string) {
  passwords.set(username, password)
}

async function login(username: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: passwords.get(username) ?? DEMO_PASSWORD }),
  })
  if (!res.ok) throw new Error(`login ${username} failed: ${res.status}`)
  const token = (await res.json()).data.token as string
  tokens.set(username, token)
  return token
}

export interface ApiResult<T = any> {
  status: number
  body: { data: T; detail?: string } & Record<string, any>
}

/** fetch API ในฐานะผู้ใช้ — token หมดอายุ/ถูกยกเลิก (เช่น เปลี่ยนรหัสผ่าน) จะ login ใหม่ให้ */
export async function fetchAs(path: string, init: RequestInit = {}, username = "officer"): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = tokens.get(username) ?? (await login(username))
    const res = await fetch(`${API}${path}`, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } })
    if (res.status === 401 && attempt === 0) {
      tokens.delete(username)
      continue
    }
    return res
  }
  throw new Error("unreachable")
}

/** เรียก API ที่ตอบ JSON ในฐานะผู้ใช้ (ค่าเริ่มต้น officer) */
export async function api<T = any>(path: string, init: RequestInit = {}, username = "officer"): Promise<ApiResult<T>> {
  const res = await fetchAs(path, init, username)
  return { status: res.status, body: await res.json().catch(() => null) }
}

export const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

async function displayName(username: string): Promise<string> {
  return (await api("/auth/me", {}, username)).body.data.display_name
}

/** เปิดหน้ารายละเอียดโครงการจากช่องค้นหาด้านบน */
export async function openProject(page: Page, title: string) {
  await page.getByTestId("header-search").fill(title)
  await page.getByTestId("search-result").filter({ hasText: title }).first().click()
  await expect(page.getByRole("heading", { name: title })).toBeVisible()
}

/** เปิดหน้าเว็บในฐานะผู้ใช้ (ออกจากระบบคนเดิมก่อนถ้าไม่ใช่คนเดียวกัน) แล้วไปที่ #hash */
export async function as(page: Page, username: string, hash: string) {
  await page.goto(`/?t=${Date.now()}#${hash}`)
  const logout = page.getByRole("button", { name: "ออกจากระบบ" })
  const loginForm = page.locator('input[name="username"]')
  await expect(logout.or(loginForm).first()).toBeVisible()
  if (await logout.count()) {
    const current = await page.getByTestId("current-user-name").innerText().catch(() => "")
    if (current && current === (await displayName(username))) return
    await logout.click()
    await loginForm.waitFor()
  }
  await loginForm.fill(username)
  await page.locator('input[name="password"]').fill(passwords.get(username) ?? DEMO_PASSWORD)
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click()
  await page.getByTestId("current-user-name").waitFor()
  await page.goto(`/?t=${Date.now()}#${hash}`)
  await page.getByTestId("current-user-name").waitFor()
}

export interface Dialogs {
  /** ข้อความของ alert/confirm/prompt ทั้งหมดตามลำดับ */
  messages: string[]
  /** คำตอบที่ใส่ในกล่อง prompt */
  promptAnswer: string
}

/**
 * test ของชุดนี้: ยอมรับกล่อง alert/confirm/prompt อัตโนมัติ (Playwright ปกติจะกดยกเลิก)
 * และให้ test ล้มถ้าหน้าเว็บมีข้อผิดพลาด JavaScript
 */
export const test = base.extend<{ dialogs: Dialogs; pageErrors: string[]; formPreview: boolean; formPreviewSetting: void }>({
  // ตัวอย่างแบบฟอร์มข้างหน้าเสนอโครงการมีข้อความเดียวกับฟอร์ม (หัวข้อ พันธกิจ ฯลฯ) — getByText ของเทสต์อื่นจะเจอซ้ำ
  // จึงเริ่มแบบซ่อนไว้ (ค่าที่ผู้ใช้ตั้งได้เอง) · preview.spec.ts ใช้ test.use({ formPreview: true })
  formPreview: [false, { option: true }],
  formPreviewSetting: [
    async ({ page, formPreview }, use) => {
      if (!formPreview) await page.addInitScript(() => localStorage.setItem("fastcpru.formPreviewBeside", "0"))
      await use()
    },
    { auto: true },
  ],
  dialogs: [
    async ({ page }, use) => {
      const dialogs: Dialogs = { messages: [], promptAnswer: "" }
      page.on("dialog", async (dialog) => {
        dialogs.messages.push(dialog.message())
        await (dialog.type() === "prompt" ? dialog.accept(dialogs.promptAnswer) : dialog.accept())
      })
      await use(dialogs)
    },
    { auto: true },
  ],
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(String(error)))
      await use(errors)
      expect(errors, "ข้อผิดพลาด JavaScript ในหน้าเว็บ").toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** ต่อท้ายชื่อโครงการ/บัญชี ไม่ให้ชนกับรอบก่อน */
export const unique = () => String(Date.now() % 1_000_000)

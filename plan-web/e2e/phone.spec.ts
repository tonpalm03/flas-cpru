import { Page } from "@playwright/test"
import { as, expect, test, unique } from "./support/session"
import { projectAt } from "./support/projects"

// มือถือ: แถบด้านบน + แถบเมนูล่าง, แผ่น "เพิ่มเติม", ค้นหาเต็มจอ, ปุ่มย้อนกลับของเครื่อง, ติดตั้งแอป

const PHONE = { width: 390, height: 844 }
const fitsScreen = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
const title = (page: Page) => page.getByTestId("topbar-title")

test("phone: bottom tabs navigate and the phone's back button returns to the previous page", async ({ page }) => {
  await as(page, "teacher", "dashboard")
  await page.setViewportSize(PHONE)
  await expect(page.getByTestId("bottom-nav")).toBeVisible()
  await expect(page.getByTestId("sidebar")).toHaveCount(0)
  await expect(title(page)).toHaveText("งานของฉัน")
  await expect(page.getByTestId("mywork")).toBeVisible()
  expect(await fitsScreen(page)).toBe(true)

  await page.getByTestId("tab-projects").click()
  await expect(title(page)).toHaveText("โครงการของฉัน")
  // ฟอร์มเสนอโครงการเต็มจอ: ไม่มีแถบล่าง มีปุ่มย้อนกลับแทน
  await page.getByTestId("tab-proposal").click()
  await expect(page.locator('input[name="title"]')).toBeVisible()
  await expect(page.getByTestId("bottom-nav")).toHaveCount(0)
  await expect(page.getByTestId("topbar-back")).toBeVisible()

  await page.goBack()
  await expect(title(page)).toHaveText("โครงการของฉัน")
  await page.goBack()
  await expect(title(page)).toHaveText("งานของฉัน")
})

test("phone: the more sheet holds the account and the back button closes it", async ({ page }) => {
  await as(page, "officer", "dashboard")
  await page.setViewportSize(PHONE)
  await page.getByTestId("open-account").click()
  const sheet = page.getByTestId("more-sheet")
  await expect(sheet.getByTestId("current-user-name")).toBeVisible()
  await expect(sheet.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible()
  await expect(sheet.getByRole("button", { name: "เปลี่ยนรหัสผ่าน" })).toBeVisible()

  // ปุ่มย้อนกลับของเครื่อง = ปิดแผ่น ยังอยู่หน้าเดิม
  await page.goBack()
  await expect(sheet).toHaveCount(0)
  await expect(title(page)).toHaveText("ภาพรวม")

  // หน้าที่ไม่อยู่ในแถบล่าง (ถังขยะ) เปิดจากแผ่น แล้วย้อนกลับมาหน้าเดิม
  await page.getByTestId("open-account").click()
  await page.getByTestId("more-trash").click()
  await expect(title(page)).toHaveText("ถังขยะ")
  await expect(sheet).toHaveCount(0)
  await page.getByTestId("topbar-back").click()
  await expect(title(page)).toHaveText("ภาพรวม")
})

test("phone: search opens full screen, finds a project and back leaves the project", async ({ page }) => {
  const name = `ค้นบนมือถือ ${unique()}`
  const code = await projectAt("review", name)
  await as(page, "officer", "dashboard")
  await page.setViewportSize(PHONE)
  await page.getByTestId("open-search").click()
  await expect(page.getByTestId("mobile-search")).toBeVisible()
  await page.getByTestId("header-search").fill(code)
  await page.getByTestId("search-result").click()
  await expect(page.getByRole("heading", { name })).toBeVisible()
  await expect(title(page)).toHaveText("รายละเอียดโครงการ")
  await expect(page.getByTestId("mobile-search")).toHaveCount(0)

  await page.goBack()
  await expect(title(page)).toHaveText("ภาพรวม")
  await expect(page.getByTestId("mobile-search")).toHaveCount(0)
})

test("phone: the officer opens a job full screen and goes back to the list", async ({ page }) => {
  const name = `งานเต็มจอ ${unique()}`
  await projectAt("review", name)
  await as(page, "officer", "approvals")
  await page.setViewportSize(PHONE)
  await page.getByTestId("stage-tab-review").click()
  await page.getByTestId("queue-row").filter({ hasText: name }).click()
  await expect(page.locator("#queue-detail").getByRole("heading", { name })).toBeVisible()
  await expect(page.getByTestId("queue-search")).toBeHidden()
  await expect(page.getByTestId("topbar-back")).toBeVisible()

  await page.getByTestId("topbar-back").click()
  await expect(page.getByTestId("queue-search")).toBeVisible()
  await expect(title(page)).toHaveText("งานของเจ้าหน้าที่แผน")
  // ปุ่มย้อนกลับของเครื่องก็ปิดรายละเอียดได้เหมือนกัน
  await page.getByTestId("queue-row").filter({ hasText: name }).click()
  await page.goBack()
  await expect(page.getByTestId("queue-search")).toBeVisible()
  await expect(title(page)).toHaveText("งานของเจ้าหน้าที่แผน")
})

test("phone: the login page offers to install the app", async ({ page }) => {
  await page.setViewportSize(PHONE)
  await page.goto("/")
  // ไม่มีกล่องติดตั้งของเบราว์เซอร์ → แสดงวิธีติดตั้งจากเมนู
  await page.getByTestId("login-install").click()
  await expect(page.getByTestId("install-help")).toContainText("ติดตั้งจากเมนูของเบราว์เซอร์")
  await page.getByRole("button", { name: "เข้าใจแล้ว" }).click()
  await expect(page.getByTestId("install-help")).toHaveCount(0)

  // Android/Chrome ส่ง beforeinstallprompt มา → ปุ่มเปิดกล่องติดตั้งของเครื่องทันที
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt") as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
    event.prompt = async () => {
      ;(window as unknown as { prompted: boolean }).prompted = true
    }
    event.userChoice = Promise.resolve({ outcome: "accepted" })
    window.dispatchEvent(event)
  })
  await page.getByTestId("login-install").click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true)
  await expect(page.getByTestId("install-help")).toHaveCount(0)
})

test("leaving the proposal form with unsaved changes asks first", async ({ page, dialogs }) => {
  await as(page, "teacher", "proposal")
  await page.locator('input[name="title"]').fill(`ยังไม่บันทึก ${unique()}`)
  await page.getByTestId("sidebar").getByRole("button", { name: "ภาพรวม" }).click()
  expect(dialogs.messages.at(-1)).toMatch(/ยังไม่ได้บันทึก/)
  await expect(page.getByTestId("mywork")).toBeVisible()

  // บันทึกแบบร่างแล้ว = ออกได้เลยโดยไม่ถาม
  await as(page, "teacher", "proposal")
  await page.locator('input[name="title"]').fill(`บันทึกแล้ว ${unique()}`)
  await page.getByRole("button", { name: "บันทึกแบบร่าง" }).click()
  await expect(page.getByTestId("save-status")).toContainText("บันทึกแล้ว")
  const before = dialogs.messages.length
  await page.getByTestId("sidebar").getByRole("button", { name: "ภาพรวม" }).click()
  await expect(page.getByTestId("mywork")).toBeVisible()
  expect(dialogs.messages.length).toBe(before)
})

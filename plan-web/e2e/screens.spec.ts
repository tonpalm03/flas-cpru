import { Page } from "@playwright/test"
import { as, expect, test, unique } from "./support/session"
import { fillStep1, fillStep2, fillStep3, next } from "./support/forms"
import { TEACHER2, projectAt, projectsTitled } from "./support/projects"

// หน้าจอหลัก: ฟอร์มเสนอโครงการ, หน้าตรวจของเจ้าหน้าที่, หน้ารายละเอียด, รายการโครงการ

const fitsScreen = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

test("saving a draft keeps the teacher on the form and shows when it was saved", async ({ page, dialogs }) => {
  const title = `ร่างอยู่หน้าเดิม ${unique()}`
  await as(page, "teacher", "proposal")
  await expect(page.getByTestId("save-status")).toHaveText("ยังไม่ได้บันทึก")
  await page.locator('input[name="title"]').fill(title)
  await page.getByRole("button", { name: "บันทึกแบบร่าง" }).click()
  await expect(page.getByTestId("save-status")).toContainText("บันทึกแล้ว")
  await expect(page.locator('input[name="title"]')).toHaveValue(title)

  // บันทึกอีกครั้ง = แก้โครงการเดิม ไม่สร้างใหม่
  await page.locator('input[name="title"]').fill(`${title} ฉบับแก้`)
  await page.getByRole("button", { name: "บันทึกแบบร่าง" }).click()
  await expect.poll(async () => (await projectsTitled(`${title} ฉบับแก้`)).length).toBe(1)
  expect(await projectsTitled(title)).toHaveLength(0)
  expect(dialogs.messages).toEqual([])
})

test("phone: the proposal form fits the screen and shows which step the teacher is on", async ({ page }) => {
  await as(page, "teacher", "proposal")
  await page.setViewportSize({ width: 390, height: 844 })
  const progress = page.getByTestId("wizard-progress")
  await expect(progress).toContainText("ขั้นที่ 1 จาก 5")
  expect(await fitsScreen(page)).toBe(true)

  await fillStep1(page, `ฟอร์มบนมือถือ ${unique()}`)
  await next(page)
  await expect(progress).toContainText("ขั้นที่ 2 จาก 5")
  await fillStep2(page)
  await next(page)
  await fillStep3(page)
  await next(page)
  await expect(progress).toContainText("ขั้นที่ 4 จาก 5")
  // ตารางค่าใช้จ่ายกว้าง — เลื่อนในกรอบของตาราง ไม่ทำให้ทั้งหน้าเลื่อนซ้ายขวา
  expect(await fitsScreen(page)).toBe(true)
})

test("review page shows the submitted form, and only officers get the Word file", async ({ page }) => {
  const title = `หน้าตรวจ ${unique()}`
  await projectAt("review", title)

  await as(page, "officer", "approvals")
  await page.getByTestId("stage-tab-review").click()
  await page.getByTestId("queue-row").filter({ hasText: title }).click()
  const detail = page.locator("#queue-detail")
  await expect(detail.getByRole("heading", { name: title })).toBeVisible()
  await expect(detail).toContainText("฿68,000")
  await detail.getByRole("tab", { name: /ค่าใช้จ่าย/ }).click()
  await expect(detail).toContainText("ค่าตอบแทนวิทยากรภายนอก")
  await detail.getByRole("tab", { name: "ยุทธศาสตร์และกิจกรรม" }).click()
  // ชื่อกิจกรรมที่ขึ้นต้นด้วย "กิจกรรมที่ 1 :" อยู่แล้ว ไม่เติมซ้ำ
  await expect(detail).toContainText("กิจกรรมที่ 1 : อบรมเชิงปฏิบัติการ")
  await expect(detail).not.toContainText("กิจกรรมที่ 1: กิจกรรมที่ 1")
  await expect(detail.getByRole("button", { name: "ไฟล์ Word ตามแบบฟอร์ม" })).toBeVisible()
  await expect(detail.getByTestId("officer-edit")).toBeVisible()

  await as(page, "dean", "approvals")
  await page.getByTestId("stage-tab-review").click()
  await page.getByTestId("queue-row").filter({ hasText: title }).click()
  await expect(page.locator("#queue-detail").getByRole("heading", { name: title })).toBeVisible()
  await expect(page.getByRole("button", { name: "ไฟล์ Word ตามแบบฟอร์ม" })).toHaveCount(0)
  await expect(page.getByTestId("officer-edit")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Excel รายการค่าใช้จ่าย" })).toBeVisible()
})

test("phone: the officer review page fits the screen", async ({ page }) => {
  const title = `ตรวจบนมือถือ ${unique()}`
  await projectAt("review", title)
  await as(page, "officer", "approvals")
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByTestId("stage-tab-review").click()
  await page.getByTestId("queue-row").filter({ hasText: title }).click()
  await expect(page.locator("#queue-detail").getByRole("heading", { name: title })).toBeVisible()
  expect(await fitsScreen(page)).toBe(true)
})

test("project page shows the project's own year and items, and downloads its Word file", async ({ page }) => {
  const title = `รายละเอียดจริง ${unique()}`
  await projectAt("review", title)
  await as(page, "teacher", "projects")
  await page.getByText(title).first().click()
  await expect(page.getByRole("heading", { name: title })).toBeVisible()
  await expect(page.getByText(/ปีงบประมาณ 2570/).first()).toBeVisible()
  await expect(page.getByText(/2569/)).toHaveCount(0)
  await page.getByRole("tab", { name: /ค่าใช้จ่าย/ }).click()
  await expect(page.getByText("ค่าอาหารกลางวัน")).toBeVisible()
  const [doc] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "ไฟล์ Word ตามแบบฟอร์ม" }).click()])
  expect(doc.suggestedFilename()).toMatch(/\.docx$/)
})

test("project list filters by the faculty's real branches", async ({ page }) => {
  const title = `สาขาจริง ${unique()}`
  await projectAt("review", title, TEACHER2)
  await as(page, "dean", "projects")
  const branch = page.locator("select").filter({ has: page.locator('option[value="ALL"]', { hasText: "ทุกสาขาวิชา" }) })
  const options = await branch.locator("option").allInnerTexts()
  expect(options).toContain(TEACHER2.department)
  expect(options).not.toContain("นิเทศศาสตร์")
  await branch.selectOption(TEACHER2.department)
  await expect(page.getByText(title)).toBeVisible()
})

import { writeFileSync } from "node:fs"
import { as, expect, fetchAs, test, unique } from "./support/session"
import { projectAt } from "./support/projects"

// ตัวอย่างแบบฟอร์มข้างหน้าเสนอโครงการ: แบบฟอร์มจริง (ไฟล์ Word ที่ระบบพิมพ์) เปลี่ยนตามที่พิมพ์
// และไฟล์ต้นฉบับที่นำเข้าไว้เทียบ · จอกว้างแสดงคู่กัน มือถือเปิดเต็มจอ

const PHONE = { width: 390, height: 844 }

test.use({ formPreview: true })

test("the real form beside the wizard follows what the teacher types", async ({ page }) => {
  await as(page, "teacher", "proposal")
  const pages = page.getByTestId("form-preview").getByTestId("preview-pages")
  await expect(pages).toContainText("1. ชื่อโครงการ")
  // ช่องติ๊กของแบบฟอร์มแสดงเป็น ☐ / ☑ ไม่ใช่ตัวอักษรของฟอนต์ Wingdings
  await expect(pages).toContainText("☐")
  await expect(pages).not.toContainText("þ")

  const title = `โครงการตัวอย่างสด ${unique()}`
  await page.locator('input[name="title"]').fill(title)
  await expect(pages).toContainText(title, { timeout: 15_000 })
})

test("the preview can be hidden and shown again on a wide screen", async ({ page }) => {
  await as(page, "teacher", "proposal")
  await expect(page.getByTestId("form-preview")).toBeVisible()
  await page.getByRole("button", { name: "ซ่อนตัวอย่างแบบฟอร์ม" }).click()
  await expect(page.getByTestId("form-preview")).toHaveCount(0)
  await page.getByTestId("show-form-preview").click()
  await expect(page.getByTestId("form-preview").getByTestId("preview-pages")).toContainText("1. ชื่อโครงการ")
})

test("on a phone the preview opens full screen and the back button closes it", async ({ page }) => {
  await as(page, "teacher", "proposal")
  await page.setViewportSize(PHONE)
  await expect(page.getByTestId("form-preview")).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.getByTestId("open-form-preview").click()
  const sheet = page.getByRole("dialog", { name: "ตัวอย่างแบบฟอร์ม" })
  await expect(sheet.getByTestId("preview-pages")).toContainText("1. ชื่อโครงการ")
  await page.goBack()
  await expect(sheet).toHaveCount(0)
  await expect(page.getByTestId("wizard-progress")).toBeVisible()
})

test("an imported Word file can be compared in the original-file tab", async ({ page }, testInfo) => {
  const title = `โครงการต้นฉบับ ${unique()}`
  const code = await projectAt("draft", title)
  const response = await fetchAs(`/projects/${code}/document-preview`, {}, "teacher")
  expect(response.status).toBe(200)
  const file = testInfo.outputPath("original.docx")
  writeFileSync(file, Buffer.from(await response.arrayBuffer()))

  await as(page, "teacher", "proposal")
  await expect(page.getByTestId("preview-tab-source")).toHaveCount(0)
  await page.getByTestId("docx-import-input").setInputFiles(file)
  await expect(page.getByTestId("import-summary")).toBeVisible()
  await page.getByTestId("preview-tab-source").click()
  await expect(page.getByTestId("preview-source-pages")).toContainText(title)
})

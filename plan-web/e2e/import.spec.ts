import { writeFileSync } from "node:fs"
import { as, expect, fetchAs, test, unique } from "./support/session"
import { next } from "./support/forms"
import { projectAt, projectsTitled } from "./support/projects"

// อาจารย์เขียนโครงการใน Word (แบบฟอร์มของมหาวิทยาลัย) ไว้แล้ว → นำเข้าเป็นร่าง ตรวจทาน แล้วบันทึก

async function wordFileOf(title: string, path: string) {
  const code = await projectAt("draft", title)
  const response = await fetchAs(`/projects/${code}/document-preview`, {}, "teacher")
  expect(response.status).toBe(200)
  writeFileSync(path, Buffer.from(await response.arrayBuffer()))
}

test("teacher imports a Word file, reviews every step and saves it as a new draft", async ({ page, dialogs }, testInfo) => {
  const source = `โครงการจากไฟล์ Word ${unique()}`
  const file = testInfo.outputPath("proposal.docx")
  await wordFileOf(source, file)

  await as(page, "teacher", "proposal")
  await page.getByTestId("docx-import-input").setInputFiles(file)
  await expect(page.getByTestId("import-summary")).toBeVisible()
  await expect(page.locator('input[name="title"]')).toHaveValue(source)
  await expect(page.locator('textarea[name="backgroundProblem"]')).toHaveValue("ปัญหา")
  const title = `${source} ฉบับนำเข้า`
  await page.locator('input[name="title"]').fill(title)

  await next(page)
  await expect(page.getByTestId("wizard-progress")).toContainText("ยุทธศาสตร์")
  await next(page)
  await expect(page.getByTestId("okr-row").first().locator("textarea").first()).toHaveValue("วัตถุประสงค์")
  await next(page)
  // ค่าใช้จ่ายข้อ 9 มาครบทุกบาท และตรงกับงบกิจกรรมข้อ 7
  await expect(page.getByText("ตรงกัน").first()).toBeVisible()
  await expect(page.getByText("฿68,000").first()).toBeVisible()
  await next(page)

  await page.getByRole("button", { name: "บันทึกแบบร่าง" }).click()
  await expect(page.getByTestId("save-status")).toContainText("บันทึกแล้ว")
  const [saved] = await projectsTitled(title)
  expect(saved.status).toBe("DRAFT")
  expect(saved.total_amount).toBe(68000)
  const form = saved.form_data
  expect(form.activityDefinitions[0].name).toBe("กิจกรรมที่ 1 : อบรมเชิงปฏิบัติการ")
  // ข้อ 9 ของแบบฟอร์มรวมยอดต่อหมวด: ค่าใช้สอย 8,400 + 14,400 เป็นแถวเดียว
  expect(form.multiplierItems.map((i: any) => i.totalAmount).sort((a: number, b: number) => a - b)).toEqual([9200, 22800, 36000])
  expect(form.universityMissionIds).toEqual([1])
  expect(dialogs.messages).toEqual([])
})

test("a file that is not a Word form shows why it cannot be imported", async ({ page }, testInfo) => {
  await as(page, "teacher", "proposal")
  const notes = testInfo.outputPath("notes.txt")
  writeFileSync(notes, "hello")
  await page.getByTestId("docx-import-input").setInputFiles(notes)
  await expect(page.getByTestId("docx-import-error")).toContainText(".docx")

  const fake = testInfo.outputPath("scan.docx")
  writeFileSync(fake, "%PDF-1.4 not a word file")
  await page.getByTestId("docx-import-input").setInputFiles(fake)
  await expect(page.getByTestId("docx-import-error")).toContainText("ไม่ใช่ไฟล์ Word")
  await expect(page.getByTestId("import-summary")).toHaveCount(0)
})

test("a scanned PDF goes to the scan reader, which says when it is not set up", async ({ page }, testInfo) => {
  await as(page, "teacher", "proposal")
  const scan = testInfo.outputPath("scan.pdf")
  writeFileSync(scan, "%PDF-1.4 scanned form")
  await page.getByTestId("docx-import-input").setInputFiles(scan)
  await expect(page.getByTestId("docx-import-error")).toContainText("ยังไม่ได้ตั้งค่าการอ่านไฟล์สแกน")
  await expect(page.getByTestId("import-summary")).toHaveCount(0)
})

test("importing over typed data asks first, and editing an existing project has no import box", async ({ page, dialogs }, testInfo) => {
  const file = testInfo.outputPath("proposal.docx")
  await wordFileOf(`โครงการถามก่อนแทนที่ ${unique()}`, file)
  await as(page, "teacher", "proposal")
  await page.locator('input[name="title"]').fill("ชื่อที่พิมพ์ไว้แล้ว")
  await page.getByTestId("docx-import-input").setInputFiles(file)
  await expect(page.getByTestId("import-summary")).toBeVisible()
  expect(dialogs.messages.at(-1)).toMatch(/แทนที่/)

  const title = `ร่างที่แก้ไข ${unique()}`
  await projectAt("draft", title)
  await as(page, "teacher", "projects")
  await page.getByText(title).first().click()
  await page.getByRole("button", { name: "แก้ไขโครงการ" }).click()
  await expect(page.locator('input[name="title"]')).toHaveValue(title)
  await expect(page.getByTestId("docx-import")).toHaveCount(0)
})

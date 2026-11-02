import { api, as, expect, json, test, unique } from "./support/session"
import { fillProposal, fillStep1, fillStep2, fillStep3, fillStep4, next } from "./support/forms"
import { act, projectsTitled, signSteps, uploadScan } from "./support/projects"

// ข้อบกพร่องที่เคยพบและแก้แล้ว — กันไม่ให้กลับมา

async function lockedNational(department: string): Promise<number> {
  const rows = (await api("/budget/ceilings?fiscal_year=2570")).body.data.rows as any[]
  return rows.find((r) => r.department === department && r.source_code === "national")?.committed ?? 0
}

test("double-click on save draft creates one project", async ({ page, dialogs }) => {
  const title = `ร่างกดสองครั้ง ${unique()}`
  await as(page, "teacher", "proposal")
  await page.locator('input[name="title"]').fill(title)
  // สองคลิกติดกันก่อนคำขอแรกจะเสร็จ
  await page.getByRole("button", { name: "บันทึกแบบร่าง" }).evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
  })
  await expect.poll(async () => (await projectsTitled(title)).length).toBe(1)
  await page.waitForTimeout(1000)
  expect(await projectsTitled(title)).toHaveLength(1)
  expect(dialogs.messages.filter((m) => m.includes("ผิดพลาด"))).toEqual([])
})

test("a project from the form locks its branch budget when the scan is uploaded, without warnings", async ({ page }) => {
  const title = `โครงการจากฟอร์ม ${unique()}`
  await as(page, "teacher", "proposal")
  await fillProposal(page, title)
  await page.getByRole("button", { name: "บันทึกและส่งให้เจ้าหน้าที่ตรวจ" }).click()
  await page.getByText("รอเจ้าหน้าที่แผนตรวจสอบ").first().waitFor({ timeout: 15_000 })
  const [project] = await projectsTitled(title)
  expect(project.department).toBe("เทคโนโลยีสารสนเทศ")
  const before = await lockedNational(project.department)
  await act(project.project_code, "approve")
  await signSteps(project.project_code, ["TEACHER_SIGN", "PLAN_HEAD_SIGN"])
  await act(project.project_code, "record_signature", { step_code: "DEAN_APPROVE", signed_at: "2026-10-20" })
  expect(await lockedNational(project.department)).toBe(before)
  const scanned = await uploadScan(project.project_code)
  expect(scanned.body.data.warnings).toEqual([])
  expect((await lockedNational(project.department)) - before).toBe(project.total_amount)
})

test("multi-activity grid asks which activity each item belongs to", async ({ page, dialogs }) => {
  await as(page, "teacher", "proposal")
  await fillStep1(page, `หลายกิจกรรม ${unique()}`)
  await next(page)
  await fillStep2(page)
  await next(page)
  await fillStep3(page)
  await page.getByRole("button", { name: /เพิ่มกิจกรรม/ }).first().click()
  await next(page)
  await page.getByText("ตารางรายละเอียดแตกตัวคูณงบประมาณ (ข้อ 9)").waitFor()
  await fillStep4(page)
  expect(await page.locator("select[data-testid='item-activity']").count()).toBeGreaterThanOrEqual(1)
  const before = dialogs.messages.length
  await next(page)
  await expect.poll(() => dialogs.messages.length).toBeGreaterThan(before)
  expect(dialogs.messages.at(-1)).toMatch(/กิจกรรม/)
})

test("warnings of the previous project disappear after switching projects", async ({ page }) => {
  const seed = (await api("/projects/PRJ-2570-001")).body.data.form_data
  const created = await api(
    "/projects",
    json("POST", { fiscalYear: 2570, title: "โครงการหน่วยงานไม่มีวงเงิน", owner: "อ.ทดสอบ", department: "หน่วยงานไม่มีวงเงิน", amount: 68000, formData: seed }),
    "teacher"
  )
  await act(created.body.data.project_code, "submit", {}, "teacher")
  const other = `อีกโครงการ ${unique()}`
  const second = await api(
    "/projects",
    json("POST", { fiscalYear: 2570, title: other, owner: "อ.ทดสอบ", department: "เทคโนโลยีสารสนเทศ", amount: 68000, formData: seed }),
    "teacher"
  )
  await act(second.body.data.project_code, "submit", {}, "teacher")

  await as(page, "officer", "approvals")
  await page.getByTestId("stage-tab-review").click()
  await page.getByTestId("queue-row").filter({ hasText: "โครงการหน่วยงานไม่มีวงเงิน" }).first().click()
  await page.getByRole("button", { name: "อนุมัติ (สร้างไฟล์ให้พิมพ์)" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "ยืนยัน" }).click()
  await page.getByText(/ยังไม่มีวงเงิน/).first().waitFor()
  await page.getByTestId("stage-tab-all").click()
  await page.getByTestId("queue-row").filter({ hasText: other }).first().click()
  await page.waitForTimeout(800)
  await expect(page.getByText(/ยังไม่มีวงเงิน/)).toHaveCount(0)
})

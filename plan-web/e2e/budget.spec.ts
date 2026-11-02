import { api, as, expect, json, openProject, test, unique } from "./support/session"
import { act, createTeacher, projectAt, signSteps, uploadScan } from "./support/projects"

// คุมงบ: วงเงินสาขา → เตือนอนุมัติเกิน → ล็อกงบตอนอัปโหลดสแกน → บันทึก/ห้ามเกิน/ยกเลิกเบิก → อาจารย์ดูอย่างเดียว
// → หน้าคุมงบ + Excel → ปิดโครงการ → คืนวงเงิน
// ใช้สาขาใหม่ของรอบนี้ ตัวเลขวงเงินจึงไม่ปนกับชุดทดสอบอื่น

test("budget control from branch ceiling to closing", async ({ page, dialogs }) => {
  const suffix = unique()
  const teacher = await createTeacher(suffix)
  const branch = () => page.locator(`[data-testid="ceiling-row"][data-department="${teacher.department}"]`)

  await test.step("officer sets the branch ceiling", async () => {
    await as(page, "officer", "budget")
    await branch().waitFor()
    await branch().getByTestId("ceiling-input").fill("100000")
    await page.getByTestId("save-ceilings").click()
    await page.getByText("บันทึกวงเงินงบประมาณแผ่นดิน ปีงบ 2570 แล้ว").waitFor()
    await expect(branch().getByTestId("row-remaining")).toContainText("100,000.00")
  })

  const titleA = `โครงการคุมงบ A ${suffix}`
  const titleB = `โครงการคุมงบ B ${suffix}`
  const codeA = await projectAt("review", titleA, teacher)
  const codeB = await projectAt("review", titleB, teacher)

  await test.step("approval within the ceiling; the budget locks when the signed scan is uploaded", async () => {
    const approved = await act(codeA, "approve")
    expect(approved.status).toBe(200)
    expect(approved.body.data.warnings).toEqual([])
    await signSteps(codeA, ["TEACHER_SIGN", "PLAN_HEAD_SIGN", "DEAN_APPROVE"])
    expect((await api(`/projects/${codeA}/ledger`)).body.data.lines).toEqual([])
    expect((await uploadScan(codeA)).status).toBe(200)
    const ledger = (await api(`/projects/${codeA}/ledger`)).body.data
    expect(ledger.lines.map((l: any) => l.amount)).toEqual([68000])
  })

  await test.step("approving over the ceiling warns first, still approves, and is logged", async () => {
    await as(page, "officer", "approvals")
    await page.getByTestId("stage-tab-review").click()
    await page.getByText(titleB).first().click()
    await page.getByRole("button", { name: "อนุมัติ (สร้างไฟล์ให้พิมพ์)" }).click()
    await expect(page.getByTestId("approve-notice").first()).toContainText(
      `เกินวงเงินงบประมาณแผ่นดินของสาขา${teacher.department} 36,000.00 บาท`
    )
    await page.getByRole("dialog").getByRole("button", { name: "ยืนยัน" }).click()
    await page.getByRole("dialog").waitFor({ state: "detached", timeout: 20_000 })
    const projectB = (await api(`/projects/${codeB}`)).body.data
    expect(projectB.status).toBe("APPROVED_FOR_PRINT")
    expect(projectB.audit_logs.map((l: any) => l.action)).toContain("BUDGET_OVER_CEILING")
  })

  await test.step("officer records, is blocked over the remaining, and voids a disbursement", async () => {
    await as(page, "officer", "dashboard")
    await openProject(page, titleA)
    await page.getByTestId("ledger-tab").click()
    await page.getByTestId("record-form").waitFor()
    await expect(page.getByTestId("record-activity")).toHaveValue("act-1|national")
    await page.getByTestId("record-date").fill("2027-04-27")
    await page.getByTestId("record-docno").fill("167/70")
    await page.getByTestId("record-description").fill("ค่าตอบแทนวิทยากร")
    await page.getByTestId("record-amount").fill("70000")
    await page.getByTestId("record-submit").click()
    await expect(page.getByTestId("ledger-error")).toContainText("68,000.00")
    await page.getByTestId("record-amount").fill("10000")
    await page.getByTestId("record-submit").click()
    await expect(page.getByTestId("disbursement-row").first()).toContainText("58,000.00")
    await expect(page.getByTestId("line-remaining")).toHaveText("58,000.00")

    dialogs.promptAnswer = "บันทึกผิดรายการ"
    await page.getByTestId("void-button").first().click()
    await expect(page.getByTestId("line-remaining")).toHaveText("68,000.00")
    await expect(page.getByTestId("disbursement-row").first()).toContainText("บันทึกผิดรายการ")

    await page.getByTestId("record-docno").fill("168/70")
    await page.getByTestId("record-description").fill("ค่าอาหารว่าง")
    await page.getByTestId("record-amount").fill("10000")
    await page.getByTestId("record-submit").click()
    await expect(page.getByTestId("line-remaining")).toHaveText("58,000.00")
    const undo = await api(`/projects/${codeA}/actions`, json("POST", { action: "undo_scan", reason: "ทดสอบ" }))
    expect(undo.status, "the scan cannot be withdrawn once money is spent").toBe(409)
  })

  await test.step("the owner sees the ledger read-only", async () => {
    await as(page, teacher.username, "projects")
    await page.getByText(titleA).first().click()
    await page.getByTestId("ledger-tab").click()
    await expect(page.getByTestId("disbursement-row")).toHaveCount(2)
    await expect(page.getByTestId("record-form")).toHaveCount(0)
    await expect(page.getByTestId("void-button")).toHaveCount(0)
  })

  await test.step("overview and Excel export", async () => {
    await as(page, "officer", "ledger")
    await page.getByTestId("filter-source").selectOption("national")
    const row = page.getByTestId("overview-row").filter({ hasText: titleA })
    await expect(row).toContainText("10,000.00")
    await expect(row).toContainText("14.71")
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export-xlsx").click()])
    expect(download.suggestedFilename()).toBe("คุมรายการเงินงบประมาณแผ่นดิน_2570.xlsx")
  })

  await test.step("closing uses actual spending and returns the rest to the branch", async () => {
    await as(page, "officer", "dashboard")
    await openProject(page, titleA)
    await page.getByTestId("start-closure").click()
    // การ์ดสรุปเงินพื้นเข้ม ตัวอักษรขาว/เหลือง ต้องไม่ถูกพื้นขาวของ Card ทับ
    const background = await page.getByTestId("closure-summary").evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(background).not.toBe("rgb(255, 255, 255)")
    await expect(page.getByTestId("closure-spent")).toContainText("10,000.00")
    await expect(page.getByTestId("closure-returned")).toContainText("58,000.00")
    await page.getByTestId("confirm-close").click()
    await expect.poll(async () => (await api(`/projects/${codeA}`)).body.data.status).toBe("COMPLETED")
    const rows = (await api("/budget/ceilings?fiscal_year=2570")).body.data.rows
    const national = rows.find((r: any) => r.department === teacher.department && r.source_code === "national")
    expect([national.committed, national.pending]).toEqual([10000, 68000])
  })
})

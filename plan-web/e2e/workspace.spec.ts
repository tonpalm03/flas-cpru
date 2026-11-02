import { Page } from "@playwright/test"
import { api, as, expect, openProject, test, unique } from "./support/session"
import { TEACHER2, projectAt } from "./support/projects"

// หน้างานเจ้าหน้าที่แยกตามขั้นงาน + งานของฉัน (อาจารย์) + เอกสารพร้อมพิมพ์

async function dropFile(page: Page, zone: string, name: string, type: string, content: string) {
  await page.locator(zone).first().evaluate(
    (element, file) => {
      const transfer = new DataTransfer()
      transfer.items.add(new File([file.content], file.name, { type: file.type }))
      element.dispatchEvent(new DragEvent("drop", { dataTransfer: transfer, bubbles: true, cancelable: true }))
    },
    { name, type, content }
  )
}

/** ไฟล์ที่เบราว์เซอร์อ่านไม่ได้ — เหมือนไฟล์ใน Windows ที่ path ยาวเกิน 260 ตัวอักษร (เจอกับสแกนโครงการจริง ศ 26) */
async function dropUnreadableFile(page: Page, zone: string, name: string) {
  await page.locator(zone).first().evaluate((element, fileName) => {
    const file = new File(["%PDF-1.4"], fileName, { type: "application/pdf" })
    Object.defineProperty(file, "arrayBuffer", { value: () => Promise.reject(new DOMException("unreadable", "NotReadableError")) })
    const event = new DragEvent("drop", { bubbles: true, cancelable: true })
    Object.defineProperty(event, "dataTransfer", { value: { files: [file] } })
    element.dispatchEvent(event)
  }, name)
}

const signedRow = (page: Page, title: string) =>
  page.getByTestId("mywork-signed").locator("div.flex.flex-wrap.items-center.justify-between").filter({ hasText: title })

test("officer works through the stages", async ({ page }) => {
  const suffix = unique()
  await projectAt("review", `งานตรวจ ${suffix}`)
  await projectAt("review", `งานตรวจคอม ${suffix}`, TEACHER2)
  await projectAt("signing", `งานเดินเซ็น ${suffix}`)
  const scan = await projectAt("scan", `งานรอสแกน ${suffix}`)

  await test.step("tabs, counts, branch filter and search", async () => {
    await as(page, "officer", "approvals")
    await page.getByTestId("stage-tab-review").click()
    await expect(page.getByTestId("queue-row").filter({ hasText: `งานตรวจ ${suffix}` })).toHaveCount(1)
    const live = (await api("/projects")).body.data.length
    await expect(page.getByTestId("stage-count-all")).toHaveText(String(live))
    await page.getByTestId("queue-department").selectOption("วิทยาการคอมพิวเตอร์")
    for (const text of await page.getByTestId("queue-row").allInnerTexts()) expect(text).toContain("วิทยาการคอมพิวเตอร์")
    await page.getByTestId("queue-department").selectOption("")
    await page.getByTestId("queue-search").fill(`งานตรวจ ${suffix}`)
    await expect(page.getByTestId("queue-row")).toHaveCount(1)
    await page.getByTestId("queue-search").fill("")
  })

  await test.step("signing rows show who signs next", async () => {
    await page.getByTestId("stage-tab-signing").click()
    const row = page.getByTestId("queue-row").filter({ hasText: `งานเดินเซ็น ${suffix}` })
    await expect(row).toContainText("รอ: คณบดีอนุมัติ")
    await row.click()
    await expect(page.getByRole("button", { name: "บันทึก: คณบดีอนุมัติ" })).toHaveCount(1)
  })

  await test.step("scan: wrong file shows an error, dropping a PDF uploads it", async () => {
    await page.getByTestId("stage-tab-scan").click()
    const row = page.getByTestId("queue-row").filter({ hasText: `งานรอสแกน ${suffix}` })
    await row.waitFor()
    const zone = `[data-testid="queue-row"]:has-text("งานรอสแกน ${suffix}") [data-testid="scan-dropzone"]`
    await dropFile(page, zone, "notes.txt", "text/plain", "hello")
    await expect(row.getByTestId("scan-error")).toContainText("PDF, JPG หรือ PNG")
    // อ่านไฟล์ไม่ได้ → บอกสาเหตุตอนเลือกไฟล์ (เดิมไปล้มตอนส่งเป็น "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้")
    await dropUnreadableFile(page, zone, "ศ 26 ชื่อไฟล์ยาวมาก.pdf")
    await expect(row.getByTestId("scan-error")).toContainText("ชื่อโฟลเดอร์รวมชื่อไฟล์ยาวเกินไป")
    await expect(page.getByTestId("scan-confirm")).toHaveCount(0)
    await dropFile(page, zone, "signed.pdf", "application/pdf", "%PDF-1.4 signed")
    // ต้องยืนยันชื่อโครงการและยอดเงินก่อน เพราะการอัปโหลดล็อกงบทันที
    const confirm = page.getByTestId("scan-confirm")
    await expect(confirm).toContainText(`งานรอสแกน ${suffix}`)
    await expect(confirm).toContainText("฿68,000")
    expect((await api(`/projects/${scan}`)).body.data.status).toBe("WAITING_FOR_SCAN")
    await page.getByTestId("scan-confirm-upload").click()
    await expect.poll(async () => (await api(`/projects/${scan}`)).body.data.status).toBe("COMPLETED_WITH_SCAN")
    expect((await api(`/projects/${scan}`)).body.data.budget_locked).toBe(68000)
    await expect(row).toHaveCount(0)
  })

  await test.step("money stage opens the ledger and the close button", async () => {
    await page.getByTestId("stage-tab-money").click()
    const row = page.getByTestId("queue-row").filter({ hasText: `งานรอสแกน ${suffix}` })
    await expect(row).toContainText("พร้อมปิดโครงการ")
    await row.click()
    await page.getByTestId("record-form").waitFor()
    await page.getByTestId("close-project").click()
    await expect(page.getByTestId("closure-spent")).toBeVisible()
  })

  await test.step("the menu badge counts the officer's own work", async () => {
    await as(page, "officer", "dashboard")
    const all = (await api("/projects")).body.data as any[]
    // รอตรวจ + รอสแกน + คำขอของอาจารย์ที่รอเจ้าหน้าที่ (คำขอเบิก + คำขอปิดโครงการ)
    const expected =
      all.filter((p) => p.status === "PENDING_REVIEW" || p.status === "WAITING_FOR_SCAN").length +
      all.reduce((sum, p) => sum + (p.requests_pending || 0) + (p.closure_request_status === "PENDING" ? 1 : 0), 0)
    await expect(page.getByTestId("nav-badge-approvals")).toHaveText(String(expected))
  })
})

test("officer withdraws a scan attached to the wrong project", async ({ page, dialogs }) => {
  const title = `งานสแกนผิด ${unique()}`
  const code = await projectAt("scanned", title)
  await as(page, "officer", "dashboard")
  await openProject(page, title)
  await page.getByRole("button", { name: "ย้อนการอัปโหลดสแกน" }).click()
  await page.getByRole("dialog").locator("textarea").fill("แนบไฟล์ของโครงการอื่น")
  await page.getByRole("dialog").getByRole("button", { name: "ยืนยัน" }).click()
  await page.getByRole("dialog").waitFor({ state: "detached" })
  const project = (await api(`/projects/${code}`)).body.data
  expect([project.status, project.budget_locked, project.scan_doc_id]).toEqual(["WAITING_FOR_SCAN", 0, null])
  expect(dialogs.messages).toEqual([])
})

test("executives see the stages without officer buttons", async ({ page }) => {
  const title = `งานรอสแกนคณบดี ${unique()}`
  await projectAt("scan", title)
  await as(page, "dean", "approvals")
  await page.getByTestId("stage-tab-scan").click()
  await page.getByTestId("queue-row").filter({ hasText: title }).waitFor()
  await expect(page.getByTestId("scan-dropzone")).toHaveCount(0)
})

test("teacher sees signed documents as new, opens them to print, and the badge clears", async ({ page, context }, testInfo) => {
  const suffix = unique()
  const first = `งานสแกนแล้ว ${suffix}`
  const second = `งานสแกนแล้วอีก ${suffix}`
  await projectAt("scanned", first)
  await projectAt("scanned", second)

  await as(page, "teacher", "dashboard")
  await expect(signedRow(page, first).getByTestId("new-badge")).toHaveCount(1)
  expect(Number(await page.getByTestId("nav-badge-projects").innerText())).toBeGreaterThanOrEqual(2)
  await expect(page.getByText("งบประมาณแผ่นดินขออนุมัติ")).toHaveCount(0)

  await test.step("open/print opens the PDF in a new tab, then the badge clears", async () => {
    const [viewer] = await Promise.all([context.waitForEvent("page"), signedRow(page, first).getByTestId("open-signed").click()])
    // Edge/Chrome แสดง PDF ในแท็บใหม่ — Chromium แบบ headless ใน CI ไม่มีตัวเปิด PDF (แท็บค้างที่ about:blank)
    // จึงตรวจเฉพาะในเครื่องที่ใช้ Edge; ใน CI ตรวจว่าเปิดแท็บใหม่และระบบบันทึกว่าเปิดแล้ว (ป้ายหายด้านล่าง)
    if (!process.env.CI) await expect.poll(() => viewer.url()).toMatch(/^blob:/)
    await viewer.close()
    await page.reload()
    await expect(signedRow(page, first).getByTestId("new-badge")).toHaveCount(0)
    const [download] = await Promise.all([page.waitForEvent("download"), signedRow(page, first).getByTestId("download-signed").click()])
    const saved = testInfo.outputPath("signed.pdf")
    await download.saveAs(saved)
    expect((await import("node:fs")).readFileSync(saved).subarray(0, 4).toString()).toBe("%PDF")
  })

  await test.step("opening from the project page also clears the badge (menu navigation, no reload)", async () => {
    await signedRow(page, second).locator("button").first().click()
    const [viewer] = await Promise.all([context.waitForEvent("page"), page.getByTestId("open-scan").click()])
    await viewer.close()
    await page.waitForTimeout(800)
    await page.locator("aside").getByRole("button", { name: "ภาพรวม", exact: true }).click()
    await expect(signedRow(page, second).getByTestId("new-badge")).toHaveCount(0)
  })
})

test("stage cards are on the teacher's overview (own projects) and filter the project table", async ({ page }) => {
  const suffix = unique()
  const reviewing = `การ์ดรอตรวจ ${suffix}`
  const signing = `การ์ดเดินเซ็น ${suffix}`
  await projectAt("review", reviewing)
  await projectAt("signing", signing)

  await as(page, "teacher", "dashboard")
  const mine = (await api("/projects", {}, "teacher")).body.data as any[]
  const inReview = mine.filter((p) => p.status === "PENDING_REVIEW").length
  await expect(page.getByTestId("stage-card-review")).toContainText(String(inReview))
  await expect(page.getByTestId("stage-card-review")).toContainText("รอเจ้าหน้าที่แผนตรวจ")

  const rows = page.getByTestId("dashboard-row")
  await page.getByTestId("stage-card-signing").click()
  await expect(page.getByTestId("stage-card-signing")).toHaveAttribute("aria-pressed", "true")
  await expect(rows.filter({ hasText: signing })).toHaveCount(1)
  await expect(rows.filter({ hasText: reviewing })).toHaveCount(0)
  await page.getByTestId("stage-card-signing").click()
  await expect(rows.filter({ hasText: reviewing })).toHaveCount(1)

  // หน้าภาพรวมของเจ้าหน้าที่และผู้บริหารไม่มีการ์ดขั้นงาน (ใช้แท็บในหน้างานแทน)
  for (const user of ["officer", "dean"]) {
    await as(page, user, "dashboard")
    await expect(page.getByTestId("kpi-requested")).toBeVisible()
    await expect(page.locator('[data-testid^="stage-card-"]')).toHaveCount(0)
  }
})

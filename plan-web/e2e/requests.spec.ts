import { Page } from "@playwright/test"
import { writeFileSync } from "node:fs"
import { api, as, expect, fetchAs, openProject, test, unique } from "./support/session"
import { projectAt } from "./support/projects"

// อาจารย์ขอเบิก/ขอปิดโครงการในระบบ → เจ้าหน้าที่แผนบันทึกเบิก/ตีกลับ/ปิดโครงการ

async function openLedgerAsTeacher(page: Page, title: string) {
  await as(page, "teacher", "projects")
  await page.getByText(title).first().click()
  await page.getByTestId("ledger-tab").click()
}

async function requestViaApi(code: string, amount: number) {
  const form = new FormData()
  form.append("activity_key", "act-1")
  form.append("source_code", "national")
  form.append("description", "ค่าอาหารผู้เข้าร่วม")
  form.append("amount", String(amount))
  form.append("files", new Blob([Buffer.from("%PDF-1.4 receipt")], { type: "application/pdf" }), "ใบเสร็จ.pdf")
  const response = await fetchAs(`/projects/${code}/disbursement-requests`, { method: "POST", body: form }, "teacher")
  expect(response.status).toBe(200)
  return ((await response.json()).data.requests as any[])[0].id as number
}

test("teacher requests a disbursement with evidence and the officer records it", async ({ page }, testInfo) => {
  const title = `โครงการขอเบิก ${unique()}`
  const code = await projectAt("scanned", title)
  const receipt = testInfo.outputPath("ใบเสร็จ.pdf")
  writeFileSync(receipt, "%PDF-1.4 receipt")

  await test.step("teacher: evidence is required, then the request waits for the officer", async () => {
    await openLedgerAsTeacher(page, title)
    await page.getByTestId("request-open").click()
    await page.getByTestId("request-description").fill("ค่าตอบแทนวิทยากร 2 คน")
    await page.getByTestId("request-amount").fill("12000")
    await page.getByTestId("request-submit").click()
    await expect(page.getByTestId("request-error")).toContainText("แนบหลักฐาน")
    await page.getByTestId("request-files").setInputFiles(receipt)
    await page.getByTestId("request-submit").click()
    const row = page.getByTestId("request-row").first()
    await expect(row).toContainText("รอเจ้าหน้าที่")
    await expect(row).toContainText("12,000.00")
    await expect(row.getByRole("link", { name: /ใบเสร็จ\.pdf/ })).toBeVisible()
  })

  await test.step("officer: the money queue shows the request; recording it adds the disbursement", async () => {
    await as(page, "officer", "approvals")
    await page.getByTestId("stage-tab-money").click()
    const queueRow = page.getByTestId("queue-row").filter({ hasText: title })
    await expect(queueRow).toContainText("คำขอเบิกรอ 1")
    await queueRow.click()
    const pending = page.getByTestId("pending-request")
    await expect(pending).toContainText("ค่าตอบแทนวิทยากร 2 คน")
    await pending.getByTestId("request-record").click()
    await pending.getByTestId("request-docno").fill("ฎ 12/70")
    await pending.getByTestId("request-record-amount").fill("11500")
    await pending.getByTestId("request-record-submit").click()
    await expect(page.getByTestId("disbursement-row").filter({ hasText: "ฎ 12/70" })).toContainText("11,500.00")
    await expect(page.getByTestId("pending-request")).toHaveCount(0)
    const ledger = (await api(`/projects/${code}/ledger`)).body.data
    expect(ledger.requests[0].status).toBe("RECORDED")
  })

  await test.step("teacher sees it recorded with the ฎีกา number", async () => {
    await openLedgerAsTeacher(page, title)
    await expect(page.getByTestId("request-row").first()).toContainText("บันทึกเบิกแล้ว")
    await expect(page.getByTestId("request-row").first()).toContainText("ฎ 12/70")
  })
})

test("returned request is resubmitted, then the teacher asks to close and the officer closes", async ({ page, dialogs }, testInfo) => {
  const title = `โครงการขอปิด ${unique()}`
  const code = await projectAt("scanned", title)
  const first = await requestViaApi(code, 5000)
  const receipt = testInfo.outputPath("ใบเสร็จใหม่.pdf")
  writeFileSync(receipt, "%PDF-1.4 new receipt")

  await test.step("officer returns the request with a reason", async () => {
    await as(page, "officer", "dashboard")
    await openProject(page, title)
    await page.getByTestId("ledger-tab").click()
    dialogs.promptAnswer = "ใบเสร็จไม่มีลายเซ็นผู้รับเงิน"
    await page.getByTestId("pending-request").getByTestId("request-return").click()
    await expect(page.getByTestId("pending-request")).toHaveCount(0)
  })

  await test.step("teacher sees the return on the overview and resubmits", async () => {
    await as(page, "teacher", "dashboard")
    const returned = page.getByTestId("mywork-returned")
    await expect(returned).toContainText(title)
    await expect(returned).toContainText("ใบเสร็จไม่มีลายเซ็นผู้รับเงิน")
    await openLedgerAsTeacher(page, title)
    await page.getByTestId("request-resubmit").click()
    await expect(page.getByTestId("request-description")).toHaveValue("ค่าอาหารผู้เข้าร่วม")
    await page.getByTestId("request-files").setInputFiles(receipt)
    await page.getByTestId("request-submit").click()
    await expect(page.getByTestId("request-row").first()).toContainText("รอเจ้าหน้าที่")
    const requests = (await api(`/projects/${code}/ledger`)).body.data.requests as any[]
    expect(requests.find((r) => r.id === first).status).toBe("RESUBMITTED")
  })

  await test.step("teacher cannot ask to close while a request is pending; after recording it can", async () => {
    await expect(page.getByTestId("closure-open")).toBeDisabled()
    const pendingId = ((await api(`/projects/${code}/ledger`)).body.data.requests as any[]).find((r) => r.status === "PENDING").id
    const recorded = await api(
      `/projects/${code}/disbursement-requests/${pendingId}/record`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid_on: "2027-01-10", doc_no: "ฎ 20/70" }) }
    )
    expect(recorded.status).toBe(200)
    await openLedgerAsTeacher(page, title)
    await page.getByTestId("closure-open").click()
    await page.getByTestId("closure-note").fill("จัดกิจกรรมครบ ผู้เข้าร่วม 48 คน")
    await page.getByTestId("closure-submit").click()
    await expect(page.getByTestId("closure-status")).toContainText("รอเจ้าหน้าที่ปิดโครงการ")
  })

  await test.step("officer sees the closing request and closes the project", async () => {
    await as(page, "officer", "approvals")
    await page.getByTestId("stage-tab-money").click()
    const queueRow = page.getByTestId("queue-row").filter({ hasText: title })
    await expect(queueRow).toContainText("ขอปิดโครงการ")
    await queueRow.click()
    await expect(page.getByTestId("closure-request")).toContainText("จัดกิจกรรมครบ ผู้เข้าร่วม 48 คน")
    await page.getByTestId("close-project").click()
    await page.getByTestId("confirm-close").click()
    await expect.poll(async () => (await api(`/projects/${code}`)).body.data.status).toBe("COMPLETED")
    expect((await api(`/projects/${code}/ledger`)).body.data.closure_requests[0].status).toBe("ACCEPTED")
  })
})

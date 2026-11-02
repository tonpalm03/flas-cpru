import { api, as, expect, openProject, test, unique } from "./support/session"
import { projectAt } from "./support/projects"

// ลบโครงการ = ย้ายไปถังขยะ (กู้คืนได้) — ลบได้เฉพาะก่อนอนุมัติ

test("teacher deletes a draft from the overview and withdraws a submitted project with a reason", async ({ page }) => {
  const draft = `ร่างที่จะลบ ${unique()}`
  const submitted = `โครงการที่จะถอน ${unique()}`
  const draftCode = await projectAt("draft", draft)
  const submittedCode = await projectAt("review", submitted)

  await as(page, "teacher", "dashboard")
  const row = page.getByTestId("mywork-draft").locator("div.flex.flex-wrap.items-center.justify-between").filter({ hasText: draft })
  await row.getByTestId("delete-project").click()
  await expect(page.getByTestId("delete-dialog")).toContainText("ลบร่าง")
  await expect(page.getByTestId("delete-reason")).toHaveCount(0)
  await page.getByTestId("delete-confirm").click()
  await expect(page.getByTestId("mywork-draft").filter({ hasText: draft })).toHaveCount(0)
  expect((await api(`/projects/${draftCode}`)).status).toBe(404)

  await openProject(page, submitted)
  await page.getByTestId("delete-project").click()
  await expect(page.getByTestId("delete-dialog")).toContainText("ถอนโครงการ")
  await expect(page.getByTestId("delete-confirm")).toBeDisabled()
  await page.getByTestId("delete-reason").fill("ส่งซ้ำกับอีกโครงการ")
  await page.getByTestId("delete-confirm").click()
  await expect(page.getByTestId("mywork")).toBeVisible()
  expect((await api(`/projects/${submittedCode}`)).status).toBe(404)
})

test("officer deletes a duplicate from the review queue and restores it from the trash", async ({ page }) => {
  const title = `โครงการซ้ำ ${unique()}`
  const code = await projectAt("review", title)
  await as(page, "officer", "approvals")
  await page.getByTestId("stage-tab-review").click()
  await page.getByTestId("queue-row").filter({ hasText: title }).click()
  await page.locator("#queue-detail").getByTestId("delete-project").click()
  await page.getByTestId("delete-reason").fill("ส่งซ้ำกับ PRJ เดิม")
  await page.getByTestId("delete-confirm").click()
  await expect(page.getByTestId("queue-row").filter({ hasText: title })).toHaveCount(0)

  await page.getByTestId("sidebar").getByRole("button", { name: "ถังขยะ" }).click()
  const trashed = page.getByTestId("trash-row").filter({ hasText: title })
  await expect(trashed).toContainText("ส่งซ้ำกับ PRJ เดิม")
  await trashed.getByTestId("restore-project").click()
  await expect(page.getByTestId("trash-row").filter({ hasText: title })).toHaveCount(0)
  expect((await api(`/projects/${code}`)).body.data.status).toBe("PENDING_REVIEW")
})

test("approved projects have no delete button, and only officers see the trash", async ({ page }) => {
  const title = `โครงการอนุมัติแล้ว ${unique()}`
  await projectAt("approved", title)
  await as(page, "officer", "dashboard")
  await openProject(page, title)
  await expect(page.getByTestId("delete-project")).toHaveCount(0)
  await as(page, "teacher", "trash")
  await expect(page.getByTestId("sidebar").getByRole("button", { name: "ถังขยะ" })).toHaveCount(0)
  await expect(page.getByTestId("trash-row")).toHaveCount(0)
})

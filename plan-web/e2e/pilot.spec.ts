import { API, DEMO_PASSWORD, api, as, expect, test, unique } from "./support/session"
import { fillProposal } from "./support/forms"
import { projectsTitled } from "./support/projects"

// pilot: login, เจ้าของโครงการ, ฟอร์มว่าง, เปลี่ยนรหัสผ่าน, session หมดอายุ

test("wrong password shows one message", async ({ page }) => {
  await page.goto("/#dashboard")
  await page.locator('input[name="username"]').fill("teacher2")
  await page.locator('input[name="password"]').fill("wrong-password")
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click()
  await expect(page.getByRole("alert")).toContainText("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
})

test("teacher proposes on a blank form, only the owner sees it, officer approves", async ({ page }) => {
  await test.step("teacher sees no one else's projects or reference data", async () => {
    await as(page, "teacher2", "projects")
    await page.waitForTimeout(800)
    await expect(page.getByText(/PRJ-2570-001|PRJ-2569-/)).toHaveCount(0)
  })

  const title = `โครงการนำร่อง ${unique()}`
  await test.step("new proposal is blank; leader and supervisor come from account and config", async () => {
    await as(page, "teacher2", "proposal")
    await expect(page.locator('input[name="title"]')).toHaveValue("")
    await expect(page.locator('textarea[name="backgroundProblem"]')).toHaveValue("")
    await fillProposal(page, title)
    await expect(page.getByPlaceholder("ชื่อ-นามสกุล").first()).toHaveValue("อ.สมศรี วิจัยสุข")
    await expect(page.getByTestId("supervisor-name")).toHaveValue("ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย")
    await page.getByRole("button", { name: "บันทึกและส่งให้เจ้าหน้าที่ตรวจ" }).click()
    await page.getByText("ส่งเสนอโครงการสำเร็จแล้ว", { exact: false }).waitFor({ timeout: 15_000 })
  })

  const [project] = await projectsTitled(title)
  expect(project?.owner_username).toBe("teacher2")
  expect(project?.status).toBe("PENDING_REVIEW")

  await test.step("other teacher neither lists nor opens it", async () => {
    await as(page, "teacher", "projects")
    await page.waitForTimeout(800)
    await expect(page.getByText(title)).toHaveCount(0)
    expect((await api(`/projects/${project.project_code}`, {}, "teacher")).status).toBe(403)
  })

  await test.step("officer approves", async () => {
    await as(page, "officer", "approvals")
    await page.getByTestId("stage-tab-review").click()
    await page.getByText(title).first().click()
    await page.getByRole("button", { name: "อนุมัติ (สร้างไฟล์ให้พิมพ์)" }).click()
    await page.getByRole("dialog").getByRole("button", { name: "ยืนยัน" }).click()
    await page.getByRole("dialog").waitFor({ state: "detached", timeout: 20_000 })
    expect((await api(`/projects/${project.project_code}`)).body.data.status).toBe("APPROVED_FOR_PRINT")
  })
})

test("teacher changes password and logs in with the new one", async ({ page }) => {
  const newPassword = "pilot-new-pass-1"
  await as(page, "teacher2", "dashboard")
  await page.getByRole("button", { name: "เปลี่ยนรหัสผ่าน" }).click()
  await page.locator('input[name="current_password"]').fill(DEMO_PASSWORD)
  await page.locator('input[name="new_password"]').fill(newPassword)
  await page.locator('input[name="confirm_password"]').fill(newPassword)
  await page.getByRole("dialog").getByRole("button", { name: "บันทึก" }).click()
  await page.getByText("เปลี่ยนรหัสผ่านแล้ว").waitFor()
  await page.getByRole("button", { name: "ปิด", exact: true }).click()
  await page.getByRole("button", { name: "ออกจากระบบ" }).click()
  await page.locator('input[name="username"]').fill("teacher2")
  await page.locator('input[name="password"]').fill(newPassword)
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click()
  await expect(page.getByTestId("current-user-name")).toHaveText("อ.สมศรี วิจัยสุข")

  // คืนรหัสเดิม ให้ชุดอื่นใช้บัญชีนี้ต่อได้
  const relog = await (await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "teacher2", password: newPassword }),
  })).json()
  const restored = await fetch(`${API}/auth/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${relog.data.token}` },
    body: JSON.stringify({ current_password: newPassword, new_password: DEMO_PASSWORD }),
  })
  expect(restored.status).toBe(200)
})

test("an invalid session returns to the login page", async ({ page }) => {
  await as(page, "teacher", "dashboard")
  await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("fastcpru.session") || "{}")
    session.token = "expired-or-revoked"
    localStorage.setItem("fastcpru.session", JSON.stringify(session))
  })
  await page.reload()
  await expect(page.locator('input[name="username"]')).toBeVisible()
})

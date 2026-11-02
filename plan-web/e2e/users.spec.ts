import fs from "node:fs"
import path from "node:path"
import { API, api, as, expect, test, unique } from "./support/session"

// หน้าจัดการผู้ใช้ของเจ้าหน้าที่แผน

const loginStatus = async (username: string, password: string) =>
  (await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })).status

test("teacher has no user management", async ({ page }) => {
  await as(page, "teacher", "dashboard")
  await expect(page.getByText("จัดการผู้ใช้งาน")).toHaveCount(0)
  expect((await api("/users", {}, "teacher")).status).toBe(403)
})

test("officer adds, edits, resets, disables and imports users", async ({ page }, testInfo) => {
  const suffix = unique()
  const username = `somchai${suffix}`
  await as(page, "officer", "users")
  await page.getByTestId("user-row").first().waitFor()
  expect(await page.getByTestId("user-row").count()).toBeGreaterThanOrEqual(6)
  const selfRow = page.getByTestId("user-row").filter({ hasText: "นางสาวนลิน วัฒนศรี" })
  await expect(selfRow.getByRole("button", { name: "ปิดบัญชี" })).toHaveCount(0)

  let password = ""
  await test.step("new account gets a one-time password that works", async () => {
    await page.getByRole("button", { name: "เพิ่มผู้ใช้" }).click()
    const form = page.getByRole("dialog")
    await form.locator('input[name="username"]').fill(username)
    await form.locator('input[name="display_name"]').fill("อ.สมชาย ใจดี")
    await form.locator('input[name="department"]').fill("เทคโนโลยีสารสนเทศ")
    await form.locator('input[name="position"]').fill("อาจารย์ประจำสาขาวิชา")
    await form.getByRole("button", { name: "สร้างบัญชี" }).click()
    password = await page.getByTestId("issued-password").innerText()
    expect(password.length).toBeGreaterThanOrEqual(10)
    await page.getByRole("dialog").getByRole("button", { name: "ปิด", exact: true }).click()
    expect(await loginStatus(username, password)).toBe(200)
  })

  const row = page.getByTestId("user-row").filter({ hasText: username })
  await test.step("edit updates the row", async () => {
    await row.getByRole("button", { name: "แก้ไข" }).click()
    await page.getByRole("dialog").locator('input[name="position"]').fill("ประธานหลักสูตร")
    await page.getByRole("dialog").getByRole("button", { name: "บันทึก" }).click()
    await page.getByRole("dialog").waitFor({ state: "detached" })
    await expect(row).toContainText("ประธานหลักสูตร")
  })

  await test.step("reset password replaces the old one", async () => {
    await row.getByRole("button", { name: "ตั้งรหัสใหม่" }).click()
    const reset = await page.getByTestId("issued-password").innerText()
    await page.getByRole("dialog").getByRole("button", { name: "ปิด", exact: true }).click()
    expect(await loginStatus(username, password)).toBe(401)
    expect(await loginStatus(username, reset)).toBe(200)
    password = reset
  })

  await test.step("disable and enable", async () => {
    await row.getByRole("button", { name: "ปิดบัญชี" }).click()
    await page.getByText("แสดงบัญชีที่ปิดแล้ว").click()
    await row.getByText("ปิดแล้ว").waitFor()
    expect(await loginStatus(username, password)).toBe(401)
    await row.getByRole("button", { name: "เปิดบัญชี" }).click()
    await row.getByText("ใช้งาน").waitFor()
    expect(await loginStatus(username, password)).toBe(200)
  })

  await test.step("CSV import creates valid rows, lists bad ones, and issues a credentials sheet", async () => {
    const csvPath = testInfo.outputPath("import_users.csv")
    fs.mkdirSync(path.dirname(csvPath), { recursive: true })
    fs.writeFileSync(
      csvPath,
      "﻿username,display_name,role,department,position,phone,password\r\n" +
        `imp.a${suffix},อ.นำเข้า หนึ่ง,teacher,วิทยาการคอมพิวเตอร์,อาจารย์,,\r\n` +
        `imp.b${suffix},อ.นำเข้า สอง,head,ภาษาอังกฤษ,ประธานสาขา,,\r\n` +
        `imp.c${suffix},บทบาทผิด,admin,,,,\r\n`,
      "utf8"
    )
    await page.getByTestId("import-file").setInputFiles(csvPath)
    await expect(page.getByTestId("import-created-count")).toHaveText("2")
    await expect(page.getByTestId("import-errors")).toContainText("แถว 4")
    const [sheet] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /ดาวน์โหลดใบรายชื่อ/ }).click()])
    const sheetPath = testInfo.outputPath("imported_credentials.csv")
    await sheet.saveAs(sheetPath)
    const lines = fs.readFileSync(sheetPath, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/).slice(1).map((l) => l.split(","))
    expect(lines).toHaveLength(2)
    for (const [user, , , , pass] of lines) expect(await loginStatus(user, pass)).toBe(200)
  })
})

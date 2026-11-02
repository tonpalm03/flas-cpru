import { readFileSync } from "node:fs"
import PizZip from "pizzip"
import { api, as, expect, fetchAs, json, test, unique } from "./support/session"
import { fillStep1, fillStep2, fillStep3, fillStep4, next } from "./support/forms"
import { projectsTitled } from "./support/projects"

// ฟอร์มเสนอโครงการ: OKR หลายแถว, แผนของคณะจริง, หมวดรายจ่ายที่ 4, ไฟล์ Word, กลุ่มเป้าหมาย/เดือน-ไตรมาส,
// รายการย่อย, ผู้รับผิดชอบร่วม, คณบดีเป็นผู้กำกับ และร่างรุ่นเก่าที่ต้องเปิดได้

const exportButton = "ส่งออก Word ตามแบบฟอร์ม"

async function legacyDraft(title: string, formChanges: (form: any) => any) {
  const seed = (await api("/projects/PRJ-2570-001")).body.data.form_data
  const created = await api(
    "/projects",
    json("POST", { fiscalYear: 2570, title, owner: "อ.ทดสอบ", department: "เทคโนโลยีสารสนเทศ", amount: 68000, formData: formChanges(seed) }),
    "teacher"
  )
  return created.body.data.project_code as string
}

test("OKR rows, real faculty plan, category 4 and Word export", async ({ page, dialogs }) => {
  const title = `โครงการ OKR หลายข้อ ${unique()}`
  await as(page, "teacher", "proposal")
  await fillStep1(page, title)
  await next(page)

  await expect(page.getByTestId("faculty-name")).toHaveText("คณะศิลปศาสตร์และวิทยาศาสตร์")
  await expect(page.getByText("ผลิตบัณฑิตทุกสาขาวิชาให้มีความเข้มแข็งทางวิชาชีพอย่างมีคุณภาพ")).toHaveCount(1)
  await fillStep2(page)
  await next(page)
  await fillStep3(page)

  const rows = page.getByTestId("okr-row")
  await expect(rows).toHaveCount(1)
  await page.getByRole("button", { name: "+ เพิ่มวัตถุประสงค์" }).click()
  await expect(rows).toHaveCount(2)
  const before = dialogs.messages.length
  await next(page)
  expect(dialogs.messages.length).toBeGreaterThan(before)
  expect(dialogs.messages.at(-1)).toMatch(/แถวที่ 2/)
  await rows.nth(1).locator("textarea").nth(0).fill("เพื่อสร้างเครือข่ายความร่วมมือกับสถานประกอบการ")
  await rows.nth(1).locator("textarea").nth(1).fill("มีสถานประกอบการเข้าร่วมไม่น้อยกว่า 5 แห่ง")
  await rows.nth(1).getByTestId("okr-target").fill("5 แห่ง")
  await next(page)

  await page.getByText("4. หมวดค่าใช้จ่ายอื่น ๆ").first().waitFor()
  await page.getByRole("button", { name: "ค่าใช้จ่ายอื่น ๆ", exact: true }).click()
  await next(page)

  await test.step("exporting twice keeps one draft, then submit updates it", async () => {
    const [first] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: exportButton }).click()])
    expect(first.suggestedFilename()).toMatch(/\.docx$/)
    await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: exportButton }).click()])
    let saved = await projectsTitled(title)
    expect(saved.map((p) => p.status)).toEqual(["DRAFT"])
    await page.getByRole("button", { name: "บันทึกและส่งให้เจ้าหน้าที่ตรวจ" }).click()
    await page.getByText("ส่งเสนอโครงการสำเร็จแล้ว", { exact: false }).waitFor({ timeout: 15_000 })
    saved = await projectsTitled(title)
    expect(saved.map((p) => p.status)).toEqual(["PENDING_REVIEW"])
    expect(saved[0].form_data.okrs.map((o: any) => o.target)).toEqual(["ร้อยละ 80", "5 แห่ง"])
    const [modalDoc] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "ดาวน์โหลดไฟล์ Word" }).click()])
    expect(modalDoc.suggestedFilename()).toMatch(/\.docx$/)
  })

  await test.step("officer exports Word from the review page", async () => {
    await as(page, "officer", "approvals")
    await page.getByTestId("stage-tab-review").click()
    await page.getByText(title).first().click()
    const [officerDoc] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "ไฟล์ Word ตามแบบฟอร์ม" }).click()])
    expect(officerDoc.suggestedFilename()).toMatch(/\.docx$/)
  })

  await test.step("another proposer (branch head) uses the same faculty plan", async () => {
    await as(page, "head", "proposal")
    await fillStep1(page, "ตรวจคณะของประธานสาขา")
    await next(page)
    await expect(page.getByTestId("faculty-name")).toHaveText("คณะศิลปศาสตร์และวิทยาศาสตร์")
    await expect(page.getByText(/ยังไม่มีแผนปฏิบัติราชการ/)).toHaveCount(0)
  })
})

test("legacy draft with OKR on the activity opens with an OKR row", async ({ page }) => {
  const title = `ร่างรุ่นเก่า ${unique()}`
  await legacyDraft(title, (seed) => ({
    ...seed,
    okrs: [],
    targetGroup: "นักศึกษา 60 คน",
    startDate: "2026-11-10",
    endDate: "2026-11-11",
    activityDefinitions: seed.activityDefinitions.map((a: any) => ({
      ...a, objective: "วัตถุประสงค์จากร่างรุ่นเก่า", okrKeyResult: "ผลลัพธ์รุ่นเก่า", okrTarget: "ร้อยละ 70",
    })),
  }))
  await as(page, "teacher", "projects")
  await page.getByText(title, { exact: true }).first().click()
  await page.getByRole("button", { name: "แก้ไขโครงการ" }).click()
  await next(page)
  await next(page)
  const rows = page.getByTestId("okr-row")
  await expect(rows).toHaveCount(1)
  await expect(rows.first().locator("textarea").first()).toHaveValue("วัตถุประสงค์จากร่างรุ่นเก่า")
})

test("target groups, months, sub-items and co-leaders", async ({ page }) => {
  const title = `โครงการกลุ่มเป้าหมายแยก ${unique()}`
  await as(page, "teacher", "proposal")
  await fillStep1(page, title)
  await next(page)
  await fillStep2(page)
  await next(page)
  await fillStep3(page)

  await page.getByTestId("target-group-row").first().locator("input").nth(0).fill("นักศึกษา")
  const subItems = page.getByTestId("sub-items")
  await subItems.getByRole("button", { name: /เพิ่มรายการย่อย/ }).click()
  await subItems.getByRole("button", { name: /เพิ่มรายการย่อย/ }).click()
  await subItems.locator("input").nth(0).fill("ค่าใช้จ่ายเดินทางไปราชการ")
  await subItems.locator("input").nth(1).fill("พัฒนาศักยภาพบุคลากร")
  const groups = page.getByTestId("target-groups")
  await groups.getByRole("button", { name: "+ เพิ่มกลุ่มเป้าหมาย" }).click()
  const second = page.getByTestId("target-group-row").nth(1)
  await second.locator("input").nth(0).fill("สายวิชาการ")
  await second.locator("input").nth(1).fill("83")
  await expect(groups.getByText("3. กลุ่มเป้าหมาย (รวม 133 คน)")).toHaveCount(1)

  await page.getByTestId("end-month").selectOption("9")
  await page.getByTestId("start-month").selectOption("1")
  await expect(page.getByTestId("quarters")).toHaveText(/^ไตรมาส 2,3,4/)
  await page.getByTestId("start-month").selectOption("10")
  await page.getByTestId("end-month").selectOption("11")
  await page.getByTestId("start-month").selectOption("12")
  await expect(page.getByTestId("end-month")).toHaveValue("12")
  await page.getByTestId("start-month").selectOption("1")
  await page.getByTestId("end-month").selectOption("9")
  await next(page)
  await fillStep4(page)
  await next(page)

  await expect(page.getByTestId("supervisor-name")).toHaveValue("ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย")
  const co = page.getByTestId("co-leader-row")
  await co.nth(0).locator("input").nth(0).fill("นางสาวสมใจ ทดสอบระบบ")
  await co.nth(0).locator("input").nth(1).fill("นักวิชาการศึกษา")
  await co.nth(0).locator("input").nth(2).fill("080-000-0001")
  await page.getByRole("button", { name: "+ เพิ่มผู้รับผิดชอบร่วม" }).click()
  await co.nth(1).locator("input").nth(0).fill("นางสาวใจดี ตัวอย่างงาน")
  await co.nth(1).locator("input").nth(1).fill("เจ้าหน้าที่บริหารงานทั่วไป")
  await co.nth(1).locator("input").nth(2).fill("080-000-0002")
  await page.getByRole("button", { name: "+ เพิ่มผู้รับผิดชอบร่วม" }).click() // แถวว่างต้องไม่ลงเอกสาร

  await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: exportButton }).click()])
  const [saved] = await projectsTitled(title)
  const activity = saved.form_data.activityDefinitions[0]
  expect(activity.targetGroups).toHaveLength(2)
  expect([activity.startMonth, activity.endMonth, activity.subItems.length, activity.targetCount]).toEqual([1, 9, 2, 133])
  expect(saved.form_data.coLeaders.map((p: any) => p.name)).toEqual(["นางสาวสมใจ ทดสอบระบบ", "นางสาวใจดี ตัวอย่างงาน"])
  expect(saved.form_data.coLeadersText).toBe("")

  await page.getByRole("button", { name: "บันทึกและส่งให้เจ้าหน้าที่ตรวจ" }).click()
  await page.getByText("ส่งเสนอโครงการสำเร็จแล้ว", { exact: false }).waitFor({ timeout: 15_000 })
  await as(page, "officer", "approvals")
  await page.getByTestId("stage-tab-review").click()
  await page.getByText(title).first().click()
  await page.getByRole("tab", { name: "ยุทธศาสตร์และกิจกรรม" }).click()
  await expect(page.getByText(/สถานที่: .* · เป้าหมาย: นักศึกษา 50 คน, สายวิชาการ 83 คน · มกราคม – กันยายน 70 \(ไตรมาส 2,3,4\)/)).toHaveCount(1)
})

// กรอกแบบที่อาจารย์คณะศิลปศาสตร์ฯ เขียนในโครงการจริงปี 2570: ค่าเป้าหมาย/วิธีดำเนินงานหลายบรรทัด, ไม่มีวิทยากร,
// งบประมาณอื่น ๆ พร้อมที่มา — และไฟล์ Word มีตารางรายละเอียดแตกตัวคูณท้ายเอกสาร
test("entries from the faculty's real proposals reach the Word file", async ({ page, dialogs }) => {
  const title = `โครงการตามเอกสารจริง ${unique()}`
  await as(page, "teacher", "proposal")
  await expect(page.locator('select[name="projectCategory"]')).toHaveValue("unit_mission")
  await fillStep1(page, title)
  await next(page)
  await fillStep2(page)
  await next(page)
  await fillStep3(page)
  await page.getByTestId("okr-target").first().fill("1. ร้อยละ 80\n2. อย่างน้อย 3 ผลิตภัณฑ์")
  await page.getByTestId("method-step").first().fill("1.1 ประชุมวางแผน\n    - จัดทำแบบสอบถามผู้เข้าร่วม")
  await page.getByTestId("committee-count").first().fill("0")
  await next(page)

  await fillStep4(page)
  await page.locator("select:has(option[value='off_budget'])").first().selectOption("off_budget")
  const before = dialogs.messages.length
  await next(page)
  expect(dialogs.messages.slice(before)).toEqual(["กรุณาระบุที่มาของแหล่งงบประมาณอื่น ๆ (ข้อ 9)"])
  await page.getByTestId("off-budget-detail").fill("เงินอุดหนุนองค์การบริหารส่วนจังหวัด")
  await next(page)

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: exportButton }).click()])
  const [saved] = await projectsTitled(title)
  expect(saved.form_data.projectCategoryCode).toBe("unit_mission")
  expect(saved.form_data.okrs[0].target).toBe("1. ร้อยละ 80\n2. อย่างน้อย 3 ผลิตภัณฑ์")
  expect(saved.form_data.activityDefinitions[0].methods[0]).toBe("1.1 ประชุมวางแผน\n    - จัดทำแบบสอบถามผู้เข้าร่วม")
  expect(saved.form_data.activityDefinitions[0].committeeCount).toBe(0)
  expect(saved.form_data.budgetSources.offBudgetDetail).toBe("เงินอุดหนุนองค์การบริหารส่วนจังหวัด")

  const xml = new PizZip(readFileSync(await download.path())).file("word/document.xml")!.asText()
  const text = xml.replace(/<[^>]+>/g, "")
  expect(text).toContain("เงินอุดหนุนองค์การบริหารส่วนจังหวัด")
  expect(text).toContain("2. กลุ่มเป้าหมาย")
  expect(text).not.toContain("วิทยากร/คณะทำงาน")
  expect(text).toContain("รายละเอียดแตกตัวคูณงบประมาณ ประจำปีงบประมาณ พ.ศ. 2570")
  expect(text).toContain("- ค่าตอบแทนวิทยากร")
})

test("legacy scope fields open in the new form, and a faculty without a plan is blocked", async ({ page, dialogs }) => {
  const legacyForm = (seed: any) => ({
    ...seed,
    targetGroup: "นักศึกษา 60 คน", startDate: "2026-11-10", endDate: "2026-11-11",
    coLeaders: [],
    coLeadersText: "คณาจารย์ประจำสาขาวิชาเทคโนโลยีสารสนเทศ",
    activityDefinitions: seed.activityDefinitions.map((a: any) => {
      const { targetGroups, startMonth, endMonth, subItems, ...rest } = a
      return { ...rest, targetCount: 60, quarter: 1, monthRange: "ตุลาคม 69 – ธันวาคม 69 (ไตรมาส 1)" }
    }),
  })
  const title = `ร่างขอบเขตรุ่นเก่า ${unique()}`
  const code = await legacyDraft(title, legacyForm)
  const preview = await fetchAs(`/projects/${code}/document-preview`, {}, "teacher")
  expect(preview.status, "legacy draft renders without re-saving").toBe(200)

  await as(page, "teacher", "projects")
  await page.getByText(title, { exact: true }).first().click()
  await page.getByRole("button", { name: "แก้ไขโครงการ" }).click()
  await next(page)
  await next(page)
  const legacyRow = page.getByTestId("target-group-row")
  await expect(legacyRow).toHaveCount(1)
  await expect(legacyRow.first().locator("input").nth(1)).toHaveValue("60")
  await expect(page.getByTestId("start-month")).toHaveValue("10")
  await expect(page.getByTestId("end-month")).toHaveValue("12")
  await next(page)
  await next(page)
  await expect(page.getByTestId("co-leader-row").first().locator("input").first()).toHaveValue("คณาจารย์ประจำสาขาวิชาเทคโนโลยีสารสนเทศ")

  const otherTitle = `คณะที่ไม่มีแผน ${unique()}`
  await legacyDraft(otherTitle, (seed) => ({ ...legacyForm(seed), facultyName: "คณะครุศาสตร์" }))
  await as(page, "teacher", "projects")
  await page.getByText(otherTitle, { exact: true }).first().click()
  await page.getByRole("button", { name: "แก้ไขโครงการ" }).click()
  await next(page)
  await expect(page.getByText(/ยังไม่มีแผนปฏิบัติราชการของคณะครุศาสตร์ในปีงบประมาณ 2570/)).toHaveCount(1)
  const before = dialogs.messages.length
  await next(page)
  expect(dialogs.messages.length).toBeGreaterThan(before)
})

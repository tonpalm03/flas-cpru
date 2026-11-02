import { Page } from "@playwright/test"

// ฟอร์มเสนอโครงการเริ่มต้นว่าง: เติมข้อมูลขั้นต่ำให้ผ่าน validation แต่ละขั้น
export const next = (page: Page) => page.getByRole("button", { name: /ถัดไป/ }).first().click()

export async function fillStep1(page: Page, title: string) {
  await page.locator('input[name="title"]').fill(title)
  await page.locator('input[name="startDate"]').fill("2026-11-10")
  await page.locator('input[name="endDate"]').fill("2026-11-11")
  await page.locator('input[name="targetGroup"]').fill("นักศึกษา 50 คน")
  await page.locator('textarea[name="backgroundProblem"]').fill("ที่มาและปัญหาของโครงการทดสอบ")
  await page.locator('textarea[name="backgroundSolution"]').fill("แนวทางแก้ปัญหาของโครงการทดสอบ")
  await page.locator('textarea[name="backgroundImpact"]').fill("สิ่งที่จะเปลี่ยนแปลงจากโครงการทดสอบ")
}

export async function fillStep2(page: Page) {
  await page.getByText("ผลิตบัณฑิตที่มีคุณภาพได้มาตรฐานและเป็นที่ต้องการของตลาดแรงงาน").first().click()
  await page.getByText("พัฒนาชุมชนท้องถิ่น", { exact: true }).nth(0).click()
  await page.getByText("ผลิตบัณฑิตทุกสาขาวิชาให้มีความเข้มแข็งทางวิชาชีพอย่างมีคุณภาพ").first().click()
  await page.getByText("พัฒนาชุมชนท้องถิ่น", { exact: true }).nth(1).click()
}

export async function fillStep3(page: Page) {
  const okr = page.getByTestId("okr-row").first()
  await okr.locator("textarea").nth(0).fill("เพื่อพัฒนาทักษะผู้เข้าร่วม")
  await okr.locator("textarea").nth(1).fill("ผู้เข้าร่วมผ่านการประเมินร้อยละ 80")
  await okr.getByTestId("okr-target").fill("ร้อยละ 80")
  await page.getByPlaceholder("เช่น กิจกรรมที่ 1 : การอบรมเชิงปฏิบัติการพัฒนาทักษะวิชาชีพ").first().fill("กิจกรรมที่ 1 : อบรมเชิงปฏิบัติการ")
  await page.getByPlaceholder("เช่น ห้องประชุม 1 มรภ.ชัยภูมิ").first().fill("มหาวิทยาลัยราชภัฏชัยภูมิ")
  await page.getByTestId("target-group-row").first().locator("input").nth(1).fill("50")
}

export async function fillStep4(page: Page) {
  await page.getByRole("button", { name: /^วิทยากร \(/ }).click()
}

/** เติมฟอร์มใหม่ขั้น 1–4 แล้วหยุดที่ขั้นที่ 5 */
export async function fillProposal(page: Page, title: string) {
  await fillStep1(page, title)
  await next(page)
  await fillStep2(page)
  await next(page)
  await fillStep3(page)
  await next(page)
  await fillStep4(page)
  await next(page)
  await page.getByText("10. ผลประโยชน์ที่คาดว่าจะได้รับ").waitFor()
}

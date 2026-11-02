import { api, json, rememberPassword } from "./session"

// สร้างโครงการทดสอบผ่าน API (ข้ามการกรอกฟอร์ม) แล้วพาไปถึงสถานะที่ต้องการ

export interface Teacher {
  username: string
  department: string
  name: string
}

export const TEACHER: Teacher = { username: "teacher", department: "เทคโนโลยีสารสนเทศ", name: "อ.ชลธิชา พงษ์ประเสริฐ" }
export const TEACHER2: Teacher = { username: "teacher2", department: "วิทยาการคอมพิวเตอร์", name: "อ.สมศรี วิจัยสุข" }

/** อาจารย์ของสาขาใหม่ (ไม่ซ้ำกับรอบอื่น) — ใช้กับชุดทดสอบที่ตรวจตัวเลขวงเงินของสาขา */
export async function createTeacher(suffix: string): Promise<Teacher> {
  const teacher = { username: `budget${suffix}`, department: `สาขาทดสอบงบ ${suffix}`, name: `อ.ทดสอบงบ ${suffix}` }
  const created = await api(
    "/users",
    json("POST", { username: teacher.username, display_name: teacher.name, role: "teacher", department: teacher.department, position: "อาจารย์" })
  )
  if (created.status !== 200) throw new Error(`สร้างบัญชีทดสอบไม่สำเร็จ: ${created.body?.detail}`)
  rememberPassword(teacher.username, created.body.data.password)
  return teacher
}

export function payload(title: string, teacher: Teacher) {
  const items = (
    [
      ["compensation", "ค่าตอบแทนวิทยากรภายนอก", 36000],
      ["operations", "ค่าอาหารว่างและเครื่องดื่ม", 8400],
      ["operations", "ค่าอาหารกลางวัน", 14400],
      ["materials", "ค่าวัสดุและเอกสารประกอบการอบรม", 9200],
    ] as const
  ).map(([category, name, total], i) => ({
    id: `m${i}`, category, name, targetQty: 1, targetUnit: "รายการ", durationQty: 1, durationUnit: "ครั้ง",
    unitRate: total, frequencyQty: 1, frequencyUnit: "ครั้ง", totalAmount: total, fundSource: "national", activityId: "act-1",
  }))
  const formData = {
    fiscalYear: 2570, projectCategoryCode: "plan_policy", projectCategory: "ตามแผน นโยบาย/จุดเน้นมหาวิทยาลัย", title,
    department: `คณะศิลปศาสตร์และวิทยาศาสตร์ (สาขาวิชา${teacher.department})`, facultyName: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    universityMissionIds: [1], universityStrategyIds: [1], facultyMissionIds: [1], facultyStrategyIds: [1],
    backgroundProblem: "ปัญหา", backgroundSolution: "แนวทาง", backgroundImpact: "ผลกระทบ",
    okrs: [{ id: "1", objective: "วัตถุประสงค์", keyResult: "ผลลัพธ์", target: "ร้อยละ 80" }],
    activityDefinitions: [{
      id: "act-1", index: 1, name: "กิจกรรมที่ 1 : อบรมเชิงปฏิบัติการ", location: "มรภ.ชัยภูมิ",
      committeeCount: 5, targetCount: 50, startMonth: 1, endMonth: 3, methods: ["ประชุม"], kpi: "พึงพอใจ",
    }],
    budgetSources: { national: 68000, revenue: 0, offBudget: 0 }, multiplierItems: items,
    impacts: ["ผลประโยชน์"], evaluations: ["ประเมิน"],
    leader: { name: teacher.name, position: "อาจารย์", phone: "081" }, coLeaders: [],
    supervisor: { name: "คณบดี", position: "คณบดี" },
  }
  return { fiscalYear: 2570, title, owner: teacher.name, department: teacher.department, amount: 68000, budgetSources: formData.budgetSources, formData }
}

export const act = (code: string, action: string, extra: Record<string, unknown> = {}, user = "officer") =>
  api(`/projects/${code}/actions`, json("POST", { action, ...extra }), user)

export async function signSteps(code: string, steps: string[]) {
  for (const step of steps) {
    const result = await act(code, "record_signature", { step_code: step, signed_at: "2026-10-20" })
    if (result.status !== 200) throw new Error(`บันทึกลงนาม ${step} ไม่สำเร็จ: ${result.body?.detail}`)
  }
}

export async function uploadScan(code: string) {
  const form = new FormData()
  form.append("file", new Blob([Buffer.from("%PDF-1.4 signed scan")], { type: "application/pdf" }), "scan.pdf")
  return api(`/projects/${code}/scan`, { method: "POST", body: form })
}

export type Stage = "draft" | "review" | "approved" | "signing" | "scan" | "scanned"

/** สร้างโครงการของอาจารย์แล้วพาไปถึงขั้น: review (รอตรวจ), approved, signing (รอคณบดี), scan (เซ็นครบ), scanned */
export async function projectAt(stage: Stage, title: string, teacher: Teacher = TEACHER): Promise<string> {
  const created = await api("/projects", json("POST", payload(title, teacher)), teacher.username)
  if (created.status !== 200) throw new Error(`สร้างโครงการไม่สำเร็จ: ${created.body?.detail}`)
  const code = created.body.data.project_code as string
  if (stage === "draft") return code
  await act(code, "submit", {}, teacher.username)
  if (stage === "review") return code
  await act(code, "approve")
  if (stage === "approved") return code
  await signSteps(code, stage === "signing" ? ["TEACHER_SIGN", "PLAN_HEAD_SIGN"] : ["TEACHER_SIGN", "PLAN_HEAD_SIGN", "DEAN_APPROVE"])
  if (stage === "scanned") await uploadScan(code)
  return code
}

export async function projectsTitled(title: string) {
  return ((await api("/projects")).body.data as any[]).filter((p) => p.title === title)
}

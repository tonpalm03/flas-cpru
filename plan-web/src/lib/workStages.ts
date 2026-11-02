import { PlanProject, ProjectStatus } from "../types/plan"

/** หมวดงานของเจ้าหน้าที่แผน เรียงตามลำดับที่โครงการเดินไป */
export type WorkStage = "review" | "signing" | "scan" | "money" | "closed" | "all"

export interface StageInfo {
  id: WorkStage
  label: string
  hint: string
  statuses: ProjectStatus[]
}

export const STAGES: StageInfo[] = [
  { id: "review", label: "รอตรวจ", hint: "ตรวจและอนุมัติคำขอโครงการ", statuses: ["PENDING_REVIEW"] },
  {
    id: "signing",
    label: "พิมพ์และเดินเซ็น",
    hint: "บันทึกการลงนามตามเอกสารกระดาษ",
    statuses: ["APPROVED_FOR_PRINT", "WAITING_FOR_SIGNATURES"],
  },
  { id: "scan", label: "รอสแกน", hint: "อัปโหลดเอกสารที่ลงนามครบแล้ว — ระบบล็อกงบและแจ้งอาจารย์ให้อัตโนมัติ", statuses: ["WAITING_FOR_SCAN"] },
  {
    id: "money",
    label: "เบิกจ่าย / ปิดโครงการ",
    hint: "งบล็อกแล้ว (อัปโหลดสแกนแล้ว) — บันทึกการเบิกจ่ายและปิดโครงการ",
    statuses: ["COMPLETED_WITH_SCAN"],
  },
  { id: "closed", label: "ปิดแล้ว", hint: "โครงการที่ปิดหรือไม่อนุมัติ", statuses: ["COMPLETED", "REJECTED"] },
]

/** คำอธิบายขั้นงานจากมุมของอาจารย์ (การ์ดบนหน้าภาพรวมของอาจารย์) */
export const TEACHER_STAGE_HINTS: Partial<Record<WorkStage, string>> = {
  review: "ส่งแล้ว รอเจ้าหน้าที่แผนตรวจ",
  signing: "ดาวน์โหลดไฟล์ไปพิมพ์ ลงนาม แล้วส่งเอกสารให้เจ้าหน้าที่แผนเดินเซ็นต่อ",
  scan: "ลงนามครบแล้ว รอเจ้าหน้าที่อัปโหลดเอกสารสแกน",
  money: "งบพร้อมใช้ — เปิด/พิมพ์เอกสารที่ลงนามแล้ว และดูยอดเบิกและคงเหลือ",
}

export const ALL_STAGE: StageInfo = { id: "all", label: "ทั้งหมด", hint: "ทุกโครงการในระบบ", statuses: [] }

const STAGE_KEY = "fastcpru.workStage"

/** โครงการในหมวด — เฉพาะโครงการในระบบ (ข้อมูลอ้างอิงปี 2569 ไม่มี dbId) */
export function projectsInStage(projects: PlanProject[], stage: WorkStage): PlanProject[] {
  const live = projects.filter((p) => p.dbId !== undefined)
  if (stage === "all") return live
  const statuses = STAGES.find((s) => s.id === stage)?.statuses ?? []
  return live.filter((p) => statuses.includes(p.status))
}

/** จำนวนวันตั้งแต่เวลา (เช่น สถานะเปลี่ยนล่าสุด) — null ถ้าไม่มีข้อมูล */
export function daysSince(value?: string | null): number | null {
  if (!value) return null
  const time = new Date(value.replace(" ", "T")).getTime()
  if (Number.isNaN(time)) return null
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000))
}

export function waitingText(value?: string | null): string {
  const days = daysSince(value)
  if (days === null) return ""
  return days === 0 ? "วันนี้" : `ค้าง ${days} วัน`
}

/** งานที่รอเจ้าหน้าที่ลงมือทำเอง (ตัวเลขบนเมนู): รอตรวจ + รอสแกน */
export function officerAttention(projects: PlanProject[]): number {
  return projectsInStage(projects, "review").length + projectsInStage(projects, "scan").length + officerRequestCount(projects)
}

/** คำขอของอาจารย์ที่รอเจ้าหน้าที่: คำขอเบิก + คำขอปิดโครงการ */
export function officerRequestCount(projects: PlanProject[]): number {
  return projects.reduce((sum, p) => sum + (p.requestsPending || 0) + (p.closureRequestStatus === "PENDING" ? 1 : 0), 0)
}

/** โครงการที่มีคำขอถูกตีกลับรออาจารย์ (คำขอเบิกหรือคำขอปิด) */
export function hasReturnedRequest(project: PlanProject): boolean {
  return (project.requestsReturned || 0) > 0 || project.closureRequestStatus === "RETURNED"
}

/** เอกสารลงนามครบที่อาจารย์ยังไม่เปิด */
export function isNewSignedScan(project: PlanProject): boolean {
  return Boolean(project.scanDoc && !project.scanDoc.opened_at && ["COMPLETED_WITH_SCAN", "COMPLETED"].includes(project.status))
}

/** งานที่รออาจารย์ (ตัวเลขบนเมนู): ต้องแก้ไข + พร้อมพิมพ์เพื่อเซ็น + เอกสารลงนามครบที่ยังไม่เปิด + คำขอที่ถูกตีกลับ */
export function teacherAttention(projects: PlanProject[]): number {
  return projects.filter(
    (p) => p.status === "REVISION_REQUESTED" || p.status === "APPROVED_FOR_PRINT" || isNewSignedScan(p) || hasReturnedRequest(p)
  ).length
}

export function readStoredStage(): WorkStage {
  try {
    const stored = localStorage.getItem(STAGE_KEY) as WorkStage | null
    if (stored && (stored === "all" || STAGES.some((s) => s.id === stored))) return stored
  } catch {
    // เบราว์เซอร์ปิด storage — ใช้ค่าเริ่มต้น
  }
  return "review"
}

export function storeStage(stage: WorkStage): void {
  try {
    localStorage.setItem(STAGE_KEY, stage)
  } catch {
    // ไม่จำก็ได้
  }
}

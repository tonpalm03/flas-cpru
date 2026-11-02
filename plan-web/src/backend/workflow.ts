/**
 * กติกา workflow เอกสารโครงการ (ร่าง → ตรวจ → พิมพ์เซ็น → เดินเซ็น → สแกน)
 * เป็นฟังก์ชันล้วน ไม่แตะฐานข้อมูล: รับสถานะปัจจุบัน + action แล้วตัดสินสถานะถัดไปและสิ่งที่ต้องทำต่อ
 * (จาก backend/services/plan_workflow.py ของระบบเดิม)
 */
import type { Role, WorkflowAction } from "../types/plan"

export type Effect =
  | "GENERATE_DOCUMENT"
  | "ADD_SIGNATURE"
  | "REMOVE_LAST_SIGNATURE"
  | "COMMIT_BUDGET"
  | "RELEASE_BUDGET"
  | "STORE_SCAN"
  | "VOID_SCAN"

export interface SigningStep {
  code: string
  label: string
  order: number
  mode: "OFFLINE" | "IN_SYSTEM"
  signer_role: Role
}

export interface WorkflowState {
  status: string
  current_step_code: string | null
  /** ลายเซ็นของเอกสารฉบับล่าสุด เรียงตามลำดับ */
  signed_step_codes: string[]
}

export interface Transition {
  to_status: string
  current_step_code: string | null
  effects: Effect[]
}

export class WorkflowError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const DEFAULT_SIGNING_STEPS: SigningStep[] = [
  { code: "TEACHER_SIGN", label: "อาจารย์ผู้รับผิดชอบโครงการลงนาม", order: 1, mode: "OFFLINE", signer_role: "teacher" },
  { code: "PLAN_HEAD_SIGN", label: "หัวหน้างานแผนลงนาม", order: 2, mode: "OFFLINE", signer_role: "plan_head" },
  { code: "DEAN_APPROVE", label: "คณบดีอนุมัติ", order: 3, mode: "OFFLINE", signer_role: "dean" },
]

type Payload = { reason?: unknown; step_code?: unknown; signed_at?: unknown; note?: unknown }

function requireStatus(state: WorkflowState, allowed: string[]) {
  if (!allowed.includes(state.status)) throw new WorkflowError(409, `ไม่สามารถดำเนินการได้ในสถานะ ${state.status}`)
}

function requireRole(role: Role, expected: Role) {
  if (role !== expected) throw new WorkflowError(403, "บทบาทของคุณไม่มีสิทธิ์ดำเนินการนี้")
}

function currentStep(state: WorkflowState, steps: SigningStep[]): [number, SigningStep] {
  const index = steps.findIndex((s) => s.code === state.current_step_code)
  if (index < 0) throw new WorkflowError(409, "ไม่มีขั้นตอนลงนามที่รอดำเนินการ")
  return [index, steps[index]]
}

// Guards: ตรวจสถานะ (409) และบทบาท (403) — ใช้ร่วมกันระหว่าง decide และ availableActions
const GUARDS: Record<WorkflowAction, (state: WorkflowState, steps: SigningStep[], role: Role) => void> = {
  submit: (state, _steps, role) => {
    requireStatus(state, ["DRAFT", "REVISION_REQUESTED"])
    requireRole(role, "teacher")
  },
  approve: (state, steps, role) => {
    requireStatus(state, ["PENDING_REVIEW"])
    requireRole(role, "officer")
    if (!steps.length) throw new WorkflowError(409, "ยังไม่ได้ตั้งค่าขั้นตอนลงนาม")
  },
  request_revision: (state, _steps, role) => {
    requireStatus(state, ["PENDING_REVIEW", "APPROVED_FOR_PRINT", "WAITING_FOR_SIGNATURES"])
    requireRole(role, "officer")
  },
  reject: (state, _steps, role) => {
    requireStatus(state, ["PENDING_REVIEW"])
    requireRole(role, "officer")
  },
  record_signature: (state, steps, role) => {
    requireStatus(state, ["APPROVED_FOR_PRINT", "WAITING_FOR_SIGNATURES"])
    const [, step] = currentStep(state, steps)
    requireRole(role, step.mode === "OFFLINE" ? "officer" : step.signer_role)
  },
  undo_signature: (state, _steps, role) => {
    requireStatus(state, ["WAITING_FOR_SIGNATURES", "WAITING_FOR_SCAN"])
    requireRole(role, "officer")
    if (!state.signed_step_codes.length) throw new WorkflowError(409, "ยังไม่มีการบันทึกลงนามให้ย้อนกลับ")
  },
  upload_scan: (state, _steps, role) => {
    requireStatus(state, ["WAITING_FOR_SCAN", "COMPLETED_WITH_SCAN"])
    requireRole(role, "officer")
  },
  undo_scan: (state, _steps, role) => {
    requireStatus(state, ["COMPLETED_WITH_SCAN"])
    requireRole(role, "officer")
  },
}

function requireReason(payload: Payload) {
  if (!String(payload.reason || "").trim()) throw new WorkflowError(400, "กรุณาระบุเหตุผล")
}

function requireSignedAt(payload: Payload) {
  const value = String(payload.signed_at || "")
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().startsWith(value)
  if (!valid) throw new WorkflowError(400, "กรุณาระบุวันที่ลงนามในรูปแบบ YYYY-MM-DD")
}

export function decide(state: WorkflowState, steps: SigningStep[], action: string, role: Role, payload: Payload): Transition {
  if (!(action in GUARDS)) throw new WorkflowError(400, `ไม่รู้จักการดำเนินการ '${action}'`)
  const act = action as WorkflowAction
  GUARDS[act](state, steps, role)

  switch (act) {
    case "submit":
      return { to_status: "PENDING_REVIEW", current_step_code: null, effects: [] }
    case "approve":
      return { to_status: "APPROVED_FOR_PRINT", current_step_code: steps[0].code, effects: ["GENERATE_DOCUMENT"] }
    case "request_revision":
      requireReason(payload)
      return { to_status: "REVISION_REQUESTED", current_step_code: null, effects: [] }
    case "reject":
      requireReason(payload)
      return { to_status: "REJECTED", current_step_code: null, effects: [] }
    case "record_signature": {
      const [index, step] = currentStep(state, steps)
      if (payload.step_code !== step.code) throw new WorkflowError(409, `ต้องบันทึกขั้น '${step.label}' ก่อน`)
      requireSignedAt(payload)
      // ลงนามครบแล้ว รอเจ้าหน้าที่อัปโหลดสแกน — งบล็อกตอนอัปโหลดสแกน
      if (index === steps.length - 1) return { to_status: "WAITING_FOR_SCAN", current_step_code: null, effects: ["ADD_SIGNATURE"] }
      return { to_status: "WAITING_FOR_SIGNATURES", current_step_code: steps[index + 1].code, effects: ["ADD_SIGNATURE"] }
    }
    case "undo_signature": {
      const last = state.signed_step_codes[state.signed_step_codes.length - 1]
      // ต้องระบุขั้นที่จะย้อน — กดย้อนซ้ำเร็ว ๆ คำขอที่สองอ้างขั้นที่ถูกย้อนไปแล้ว จึงไม่ย้อนเกิน
      if (payload.step_code !== last) throw new WorkflowError(409, "ย้อนได้เฉพาะขั้นที่บันทึกล่าสุด กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง")
      const remaining = state.signed_step_codes.length - 1
      return { to_status: remaining === 0 ? "APPROVED_FOR_PRINT" : "WAITING_FOR_SIGNATURES", current_step_code: last, effects: ["REMOVE_LAST_SIGNATURE"] }
    }
    case "undo_scan":
      // แนบสแกนผิด: ปลดงบที่ล็อก แล้วยกเลิกไฟล์สแกน กลับไปรอสแกน
      requireReason(payload)
      return { to_status: "WAITING_FOR_SCAN", current_step_code: null, effects: ["RELEASE_BUDGET", "VOID_SCAN"] }
    case "upload_scan":
      // สแกนแรก = เอกสารที่ลงนามครบเข้าระบบ → ล็อกงบรายกิจกรรม; อัปโหลดซ้ำ = เปลี่ยนไฟล์อย่างเดียว
      if (state.status === "WAITING_FOR_SCAN") return { to_status: "COMPLETED_WITH_SCAN", current_step_code: null, effects: ["STORE_SCAN", "COMMIT_BUDGET"] }
      return { to_status: "COMPLETED_WITH_SCAN", current_step_code: null, effects: ["STORE_SCAN"] }
  }
}

export function availableActions(state: WorkflowState, steps: SigningStep[], role: Role): WorkflowAction[] {
  return (Object.keys(GUARDS) as WorkflowAction[]).filter((act) => {
    try {
      GUARDS[act](state, steps, role)
      return true
    } catch {
      return false
    }
  })
}

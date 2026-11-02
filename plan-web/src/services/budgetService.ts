import { apiBlob, apiJson } from "../lib/api"
import { saveBlob } from "./planService"

export interface SourceLabel {
  code: string
  label: string
}

/** ตัวเลขของสาขาต่อแหล่งงบ (คำนวณจากโครงการและรายการเบิกจริงทุกครั้ง) */
export interface BranchBudgetRow {
  department: string
  source_code: string
  ceiling: number
  committed: number // คณบดีอนุมัติแล้ว (ปิดโครงการแล้วนับเท่าที่เบิกจริง)
  pending: number // เจ้าหน้าที่อนุมัติแล้ว รอเดินเซ็นถึงคณบดี
  spent: number
  remaining: number // วงเงิน − ผูกพัน − รอลงนาม
}

export interface BranchSummary {
  fiscal_year: number
  sources: SourceLabel[]
  departments: string[]
  rows: BranchBudgetRow[]
}

export interface LedgerLine {
  activity_key: string
  activity_no: number
  activity_name: string
  source_code: string
  source_label: string
  amount: number
  spent: number
  remaining: number
  /** ยอดที่อาจารย์ขอเบิกค้างอยู่ (ยังไม่ใช่ยอดเบิก) */
  requested: number
  /** ยอดที่ขอเบิกเพิ่มได้ = คงเหลือ − ที่ขอค้าง */
  available: number
}

export type RequestStatus = "PENDING" | "RECORDED" | "ACCEPTED" | "RETURNED" | "RESUBMITTED" | "CANCELLED"

export interface RequestFile {
  id: number
  file_name: string
  content_type: string
  size_bytes: number
}

/** คำขอเบิกของอาจารย์ — เจ้าหน้าที่บันทึกเบิก (RECORDED) หรือตีกลับ (RETURNED) */
export interface DisbursementRequest {
  id: number
  activity_key: string
  activity_name: string
  source_code: string
  source_label: string
  description: string
  amount: number
  status: RequestStatus
  requested_by: string
  created_at: string
  decided_at: string | null
  decided_by: string | null
  decision_reason: string | null
  disbursement_id: number | null
  resubmits_id: number | null
  files: RequestFile[]
}

/** คำขอปิดโครงการของอาจารย์ — เจ้าหน้าที่ปิดโครงการ (ACCEPTED) หรือตีกลับ */
export interface ClosureRequest {
  id: number
  note: string
  status: RequestStatus
  requested_by: string
  created_at: string
  decided_at: string | null
  decided_by: string | null
  decision_reason: string | null
  files: RequestFile[]
}

export interface RequestInput {
  activity_key: string
  source_code: string
  description: string
  amount: number
  resubmits_id?: number
}

export interface Disbursement {
  id: number
  activity_key: string
  activity_name: string
  source_code: string
  paid_on: string
  doc_no: string
  description: string
  amount: number
  recorded_by: string
  created_at: string
  voided_at: string | null
  voided_by: string | null
  void_reason: string | null
}

export interface ProjectLedgerData {
  project_code: string
  status: string
  lines: LedgerLine[]
  disbursements: Disbursement[]
  totals: { amount: number; spent: number; remaining: number }
  can_record: boolean
  /** อาจารย์เจ้าของโครงการขอเบิก/ขอปิดได้ (งบล็อกแล้วและยังไม่ปิด) */
  can_request: boolean
  requests: DisbursementRequest[]
  closure_requests: ClosureRequest[]
}

export interface DisbursementInput {
  activity_key: string
  source_code: string
  paid_on: string
  doc_no: string
  description: string
  amount: number
}

export interface BudgetCheck {
  warnings: string[]
}

export interface OverviewRow {
  no: number
  project_code: string
  title: string
  department: string
  owner: string
  status: string
  approved: number
  spent: number
  remaining: number
  percent: number
}

export interface LedgerOverview {
  fiscal_year: number
  source: string | null
  rows: OverviewRow[]
  totals: { approved: number; spent: number; remaining: number; percent: number }
}

export interface ClosureReport {
  participantCount?: number
  satisfactionScore?: number
  outcomeReport?: string
  photoAlbumUrl?: string
}

export interface ClosureResult {
  spent: number
  returned: number
  by_source: Record<string, { amount: number; spent: number; returned: number }>
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  return search.toString()
}

export const budgetService = {
  getBranchSummary(fiscalYear: number): Promise<BranchSummary> {
    return apiJson<BranchSummary>(`/budget/ceilings?${query({ fiscal_year: fiscalYear })}`)
  },

  saveCeilings(fiscalYear: number, sourceCode: string, ceilings: { department: string; ceiling: number }[]): Promise<BranchSummary> {
    return apiJson<BranchSummary>("/budget/ceilings", json("PUT", { fiscal_year: fiscalYear, source_code: sourceCode, ceilings }))
  },

  getProjectLedger(code: string): Promise<ProjectLedgerData> {
    return apiJson<ProjectLedgerData>(`/projects/${code}/ledger`)
  },

  recordDisbursement(code: string, input: DisbursementInput): Promise<ProjectLedgerData> {
    return apiJson<ProjectLedgerData>(`/projects/${code}/disbursements`, json("POST", input))
  },

  voidDisbursement(code: string, id: number, reason: string): Promise<ProjectLedgerData> {
    return apiJson<ProjectLedgerData>(`/projects/${code}/disbursements/${id}/void`, json("POST", { reason }))
  },

  requestDisbursement(code: string, input: RequestInput, files: File[]): Promise<ProjectLedgerData> {
    const form = new FormData()
    form.append("activity_key", input.activity_key)
    form.append("source_code", input.source_code)
    form.append("description", input.description)
    form.append("amount", String(input.amount))
    if (input.resubmits_id) form.append("resubmits_id", String(input.resubmits_id))
    files.forEach((file) => form.append("files", file))
    return apiJson<ProjectLedgerData>(`/projects/${code}/disbursement-requests`, { method: "POST", body: form })
  },

  /** record: ใส่ paid_on, doc_no (แก้ amount/description ได้) · return: reason · cancel */
  decideRequest(code: string, id: number, verb: "record" | "return" | "cancel", body: Record<string, unknown> = {}): Promise<ProjectLedgerData> {
    return apiJson<ProjectLedgerData>(`/projects/${code}/disbursement-requests/${id}/${verb}`, json("POST", body))
  },

  requestClosure(code: string, note: string, files: File[]): Promise<ProjectLedgerData> {
    const form = new FormData()
    form.append("note", note)
    files.forEach((file) => form.append("files", file))
    return apiJson<ProjectLedgerData>(`/projects/${code}/closure-requests`, { method: "POST", body: form })
  },

  decideClosure(code: string, id: number, verb: "return" | "cancel", body: Record<string, unknown> = {}): Promise<ProjectLedgerData> {
    return apiJson<ProjectLedgerData>(`/projects/${code}/closure-requests/${id}/${verb}`, json("POST", body))
  },

  /** เปิดไฟล์หลักฐานในแท็บใหม่ (PDF/รูป) */
  async openRequestFile(file: RequestFile): Promise<void> {
    const viewer = window.open("", "_blank")
    if (viewer) viewer.document.title = file.file_name
    try {
      const blob = await apiBlob(`/request-files/${file.id}/download`)
      const url = URL.createObjectURL(blob)
      if (viewer) viewer.location.href = url
      else saveBlob(blob, file.file_name)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      viewer?.close()
      throw e
    }
  },

  getBudgetCheck(code: string): Promise<BudgetCheck> {
    return apiJson<BudgetCheck>(`/projects/${code}/budget-check`)
  },

  closeProject(code: string, report: ClosureReport): Promise<ClosureResult> {
    return apiJson<ClosureResult>(`/projects/${code}/close`, json("POST", report))
  },

  getOverview(fiscalYear: number, source?: string, department?: string): Promise<LedgerOverview> {
    return apiJson<LedgerOverview>(`/budget/ledger?${query({ fiscal_year: fiscalYear, source, department })}`)
  },

  async downloadOverview(fiscalYear: number, source: SourceLabel, department?: string): Promise<void> {
    const blob = await apiBlob(`/budget/ledger.xlsx?${query({ fiscal_year: fiscalYear, source: source.code, department })}`)
    saveBlob(blob, `คุมรายการเงิน${source.label}_${fiscalYear}.xlsx`)
  },
}

const THAI_SHORT_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

/** "2027-04-27" → "27 เม.ย. 70" แบบเดียวกับไฟล์คุมรายการเงิน */
export function thaiShortDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value
  return `${day} ${THAI_SHORT_MONTHS[month - 1]} ${String((year + 543) % 100).padStart(2, "0")}`
}

/** เงินบาทแบบมีทศนิยม 2 ตำแหน่ง */
export function baht(amount: number): string {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

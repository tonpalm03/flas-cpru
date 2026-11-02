import {
  CpruProjectFormData,
  PlanProject,
  ProjectStatus,
  BudgetItem,
  DocumentRef,
  WorkflowAction,
  WorkflowView,
} from "../types/plan"
import { apiBlob, apiJson } from "../lib/api"
import { getCurrentUser } from "../lib/currentUser"

// Fallback seed projects for demonstration & offline reliability
/** โครงการในถังขยะ (เจ้าหน้าที่แผนกู้คืนได้) */
export interface TrashItem {
  project_code: string
  title: string
  owner: string
  department: string
  fiscal_year: number
  status: string
  total_amount: number
  deleted_at: string
  deleted_by: string
  delete_reason: string | null
}

export const initialMockProjects: PlanProject[] = [
  {
    id: "PRJ-2568-042",
    dbId: 1,
    name: "พัฒนาทักษะ AI เพื่อการเรียนรู้",
    owner: "อ.ชลธิชา พงษ์ประเสริฐ",
    unit: "เทคโนโลยีสารสนเทศ",
    amount: 85000,
    spent: 22500,
    advance: 30000,
    date: "18 ก.พ. 2568",
    status: "COMPLETED_WITH_SCAN",
    objective: "พัฒนาทักษะการใช้ AI อย่างรับผิดชอบให้กับนักศึกษา",
    targetGroup: "นักศึกษาคณะวิทยาศาสตร์ 120 คน",
    budgetItems: [
      { category: "ค่าวิทยากร", description: "วิทยากรผู้เชี่ยวชาญ AI 2 ท่าน 12 ชม.", amount: 36000 },
      { category: "ค่าอาหาร", description: "อาหารกลางวันและอาหารว่าง 120 คน 2 วัน", amount: 28800 },
      { category: "ค่าวัสดุ", description: "เอกสารและอุปกรณ์จัดอบรม", amount: 20200 },
    ],
  },
  {
    id: "PRJ-2568-044",
    dbId: 2,
    name: "บริการวิชาการเพื่อชุมชน",
    owner: "อ.พิมพ์ชนก วัฒนกุล",
    unit: "การจัดการ",
    amount: 120000,
    spent: 0,
    advance: 0,
    date: "3 มี.ค. 2568",
    status: "PENDING_REVIEW",
    objective: "ถ่ายทอดองค์ความรู้ด้านการจัดการธุรกิจให้ผู้ประกอบการชุมชน",
    targetGroup: "กลุ่มวิสาหกิจชุมชน 40 ครัวเรือน",
    budgetItems: [
      { category: "ค่าวิทยากร", description: "วิทยากรที่ปรึกษาธุรกิจ", amount: 45000 },
      { category: "ค่าอาหาร", description: "อาหารว่างและอาหารกลางวัน", amount: 35000 },
      { category: "ค่าเดินทาง", description: "ค่าเช่าพาหนะลงพื้นที่ชุมชน", amount: 40000 },
    ],
  },
  {
    id: "PRJ-2568-045",
    dbId: 3,
    name: "อบรมการสื่อสารดิจิทัล",
    owner: "อ.กิตติศักดิ์ ชูใจ",
    unit: "นิเทศศาสตร์",
    amount: 65000,
    spent: 0,
    advance: 0,
    date: "22 ก.พ. 2568",
    status: "PENDING_REVIEW",
    objective: "เสริมทักษะการสื่อสารบนแพลตฟอร์มดิจิทัล",
    targetGroup: "นักศึกษาและศิษย์เก่า 80 คน",
    budgetItems: [
      { category: "ค่าวิทยากร", description: "วิทยากรสาย Content Creator", amount: 30000 },
      { category: "ค่าอาหาร", description: "อาหารว่างและเครื่องดื่ม", amount: 20000 },
      { category: "ค่าวัสดุ", description: "อุปกรณ์สตูดิโอและลิขสิทธิ์ซอฟต์แวร์", amount: 15000 },
    ],
  },
  {
    id: "PRJ-2568-039",
    dbId: 4,
    name: "Design Thinking for Educators",
    owner: "อ.วราภรณ์ ใจดี",
    unit: "เทคโนโลยีสารสนเทศ",
    amount: 48000,
    spent: 48000,
    advance: 0,
    date: "28 ม.ค. 2568",
    status: "COMPLETED",
    objective: "พัฒนากระบวนการออกแบบการเรียนรู้",
    targetGroup: "คณาจารย์ในคณะ 30 คน",
  },
]


const VIEWABLE_TYPES = ["application/pdf", "image/jpeg", "image/png"]

export function isViewable(contentType?: string): boolean {
  return VIEWABLE_TYPES.includes(contentType || "")
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function mapDbRowToPlanProject(row: any): PlanProject {
  return {
    id: row.project_code || `PRJ-2570-${String(row.id).padStart(3, "0")}`,
    dbId: row.id,
    name: row.title,
    owner: row.owner || row.form_data?.leader?.name || "อาจารย์ผู้เสนอโครงการ",
    unit: row.department || row.form_data?.department || "เทคโนโลยีสารสนเทศ",
    amount: Number(row.total_amount || 0),
    // ยอดเบิกจริงจากทะเบียนการเบิกจ่าย (backend รวมให้ในแถวโครงการ)
    spent: Number(row.budget_spent || 0),
    advance: 0,
    remaining: Number(row.total_amount || 0) - Number(row.budget_spent || 0),
    percentSpent: Number(row.total_amount) > 0 ? (Number(row.budget_spent || 0) / Number(row.total_amount)) * 100 : 0,
    budgetLocked: Number(row.budget_locked || 0),
    requestsPending: Number(row.requests_pending || 0),
    requestsReturned: Number(row.requests_returned || 0),
    requestsReturnReason: row.requests_return_reason ?? null,
    closureRequestStatus: row.closure_request_status ?? null,
    closureReturnReason: row.closure_return_reason ?? null,
    fiscalYear: row.fiscal_year || 2570,
    date: row.start_date || "2570",
    status: (row.status as ProjectStatus) || "PENDING_REVIEW",
    objective: row.objective || "",
    targetGroup: row.target_group || "",
    formData: row.form_data,
    budgetSources: {
      national: Number(row.national_amount || 0),
      revenue: Number(row.revenue_amount || 0),
      offBudget: Number(row.off_budget_amount || 0),
    },
    isBudgetLocked: Boolean(row.is_locked),
    createdAt: row.created_at,
    currentStepCode: row.current_step_code ?? null,
    currentStepLabel: row.current_step_label ?? null,
    lastReason: row.last_reason ?? null,
    updatedAt: row.updated_at,
    proposalDoc: row.proposal_doc_id ? { id: row.proposal_doc_id, file_name: row.proposal_doc_name } : null,
    scanDoc: row.scan_doc_id
      ? {
          id: row.scan_doc_id,
          file_name: row.scan_doc_name,
          content_type: row.scan_content_type,
          uploaded_at: row.scan_uploaded_at,
          opened_at: row.scan_opened_at ?? null,
        }
      : null,
  }
}

export type NewProjectInput = Omit<PlanProject, "id" | "spent" | "advance">

/** ข้อมูลโครงการในรูปแบบที่ backend รับ (POST /projects และตัวอย่างแบบฟอร์มของข้อมูลที่ยังไม่บันทึก) */
function projectPayload(project: NewProjectInput) {
  return {
    fiscalYear: project.fiscalYear || project.formData?.fiscalYear || 2570,
    title: project.name,
    owner: project.owner,
    department: project.unit || project.formData?.department || "เทคโนโลยีสารสนเทศ",
    faculty: project.formData?.facultyName || "คณะศิลปศาสตร์และวิทยาศาสตร์",
    projectCategory: project.formData?.projectCategory || "ตามแผน นโยบาย/จุดเน้นมหาวิทยาลัย",
    projectCategoryOther: project.formData?.projectCategoryOther || "",
    amount: project.amount,
    budgetSources: project.budgetSources || project.formData?.budgetSources || {
      national: project.amount,
      revenue: 0,
      offBudget: 0,
    },
    startDate: project.date || "",
    endDate: "",
    targetGroup: project.targetGroup || "",
    objective: project.objective || "",
    formData: project.formData,
  }
}

export const planService = {
  // รายการโครงการจาก backend เท่านั้น (อาจารย์ได้เฉพาะโครงการของตัวเอง — backend กรองให้)
  // ข้อมูลอ้างอิงปีงบ 2569 (web/src/data/cpru2569Data.ts) ไม่แสดงแล้ว เพราะปนกับข้อมูลจริง
  // backend ผิดพลาด → แจ้ง error (ไม่สลับไปแสดงข้อมูลจากแหล่งอื่นแทน)
  async getProjects(fiscalYear?: number): Promise<PlanProject[]> {
    const rows = await apiJson<any[]>(fiscalYear ? `/projects?fiscal_year=${fiscalYear}` : "/projects")
    return (Array.isArray(rows) ? rows : []).map(mapDbRowToPlanProject)
  },

  // Create a new project proposal (FastAPI Enterprise SQLite DB)
  async createProject(project: NewProjectInput, budgetItems: BudgetItem[]): Promise<PlanProject> {
    // โครงการใหม่บันทึกเป็นแบบร่างเสมอ — การส่งตรวจใช้ performAction(code, "submit")
    const row = await apiJson<any>("/projects", { method: "POST", body: JSON.stringify(projectPayload(project)) })
    const savedProject = mapDbRowToPlanProject(row)
    savedProject.budgetItems = budgetItems
    return savedProject
  },

  // Update project data directly (for Plan Officer Collaborative Edit)
  async updateProjectData(
    projectId: string,
    dbId: number | undefined,
    updates: Partial<PlanProject>,
    _actor?: string
  ): Promise<PlanProject> {
    // ผู้แก้ไขมาจาก header ของผู้ใช้ปัจจุบัน; สถานะเปลี่ยนผ่าน performAction เท่านั้น
    const payload: any = {}
    if (updates.name) payload.title = updates.name
    if (updates.amount !== undefined) payload.total_amount = updates.amount
    if (updates.objective) payload.objective = updates.objective
    if (updates.targetGroup) payload.targetGroup = updates.targetGroup
    if (updates.formData) payload.formData = updates.formData
    if (updates.budgetSources) payload.budgetSources = updates.budgetSources
    if (updates.unit) payload.department = updates.unit
    if (updates.owner) payload.owner = updates.owner
    if (updates.fiscalYear) payload.fiscalYear = updates.fiscalYear
    if (updates.date) payload.startDate = updates.date
    if (updates.formData?.endDate) payload.endDate = updates.formData.endDate

    const row = await apiJson<any>(`/projects/${projectId}`, { method: "PUT", body: JSON.stringify(payload) })
    return mapDbRowToPlanProject(row)
  },

  // Document workflow (ร่าง → ตรวจ → พิมพ์เซ็น → เดินเซ็น → สแกน)
  getWorkflow(code: string): Promise<WorkflowView> {
    return apiJson<WorkflowView>(`/projects/${code}/workflow`)
  },

  performAction(
    code: string,
    action: WorkflowAction,
    payload: { reason?: string; step_code?: string; signed_at?: string; note?: string } = {}
  ): Promise<WorkflowView> {
    return apiJson<WorkflowView>(`/projects/${code}/actions`, {
      method: "POST",
      body: JSON.stringify({ action, ...payload }),
    })
  },

  /** อ่านไฟล์ Word ของโครงการ (แบบฟอร์ม 14 ข้อ) เป็นร่าง — ยังไม่บันทึกจนกว่าผู้ใช้จะกดบันทึก/ส่ง */
  importDocx(file: File): Promise<{ form_data: CpruProjectFormData; warnings: string[] }> {
    const form = new FormData()
    form.append("file", file)
    return apiJson(`/projects/import-docx`, { method: "POST", body: form })
  },

  /** ไฟล์สแกน (PDF) ของโครงการ → ร่างเหมือน importDocx (AI อ่านทีละหน้า ไม่เกิน 1 นาที — backend/services/proposal_scan.py) */
  importScan(file: File): Promise<{ form_data: CpruProjectFormData; warnings: string[] }> {
    const form = new FormData()
    form.append("file", file)
    return apiJson(`/projects/import-scan`, { method: "POST", body: form })
  },

  /** ย้ายโครงการไปถังขยะ (กฎ: backend/services/project_trash.py) */
  deleteProject(code: string, reason = ""): Promise<unknown> {
    return apiJson(`/projects/${code}/delete`, { method: "POST", body: JSON.stringify({ reason }) })
  },

  restoreProject(code: string): Promise<unknown> {
    return apiJson(`/projects/${code}/restore`, { method: "POST" })
  },

  getTrash(): Promise<TrashItem[]> {
    return apiJson<TrashItem[]>("/trash")
  },

  uploadScan(code: string, file: File): Promise<WorkflowView> {
    const form = new FormData()
    form.append("file", file)
    return apiJson<WorkflowView>(`/projects/${code}/scan`, { method: "POST", body: form })
  },

  async downloadDocument(doc: DocumentRef): Promise<void> {
    saveBlob(await apiBlob(`/documents/${doc.id}/download`), doc.file_name)
  },

  /** เปิด PDF/รูปในแท็บใหม่ให้สั่งพิมพ์ได้ทันที (ชนิดอื่นดาวน์โหลดแทน)
   * ต้องเรียกตรงจากการคลิก: เปิดหน้าต่างก่อน แล้วค่อยใส่ไฟล์ — กัน popup blocker */
  async openDocument(doc: DocumentRef): Promise<void> {
    if (!isViewable(doc.content_type)) return this.downloadDocument(doc)
    const viewer = window.open("", "_blank")
    if (viewer) viewer.document.title = doc.file_name
    try {
      const blob = await apiBlob(`/documents/${doc.id}/download`)
      const url = URL.createObjectURL(blob)
      if (viewer) viewer.location.href = url
      else saveBlob(blob, doc.file_name)
      // เบราว์เซอร์โหลดไฟล์เข้าแท็บใหม่แล้วจึงคืนหน่วยความจำ
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      viewer?.close()
      throw e
    }
  },

  /** แบบฟอร์มจริง (ไฟล์ Word) จากข้อมูลที่กำลังกรอก — ยังไม่บันทึก ใช้แสดงตัวอย่างข้างหน้าเสนอโครงการ */
  previewDraftDocument(project: NewProjectInput, signal?: AbortSignal): Promise<Blob> {
    return apiBlob("/projects/document-preview", { method: "POST", body: JSON.stringify(projectPayload(project)), signal })
  },

  async previewDocument(code: string): Promise<void> {
    saveBlob(await apiBlob(`/projects/${code}/document-preview`), `ตัวอย่าง_${code}.docx`)
  },
}

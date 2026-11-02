export type Role = "teacher" | "head" | "officer" | "plan_head" | "dean"

export type ProjectStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "APPROVED_FOR_PRINT"
  | "WAITING_FOR_SIGNATURES"
  | "WAITING_FOR_SCAN"
  | "COMPLETED_WITH_SCAN"
  | "COMPLETED"

export type WorkflowAction =
  | "submit"
  | "approve"
  | "request_revision"
  | "reject"
  | "record_signature"
  | "undo_signature"
  | "upload_scan"
  | "undo_scan"

export interface WorkflowStepView {
  code: string
  label: string
  order: number
  mode: "OFFLINE" | "IN_SYSTEM"
  state: "done" | "current" | "pending"
  signed_at?: string | null
  recorded_by?: string | null
  note?: string | null
}

export interface ProjectDocumentView {
  id: number
  kind: "GENERATED_PROPOSAL" | "SIGNED_SCAN"
  version: number
  file_name: string
  content_type: string
  size_bytes: number
  created_at: string
  created_by: string
}

/** เอกสารฉบับล่าสุดที่แนบมากับแถวโครงการ (ใช้ดาวน์โหลด/เปิดดูโดยไม่ต้องโหลด workflow) */
export interface DocumentRef {
  id: number
  file_name: string
  content_type?: string
}

export interface ScanDocumentRef extends DocumentRef {
  uploaded_at: string
  opened_at: string | null // อาจารย์เจ้าของโครงการเปิดครั้งแรกเมื่อไร (null = ยังไม่เปิด → ป้าย "ใหม่")
}

export interface WorkflowView {
  project_code: string
  status: ProjectStatus
  current_step_code: string | null
  last_reason: string | null
  steps: WorkflowStepView[]
  documents: ProjectDocumentView[]
  available_actions: WorkflowAction[]
  warnings: string[]
}

// ข้อมูลประจำปีงบประมาณ (มาจาก backend/fiscal_years/{ปี}/config.json)
export interface CodeLabel {
  code: string
  label: string
}

export interface ExpenseCategoryConfig extends CodeLabel {
  hint: string
}

export interface ProjectCategoryConfig extends CodeLabel {
  aliases: string[]
}

export interface PlanItem {
  id: number
  text: string
}

export interface StrategicPlan {
  title: string
  missions: PlanItem[]
  strategies: PlanItem[]
  // ผู้กำกับติดตามโครงการ (ข้อ 14) ค่าเริ่มต้น — ปกติคือคณบดี
  default_supervisor?: { name: string; position: string } | null
}

export interface FiscalYearConfig {
  fiscal_year: number
  budget_sources: CodeLabel[]
  expense_categories: ExpenseCategoryConfig[]
  project_categories: ProjectCategoryConfig[]
  university_plan: StrategicPlan
  faculty_plans: Record<string, StrategicPlan>
}


export interface UserRoleInfo {
  label: string
  short: string
  name: string
  department: string
  // คณะของผู้ใช้ — ใช้เลือกแผนปฏิบัติราชการของคณะ (ข้อ 4) อัตโนมัติ
  faculty?: string
  // เติมเป็นผู้รับผิดชอบโครงการ (ข้อ 12) ตอนเสนอโครงการใหม่
  position?: string
  phone?: string
}

// Section 6: Objectives, OKRs, Targets
export interface ProjectOKRItem {
  id: string
  objective: string
  keyResult: string
  target: string
}

// Section 7: Scope of Project
export interface ProjectScopeActivity {
  id: string
  name: string
  location: string
  committeeCount: number
  targetCount: number
  quarter: 1 | 2 | 3 | 4
  monthRange: string
  amount: number
}

// Section 8: Activity Methods & KPIs
export interface ProjectActivityMethod {
  id: string
  name: string
  methods: string[]
  kpi: string
}

// Section 9: Detailed Expense Item by Category & Source
// รหัสหมวดรายจ่ายมาจาก expense_categories ของ config ปีงบ (เช่น compensation, operations, materials)
export type ExpenseCategoryKey = string

// ============================================================================
// Smart Budget Multiplier Structure (ตารางแตกตัวคูณงบประมาณ 4 มิติ)
// Formula: [กลุ่มเป้าหมาย (คน)] x [ระยะเวลา (มื้อ/ชม./วัน)] x [เรทบาท] x [จำนวนครั้ง] = [ยอดรวม]
// ============================================================================
export interface MultiplierBudgetItem {
  id: string
  activityId?: string
  activityName?: string
  category: ExpenseCategoryKey // compensation, operations, materials
  name: string // e.g. "ค่าตอบแทนวิทยากร", "ค่าอาหารกลางวัน", "ค่าอาหารว่าง"
  targetQty: number // เช่น 2 (คน), 50 (คน), 1 (งาน)
  targetUnit: string // เช่น "คน", "ชุด", "งาน", "เล่ม"
  durationQty: number // เช่น 6 (ชม.), 1 (มื้อ), 2 (วัน)
  durationUnit: string // เช่น "ชม.", "มื้อ", "วัน", "คืน"
  unitRate: number // เช่น 1000 (บาท/ชม.), 120 (บาท/มื้อ), 35 (บาท/มื้อ)
  rateUnit: string // "บาท"
  frequencyQty: number // เช่น 1 (ครั้ง), 2 (ครั้ง)
  frequencyUnit: string // "ครั้ง"
  totalAmount: number // targetQty * durationQty * unitRate * frequencyQty
  fundSource: string // รหัสแหล่งงบจาก budget_sources ของ config ปีงบ (national, revenue, off_budget)
  note?: string
}

// Unified Activity Entity
export interface TargetGroup {
  name: string
  count: number
}

export interface ProjectActivityDefinition {
  id: string
  index: number
  name: string
  // รายการย่อยใต้ชื่อกิจกรรม ("- ...") ในข้อ 7, 8 และ 9
  subItems?: string[]
  location: string
  committeeCount: number
  // กลุ่มเป้าหมายแยกตามกลุ่ม — targetCount คือผลรวม (เก็บไว้ให้หน้าจอเดิมอ่าน)
  targetGroups?: TargetGroup[]
  targetCount: number
  // เดือนเริ่ม/สิ้นสุด (1-12) — ไตรมาสคำนวณจากเดือน; quarter/monthRange เป็นค่าที่คำนวณไว้ให้หน้าจอเดิม
  startMonth?: number
  endMonth?: number
  quarter: 1 | 2 | 3 | 4
  monthRange: string
  objective?: string
  okrKeyResult?: string
  okrTarget?: string
  methods: string[]
  kpi: string
  multiplierItems: MultiplierBudgetItem[]
  budgetAmount?: number
}

export interface DetailedExpenseItem {
  id: string
  activityName: string
  category: ExpenseCategoryKey
  description: string
  nationalAmount: number // งบแผ่นดิน
  revenueAmount: number  // งบเงินรายได้
  offBudgetAmount: number // งบนอกแผน
}

// Sections 12-14: Personnel
export interface ProjectPersonnel {
  name: string
  position: string
  phone: string
}

// Complete 14-Section CPRU Official Form Payload
export interface CpruProjectFormData {
  fiscalYear: number
  projectCategoryCode?: string // รหัสประเภทโครงการจาก config ปีงบ (เช่น plan_policy)
  projectCategory: string // ชื่อประเภทโครงการตามแบบฟอร์ม
  projectCategoryOther?: string

  // 1-2 General
  title: string
  department: string
  startDate?: string
  endDate?: string
  targetGroup?: string

  // 3-4 Strategic Alignment
  universityMissionIds: number[]
  universityStrategyIds: number[]
  facultyName?: string
  facultyMissionIds?: number[]
  facultyStrategyIds?: number[]
  facultyMissionText?: string
  facultyStrategyText?: string

  // 5 Background & Rationale (3 paragraphs)
  backgroundProblem: string
  backgroundSolution: string
  backgroundImpact: string

  // 6 OKRs & Targets
  okrs: ProjectOKRItem[]

  // 7 Scope & Quarters
  activities: ProjectScopeActivity[]

  // 8 Methods & KPIs
  activityMethods: ProjectActivityMethod[]

  // Unified Activities (with OKR, Scope, Method & Multipliers)
  activityDefinitions?: ProjectActivityDefinition[]

  // 9 Budget Breakdown & 3 Sources
  budgetSources: {
    national: number // งบประมาณแผ่นดิน
    revenue: number  // งบประมาณเงินรายได้
    offBudget: number // งบนอกแผน
    offBudgetDetail?: string
  }
  expenses: DetailedExpenseItem[]
  multiplierItems?: MultiplierBudgetItem[]

  // 10 Impact
  impacts: string[]

  // 11 Evaluation & Monitoring
  evaluations: string[]

  // 12-14 Personnel
  leader: ProjectPersonnel
  coLeaders: ProjectPersonnel[]
  coLeadersText?: string
  supervisor: { name: string; position: string; phone?: string }

  // Plan Officer Collaboration & Review
  officerReviewNotes?: string
  officerReviewedAt?: string
  officerReviewedBy?: string
}

export interface BudgetItem {
  id?: string | number
  category: string
  description: string
  amount: number
}

export interface ProjectAttachment {
  name: string
  size?: number
  type?: string
  url?: string
}

export interface DisbursementRecord {
  id: string
  date: string // e.g. "27 เม.ย. 69"
  docNumber: string // e.g. "167/69", "ขด-303/69", "อว 0646.02/89"
  description: string
  payeeOrResponsible?: string
  allocatedBudget?: number
  disbursedAmount: number // ยอดเบิก
  remainingBalance: number // ยอดคงเหลือ
  category?: string
}

export interface ProjectSubActivity {
  id: string
  code?: string // e.g. "กิจกรรมที่ 3.1"
  name: string
  allocatedBudget: number
  spentBudget: number
  remainingBudget: number
  quarter?: string // e.g. "ไตรมาสที่ 2 (ม.ค. - มี.ค. 69)"
  disbursements?: DisbursementRecord[]
}

export interface PlanProject {
  id: string // Code like PRJ-2568-042 or PRJ-2569-001
  dbId?: number
  projectNo?: number // 1 to 35
  name: string
  shortName?: string
  owner: string
  ownerId?: string
  unit: string // branch_name (e.g. เทคโนโลยีสารสนเทศ)
  amount: number // total budget
  spent: number
  advance: number
  remaining?: number
  percentSpent?: number
  fiscalYear?: number
  quarter?: string // e.g. "ไตรมาส 3"
  date: string // activity_date
  status: ProjectStatus
  objective: string
  targetGroup?: string
  budgetItems?: BudgetItem[]
  attachments?: ProjectAttachment[]
  createdAt?: string
  formData?: CpruProjectFormData
  budgetSources?: {
    national: number
    revenue: number
    offBudget: number
  }
  subActivities?: ProjectSubActivity[]
  disbursements?: DisbursementRecord[]

  // ERP & Future Financial Sync
  costCenterCode?: string
  erpProjectRefId?: string | null
  erpSyncStatus?: "DRAFT" | "PENDING_SYNC" | "COMMITTED" | "SYNC_FAILED"
  totalBudgetApproved?: number
  isBudgetLocked?: boolean
  /** ยอดงบที่ล็อกแล้ว (อัปโหลดเอกสารลงนามครบแล้ว) */
  budgetLocked?: number
  /** คำขอเบิกของอาจารย์: รอเจ้าหน้าที่ / ถูกตีกลับรออาจารย์ (+ เหตุผลล่าสุด) */
  requestsPending?: number
  requestsReturned?: number
  requestsReturnReason?: string | null
  /** สถานะคำขอปิดโครงการล่าสุด (PENDING / RETURNED / ACCEPTED ...) */
  closureRequestStatus?: string | null
  closureReturnReason?: string | null

  // Document workflow
  currentStepCode?: string | null
  currentStepLabel?: string | null
  lastReason?: string | null
  updatedAt?: string
  proposalDoc?: DocumentRef | null
  scanDoc?: ScanDocumentRef | null
}


export interface BudgetAllocation {
  unit: string
  compensation: number // ค่าตอบแทน
  operations: number // ค่าใช้สอย
}

export interface FiscalYearInfo {
  year: number
  totalBudget: number
  allocated: number
  unallocated: number
  status: "DRAFT" | "OPEN" | "CLOSED"
  allocations: BudgetAllocation[]
}

export interface ProjectClosureData {
  projectId: string
  actualSpent: number
  returnedAmount: number
  participantCount: number
  satisfactionScore: number
  outcomeReport: string
  photoAlbumUrl?: string
}

export interface BudgetType {
  id: string
  code: string
  name: string
  description?: string
  fiscalYear?: number
  isActive: boolean
}

// Hierarchical Self-Referencing Budget Category (Adjacency List)
export interface BudgetCategory {
  id: string
  code: string
  name: string
  description?: string
  parentId: string | null
  fiscalYear: number
  isActive: boolean
  sortOrder: number
  children?: BudgetCategory[]
}

export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "number"
  | "date"

export interface FormFieldSchema {
  id: string
  name: string // field identifier (JSON key)
  label: string // label shown on form
  type: FormFieldType
  required: boolean
  wordTag: string // tag used in Word docx, e.g. "strategic_plan" -> {{strategic_plan}}
  placeholder?: string
  options?: string[] // for select/checkbox
  defaultValue?: any
  helpText?: string
}

export interface FormTemplate {
  id: string
  fiscalYear: number
  title: string
  description?: string
  isActive: boolean
  schema: FormFieldSchema[]
  wordTemplateUrl?: string
  createdAt?: string
}

export type PlanPage =
  | "dashboard"
  | "budget"
  | "projects"
  | "proposal"
  | "project-detail"
  | "approvals"
  | "closure"
  | "form-builder"
  | "users"
  | "trash"
  | "ledger"

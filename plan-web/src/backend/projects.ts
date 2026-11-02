/**
 * โครงการของระบบแผนบน Firestore — แทน SQLite + FastAPI ของระบบเดิม (database.py, workflow_service.py, project_trash.py)
 *   plan_proposals/{รหัสโครงการ}   แถวโครงการ + ลายเซ็น + ประวัติ (audit_logs) + รายการเอกสาร
 *   plan_documents/{id}            เอกสารแต่ละฉบับ: ข้อมูลที่ใช้สร้างไฟล์ Word (render_context) หรือที่เก็บไฟล์สแกนใน Storage
 *   plan_proposal_counters/{ปีงบ}  เลขรหัสโครงการถัดไป (ไม่ใช้ซ้ำแม้ลบโครงการ)
 * ไฟล์ Word สร้างในเบราว์เซอร์จาก template ของปีงบ + render_context ที่เก็บไว้ตอนอนุมัติ (เนื้อหาไม่เปลี่ยนตามมาภายหลัง)
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
  type DocumentData,
} from "firebase/firestore"
import { deleteObject, getBlob, ref, uploadBytes } from "firebase/storage"
import type { FiscalYearConfig, Role } from "../types/plan"
import { db, storage } from "./firebase"
import type { Actor } from "./users"
import { FACULTY_NAME } from "./users"
import { buildContext, DocumentDataError, formatMoney, lineItemsTotal, PROVIDED_TAGS, type DocumentProject } from "./proposalDocument"
import { renderDocx, TemplateDataError, templateVariables } from "./docxTemplate"
import { availableActions, decide, DEFAULT_SIGNING_STEPS, WorkflowError, type WorkflowState } from "./workflow"
import config2570 from "./fiscalYears/2570.json"

const PROJECTS = "plan_proposals"
const DOCUMENTS = "plan_documents"
const COUNTERS = "plan_proposal_counters"

const PROPOSAL = "GENERATED_PROPOSAL"
const SCAN = "SIGNED_SCAN"
export const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const MAX_SCAN_BYTES = 20 * 1024 * 1024
const ALLOWED_SCAN_TYPES: Record<string, string> = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png" }
// ไบต์แรกของไฟล์แต่ละชนิด — ชนิดที่เบราว์เซอร์ส่งมาปลอมได้ ต้องตรวจเนื้อไฟล์ด้วย
const SCAN_SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
}

// สถานะที่ลายเซ็นของเอกสารฉบับล่าสุดยังมีผล (ก่อนหน้านั้นลายเซ็นเก่าเป็นของฉบับที่ถูกตีกลับไปแล้ว)
const SIGNING_STATUSES = ["APPROVED_FOR_PRINT", "WAITING_FOR_SIGNATURES", "WAITING_FOR_SCAN", "COMPLETED_WITH_SCAN", "COMPLETED"]

const EDITABLE_STATUSES: Partial<Record<Role, string[]>> = {
  teacher: ["DRAFT", "REVISION_REQUESTED"],
  officer: ["PENDING_REVIEW"],
}

const TEACHER_DRAFT = ["DRAFT"]
const TEACHER_WITHDRAW = ["PENDING_REVIEW", "REVISION_REQUESTED"]
const OFFICER_DELETABLE = ["DRAFT", "PENDING_REVIEW", "REVISION_REQUESTED", "REJECTED"]

type Row = Record<string, any>

interface DocumentMeta {
  id: number
  kind: typeof PROPOSAL | typeof SCAN
  version: number
  file_name: string
  content_type: string
  size_bytes: number
  created_at: string
  created_by: string
  voided_at?: string | null
  voided_by?: string | null
  void_reason?: string | null
  owner_opened_at?: string | null
}

// ---------------------------------------------------------------------------
// ปีงบประมาณและ template
// ---------------------------------------------------------------------------

const FISCAL_YEARS: Record<number, FiscalYearConfig> = { 2570: normalizeConfig(config2570) }

function normalizeConfig(raw: any): FiscalYearConfig {
  const plan = (p: any) => ({ ...p, default_supervisor: p.default_supervisor ?? null })
  return {
    ...raw,
    expense_categories: raw.expense_categories.map((c: any) => ({ hint: "", ...c })),
    project_categories: raw.project_categories.map((c: any) => ({ aliases: [], ...c })),
    university_plan: plan(raw.university_plan),
    faculty_plans: Object.fromEntries(Object.entries(raw.faculty_plans).map(([k, v]) => [k, plan(v)])),
  }
}

export function listYears(): number[] {
  return Object.keys(FISCAL_YEARS).map(Number).sort()
}

export function loadConfig(year: number): FiscalYearConfig {
  const config = FISCAL_YEARS[year]
  if (!config) throw new WorkflowError(422, `ยังไม่ได้ตั้งค่าปีงบประมาณ ${year}`)
  return config
}

const templateCache = new Map<number, Promise<ArrayBuffer>>()

function loadTemplate(year: number): Promise<ArrayBuffer> {
  loadConfig(year)
  let cached = templateCache.get(year)
  if (!cached) {
    cached = fetch(`${import.meta.env.BASE_URL}fiscal_years/${year}/template.docx`).then((r) => {
      if (!r.ok) throw new WorkflowError(422, `ยังไม่ได้ตั้งค่าปีงบประมาณ ${year}`)
      return r.arrayBuffer()
    })
    cached.catch(() => templateCache.delete(year))
    templateCache.set(year, cached)
  }
  return cached
}

export async function checkTemplate(year: number): Promise<{ ok: boolean; missing: string[] }> {
  const missing = templateVariables(await loadTemplate(year)).filter((tag) => !PROVIDED_TAGS.has(tag))
  return { ok: missing.length === 0, missing }
}

async function templateFor(project: Row): Promise<{ config: FiscalYearConfig; template: ArrayBuffer }> {
  const year = Number(project.fiscal_year || 0)
  const config = loadConfig(year)
  const template = await loadTemplate(year)
  const check = await checkTemplate(year)
  if (!check.ok) throw new WorkflowError(422, `แบบฟอร์มปีงบประมาณ ${year} มี tag ที่ระบบไม่มีข้อมูลให้: ${check.missing.join(", ")}`)
  return { config, template }
}

function documentError(error: unknown): never {
  if (error instanceof DocumentDataError) throw new WorkflowError(422, error.message)
  if (error instanceof TemplateDataError) throw new WorkflowError(422, `แบบฟอร์มใช้ข้อมูลที่ไม่มีในการตั้งค่าปีงบประมาณ: ${error.message}`)
  throw error
}

function render(template: ArrayBuffer, context: Record<string, unknown>): Blob {
  try {
    return renderDocx(template, context)
  } catch (error) {
    documentError(error)
  }
}

function contextFor(project: DocumentProject, config: FiscalYearConfig): Record<string, unknown> {
  try {
    return buildContext(project, config)
  } catch (error) {
    documentError(error)
  }
}

// ---------------------------------------------------------------------------
// แถวโครงการ
// ---------------------------------------------------------------------------

function now(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function owns(actor: Actor, project: Row): boolean {
  // อาจารย์เข้าถึงได้เฉพาะโครงการของตัวเอง; บทบาทอื่นเห็นทุกโครงการ (ระบบใช้กับคณะเดียว)
  return actor.user.role !== "teacher" || project.owner_uid === actor.uid
}

function ensureAccess(actor: Actor, project: Row) {
  if (!owns(actor, project)) throw new WorkflowError(403, "โครงการนี้ไม่ใช่ของคุณ")
}

function audit(project: Row, action: string, actor: string, fromStatus: string | null, toStatus: string, remarks: string | null, at: string) {
  const logs: Row[] = project.audit_logs || []
  const id = logs.reduce((max, log) => Math.max(max, Number(log.id) || 0), 0) + 1
  return [...logs, { id, project_code: project.project_code, action, actor, from_status: fromStatus, to_status: toStatus, remarks, created_at: at }]
}

function documentsOf(project: Row): DocumentMeta[] {
  return project.documents || []
}

function latestVersion(project: Row, kind: string): number {
  return documentsOf(project)
    .filter((d) => d.kind === kind)
    .reduce((max, d) => Math.max(max, d.version), 0)
}

function latestLive(project: Row, kind: string): DocumentMeta | undefined {
  return documentsOf(project)
    .filter((d) => d.kind === kind && !d.voided_at)
    .sort((a, b) => b.version - a.version)[0]
}

function signatures(project: Row): Row[] {
  if (!SIGNING_STATUSES.includes(project.status)) return []
  const version = latestVersion(project, PROPOSAL)
  return version ? (project.signatures || []).filter((s: Row) => s.document_version === version) : []
}

function stateOf(project: Row): WorkflowState {
  return { status: project.status, current_step_code: project.current_step_code ?? null, signed_step_codes: signatures(project).map((s) => s.step_code) }
}

/** แถวโครงการในรูปแบบเดียวกับที่ backend เดิมตอบ (projects.* + ข้อมูลเสริม _PROJECT_EXTRAS) */
function toRow(project: Row, withLogs = false): Row {
  // ลายเซ็น/เอกสาร/uid ของเจ้าของเป็นข้อมูลภายใน — หน้าเว็บอ่านผ่าน workflow view และ audit_logs
  const { documents: _documents, signatures: _signatures, audit_logs, owner_uid: _uid, ...row } = project
  const proposal = latestLive(project, PROPOSAL)
  const scan = latestLive(project, SCAN)
  return {
    ...row,
    budget_locked: 0,
    budget_spent: 0,
    current_step_label: DEFAULT_SIGNING_STEPS.find((s) => s.code === project.current_step_code)?.label ?? null,
    proposal_doc_id: proposal?.id ?? null,
    proposal_doc_name: proposal?.file_name ?? null,
    scan_doc_id: scan?.id ?? null,
    scan_doc_name: scan?.file_name ?? null,
    scan_content_type: scan?.content_type ?? null,
    scan_uploaded_at: scan?.created_at ?? null,
    scan_opened_at: scan?.owner_opened_at ?? null,
    requests_pending: 0,
    requests_returned: 0,
    closure_request_status: null,
    requests_return_reason: null,
    closure_return_reason: null,
    ...(withLogs ? { audit_logs: audit_logs || [] } : {}),
  }
}

function workflowView(project: Row, role: Role) {
  const signed = new Map(signatures(project).map((s) => [s.step_code, s]))
  return {
    project_code: project.project_code,
    status: project.status,
    current_step_code: project.current_step_code ?? null,
    last_reason: project.last_reason ?? null,
    steps: DEFAULT_SIGNING_STEPS.map((step) => {
      const signature = signed.get(step.code)
      return {
        code: step.code,
        label: step.label,
        order: step.order,
        mode: step.mode,
        state: signature ? "done" : step.code === project.current_step_code ? "current" : "pending",
        signed_at: signature?.signed_at ?? null,
        recorded_by: signature?.recorded_by ?? null,
        note: signature?.note ?? null,
      }
    }),
    documents: documentsOf(project)
      .filter((d) => !d.voided_at)
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.version - b.version)
      .map(({ id, kind, version, file_name, content_type, size_bytes, created_at, created_by }) => ({
        id, kind, version, file_name, content_type, size_bytes, created_at, created_by,
      })),
    available_actions: availableActions(stateOf(project), DEFAULT_SIGNING_STEPS, role),
    warnings: [] as string[],
  }
}

async function readProject(code: string, includeDeleted = false): Promise<Row> {
  const snap = await getDoc(doc(db, PROJECTS, code))
  if (!snap.exists() || (!includeDeleted && snap.data().deleted_at)) throw new WorkflowError(404, `ไม่พบโครงการรหัส ${code}`)
  return snap.data()
}

async function projectFor(actor: Actor, code: string): Promise<Row> {
  const project = await readProject(code)
  ensureAccess(actor, project)
  return project
}

// ---------------------------------------------------------------------------
// โครงการ: รายการ / สร้าง / แก้ไข
// ---------------------------------------------------------------------------

export async function listProjects(actor: Actor, fiscalYear?: number): Promise<Row[]> {
  const base = collection(db, PROJECTS)
  // อาจารย์อ่านได้เฉพาะของตัวเอง (firestore.rules) — ต้องกรองในคำค้นด้วย ไม่งั้นทั้งคำค้นถูกปฏิเสธ
  const snap = await getDocs(actor.user.role === "teacher" ? query(base, where("owner_uid", "==", actor.uid)) : base)
  return snap.docs
    .map((d) => d.data())
    .filter((p) => !p.deleted_at && (!fiscalYear || Number(p.fiscal_year) === fiscalYear))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || String(b.project_code).localeCompare(String(a.project_code)))
    .map((p) => toRow(p))
}

export async function getProject(actor: Actor, code: string): Promise<Row> {
  return toRow(await projectFor(actor, code), true)
}

export async function createProject(actor: Actor, payload: Row): Promise<Row> {
  const fy = Number(payload.fiscalYear || payload.fiscal_year || 2570)
  const name = actor.user.display_name
  const title = payload.title || payload.name || "โครงการใหม่"
  const owner = payload.owner || payload.leader?.name || name
  const totalAmount = Number(payload.amount || payload.total_amount || 0)
  const budgetSources = payload.budgetSources || payload.formData?.budgetSources || {}
  const at = now()

  const code = await runTransaction(db, async (tx) => {
    const counterRef = doc(db, COUNTERS, String(fy))
    const counter = await tx.get(counterRef)
    const next = (counter.exists() ? Number(counter.data().next) || 1 : 1)
    const projectCode = `PRJ-${fy}-${String(next).padStart(3, "0")}`
    const project: Row = {
      project_code: projectCode,
      title,
      owner,
      owner_uid: actor.uid,
      owner_username: actor.user.username,
      department: payload.department || payload.unit || "",
      faculty: payload.faculty || FACULTY_NAME,
      fiscal_year: fy,
      project_category: payload.projectCategory || payload.category || "ตามแผน นโยบาย/จุดเน้นมหาวิทยาลัย",
      project_category_other: payload.projectCategoryOther || "",
      total_amount: totalAmount,
      national_amount: Number(budgetSources.national || totalAmount),
      revenue_amount: Number(budgetSources.revenue || 0),
      off_budget_amount: Number(budgetSources.offBudget || 0),
      start_date: payload.startDate || payload.date || "",
      end_date: payload.endDate || "",
      target_group: payload.targetGroup || "",
      objective: payload.objective || "",
      // โครงการใหม่เป็นแบบร่างเสมอ การส่งตรวจทำผ่าน workflow action "submit"
      status: "DRAFT",
      current_step_code: null,
      last_reason: null,
      officer_notes: null,
      form_data: payload.formData || payload,
      created_at: at,
      updated_at: at,
      deleted_at: null,
      deleted_by: null,
      delete_reason: null,
      signatures: [],
      documents: [],
      audit_logs: [],
    }
    project.audit_logs = audit(project, "PROPOSAL_DRAFT_CREATED", owner, null, "DRAFT", `สร้างแบบร่างโครงการ วงเงิน ฿${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, at)
    tx.set(counterRef, { next: next + 1 })
    tx.set(doc(db, PROJECTS, projectCode), project)
    return projectCode
  })
  return getProject(actor, code)
}

export async function updateProject(actor: Actor, code: string, updates: Row): Promise<Row> {
  const allowed = EDITABLE_STATUSES[actor.user.role]
  if (!allowed) throw new WorkflowError(403, "บทบาทของคุณไม่มีสิทธิ์แก้ไขโครงการ")
  await projectFor(actor, code)
  await runTransaction(db, async (tx) => {
    const projectRef = doc(db, PROJECTS, code)
    const snap = await tx.get(projectRef)
    if (!snap.exists() || snap.data().deleted_at) throw new WorkflowError(404, `ไม่พบโครงการรหัส ${code}`)
    const existing = snap.data()
    if (!allowed.includes(existing.status)) throw new WorkflowError(409, `แก้ไขโครงการไม่ได้ในสถานะ ${existing.status}`)
    const sources = updates.budgetSources || {}
    const at = now()
    const officerNotes = updates.officerNotes || updates.officer_notes || existing.officer_notes || null
    // สถานะเปลี่ยนได้ผ่าน workflow action เท่านั้น (ไม่เขียน status)
    const next: Row = {
      ...existing,
      title: updates.title || updates.name || existing.title,
      department: updates.department || existing.department,
      fiscal_year: Number(updates.fiscalYear || updates.fiscal_year || existing.fiscal_year),
      owner: updates.owner || existing.owner,
      start_date: updates.startDate || existing.start_date,
      end_date: updates.endDate || existing.end_date,
      total_amount: Number(updates.amount || updates.total_amount || existing.total_amount),
      national_amount: Number(sources.national || updates.national_amount || existing.national_amount),
      revenue_amount: Number(sources.revenue || updates.revenue_amount || existing.revenue_amount),
      off_budget_amount: Number(sources.offBudget || updates.off_budget_amount || existing.off_budget_amount),
      objective: updates.objective || existing.objective,
      target_group: updates.targetGroup || existing.target_group,
      officer_notes: officerNotes,
      form_data: updates.formData || existing.form_data,
      updated_at: at,
    }
    next.audit_logs = audit(existing, "PLAN_OFFICER_EDIT", actor.user.display_name, null, existing.status,
      officerNotes || "เจ้าหน้าที่แผนปรับปรุงข้อมูลโครงการแทนอาจารย์", at)
    tx.set(projectRef, next)
  })
  return getProject(actor, code)
}

// ---------------------------------------------------------------------------
// ถังขยะ: อาจารย์ลบร่าง/ถอนก่อนอนุมัติ · เจ้าหน้าที่ลบก่อนอนุมัติหรือไม่อนุมัติ และกู้คืน (project_trash.py)
// ---------------------------------------------------------------------------

function deleteAllowed(actor: Actor, project: Row, reason: string) {
  const status = project.status
  const role = actor.user.role
  if (role === "teacher") {
    if (!owns(actor, project)) throw new WorkflowError(403, "โครงการนี้ไม่ใช่ของคุณ")
    if (TEACHER_DRAFT.includes(status)) return
    if (TEACHER_WITHDRAW.includes(status)) {
      if (!reason) throw new WorkflowError(400, "กรุณาระบุเหตุผลที่ถอนโครงการ")
      return
    }
  } else if (role === "officer") {
    if (OFFICER_DELETABLE.includes(status)) {
      if (!reason) throw new WorkflowError(400, "กรุณาระบุเหตุผลที่ลบโครงการ")
      return
    }
  } else {
    throw new WorkflowError(403, "บทบาทของคุณลบโครงการไม่ได้")
  }
  if (status === "REJECTED") throw new WorkflowError(409, "โครงการที่ไม่อนุมัติแล้ว ให้เจ้าหน้าที่แผนเป็นผู้ลบ")
  throw new WorkflowError(409, "โครงการอนุมัติแล้ว ลบไม่ได้ — ใช้การย้อนตามขั้นตอนแทน (เช่น ย้อนการอัปโหลดสแกน)")
}

export async function deleteProject(actor: Actor, code: string, rawReason: unknown): Promise<void> {
  const reason = String(rawReason || "").trim()
  await runTransaction(db, async (tx) => {
    const projectRef = doc(db, PROJECTS, code)
    const snap = await tx.get(projectRef)
    if (!snap.exists() || snap.data().deleted_at) throw new WorkflowError(404, `ไม่พบโครงการรหัส ${code}`)
    const project = snap.data()
    deleteAllowed(actor, project, reason)
    const at = now()
    const verb = TEACHER_DRAFT.includes(project.status) && actor.user.role === "teacher" ? "ลบร่าง" : "ลบโครงการ"
    tx.update(projectRef, {
      deleted_at: at,
      deleted_by: actor.user.display_name,
      delete_reason: reason || null,
      updated_at: at,
      audit_logs: audit(project, "PROJECT_DELETED", actor.user.display_name, project.status, project.status, `${verb}${reason ? `: ${reason}` : ""}`, at),
    })
  })
}

export async function restoreProject(actor: Actor, code: string): Promise<void> {
  if (actor.user.role !== "officer") throw new WorkflowError(403, "เฉพาะเจ้าหน้าที่แผนเท่านั้น")
  await runTransaction(db, async (tx) => {
    const projectRef = doc(db, PROJECTS, code)
    const snap = await tx.get(projectRef)
    if (!snap.exists() || !snap.data().deleted_at) throw new WorkflowError(404, "ไม่พบโครงการนี้ในถังขยะ")
    const project = snap.data()
    const at = now()
    tx.update(projectRef, {
      deleted_at: null,
      deleted_by: null,
      delete_reason: null,
      updated_at: at,
      audit_logs: audit(project, "PROJECT_RESTORED", actor.user.display_name, project.status, project.status, "กู้คืนจากถังขยะ", at),
    })
  })
}

export async function listTrash(actor: Actor): Promise<Row[]> {
  if (actor.user.role !== "officer") throw new WorkflowError(403, "เฉพาะเจ้าหน้าที่แผนเท่านั้น")
  const snap = await getDocs(collection(db, PROJECTS))
  return snap.docs
    .map((d) => d.data())
    .filter((p) => p.deleted_at)
    .sort((a, b) => String(b.deleted_at).localeCompare(String(a.deleted_at)))
    .map(({ project_code, title, owner, department, fiscal_year, status, total_amount, deleted_at, deleted_by, delete_reason }) => ({
      project_code, title, owner, department, fiscal_year, status, total_amount, deleted_at, deleted_by, delete_reason,
    }))
}

// ---------------------------------------------------------------------------
// workflow
// ---------------------------------------------------------------------------

export async function getWorkflow(actor: Actor, code: string) {
  return workflowView(await projectFor(actor, code), actor.user.role)
}

function validateSubmission(project: Row) {
  const missing = (
    [
      ["ชื่อโครงการ", project.title],
      ["หน่วยงาน", project.department],
      ["ผู้รับผิดชอบโครงการ", project.owner],
    ] as const
  )
    .filter(([, value]) => !String(value || "").trim())
    .map(([label]) => label)
  if (missing.length) throw new WorkflowError(422, "กรุณากรอก " + missing.join(", "))
  if (Number(project.total_amount || 0) <= 0) throw new WorkflowError(422, "งบประมาณรวมต้องมากกว่า 0 บาท")
  loadConfig(Number(project.fiscal_year || 0))
}

function newDocumentId(project: Row): number {
  // ไม่ซ้ำทั้งระบบ (ใช้เปิดไฟล์จากลิงก์ /documents/{id}) และมากกว่าเลขเดิมของโครงการนี้เสมอ
  const max = documentsOf(project).reduce((m, d) => Math.max(m, d.id), 0)
  return Math.max(Date.now() * 10 + Math.floor(Math.random() * 10), max + 1)
}

async function checkScan(file: File | null): Promise<{ extension: string; bytes: Uint8Array }> {
  if (!file || !file.size) throw new WorkflowError(400, "กรุณาแนบไฟล์สแกนเอกสาร")
  const extension = ALLOWED_SCAN_TYPES[file.type]
  if (!extension) throw new WorkflowError(400, "รองรับเฉพาะไฟล์ PDF, JPG หรือ PNG")
  if (file.size > MAX_SCAN_BYTES) throw new WorkflowError(400, `ไฟล์มีขนาดเกิน ${MAX_SCAN_BYTES / (1024 * 1024)} MB`)
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!SCAN_SIGNATURES[file.type].every((byte, i) => bytes[i] === byte)) {
    throw new WorkflowError(400, "เนื้อไฟล์ไม่ใช่ PDF, JPG หรือ PNG จริง (ไฟล์อาจเสียหรือถูกเปลี่ยนนามสกุล)")
  }
  return { extension, bytes }
}

type ActionPayload = { reason?: unknown; step_code?: unknown; signed_at?: unknown; note?: unknown }

export async function performAction(actor: Actor, code: string, action: string, payload: ActionPayload, scanFile: File | null = null) {
  const role = actor.user.role
  const name = actor.user.display_name
  // ตรวจก่อนเตรียมไฟล์ (template / อัปโหลดสแกน) แล้วตรวจซ้ำใน transaction กันการกดพร้อมกัน
  const before = await projectFor(actor, code)
  const planned = decide(stateOf(before), DEFAULT_SIGNING_STEPS, action, role, payload)
  const prepared = planned.effects.includes("GENERATE_DOCUMENT") ? await templateFor(before) : null
  const scan = planned.effects.includes("STORE_SCAN") ? await checkScan(scanFile) : null
  let uploadedPath: string | null = null

  try {
    if (scan) {
      const version = latestVersion(before, SCAN) + 1
      uploadedPath = `plan_documents/${code}/scan_v${version}_${Date.now()}${scan.extension}`
      await uploadBytes(ref(storage, uploadedPath), scan.bytes, { contentType: scanFile!.type })
    }
    const project = await runTransaction(db, async (tx) => {
      const projectRef = doc(db, PROJECTS, code)
      const snap = await tx.get(projectRef)
      if (!snap.exists() || snap.data().deleted_at) throw new WorkflowError(404, `ไม่พบโครงการรหัส ${code}`)
      const project = snap.data()
      ensureAccess(actor, project)
      const transition = decide(stateOf(project), DEFAULT_SIGNING_STEPS, action, role, payload)
      if (action === "submit") validateSubmission(project)

      const at = now()
      const proposalVersion = latestVersion(project, PROPOSAL)
      let documents = [...documentsOf(project)]
      let signatureRows: Row[] = [...(project.signatures || [])]
      for (const effect of transition.effects) {
        if (effect === "GENERATE_DOCUMENT") {
          // ยอดที่ตัดงบผูกพัน (total_amount) ต้องเท่ากับยอดที่พิมพ์ในเอกสารที่อนุมัติ
          const itemsTotal = lineItemsTotal(project)
          const projectTotal = Number(Number(project.total_amount || 0).toFixed(2))
          if (itemsTotal !== null && Math.abs(itemsTotal - projectTotal) >= 0.01) {
            throw new WorkflowError(422,
              `ยอดรวมโครงการ (${formatMoney(projectTotal)} บาท) ไม่ตรงกับผลรวมรายการค่าใช้จ่าย ` +
              `(${formatMoney(itemsTotal)} บาท) กรุณาแก้ให้ตรงกันก่อนอนุมัติ`)
          }
          const context = contextFor(project, prepared!.config)
          // สร้างไฟล์จริงหนึ่งครั้งเพื่อตรวจว่า template เติมข้อมูลนี้ได้ (ขนาดไฟล์เก็บไว้แสดงในรายการเอกสาร)
          const blob = render(prepared!.template, context)
          const version = proposalVersion + 1
          const id = newDocumentId({ documents })
          documents.push({
            id, kind: PROPOSAL, version, file_name: `โครงการ_${code}_v${version}.docx`, content_type: DOCX_TYPE,
            size_bytes: blob.size, created_at: at, created_by: name,
          })
          tx.set(doc(db, DOCUMENTS, String(id)), {
            project_code: code, kind: PROPOSAL, version, owner_uid: project.owner_uid,
            template_ref: `${project.fiscal_year}/template.docx`, render_context: JSON.stringify(context), created_at: at,
          })
        } else if (effect === "ADD_SIGNATURE") {
          signatureRows.push({
            step_code: payload.step_code, document_version: proposalVersion, signed_at: payload.signed_at,
            recorded_by: name, note: String(payload.note || "").trim() || null, created_at: at,
          })
        } else if (effect === "REMOVE_LAST_SIGNATURE") {
          const lastIndex = signatureRows.map((s) => s.document_version).lastIndexOf(proposalVersion)
          if (lastIndex >= 0) signatureRows = signatureRows.filter((_, i) => i !== lastIndex)
        } else if (effect === "STORE_SCAN") {
          const version = latestVersion({ documents }, SCAN) + 1
          const id = newDocumentId({ documents })
          documents.push({
            id, kind: SCAN, version, file_name: `สแกน_${code}_v${version}${scan!.extension}`, content_type: scanFile!.type,
            size_bytes: scan!.bytes.length, created_at: at, created_by: name, owner_opened_at: null,
          })
          tx.set(doc(db, DOCUMENTS, String(id)), {
            project_code: code, kind: SCAN, version, owner_uid: project.owner_uid, storage_path: uploadedPath, created_at: at,
          })
        } else if (effect === "VOID_SCAN") {
          const reason = String(payload.reason || "").trim()
          documents = documents.map((d) => (d.kind === SCAN && !d.voided_at ? { ...d, voided_at: at, voided_by: name, void_reason: reason } : d))
        }
        // COMMIT_BUDGET / RELEASE_BUDGET: ระบบคุมงบรายกิจกรรมยังไม่เปิดใช้บน Firebase
      }

      const reason = String(payload.reason || "").trim()
      const lastReason = action === "request_revision" || action === "reject" ? reason : action === "submit" ? null : project.last_reason ?? null
      const stepLabel = DEFAULT_SIGNING_STEPS.find((s) => s.code === payload.step_code)?.label || ""
      const remarks = reason || [stepLabel, String(payload.note || "").trim()].filter(Boolean).join(" ") || null
      const next: Row = {
        ...project,
        status: transition.to_status,
        current_step_code: transition.current_step_code,
        last_reason: lastReason,
        updated_at: at,
        documents,
        signatures: signatureRows,
        audit_logs: audit(project, `WORKFLOW_${action.toUpperCase()}`, name, project.status, transition.to_status, remarks, at),
      }
      tx.set(projectRef, next)
      return next
    })
    return workflowView(project, role)
  } catch (error) {
    if (uploadedPath) await deleteObject(ref(storage, uploadedPath)).catch(() => undefined)
    throw error
  }
}

// ---------------------------------------------------------------------------
// เอกสาร
// ---------------------------------------------------------------------------

/** ตัวอย่างแบบฟอร์มจากข้อมูลที่กำลังกรอก (ยังไม่บันทึก — รูปแบบเดียวกับตอนสร้างโครงการ) */
export async function previewUnsaved(payload: Row): Promise<Blob> {
  const form = payload.formData && typeof payload.formData === "object" ? payload.formData : {}
  const project: Row = {
    title: payload.title || "",
    department: payload.department || "",
    faculty: payload.faculty || form.facultyName || "",
    fiscal_year: payload.fiscalYear || form.fiscalYear || 0,
    total_amount: payload.amount || 0,
    form_data: form,
  }
  const { config, template } = await templateFor(project)
  return render(template, contextFor(project, config))
}

export async function previewProject(actor: Actor, code: string): Promise<Blob> {
  if (actor.user.role !== "teacher" && actor.user.role !== "officer") throw new WorkflowError(403, "เฉพาะอาจารย์และเจ้าหน้าที่แผนเท่านั้น")
  const project = await projectFor(actor, code)
  const { config, template } = await templateFor(project)
  return render(template, contextFor(project, config))
}

export async function readDocument(actor: Actor, id: number): Promise<{ blob: Blob; fileName: string; contentType: string }> {
  const notFound = () => new WorkflowError(404, "ไม่พบข้อมูลที่ต้องการ")
  const fileSnap = await getDoc(doc(db, DOCUMENTS, String(id))).catch(() => null)
  if (!fileSnap?.exists()) throw notFound()
  const file: DocumentData = fileSnap.data()
  const project = await projectFor(actor, file.project_code)
  const meta = documentsOf(project).find((d) => d.id === id)
  if (!meta) throw notFound()
  // สแกนที่ยกเลิกแล้ว — เจ้าหน้าที่ยังเปิดดูเป็นหลักฐานได้
  if (meta.voided_at && actor.user.role !== "officer") throw notFound()

  let blob: Blob
  if (meta.kind === PROPOSAL) {
    blob = render(await loadTemplate(Number(project.fiscal_year)), JSON.parse(file.render_context))
  } else {
    blob = await getBlob(ref(storage, file.storage_path))
    if (actor.user.role === "teacher" && owns(actor, project) && !meta.owner_opened_at) {
      // อาจารย์เปิดไฟล์สแกนแล้ว → ป้าย "ใหม่" หายจากหน้างานของฉัน
      await markOpened(String(project.project_code), id).catch(() => undefined)
    }
  }
  return { blob, fileName: meta.file_name, contentType: meta.content_type }
}

async function markOpened(projectCode: string, id: number) {
  await runTransaction(db, async (tx) => {
    const projectRef = doc(db, PROJECTS, projectCode)
    const snap = await tx.get(projectRef)
    if (!snap.exists()) return
    const documents = documentsOf(snap.data()).map((d) => (d.id === id && !d.owner_opened_at ? { ...d, owner_opened_at: now() } : d))
    tx.update(projectRef, { documents })
  })
}

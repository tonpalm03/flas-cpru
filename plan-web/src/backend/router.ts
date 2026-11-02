/**
 * "backend" ของระบบแผนที่ทำงานในเบราว์เซอร์: รับคำขอแบบเดียวกับ FastAPI เดิม (/projects, /auth/..., ...)
 * แล้วทำงานกับ Firebase โดยตรง — หน้าจอของระบบเดิมจึงใช้ได้โดยไม่ต้องแก้ (lib/api.ts ส่งคำขอมาที่นี่แทน fetch)
 * ไม่มี server ของตัวเอง: สิทธิ์จริงบังคับด้วย firestore.rules
 */
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth"
import { auth, authReady } from "./firebase"
import { listUsers, loadActor, type Actor } from "./users"
import * as projects from "./projects"
import { DOCX_TYPE } from "./projects"
import { WorkflowError } from "./workflow"

type Params = Record<string, string>
type Body = Record<string, any>
interface Request {
  method: string
  params: Params
  query: URLSearchParams
  body: Body
  form: FormData | null
  actor: () => Promise<Actor>
}
type Handler = (req: Request) => Promise<unknown>

/** คำตอบที่เป็นไฟล์ (ไม่ห่อเป็น { status, data }) */
class FileResult {
  constructor(public blob: Blob, public fileName: string, public contentType: string) {}
}

const BUDGET_PENDING = "ระบบคุมงบและการเบิกจ่ายยังไม่เปิดใช้บนเว็บคณะ (จะเปิดในรอบถัดไป)"
const USERS_ELSEWHERE = "จัดการบัญชีผู้ใช้และบทบาทที่หน้า \"ตั้งค่าผู้ใช้\" ของเว็บคณะ (บัญชีเดียวกับระบบแผน)"

function normalizeEmail(input: string): string {
  const trimmed = input.trim()
  return trimmed.includes("@") ? trimmed : `${trimmed}@cpru.ac.th`
}

function requireRole(actor: Actor, ...roles: string[]) {
  if (!roles.includes(actor.user.role)) throw new WorkflowError(403, "บทบาทของคุณไม่มีสิทธิ์ใช้งานส่วนนี้")
}

// เสนอโครงการได้: อาจารย์ ประธานสาขา หัวหน้างานแผน คณบดี (เจ้าหน้าที่แผนไม่สร้างโครงการเอง)
const PROPOSER_ROLES = ["teacher", "head", "plan_head", "dean"]
const BUDGET_VIEWERS = ["officer", "plan_head", "dean"]

const routes: [string, string, Handler][] = [
  ["POST", "/auth/login", async ({ body }) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizeEmail(String(body.username || "")), String(body.password || ""))
      const actor = await loadActor(credential.user)
      return { token: actor.uid, user: actor.user }
    } catch (error: any) {
      if (error?.status) throw error
      throw new WorkflowError(401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
    }
  }],
  ["GET", "/auth/me", async ({ actor }) => (await actor()).user],
  ["POST", "/auth/logout", async () => {
    await signOut(auth)
    return null
  }],
  ["POST", "/auth/password", async ({ body }) => {
    const user = await authReady()
    if (!user?.email) throw new WorkflowError(401, "กรุณาเข้าสู่ระบบ")
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, String(body.current_password || "")))
    } catch {
      throw new WorkflowError(400, "รหัสผ่านปัจจุบันไม่ถูกต้อง")
    }
    if (String(body.new_password || "").length < 6) throw new WorkflowError(400, "รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร")
    await updatePassword(user, String(body.new_password))
    return null
  }],

  ["GET", "/users", async ({ actor }) => {
    requireRole(await actor(), "officer")
    return listUsers()
  }],
  ["POST", "/users", async () => { throw new WorkflowError(400, USERS_ELSEWHERE) }],
  ["POST", "/users/import", async () => { throw new WorkflowError(400, USERS_ELSEWHERE) }],
  ["PATCH", "/users/:username", async () => { throw new WorkflowError(400, USERS_ELSEWHERE) }],
  ["POST", "/users/:username/reset-password", async () => { throw new WorkflowError(400, USERS_ELSEWHERE) }],

  ["GET", "/fiscal-years", async ({ actor }) => {
    await actor()
    return projects.listYears()
  }],
  ["GET", "/fiscal-years/:year/config", async ({ actor, params }) => {
    await actor()
    return projects.loadConfig(Number(params.year))
  }],
  ["GET", "/fiscal-years/:year/template-check", async ({ actor, params }) => {
    requireRole(await actor(), "officer")
    return projects.checkTemplate(Number(params.year))
  }],

  ["GET", "/projects", async ({ actor, query }) => projects.listProjects(await actor(), Number(query.get("fiscal_year")) || undefined)],
  ["GET", "/plan/projects", async ({ actor, query }) => projects.listProjects(await actor(), Number(query.get("fiscal_year")) || undefined)],
  ["POST", "/projects", async ({ actor, body }) => projects.createProject(await actor(), body)],
  ["POST", "/projects/document-preview", async ({ actor, body }) => {
    requireRole(await actor(), ...PROPOSER_ROLES, "officer")
    return new FileResult(await projects.previewUnsaved(body), "ตัวอย่างแบบฟอร์ม.docx", DOCX_TYPE)
  }],
  ["POST", "/projects/import-docx", async () => {
    throw new WorkflowError(503, "การนำเข้าไฟล์ Word ยังไม่เปิดใช้บนเว็บคณะ กรุณากรอกแบบฟอร์มในระบบ")
  }],
  ["POST", "/projects/import-scan", async () => {
    throw new WorkflowError(503, "การอ่านไฟล์สแกนยังไม่เปิดใช้บนเว็บคณะ กรุณากรอกแบบฟอร์มในระบบ")
  }],
  ["GET", "/projects/:code", async ({ actor, params }) => projects.getProject(await actor(), params.code)],
  ["PUT", "/projects/:code", async ({ actor, params, body }) => {
    const { status: _ignored, ...updates } = body
    return projects.updateProject(await actor(), params.code, updates)
  }],
  ["POST", "/projects/:code/delete", async ({ actor, params, body }) => {
    await projects.deleteProject(await actor(), params.code, body.reason)
    return null
  }],
  ["POST", "/projects/:code/restore", async ({ actor, params }) => {
    await projects.restoreProject(await actor(), params.code)
    return null
  }],
  ["GET", "/trash", async ({ actor }) => projects.listTrash(await actor())],

  ["GET", "/projects/:code/workflow", async ({ actor, params }) => projects.getWorkflow(await actor(), params.code)],
  ["POST", "/projects/:code/actions", async ({ actor, params, body }) => {
    if (!body.action) throw new WorkflowError(400, "กรุณาระบุ action")
    const fields = Object.fromEntries(["reason", "step_code", "signed_at", "note"].filter((k) => k in body).map((k) => [k, body[k]]))
    return projects.performAction(await actor(), params.code, String(body.action), fields)
  }],
  ["POST", "/projects/:code/scan", async ({ actor, params, form }) => {
    const file = form?.get("file")
    return projects.performAction(await actor(), params.code, "upload_scan", {}, file instanceof File ? file : null)
  }],
  ["GET", "/projects/:code/document-preview", async ({ actor, params }) =>
    new FileResult(await projects.previewProject(await actor(), params.code), `ตัวอย่าง_${params.code}.docx`, DOCX_TYPE)],
  ["GET", "/documents/:id/download", async ({ actor, params }) => {
    const { blob, fileName, contentType } = await projects.readDocument(await actor(), Number(params.id))
    return new FileResult(blob, fileName, contentType)
  }],

  // คุมงบ: ยังไม่ย้ายมา — หน้าที่อ่านงบได้ค่าว่าง ส่วนการบันทึกแจ้งว่ายังไม่เปิดใช้
  ["GET", "/projects/:code/budget-check", async ({ actor, params }) => {
    const user = await actor()
    requireRole(user, "officer")
    await projects.getProject(user, params.code)
    return { warnings: [] }
  }],
  ["GET", "/projects/:code/ledger", async ({ actor, params }) => {
    const project = await projects.getProject(await actor(), params.code)
    const amount = Number(project.total_amount || 0)
    return {
      project_code: params.code, status: project.status, lines: [], disbursements: [],
      totals: { amount, spent: 0, remaining: amount }, can_record: false, can_request: false, requests: [], closure_requests: [],
    }
  }],
  ["GET", "/budget/ceilings", async ({ actor }) => {
    requireRole(await actor(), ...BUDGET_VIEWERS)
    throw new WorkflowError(503, BUDGET_PENDING)
  }],
  ["GET", "/budget/ledger", async ({ actor }) => {
    requireRole(await actor(), ...BUDGET_VIEWERS)
    throw new WorkflowError(503, BUDGET_PENDING)
  }],
]

function match(pattern: string, path: string): Params | null {
  const a = pattern.split("/")
  const b = path.split("/")
  if (a.length !== b.length) return null
  const params: Params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

let cachedActor: { uid: string; actor: Promise<Actor> } | null = null

async function currentActor(): Promise<Actor> {
  const user = await authReady()
  if (!user) throw new WorkflowError(401, "กรุณาเข้าสู่ระบบ")
  if (cachedActor?.uid !== user.uid) cachedActor = { uid: user.uid, actor: loadActor(user) }
  return cachedActor.actor
}

/** แปลงข้อผิดพลาดของ Firestore ให้เป็นข้อความที่ผู้ใช้อ่านเข้าใจ */
function errorResponse(error: any): Response {
  if (error instanceof WorkflowError) return json(error.status, { detail: error.message })
  if (typeof error?.status === "number") return json(error.status, { detail: error.message })
  if (error?.code === "permission-denied" || error?.code === "storage/unauthorized") {
    return json(403, { detail: "คุณไม่มีสิทธิ์ดำเนินการนี้ หรือสถานะโครงการเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่" })
  }
  if (error?.code === "unavailable") return json(503, { detail: "เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต" })
  console.error(error)
  return json(500, { detail: `เกิดข้อผิดพลาด: ${error?.message || error}` })
}

export async function handle(path: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(path, "http://plan.local")
  const method = (init.method || "GET").toUpperCase()
  const route = routes.map(([m, pattern, handler]) => [m, match(pattern, url.pathname), handler] as const).find(([m, params]) => m === method && params)
  if (!route) return json(404, { detail: "ไม่พบข้อมูลที่ต้องการ" })
  const [, params, handler] = route
  let body: Body = {}
  if (typeof init.body === "string" && init.body) {
    try {
      body = JSON.parse(init.body)
    } catch {
      return json(400, { detail: "ข้อมูลที่ส่งมาไม่ถูกต้อง" })
    }
  }
  try {
    // อ่านผู้ใช้ใหม่ทุกครั้งที่ login เปลี่ยน (บทบาทที่แก้ในเว็บคณะมีผลเมื่อโหลดหน้าใหม่)
    if (url.pathname === "/auth/login" || url.pathname === "/auth/logout") cachedActor = null
    const result = await handler({
      method,
      params: params!,
      query: url.searchParams,
      body,
      form: init.body instanceof FormData ? init.body : null,
      actor: currentActor,
    })
    if (result instanceof FileResult) {
      return new Response(result.blob, {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
        },
      })
    }
    return json(200, { status: "success", data: result })
  } catch (error) {
    return errorResponse(error)
  }
}

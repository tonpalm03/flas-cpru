import { getSession, setSession } from "./currentUser"
import { handle } from "../backend/router"

// ระบบแผนบนเว็บคณะไม่มี backend แยก: คำขอ /projects, /auth/... ทำงานกับ Firebase ในเบราว์เซอร์ (backend/router.ts)
// รูปแบบคำขอ/คำตอบเหมือน FastAPI เดิมทุกอย่าง หน้าจอจึงไม่ต้องแก้

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response
  try {
    response = await handle(path, init)
  } catch {
    throw new ApiError(0, "เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต")
  }
  if (response.status === 401 && getSession() && !path.startsWith("/auth/login")) {
    // session หมดอายุ/ถูกออกจากระบบ → กลับไปหน้า login
    setSession(null)
  }
  if (!response.ok) {
    let detail = `เกิดข้อผิดพลาด (${response.status})`
    try {
      const body = await response.json()
      if (typeof body?.detail === "string") detail = body.detail
    } catch {
      // body ไม่ใช่ JSON
    }
    throw new ApiError(response.status, detail)
  }
  return response
}

/** เรียก API ที่ตอบ `{ status, data }` แล้วคืนเฉพาะ `data` */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData
  const response = await request(path, {
    ...init,
    headers: { ...(isForm || !init.body ? {} : { "Content-Type": "application/json" }), ...(init.headers || {}) },
  })
  const body = await response.json()
  return body.data as T
}

export async function apiBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const response = await request(path, {
    ...init,
    headers: { ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) },
  })
  return response.blob()
}

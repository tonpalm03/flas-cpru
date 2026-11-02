// เปิด backend สำหรับชุดทดสอบหน้าเว็บ: ฐานข้อมูล/ไฟล์ใหม่ทุกครั้ง + บัญชีทดสอบ (seed-demo) แล้วรัน uvicorn
// Python: ตัวแปร E2E_PYTHON หรือ venv ของ backend (Windows: venv/Scripts/python.exe, อื่น ๆ: venv/bin/python) หรือ python3
import { spawn, spawnSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.resolve(here, "../../../backend")
const dataDir = path.resolve(here, "../.data")
const port = process.env.E2E_API_PORT || "8011"

function python() {
  if (process.env.E2E_PYTHON) return process.env.E2E_PYTHON
  const venv = process.platform === "win32" ? path.join(backendDir, "venv", "Scripts", "python.exe") : path.join(backendDir, "venv", "bin", "python")
  return existsSync(venv) ? venv : "python3"
}

rmSync(dataDir, { recursive: true, force: true })
mkdirSync(dataDir, { recursive: true })
// สำเนาการตั้งค่าปีงบ: ชุดทดสอบไม่แตะไฟล์จริงของ repo
cpSync(path.join(backendDir, "fiscal_years"), path.join(dataDir, "fiscal_years"), { recursive: true })

const env = {
  ...process.env,
  FASTCPRU_DB_PATH: path.join(dataDir, "e2e.db"),
  FASTCPRU_UPLOADS_DIR: path.join(dataDir, "uploads"),
  FASTCPRU_FISCAL_YEARS_DIR: path.join(dataDir, "fiscal_years"),
  PYTHONIOENCODING: "utf-8",
  // ไม่เรียก AI จริง (ไม่เสียเงิน) แม้ backend/.env ของเครื่องจะมี key — นำเข้าไฟล์สแกนจึงตอบว่ายังไม่ได้ตั้งค่า
  ANTHROPIC_API_KEY: "",
  ANTHROPIC_AUTH_TOKEN: "",
  GEMINI_API_KEY: "",
}

const seed = spawnSync(python(), ["scripts/manage_users.py", "seed-demo"], { cwd: backendDir, env, stdio: "inherit" })
if (seed.status !== 0) {
  console.error("สร้างบัญชีทดสอบไม่สำเร็จ")
  process.exit(seed.status ?? 1)
}

const server = spawn(python(), ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", port], {
  cwd: backendDir,
  env,
  stdio: "inherit",
})
server.on("exit", (code) => process.exit(code ?? 0))
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal))

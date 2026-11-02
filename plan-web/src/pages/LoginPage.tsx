import { FormEvent, useState } from "react"
import { ApiError } from "../lib/api"
import { authService } from "../services/authService"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Field } from "../components/ui/Field"
import { useInstallApp } from "../components/layout/InstallApp"
import { useIsPhone } from "../lib/useIsPhone"

const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"

export function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // มือถือ: ปุ่มติดตั้งเป็นแอป (ครั้งแรกที่เปิดลิงก์ ก่อนเข้าสู่ระบบ)
  const isPhone = useIsPhone()
  const install = useInstallApp()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await authService.login(username.trim(), password)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "เข้าสู่ระบบไม่สำเร็จ")
      setPassword("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="bg-faculty-gradient absolute inset-x-0 top-0 h-40 sm:h-48" aria-hidden="true" />
      <div className="relative w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-24 place-items-center rounded-3xl bg-white p-2 shadow-lg">
            <img src={`${import.meta.env.BASE_URL}brand/faculty-logo.png`} alt="ตราคณะศิลปศาสตร์และวิทยาศาสตร์" className="size-20 object-contain" />
          </span>
          <div>
            <div className="text-xl font-bold text-ink">ระบบแผนและงบประมาณ</div>
            <div className="text-sm text-brand-2">คณะศิลปศาสตร์และวิทยาศาสตร์</div>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-lg font-bold text-ink">เข้าสู่ระบบ</h1>
            <Field label="ชื่อผู้ใช้">
              <input
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="รหัสผ่าน">
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            {error && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
            <p className="text-[11px] text-muted">ลืมรหัสผ่านหรือยังไม่มีบัญชี ติดต่อเจ้าหน้าที่แผนของคณะ</p>
          </form>
        </Card>
        {isPhone && !install.installed && (
          <Button data-testid="login-install" variant="outline" icon="download" className="w-full" onClick={install.start}>
            ติดตั้งแอประบบแผนลงมือถือ
          </Button>
        )}
        <img src={`${import.meta.env.BASE_URL}brand/university-logo.png`} alt="มหาวิทยาลัยราชภัฏชัยภูมิ" className="mx-auto h-9 w-auto opacity-90" />
      </div>
      {install.sheet}
    </div>
  )
}

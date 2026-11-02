import { FormEvent, useState } from "react"
import { ApiError } from "../../lib/api"
import { authService } from "../../services/authService"
import { Button } from "../ui/Button"
import { Field } from "../ui/Field"

const MIN_LENGTH = 8
const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next.length < MIN_LENGTH) return setError(`รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_LENGTH} ตัวอักษร`)
    if (next !== confirm) return setError("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน")
    setBusy(true)
    setError(null)
    try {
      await authService.changePassword(current, next)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "เปลี่ยนรหัสผ่านไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-label="เปลี่ยนรหัสผ่าน">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {done ? (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-ink">เปลี่ยนรหัสผ่านแล้ว</h2>
            <p className="text-xs text-muted">เครื่องอื่นที่ใช้บัญชีนี้อยู่จะถูกออกจากระบบ</p>
            <Button className="w-full" onClick={onClose}>ปิด</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h2 className="text-base font-bold text-ink">เปลี่ยนรหัสผ่าน</h2>
            <Field label="รหัสผ่านปัจจุบัน">
              <input name="current_password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
            </Field>
            <Field label="รหัสผ่านใหม่" hint={`อย่างน้อย ${MIN_LENGTH} ตัวอักษร`}>
              <input name="new_password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
            </Field>
            <Field label="ยืนยันรหัสผ่านใหม่">
              <input name="confirm_password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
            </Field>
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{error}</div>}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
              <Button type="submit" className="flex-1" disabled={busy}>บันทึก</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

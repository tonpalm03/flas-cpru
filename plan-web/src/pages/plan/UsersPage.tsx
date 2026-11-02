import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { Role } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { getSession, roleLabels } from "../../lib/currentUser"
import {
  ImportResult,
  IssuedCredential,
  ManagedUser,
  UserInput,
  downloadCredentials,
  downloadUserTemplate,
  userService,
} from "../../services/userService"
import { Button } from "../../components/ui/Button"
import { Card } from "../../components/ui/Card"
import { Field } from "../../components/ui/Field"
import { PageHeader } from "../../components/ui/PageHeader"
import { useIsPhone } from "../../lib/useIsPhone"

const ROLES: Role[] = ["teacher", "head", "officer", "plan_head", "dean"]
const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
const emptyInput: UserInput = { username: "", display_name: "", role: "teacher", department: "", position: "", phone: "" }

export function UsersPage() {
  const me = getSession()?.user.username
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const isPhone = useIsPhone()
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
  const [showInactive, setShowInactive] = useState(false)
  const [editing, setEditing] = useState<ManagedUser | "new" | null>(null)
  const [issued, setIssued] = useState<IssuedCredential[] | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      setUsers(await userService.list())
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "โหลดรายชื่อผู้ใช้ไม่สำเร็จ")
    }
  }
  useEffect(() => {
    load()
  }, [])

  const run = async (task: () => Promise<void>) => {
    setError(null)
    try {
      await task()
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "ดำเนินการไม่สำเร็จ")
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(
      (u) =>
        (showInactive || u.is_active) &&
        (roleFilter === "all" || u.role === roleFilter) &&
        (!q || [u.username, u.display_name, u.department, u.position].some((v) => v.toLowerCase().includes(q)))
    )
  }, [users, query, roleFilter, showInactive])

  const resetPassword = (user: ManagedUser) =>
    run(async () => {
      if (!confirm(`ตั้งรหัสผ่านใหม่ให้ ${user.display_name}? รหัสเดิมจะใช้ไม่ได้ และผู้ใช้จะถูกออกจากระบบทุกเครื่อง`)) return
      setIssued([await userService.resetPassword(user)])
    })

  const toggleActive = (user: ManagedUser) =>
    run(async () => {
      if (user.is_active && !confirm(`ปิดบัญชี ${user.display_name}? ผู้ใช้จะเข้าสู่ระบบไม่ได้จนกว่าจะเปิดอีกครั้ง`)) return
      await userService.update(user.username, { is_active: !user.is_active })
      await load()
    })

  const importFile = (file: File) =>
    run(async () => {
      const result = await userService.importCsv(file)
      setImportResult(result)
      await load()
    })

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        eyebrow="เจ้าหน้าที่แผน"
        title="จัดการผู้ใช้งาน"
        description="เพิ่มอาจารย์และผู้บริหารเข้าระบบ ตั้งรหัสผ่านใหม่ และปิดบัญชีที่เลิกใช้"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon="download" onClick={downloadUserTemplate}>
              แบบฟอร์ม CSV
            </Button>
            <Button variant="outline" size="sm" icon="upload" onClick={() => fileRef.current?.click()}>
              นำเข้าจาก CSV
            </Button>
            <Button size="sm" icon="plus" onClick={() => setEditing("new")}>
              เพิ่มผู้ใช้
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              data-testid="import-file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (file) importFile(file)
              }}
            />
          </div>
        }
      />

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{error}</div>}

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ username สาขา หรือตำแหน่ง"
            type="search"
            className="min-w-0 flex-1 basis-full rounded-xl border border-line-strong bg-white px-3 py-2 text-xs focus:outline-none sm:min-w-[220px] sm:basis-auto"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
            className="rounded-xl border border-line-strong bg-white px-3 py-2 text-xs font-semibold"
          >
            <option value="all">ทุกบทบาท</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>{roleLabels[role].short}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            แสดงบัญชีที่ปิดแล้ว
          </label>
          <span className="ml-auto text-xs text-muted">{visible.length} บัญชี</span>
        </div>

        {isPhone ? (
          // มือถือ: การ์ดต่อบัญชี (ตาราง 7 คอลัมน์อ่านไม่ได้บนจอแคบ)
          <div className="divide-y divide-line">
            {visible.map((user) => (
              <div key={user.username} data-testid="user-row" className="py-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink">{user.display_name}</div>
                    <div className="text-muted">
                      <span className="font-mono text-brand">{user.username}</span> · {roleLabels[user.role]?.short ?? user.role}
                      {user.department ? ` · ${user.department}` : ""}
                    </div>
                    {(user.position || user.phone) && <div className="text-muted">{[user.position, user.phone].filter(Boolean).join(" · ")}</div>}
                  </div>
                  <span className="shrink-0">
                    {user.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">ใช้งาน</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">ปิดแล้ว</span>
                    )}
                  </span>
                </div>
                <div className="-ml-2 mt-1 flex flex-wrap">
                    <button type="button" onClick={() => setEditing(user)} className="rounded-lg px-2 py-1 font-semibold text-brand hover:bg-brand/5">
                      แก้ไข
                    </button>
                    <button type="button" onClick={() => resetPassword(user)} className="rounded-lg px-2 py-1 font-semibold text-brand hover:bg-brand/5">
                      ตั้งรหัสใหม่
                    </button>
                    {user.username !== me && (
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        className={`rounded-lg px-2 py-1 font-semibold ${user.is_active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                      >
                        {user.is_active ? "ปิดบัญชี" : "เปิดบัญชี"}
                      </button>
                    )}
                </div>
              </div>
            ))}
            {visible.length === 0 && <div className="py-8 text-center text-muted">ไม่พบผู้ใช้</div>}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] uppercase text-muted">
              <tr>
                <th className="py-2 pr-3">ชื่อ-นามสกุล</th>
                <th className="py-2 pr-3">username</th>
                <th className="py-2 pr-3">บทบาท</th>
                <th className="py-2 pr-3">สาขา/หน่วยงาน</th>
                <th className="py-2 pr-3">ตำแหน่ง · เบอร์โทร</th>
                <th className="py-2 pr-3">สถานะ</th>
                <th className="py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr key={user.username} data-testid="user-row" className="border-b border-surface align-top">
                  <td className="py-2.5 pr-3 font-semibold text-ink">{user.display_name}</td>
                  <td className="py-2.5 pr-3 font-mono text-brand">{user.username}</td>
                  <td className="py-2.5 pr-3">{roleLabels[user.role]?.short ?? user.role}</td>
                  <td className="py-2.5 pr-3">{user.department || "-"}</td>
                  <td className="py-2.5 pr-3 text-muted">{[user.position, user.phone].filter(Boolean).join(" · ") || "-"}</td>
                  <td className="py-2.5 pr-3">
                    {user.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">ใช้งาน</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">ปิดแล้ว</span>
                    )}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => setEditing(user)} className="rounded-lg px-2 py-1 font-semibold text-brand hover:bg-brand/5">
                      แก้ไข
                    </button>
                    <button type="button" onClick={() => resetPassword(user)} className="rounded-lg px-2 py-1 font-semibold text-brand hover:bg-brand/5">
                      ตั้งรหัสใหม่
                    </button>
                    {user.username !== me && (
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        className={`rounded-lg px-2 py-1 font-semibold ${user.is_active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                      >
                        {user.is_active ? "ปิดบัญชี" : "เปิดบัญชี"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">ไม่พบผู้ใช้</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      <p className="text-[11px] text-muted">
        นำเข้าจาก CSV: กด "แบบฟอร์ม CSV" แล้วกรอกใน Excel ทีละคน — role ใช้ teacher (อาจารย์), head (ประธานสาขา), officer (เจ้าหน้าที่แผน),
        plan_head (หัวหน้างานแผน), dean (คณบดี); ช่อง password ปล่อยว่างได้ ระบบสุ่มให้ แล้วบันทึกเป็น "CSV UTF-8"
        ตัวอย่างแถว: somchai.j, อ.สมชาย ใจดี, teacher, เทคโนโลยีสารสนเทศ, อาจารย์ประจำสาขาวิชา, 081-234-5678
      </p>

      {editing && (
        <UserFormDialog
          user={editing === "new" ? null : editing}
          isSelf={editing !== "new" && editing.username === me}
          onClose={() => setEditing(null)}
          onSaved={async (credential) => {
            setEditing(null)
            if (credential) setIssued([credential])
            await load()
          }}
        />
      )}
      {issued && <CredentialsDialog credentials={issued} onClose={() => setIssued(null)} />}
      {importResult && <ImportResultDialog result={importResult} onClose={() => setImportResult(null)} />}
    </div>
  )
}

function Dialog({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {children}
      </div>
    </div>
  )
}

function UserFormDialog({
  user,
  isSelf,
  onClose,
  onSaved,
}: {
  user: ManagedUser | null
  isSelf: boolean
  onClose: () => void
  onSaved: (credential: IssuedCredential | null) => void
}) {
  const [form, setForm] = useState<UserInput>(
    user
      ? { display_name: user.display_name, role: user.role, department: user.department, position: user.position, phone: user.phone }
      : emptyInput
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (key: keyof UserInput) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (user) {
        const { display_name, role, department, position, phone } = form
        await userService.update(user.username, { display_name, role, department, position, phone })
        onSaved(null)
      } else {
        onSaved(await userService.create(form))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "บันทึกไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title={user ? `แก้ไขผู้ใช้ ${user.username}` : "เพิ่มผู้ใช้"}>
      <form onSubmit={submit} className="space-y-3">
        {!user && (
          <Field label="username (ใช้ตอนเข้าสู่ระบบ)" required hint="ตัวอักษรอังกฤษ/ตัวเลข เช่น somchai.j">
            <input name="username" value={form.username} onChange={set("username")} className={inputClass} />
          </Field>
        )}
        <Field label="ชื่อ-นามสกุล" required hint="แสดงในระบบและเอกสาร (ข้อ 12)">
          <input name="display_name" value={form.display_name} onChange={set("display_name")} className={inputClass} />
        </Field>
        <Field label="บทบาท" required>
          <select name="role" value={form.role} onChange={set("role")} disabled={isSelf} className={inputClass}>
            {ROLES.map((role) => (
              <option key={role} value={role}>{roleLabels[role].label}</option>
            ))}
          </select>
        </Field>
        <Field label="สาขา/หน่วยงาน" hint="ของอาจารย์ใช้ชื่อสาขาให้ตรงกับวงเงินของสาขา">
          <input name="department" value={form.department} onChange={set("department")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ตำแหน่ง">
            <input name="position" value={form.position} onChange={set("position")} className={inputClass} />
          </Field>
          <Field label="เบอร์โทร">
            <input name="phone" value={form.phone} onChange={set("phone")} className={inputClass} />
          </Field>
        </div>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{error}</div>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
          <Button type="submit" className="flex-1" disabled={busy}>{user ? "บันทึก" : "สร้างบัญชี"}</Button>
        </div>
      </form>
    </Dialog>
  )
}

function CredentialsDialog({ credentials, onClose }: { credentials: IssuedCredential[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const text = credentials.map((c) => `${c.display_name}\nusername: ${c.username}\nรหัสผ่าน: ${c.password}`).join("\n\n")
  return (
    <Dialog title="รหัสผ่านเริ่มต้น">
      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        รหัสนี้แสดงครั้งเดียว จดหรือคัดลอกให้ผู้ใช้ แล้วให้ผู้ใช้เปลี่ยนรหัสเองหลังเข้าสู่ระบบ
      </p>
      {credentials.map((c) => (
        <div key={c.username} className="rounded-xl bg-surface px-4 py-3 text-sm" data-testid="issued-credential">
          <div className="font-semibold text-ink">{c.display_name}</div>
          <div className="mt-1 font-mono text-xs">username: <span data-testid="issued-username">{c.username}</span></div>
          <div className="font-mono text-base font-bold text-brand">รหัสผ่าน: <span data-testid="issued-password">{c.password}</span></div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? "คัดลอกแล้ว" : "คัดลอก"}
        </Button>
        <Button className="flex-1" onClick={onClose}>ปิด</Button>
      </div>
    </Dialog>
  )
}

function ImportResultDialog({ result, onClose }: { result: ImportResult; onClose: () => void }) {
  return (
    <Dialog title="ผลการนำเข้ารายชื่อ">
      <div className="text-sm">
        สร้างบัญชีแล้ว <strong data-testid="import-created-count">{result.created.length}</strong> บัญชี
        {result.errors.length > 0 && <> · ข้าม <strong className="text-rose-700">{result.errors.length}</strong> แถว</>}
      </div>
      {result.created.length > 0 && (
        <>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            ดาวน์โหลดใบรายชื่อพร้อมรหัสเริ่มต้นไว้แจกผู้ใช้ — ปิดหน้าต่างนี้แล้วจะดูรหัสอีกไม่ได้
          </p>
          <Button variant="outline" icon="download" className="w-full" onClick={() => downloadCredentials(result.created)}>
            ดาวน์โหลดใบรายชื่อพร้อมรหัส (CSV)
          </Button>
        </>
      )}
      {result.errors.length > 0 && (
        <ul className="space-y-1 text-xs text-rose-800" data-testid="import-errors">
          {result.errors.map((e) => (
            <li key={e.line}>แถว {e.line}{e.username ? ` (${e.username})` : ""}: {e.message}</li>
          ))}
        </ul>
      )}
      <Button className="w-full" onClick={onClose}>ปิด</Button>
    </Dialog>
  )
}

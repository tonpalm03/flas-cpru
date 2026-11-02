import { FormEvent, useEffect, useState } from "react"
import { ApiError } from "../../lib/api"
import { Disbursement, LedgerLine, ProjectLedgerData, baht, budgetService, thaiShortDate } from "../../services/budgetService"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { RequestsPanel } from "./DisbursementRequests"

interface ProjectLedgerProps {
  projectCode: string
  ledger: ProjectLedgerData | null
  error?: string | null
  onChange: (ledger: ProjectLedgerData) => void
}

const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"

const lineKey = (line: Pick<LedgerLine, "activity_key" | "source_code">) => `${line.activity_key}|${line.source_code}`
const satang = (amount: number) => Math.round(amount * 100)

function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** รายการเบิกของบรรทัดงบ พร้อมคงเหลือสะสม (รายการที่ยกเลิกไม่นับ) — แบบเดียวกับทะเบียนใน Excel */
function withRunningBalance(line: LedgerLine, disbursements: Disbursement[]) {
  let remaining = satang(line.amount)
  return disbursements
    .filter((d) => lineKey(d) === lineKey(line))
    .map((d) => {
      if (!d.voided_at) remaining -= satang(d.amount)
      return { ...d, balance: d.voided_at ? null : remaining / 100 }
    })
}

export function ProjectLedger({ projectCode, ledger, error, onChange }: ProjectLedgerProps) {
  const [selected, setSelected] = useState("")
  const [paidOn, setPaidOn] = useState(today())
  const [docNo, setDocNo] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const lines = ledger?.lines ?? []
  // บรรทัดเดียว (กิจกรรมเดียว แหล่งงบเดียว) เลือกให้เลย
  useEffect(() => {
    if (lines.length === 1) setSelected(lineKey(lines[0]))
  }, [lines.length, lines[0]?.activity_key, lines[0]?.source_code])

  if (error) {
    return <Card className="p-6 text-xs font-semibold text-rose-700" data-testid="ledger-error">{error}</Card>
  }
  if (!ledger) {
    return <Card className="p-6 text-xs text-muted">กำลังโหลดงบของโครงการ...</Card>
  }
  if (lines.length === 0) {
    return (
      <Card className="p-6 text-xs text-muted" data-testid="ledger-empty">
        ยังไม่มีงบที่ล็อกไว้ — ระบบล็อกงบรายกิจกรรมเมื่อเจ้าหน้าที่อัปโหลดเอกสารที่ลงนามครบ (สแกน) แล้ว จากนั้นจึงบันทึกการเบิกจ่ายได้
      </Card>
    )
  }

  const line = lines.find((l) => lineKey(l) === selected)
  const parsedAmount = Number(amount)

  const run = async (task: () => Promise<ProjectLedgerData>) => {
    setBusy(true)
    setFormError(null)
    try {
      onChange(await task())
      return true
    } catch (e) {
      setFormError(e instanceof ApiError ? e.detail : "บันทึกไม่สำเร็จ")
      return false
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!line) return setFormError("กรุณาเลือกกิจกรรม")
    if (!(parsedAmount > 0)) return setFormError("กรุณาระบุจำนวนเงินมากกว่า 0")
    if (satang(parsedAmount) > satang(line.remaining)) {
      return setFormError(`ยอดเบิกเกินงบคงเหลือของกิจกรรม (คงเหลือ ${baht(line.remaining)} บาท)`)
    }
    const ok = await run(() =>
      budgetService.recordDisbursement(projectCode, {
        activity_key: line.activity_key,
        source_code: line.source_code,
        paid_on: paidOn,
        doc_no: docNo.trim(),
        description: description.trim(),
        amount: parsedAmount,
      })
    )
    if (ok) {
      setDocNo("")
      setDescription("")
      setAmount("")
    }
  }

  const voidRow = (row: Disbursement) => {
    const reason = prompt(`ยกเลิกรายการ ${row.doc_no} (${baht(row.amount)} บาท)\nระบุเหตุผล:`)
    if (reason === null) return
    if (!reason.trim()) return setFormError("กรุณาระบุเหตุผลที่ยกเลิกรายการ")
    run(() => budgetService.voidDisbursement(projectCode, row.id, reason.trim()))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {lines.map((l) => {
          const percent = l.amount > 0 ? Math.min((l.spent / l.amount) * 100, 100) : 0
          return (
            <Card key={lineKey(l)} className="p-4 space-y-2" data-testid="ledger-line">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-bold text-ink">{l.activity_name}</div>
                <span className="shrink-0 rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">{l.source_label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-muted">
                <div>
                  งบ<div className="font-mono text-sm font-bold text-brand">{baht(l.amount)}</div>
                </div>
                <div>
                  เบิกแล้ว<div className="font-mono text-sm font-bold text-emerald-700">{baht(l.spent)}</div>
                </div>
                <div>
                  คงเหลือ<div className="font-mono text-sm font-bold text-amber-700" data-testid="line-remaining">{baht(l.remaining)}</div>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
              </div>
              {l.requested > 0 && (
                <div className="text-[11px] text-amber-800">อาจารย์ขอเบิกค้างอยู่ {baht(l.requested)} บาท</div>
              )}
            </Card>
          )
        })}
      </div>

      <RequestsPanel projectCode={projectCode} ledger={ledger} onChange={onChange} />

      {ledger.can_record && (
        <Card className="p-5">
          <form data-testid="record-form" onSubmit={submit} className="space-y-3">
            <div className="text-sm font-bold text-ink">บันทึกการเบิกจ่าย</div>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
              <label className="text-xs font-semibold text-slate-700">
                กิจกรรม / แหล่งงบ
                <select
                  data-testid="record-activity"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className={`${inputClass} mt-1`}
                >
                  <option value="">— เลือกกิจกรรม —</option>
                  {lines.map((l) => (
                    <option key={lineKey(l)} value={lineKey(l)}>
                      {l.activity_name} · {l.source_label} (คงเหลือ {baht(l.remaining)})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                วันที่
                <input data-testid="record-date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                เลขที่ (เช่น 167/70)
                <input data-testid="record-docno" value={docNo} onChange={(e) => setDocNo(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-[3fr_1fr]">
              <label className="text-xs font-semibold text-slate-700">
                รายการ
                <input
                  data-testid="record-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น ค่าตอบแทนวิทยากร วันที่ 23 เมษายน 2570"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                จำนวนเงิน (บาท)
                <input
                  data-testid="record-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${inputClass} mt-1 text-right font-mono`}
                />
              </label>
            </div>
            {line && <div className="text-[11px] text-muted">งบคงเหลือของกิจกรรมนี้ {baht(line.remaining)} บาท (ถัวเฉลี่ยทุกรายการภายใต้กิจกรรมเดียวกัน)</div>}
            {formError && (
              <div data-testid="ledger-error" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
                {formError}
              </div>
            )}
            <div className="flex justify-end">
              <Button data-testid="record-submit" type="submit" size="sm" icon="plus" disabled={busy || !docNo.trim() || !description.trim() || !amount}>
                {busy ? "กำลังบันทึก..." : "บันทึกการเบิก"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {lines.map((l) => {
        const rows = withRunningBalance(l, ledger.disbursements)
        return (
          <Card key={lineKey(l)} className="p-5 space-y-3">
            <div className="text-sm font-bold text-ink">
              ทะเบียนการเบิกจ่าย · {l.activity_name} <span className="text-xs font-semibold text-muted">({l.source_label})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface font-bold whitespace-nowrap text-muted">
                  <tr>
                    <th className="py-2 px-3">ว/ด/ป</th>
                    <th className="py-2 px-3">เลขที่</th>
                    <th className="py-2 px-3 min-w-[260px]">รายการ</th>
                    <th className="py-2 px-3 text-right">งบจัดสรร</th>
                    <th className="py-2 px-3 text-right">เบิก</th>
                    <th className="py-2 px-3 text-right">คงเหลือ</th>
                    <th className="py-2 px-3">บันทึกโดย</th>
                    {ledger.can_record && <th className="py-2 px-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr className="bg-surface">
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3 font-semibold">{l.activity_name}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{baht(l.amount)}</td>
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3 text-right font-mono">{baht(l.amount)}</td>
                    <td className="py-2 px-3" />
                    {ledger.can_record && <td className="py-2 px-3" />}
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.id} data-testid="disbursement-row" className={row.voided_at ? "text-slate-400" : ""}>
                      <td className="py-2 px-3 whitespace-nowrap">{thaiShortDate(row.paid_on)}</td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono">{row.doc_no}</td>
                      <td className="py-2 px-3">
                        <span className={row.voided_at ? "line-through" : ""}>{row.description}</span>
                        {row.voided_at && (
                          <div className="text-[11px] text-rose-600 no-underline">
                            ยกเลิกโดย {row.voided_by}: {row.void_reason}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3" />
                      <td className={`py-2 px-3 text-right font-mono font-bold ${row.voided_at ? "line-through" : "text-emerald-700"}`}>{baht(row.amount)}</td>
                      <td className="py-2 px-3 text-right font-mono">{row.balance === null ? "" : baht(row.balance)}</td>
                      <td className="py-2 px-3 text-[11px] text-muted">{row.recorded_by}</td>
                      {ledger.can_record && (
                        <td className="py-2 px-3 text-right">
                          {!row.voided_at && (
                            <Button data-testid="void-button" variant="ghost" size="sm" onClick={() => voidRow(row)} disabled={busy}>
                              ยกเลิก
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={ledger.can_record ? 8 : 7} className="py-4 text-center text-muted">
                        ยังไม่มีรายการเบิกจ่าย
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

/** ProjectLedger ที่โหลดข้อมูลเอง (ใช้ในหน้างานเจ้าหน้าที่ หมวดเบิกจ่าย/ปิดโครงการ) */
export function LoadedProjectLedger({ projectCode, onChanged }: { projectCode: string; onChanged: () => void }) {
  const [ledger, setLedger] = useState<ProjectLedgerData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLedger(null)
    setError(null)
    budgetService
      .getProjectLedger(projectCode)
      .then(setLedger)
      .catch((e) => setError(e instanceof ApiError ? e.detail : "โหลดงบของโครงการไม่สำเร็จ"))
  }, [projectCode])

  return (
    <ProjectLedger
      projectCode={projectCode}
      ledger={ledger}
      error={error}
      onChange={(next) => {
        setLedger(next)
        onChanged()
      }}
    />
  )
}

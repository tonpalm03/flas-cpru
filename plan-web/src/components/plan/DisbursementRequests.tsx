import { FormEvent, useRef, useState } from "react"
import { ApiError } from "../../lib/api"
import {
  ClosureRequest,
  DisbursementRequest,
  LedgerLine,
  ProjectLedgerData,
  RequestFile,
  RequestStatus,
  baht,
  budgetService,
  thaiShortDate,
} from "../../services/budgetService"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"

// คำขอเบิก/คำขอปิดโครงการ: อาจารย์ขอ (ต้องแนบหลักฐาน) → เจ้าหน้าที่แผนบันทึกเบิกตามเลขฎีกา หรือตีกลับ
// สิทธิ์มาจาก ledger: can_request = อาจารย์เจ้าของ, can_record = เจ้าหน้าที่แผน (ผู้บริหารเห็นอย่างเดียว)

interface PanelProps {
  projectCode: string
  ledger: ProjectLedgerData
  onChange: (ledger: ProjectLedgerData) => void
}

const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"

const REQUEST_LABELS: Record<RequestStatus, string> = {
  PENDING: "รอเจ้าหน้าที่",
  RECORDED: "บันทึกเบิกแล้ว",
  ACCEPTED: "ปิดโครงการแล้ว",
  RETURNED: "ถูกตีกลับ",
  RESUBMITTED: "ส่งใหม่แล้ว",
  CANCELLED: "ยกเลิกแล้ว",
}
const CLOSURE_LABELS: Record<RequestStatus, string> = {
  ...REQUEST_LABELS,
  PENDING: "รอเจ้าหน้าที่ปิดโครงการ",
}
const TONES: Record<RequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  RECORDED: "bg-brand-soft text-brand border-brand/20",
  ACCEPTED: "bg-brand-soft text-brand border-brand/20",
  RETURNED: "bg-rose-50 text-rose-700 border-rose-200",
  RESUBMITTED: "bg-surface text-muted border-line",
  CANCELLED: "bg-surface text-muted border-line",
}

const lineKey = (line: Pick<LedgerLine, "activity_key" | "source_code">) => `${line.activity_key}|${line.source_code}`
const satang = (amount: number) => Math.round(amount * 100)

function shortDate(value: string | null): string {
  return value ? thaiShortDate(value.slice(0, 10)) : ""
}

function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function useRunner(onChange: (ledger: ProjectLedgerData) => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (task: () => Promise<ProjectLedgerData>) => {
    setBusy(true)
    setError(null)
    try {
      onChange(await task())
      return true
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "บันทึกไม่สำเร็จ")
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

function StatusChip({ status, labels = REQUEST_LABELS }: { status: RequestStatus; labels?: Record<RequestStatus, string> }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONES[status]}`}>{labels[status]}</span>
}

function FileLinks({ files, onError }: { files: RequestFile[]; onError: (message: string) => void }) {
  if (files.length === 0) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
      {files.map((file) => (
        <a
          key={file.id}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            budgetService.openRequestFile(file).catch((err) => onError(err instanceof ApiError ? err.detail : "เปิดไฟล์ไม่สำเร็จ"))
          }}
          className="font-semibold text-brand-2 underline-offset-2 hover:underline"
        >
          {file.file_name}
        </a>
      ))}
    </div>
  )
}

function FilePicker({ testId, files, onChange }: { testId: string; files: File[]; onChange: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" icon="upload" onClick={() => input.current?.click()}>
        เลือกไฟล์
      </Button>
      <span className="text-[11px] font-normal text-muted">{files.length ? files.map((f) => f.name).join(", ") : "ยังไม่ได้เลือกไฟล์"}</span>
      <input
        ref={input}
        data-testid={testId}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          onChange(Array.from(e.target.files || []))
          e.target.value = ""
        }}
      />
    </div>
  )
}

function ErrorBox({ message, testId }: { message: string | null; testId: string }) {
  if (!message) return null
  return (
    <div data-testid={testId} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
      {message}
    </div>
  )
}

/** ฟอร์มขอเบิกของอาจารย์ (ใช้ทั้งขอใหม่และส่งใหม่หลังถูกตีกลับ) */
function RequestForm({
  projectCode,
  lines,
  initial,
  onDone,
  onCancel,
  onChange,
}: {
  projectCode: string
  lines: LedgerLine[]
  initial?: DisbursementRequest
  onDone: () => void
  onCancel: () => void
  onChange: (ledger: ProjectLedgerData) => void
}) {
  const [selected, setSelected] = useState(initial ? lineKey(initial) : lines.length === 1 ? lineKey(lines[0]) : "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "")
  const [files, setFiles] = useState<File[]>([])
  const { busy, error, setError, run } = useRunner(onChange)
  const line = lines.find((l) => lineKey(l) === selected)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!line) return setError("กรุณาเลือกกิจกรรม")
    if (!description.trim()) return setError("กรุณาระบุรายการที่ขอเบิก")
    if (!(value > 0)) return setError("กรุณาระบุจำนวนเงินมากกว่า 0")
    if (satang(value) > satang(line.available)) return setError(`ยอดที่ขอเกินงบที่ขอได้ของกิจกรรมนี้ (ขอได้อีก ${baht(line.available)} บาท)`)
    if (files.length === 0) return setError("กรุณาแนบหลักฐานอย่างน้อย 1 ไฟล์ (PDF, JPG หรือ PNG)")
    const ok = await run(() =>
      budgetService.requestDisbursement(
        projectCode,
        { activity_key: line.activity_key, source_code: line.source_code, description: description.trim(), amount: value, resubmits_id: initial?.id },
        files
      )
    )
    if (ok) onDone()
  }

  return (
    <form data-testid="request-form" onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div className="text-sm font-bold text-ink">{initial ? "แก้แล้วส่งคำขอใหม่" : "ขอเบิก"}</div>
      {initial?.decision_reason && <div className="text-xs text-rose-700">เหตุผลที่ถูกตีกลับ: {initial.decision_reason}</div>}
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <label className="text-xs font-semibold text-ink">
          กิจกรรม / แหล่งงบ
          <select data-testid="request-activity" value={selected} onChange={(e) => setSelected(e.target.value)} className={`${inputClass} mt-1`}>
            <option value="">— เลือกกิจกรรม —</option>
            {lines.map((l) => (
              <option key={lineKey(l)} value={lineKey(l)}>
                {l.activity_name} · {l.source_label} (ขอได้อีก {baht(l.available)})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink">
          จำนวนเงิน (บาท)
          <input
            data-testid="request-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} mt-1 text-right font-mono`}
          />
        </label>
      </div>
      <label className="block text-xs font-semibold text-ink">
        รายการที่ขอเบิก
        <input
          data-testid="request-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เช่น ค่าตอบแทนวิทยากร 2 คน วันที่ 23 เมษายน 2570"
          className={`${inputClass} mt-1`}
        />
      </label>
      <div className="text-xs font-semibold text-ink">
        หลักฐาน (ใบเสร็จ/บันทึกข้อความ — PDF, JPG หรือ PNG ไม่เกิน 20 MB ต่อไฟล์ สูงสุด 5 ไฟล์)
        <FilePicker testId="request-files" files={files} onChange={setFiles} />
      </div>
      {line && <div className="text-[11px] text-muted">งบคงเหลือ {baht(line.remaining)} บาท · ขอค้างอยู่ {baht(line.requested)} บาท · ขอได้อีก {baht(line.available)} บาท</div>}
      <ErrorBox message={error} testId="request-error" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          ยกเลิก
        </Button>
        <Button data-testid="request-submit" type="submit" size="sm" icon="send" disabled={busy}>
          {busy ? "กำลังส่ง..." : "ส่งคำขอ"}
        </Button>
      </div>
    </form>
  )
}

/** การ์ดคำขอเบิกที่รอเจ้าหน้าที่: บันทึกเบิก (ใส่เลขฎีกา) หรือตีกลับ */
function PendingRequest({ projectCode, request, onChange }: { projectCode: string; request: DisbursementRequest; onChange: PanelProps["onChange"] }) {
  const [recording, setRecording] = useState(false)
  const [docNo, setDocNo] = useState("")
  const [paidOn, setPaidOn] = useState(today())
  const [amount, setAmount] = useState(String(request.amount))
  const [description, setDescription] = useState(request.description)
  const { busy, error, setError, run } = useRunner(onChange)

  const record = (event: FormEvent) => {
    event.preventDefault()
    if (!docNo.trim()) return setError("กรุณาระบุเลขที่ฎีกา/เอกสาร")
    run(() =>
      budgetService.decideRequest(projectCode, request.id, "record", {
        doc_no: docNo.trim(),
        paid_on: paidOn,
        amount: Number(amount),
        description: description.trim(),
      })
    )
  }

  const returnIt = () => {
    const reason = prompt(`ตีกลับคำขอ "${request.description}" (${baht(request.amount)} บาท)\nระบุเหตุผลให้อาจารย์:`)
    if (reason === null) return
    if (!reason.trim()) return setError("กรุณาระบุเหตุผลที่ตีกลับ")
    run(() => budgetService.decideRequest(projectCode, request.id, "return", { reason: reason.trim() }))
  }

  return (
    <div data-testid="pending-request" className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink">{request.description}</div>
          <div className="text-[11px] text-muted">
            {request.activity_name} · {request.source_label} · ขอโดย {request.requested_by} เมื่อ {shortDate(request.created_at)}
          </div>
        </div>
        <div className="font-mono text-base font-bold text-brand">{baht(request.amount)}</div>
      </div>
      <FileLinks files={request.files} onError={setError} />
      {recording ? (
        <form onSubmit={record} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
          <label className="text-[11px] font-semibold text-ink">
            เลขที่ฎีกา/เอกสาร
            <input data-testid="request-docno" value={docNo} onChange={(e) => setDocNo(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-[11px] font-semibold text-ink">
            วันที่
            <input data-testid="request-date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-[11px] font-semibold text-ink">
            ยอดเบิกจริง (บาท)
            <input
              data-testid="request-record-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} mt-1 text-right font-mono`}
            />
          </label>
          <label className="text-[11px] font-semibold text-ink sm:col-span-3">
            รายการ
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRecording(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button data-testid="request-record-submit" type="submit" size="sm" icon="check" disabled={busy}>
              {busy ? "กำลังบันทึก..." : "บันทึกเบิก"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button data-testid="request-return" variant="outline" size="sm" icon="return" onClick={returnIt} disabled={busy}>
            ตีกลับ
          </Button>
          <Button data-testid="request-record" size="sm" icon="check" onClick={() => setRecording(true)} disabled={busy}>
            บันทึกเบิก
          </Button>
        </div>
      )}
      <ErrorBox message={error} testId="request-error" />
    </div>
  )
}

function RequestRow({
  request,
  docNo,
  canAct,
  onResubmit,
  onCancel,
  onError,
  busy,
}: {
  request: DisbursementRequest
  docNo?: string
  canAct: boolean
  onResubmit: () => void
  onCancel: () => void
  onError: (message: string) => void
  busy: boolean
}) {
  return (
    <div data-testid="request-row" className="space-y-1 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={request.status} />
            <span className="text-sm font-semibold text-ink">{request.description}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted">
            {request.activity_name} · {request.source_label} · ขอเมื่อ {shortDate(request.created_at)}
            {request.status === "RECORDED" && docNo && ` · เลขที่ ${docNo}`}
            {request.decided_by && request.status !== "PENDING" && ` · โดย ${request.decided_by}`}
          </div>
        </div>
        <div className="font-mono text-sm font-bold text-ink">{baht(request.amount)}</div>
      </div>
      {request.status === "RETURNED" && request.decision_reason && (
        <div className="text-xs text-rose-700">เหตุผลที่ตีกลับ: {request.decision_reason}</div>
      )}
      <FileLinks files={request.files} onError={onError} />
      {canAct && (request.status === "PENDING" || request.status === "RETURNED") && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button data-testid="request-cancel" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
            ยกเลิกคำขอ
          </Button>
          {request.status === "RETURNED" && (
            <Button data-testid="request-resubmit" variant="outline" size="sm" icon="edit" onClick={onResubmit} disabled={busy}>
              แก้แล้วส่งใหม่
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** ส่วนขอปิดโครงการของอาจารย์ + สถานะคำขอล่าสุด */
function TeacherClosure({ projectCode, ledger, onChange }: PanelProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const { busy, error, setError, run } = useRunner(onChange)
  const latest: ClosureRequest | undefined = ledger.closure_requests[0]
  const pendingDisbursements = ledger.requests.some((r) => r.status === "PENDING")
  const waiting = latest?.status === "PENDING"

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!note.trim()) return setError("กรุณาสรุปผลการดำเนินงานโดยย่อ")
    const ok = await run(() => budgetService.requestClosure(projectCode, note.trim(), files))
    if (ok) {
      setOpen(false)
      setNote("")
      setFiles([])
    }
  }

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-ink">ปิดโครงการ</div>
          <div className="text-[11px] text-muted">จัดกิจกรรมและเบิกครบแล้ว ส่งสรุปผลให้เจ้าหน้าที่ปิดโครงการและคืนงบคงเหลือ</div>
        </div>
        {ledger.can_request && !open && (
          <Button data-testid="closure-open" variant="outline" size="sm" icon="return" onClick={() => setOpen(true)} disabled={busy || waiting || pendingDisbursements}>
            ขอปิดโครงการ
          </Button>
        )}
      </div>
      {ledger.can_request && pendingDisbursements && !waiting && (
        <div className="text-[11px] text-muted">ขอปิดโครงการได้เมื่อไม่มีคำขอเบิกที่รอเจ้าหน้าที่</div>
      )}
      {latest && (
        <div data-testid="closure-status" className="flex flex-wrap items-center gap-2 text-xs">
          <StatusChip status={latest.status} labels={CLOSURE_LABELS} />
          <span className="text-muted">ส่งเมื่อ {shortDate(latest.created_at)}</span>
          {latest.status === "RETURNED" && latest.decision_reason && <span className="text-rose-700">เหตุผล: {latest.decision_reason}</span>}
          {ledger.can_request && (latest.status === "PENDING" || latest.status === "RETURNED") && (
            <Button
              data-testid="closure-cancel"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                if (confirm("ยกเลิกคำขอปิดโครงการ?")) run(() => budgetService.decideClosure(projectCode, latest.id, "cancel"))
              }}
            >
              ยกเลิกคำขอ
            </Button>
          )}
        </div>
      )}
      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <label className="block text-xs font-semibold text-ink">
            สรุปผลการดำเนินงานโดยย่อ
            <textarea
              data-testid="closure-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="เช่น จัดกิจกรรมครบ 2 วัน ผู้เข้าร่วม 48 คน ความพึงพอใจเฉลี่ย 4.5"
              className={`${inputClass} mt-1`}
            />
          </label>
          <div className="text-xs font-semibold text-ink">
            รายงานผล (ถ้ามี — PDF, JPG หรือ PNG)
            <FilePicker testId="closure-files" files={files} onChange={setFiles} />
          </div>
          <ErrorBox message={error} testId="closure-error" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button data-testid="closure-submit" type="submit" size="sm" icon="send" disabled={busy}>
              {busy ? "กำลังส่ง..." : "ส่งคำขอปิดโครงการ"}
            </Button>
          </div>
        </form>
      )}
      {!open && <ErrorBox message={error} testId="closure-error" />}
    </div>
  )
}

/** คำขอปิดโครงการที่รอเจ้าหน้าที่ (ปิดด้วยปุ่ม "ปิดโครงการ / คืนงบคงเหลือ" ตามเดิม) */
function OfficerClosure({ projectCode, ledger, onChange }: PanelProps) {
  const { busy, error, setError, run } = useRunner(onChange)
  const pending = ledger.closure_requests.find((c) => c.status === "PENDING")
  if (!pending) return null
  const returnIt = () => {
    const reason = prompt("ตีกลับคำขอปิดโครงการ\nระบุเหตุผลให้อาจารย์:")
    if (reason === null) return
    if (!reason.trim()) return setError("กรุณาระบุเหตุผลที่ตีกลับ")
    run(() => budgetService.decideClosure(projectCode, pending.id, "return", { reason: reason.trim() }))
  }
  return (
    <div data-testid="closure-request" className="space-y-2 rounded-xl border border-brand/30 bg-brand-soft/60 p-4">
      <div className="text-sm font-bold text-ink">อาจารย์ขอปิดโครงการ</div>
      <div className="whitespace-pre-line text-xs text-ink">{pending.note}</div>
      <div className="text-[11px] text-muted">
        โดย {pending.requested_by} เมื่อ {shortDate(pending.created_at)} — ตรวจแล้วกด "ปิดโครงการ / คืนงบคงเหลือ"
      </div>
      <FileLinks files={pending.files} onError={setError} />
      <div className="flex justify-end">
        <Button data-testid="closure-return" variant="outline" size="sm" icon="return" onClick={returnIt} disabled={busy}>
          ตีกลับ
        </Button>
      </div>
      <ErrorBox message={error} testId="closure-error" />
    </div>
  )
}

/** ส่วนคำขอทั้งหมดในหน้า "งบและการเบิกจ่าย" */
export function RequestsPanel({ projectCode, ledger, onChange }: PanelProps) {
  const [form, setForm] = useState<{ initial?: DisbursementRequest } | null>(null)
  const { busy, error, setError, run } = useRunner(onChange)
  const pending = ledger.requests.filter((r) => r.status === "PENDING")
  const history = ledger.can_record ? ledger.requests.filter((r) => r.status !== "PENDING") : ledger.requests
  const docNos = new Map(ledger.disbursements.map((d) => [d.id, d.doc_no]))
  const isTeacher = ledger.can_request
  const showClosure = ledger.can_request || ledger.closure_requests.length > 0

  if (!ledger.can_request && !ledger.can_record && ledger.requests.length === 0 && ledger.closure_requests.length === 0) {
    return null
  }

  return (
    <Card className="space-y-4 p-5" data-testid="requests-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-ink">คำขอเบิกจากอาจารย์</div>
          <div className="text-[11px] text-muted">
            {ledger.can_record
              ? "ตรวจหลักฐาน แล้วบันทึกเบิกตามเลขที่ฎีกา หรือตีกลับพร้อมเหตุผล"
              : "ขอเบิกพร้อมแนบหลักฐาน — เจ้าหน้าที่แผนบันทึกเบิกตามเลขที่ฎีกา หรือตีกลับพร้อมเหตุผล"}
          </div>
        </div>
        {ledger.can_request && !form && (
          <Button data-testid="request-open" size="sm" icon="plus" onClick={() => setForm({})}>
            ขอเบิก
          </Button>
        )}
      </div>

      {form && (
        <RequestForm
          key={form.initial?.id ?? "new"}
          projectCode={projectCode}
          lines={ledger.lines}
          initial={form.initial}
          onChange={onChange}
          onDone={() => setForm(null)}
          onCancel={() => setForm(null)}
        />
      )}

      {ledger.can_record && pending.map((request) => <PendingRequest key={request.id} projectCode={projectCode} request={request} onChange={onChange} />)}
      {ledger.can_record && <OfficerClosure projectCode={projectCode} ledger={ledger} onChange={onChange} />}

      <ErrorBox message={error} testId="request-list-error" />
      {history.length > 0 ? (
        <div className="divide-y divide-line">
          {history.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              docNo={request.disbursement_id ? docNos.get(request.disbursement_id) : undefined}
              canAct={isTeacher}
              busy={busy}
              onError={setError}
              onResubmit={() => setForm({ initial: request })}
              onCancel={() => {
                if (confirm(`ยกเลิกคำขอ "${request.description}"?`)) run(() => budgetService.decideRequest(projectCode, request.id, "cancel"))
              }}
            />
          ))}
        </div>
      ) : (
        ledger.requests.length === 0 && <div className="py-2 text-xs text-muted">ยังไม่มีคำขอเบิก</div>
      )}

      {showClosure && !ledger.can_record && <TeacherClosure projectCode={projectCode} ledger={ledger} onChange={onChange} />}
    </Card>
  )
}

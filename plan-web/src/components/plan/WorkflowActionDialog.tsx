import { useState } from "react"
import { actionLabels } from "../../lib/formatters"
import { Button } from "../ui/Button"

type DialogAction = "approve" | "request_revision" | "reject" | "record_signature" | "undo_signature" | "upload_scan" | "undo_scan"

export interface DialogInput {
  reason?: string
  signed_at?: string
  note?: string
  file?: File
}

interface WorkflowActionDialogProps {
  action: DialogAction
  stepLabel?: string
  /** คำเตือนที่ต้องเห็นก่อนยืนยัน (เช่น อนุมัติแล้วเกินวงเงินสาขา) — ไม่บล็อกการยืนยัน */
  notices?: string[]
  onCancel: () => void
  onConfirm: (input: DialogInput) => Promise<void>
}

const descriptions: Record<DialogAction, string> = {
  approve: "ระบบจะสร้างไฟล์ Word ตามแบบฟอร์มของปีงบประมาณ ให้อาจารย์ดาวน์โหลดไปพิมพ์และลงนาม",
  request_revision: "โครงการจะกลับไปให้อาจารย์แก้ไข การบันทึกลงนามของฉบับนี้จะถูกยกเลิก",
  reject: "โครงการจะสิ้นสุดที่สถานะไม่อนุมัติ",
  record_signature: "บันทึกตามเอกสารกระดาษที่ลงนามแล้ว",
  undo_signature: "ยกเลิกการบันทึกลงนามขั้นล่าสุด (กรณีบันทึกผิด)",
  upload_scan:
    "แนบไฟล์สแกนเอกสารที่ลงนามครบแล้ว (PDF, JPG หรือ PNG ไม่เกิน 20 MB) — สแกนครั้งแรกระบบจะล็อกงบของโครงการ เริ่มบันทึกเบิกจ่ายได้ และแจ้งอาจารย์ทันที",
  undo_scan:
    "ยกเลิกไฟล์สแกนที่แนบผิด: โครงการกลับไปขั้นรอสแกน และปลดงบที่ล็อกไว้ (ทำไม่ได้ถ้าบันทึกเบิกจ่ายไปแล้ว) — ไฟล์เดิมยังเก็บไว้เป็นหลักฐาน",
}

function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function WorkflowActionDialog({ action, stepLabel, notices = [], onCancel, onConfirm }: WorkflowActionDialogProps) {
  const [reason, setReason] = useState("")
  const [signedAt, setSignedAt] = useState(today())
  const [note, setNote] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const needsReason = action === "request_revision" || action === "reject" || action === "undo_scan"
  const canConfirm =
    !submitting &&
    (!needsReason || reason.trim().length > 0) &&
    (action !== "record_signature" || signedAt.length === 10) &&
    (action !== "upload_scan" || file !== null)

  const confirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm({
        reason: needsReason ? reason.trim() : undefined,
        signed_at: action === "record_signature" ? signedAt : undefined,
        note: action === "record_signature" ? note.trim() || undefined : undefined,
        file: file ?? undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-ink">
            {actionLabels[action]}
            {stepLabel ? `: ${stepLabel}` : ""}
          </h3>
          <p className="mt-1 text-xs text-muted">{descriptions[action]}</p>
        </div>

        {notices.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-amber-800">คำเตือนวงเงินสาขา (ยังอนุมัติได้ ระบบจะบันทึกไว้)</div>
            {notices.map((notice) => (
              <div key={notice} data-testid="approve-notice" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {notice}
              </div>
            ))}
          </div>
        )}

        {needsReason && (
          <label className="block text-xs font-semibold text-slate-700">
            {action === "undo_scan" ? "เหตุผลที่ยกเลิกไฟล์สแกน" : "เหตุผล (แจ้งให้อาจารย์ทราบ)"} <span className="text-rose-600">*</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              autoFocus
              className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
        )}

        {action === "record_signature" && (
          <>
            <label className="block text-xs font-semibold text-slate-700">
              วันที่ลงนามในเอกสาร <span className="text-rose-600">*</span>
              <input
                type="date"
                value={signedAt}
                onChange={(e) => setSignedAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              หมายเหตุ
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2 text-sm font-normal"
              />
            </label>
          </>
        )}

        {action === "upload_scan" && (
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            variant={action === "reject" ? "danger" : "primary"}
            size="sm"
            onClick={confirm}
            disabled={!canConfirm}
          >
            {submitting ? "กำลังบันทึก..." : "ยืนยัน"}
          </Button>
        </div>
      </div>
    </div>
  )
}

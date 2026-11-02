import { DragEvent, useRef, useState } from "react"
import { PlanProject } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { formatMoney } from "../../lib/formatters"
import { planService } from "../../services/planService"
import { Button } from "../ui/Button"

interface ScanDropZoneProps {
  project: PlanProject
  onUploaded: () => void
}

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"]
const MAX_BYTES = 20 * 1024 * 1024
const UNREADABLE_FILE =
  "เปิดไฟล์นี้ไม่ได้ — มักเกิดจากชื่อโฟลเดอร์รวมชื่อไฟล์ยาวเกินไป ย้ายไฟล์ไปไว้ที่ Desktop หรือเปลี่ยนชื่อไฟล์ให้สั้นลงแล้วลองใหม่"

/**
 * อัปโหลดเอกสารที่ลงนามครบจากแถวในคิว "รอสแกน": ลากไฟล์มาวาง หรือคลิกเลือกไฟล์
 * การอัปโหลดล็อกงบของโครงการและแจ้งอาจารย์ทันที จึงต้องยืนยันชื่อโครงการและยอดเงินก่อนส่งทุกครั้ง
 */
export function ScanDropZone({ project, onUploaded }: ScanDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const choose = async (file?: File) => {
    if (!file || busy) return
    setError(null)
    // ตรวจก่อนส่ง ให้รู้ทันทีที่แถวนี้ (backend ตรวจซ้ำรวมถึงเนื้อไฟล์)
    if (!ACCEPTED.includes(file.type)) return setError("รองรับเฉพาะไฟล์ PDF, JPG หรือ PNG")
    if (file.size > MAX_BYTES) return setError("ไฟล์มีขนาดเกิน 20 MB")
    // อ่านไฟล์ตอนเลือกเลย: Windows เปิดไฟล์ที่ path ยาวเกิน 260 ตัวอักษรไม่ได้ (เช่น ไฟล์ที่แตกจาก zip ของ Google Drive)
    // ถ้ารอไปอ่านตอนส่ง เบราว์เซอร์จะล้มเป็น "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" ซึ่งไม่บอกสาเหตุ — ส่งสำเนาที่อ่านแล้วแทน
    try {
      setPending(new File([await file.arrayBuffer()], file.name, { type: file.type }))
    } catch {
      setError(UNREADABLE_FILE)
    }
  }

  const upload = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await planService.uploadScan(project.id, pending)
      setPending(null)
      onUploaded()
    } catch (e) {
      setPending(null)
      setError(e instanceof ApiError ? e.detail : "อัปโหลดไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    choose(event.dataTransfer.files?.[0])
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div
        data-testid="scan-dropzone"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-2 cursor-pointer rounded-xl border-2 border-dashed px-3 py-2.5 text-center text-[11px] font-semibold transition-colors ${
          dragging ? "border-brand bg-brand/10 text-brand" : "border-line bg-white text-muted hover:border-brand/40"
        }`}
      >
        {busy ? "กำลังอัปโหลด..." : "ลากไฟล์สแกนมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (PDF/JPG/PNG ไม่เกิน 20 MB)"}
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(e) => {
          choose(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      {error && (
        <div data-testid="scan-error" className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-800">
          {error}
        </div>
      )}

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div data-testid="scan-confirm" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-ink">ยืนยันอัปโหลดเอกสารที่ลงนามครบ</h3>
              <p className="mt-1 text-xs text-muted">ตรวจให้แน่ใจว่าไฟล์นี้เป็นเอกสารของโครงการด้านล่าง</p>
            </div>
            <div className="space-y-1 rounded-xl bg-surface p-3 text-sm">
              <div className="font-mono text-xs text-muted">{project.id}</div>
              <div className="font-semibold text-ink">{project.name}</div>
              <div className="text-xs text-muted">
                {project.owner} · สาขาวิชา{project.unit}
              </div>
              <div className="pt-1 text-xs text-muted">
                ไฟล์: <span className="font-semibold text-ink">{pending.name}</span>
              </div>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-ink">
              <li>
                ระบบจะล็อกงบของโครงการ <strong className="font-mono">฿{formatMoney(project.amount)}</strong> และเริ่มบันทึกการเบิกจ่ายได้
              </li>
              <li>อาจารย์จะเห็นเอกสาร "ใหม่" พร้อมพิมพ์ในหน้างานของฉันทันที</li>
              <li>ถ้าแนบผิด กด "ย้อนการอัปโหลดสแกน" ในหน้าโครงการได้ (ก่อนบันทึกเบิกจ่าย)</li>
            </ul>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPending(null)} disabled={busy}>
                ยกเลิก
              </Button>
              <Button data-testid="scan-confirm-upload" size="sm" onClick={upload} disabled={busy}>
                {busy ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลดและล็อกงบ"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

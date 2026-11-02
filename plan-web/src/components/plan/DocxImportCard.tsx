import { useRef, useState } from "react"
import { CpruProjectFormData } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { planService } from "../../services/planService"
import { Button } from "../ui/Button"

interface DocxImportCardProps {
  /** คืน false = ผู้ใช้ยกเลิก (เช่น ไม่ยืนยันการแทนที่ข้อมูลที่กรอกไว้) */
  confirmReplace: () => boolean
  onImported: (form: CpruProjectFormData, warnings: string[], file: File) => void
}

/** นำเข้าไฟล์ Word (.docx) หรือไฟล์สแกน (.pdf) ของแบบฟอร์มโครงการของมหาวิทยาลัย มาเป็นร่างในหน้าเสนอโครงการ */
export function DocxImportCard({ confirmReplace, onImported }: DocxImportCardProps) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<"docx" | "scan" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const importFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    const name = file.name.toLowerCase()
    const kind = name.endsWith(".docx") ? "docx" : name.endsWith(".pdf") ? "scan" : null
    if (!kind) {
      setError("เลือกไฟล์ Word (.docx) หรือไฟล์สแกน (.pdf) — ถ้าเป็น .doc ให้เปิดใน Word แล้วบันทึกเป็น .docx ก่อน")
      return
    }
    if (!confirmReplace()) return
    setBusy(kind)
    try {
      const result = kind === "docx" ? await planService.importDocx(file) : await planService.importScan(file)
      onImported(result.form_data, result.warnings, file)
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "นำเข้าไฟล์ไม่สำเร็จ")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div data-testid="docx-import" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong bg-brand-soft/40 p-3 lg:mb-6 lg:p-4">
      <div className="min-w-0">
        <div className="text-sm font-bold text-ink">มีไฟล์ Word หรือไฟล์สแกนของโครงการอยู่แล้ว?</div>
        <p className="mt-0.5 hidden text-xs text-muted lg:block">
          นำเข้าแบบฟอร์มโครงการของมหาวิทยาลัยเป็นไฟล์ Word (.docx) หรือไฟล์สแกน (.pdf) ระบบจะเติมข้อมูลให้ทุกขั้น แล้วตรวจทานก่อนบันทึก
          · ไฟล์สแกนใช้ AI อ่าน ใช้เวลาไม่เกิน 1 นาที
        </p>
        {busy === "scan" && (
          <p data-testid="scan-import-progress" className="mt-1.5 text-xs font-semibold text-brand-2">
            กำลังอ่านไฟล์สแกนทีละหน้า ใช้เวลาไม่เกิน 1 นาที — อย่าปิดหน้านี้
          </p>
        )}
        {error && (
          <p data-testid="docx-import-error" role="alert" className="mt-1.5 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" icon="upload" type="button" disabled={busy !== null} onClick={() => input.current?.click()} className="shrink-0">
        {busy ? "กำลังอ่านไฟล์..." : "นำเข้าไฟล์"}
      </Button>
      <input
        ref={input}
        data-testid="docx-import-input"
        type="file"
        accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          importFile(file)
        }}
      />
    </div>
  )
}

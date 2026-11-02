import { useState } from "react"
import { PlanProject, Role } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { planService } from "../../services/planService"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"

// ลบ = ย้ายไปถังขยะ (เจ้าหน้าที่กู้คืนได้) — กฎเดียวกับ backend/services/project_trash.py
// อาจารย์: ลบร่าง (ไม่ต้องใส่เหตุผล) / ถอนโครงการที่ส่งแล้วแต่ยังไม่อนุมัติ · เจ้าหน้าที่: ลบก่อนอนุมัติหรือที่ไม่อนุมัติ
type DeleteKind = { label: string; needsReason: boolean; note: string }

export function deleteKind(role: Role, status: string): DeleteKind | null {
  if (role === "teacher") {
    if (status === "DRAFT") return { label: "ลบร่าง", needsReason: false, note: "ร่างนี้จะหายจากรายการของคุณ (เจ้าหน้าที่แผนกู้คืนให้ได้ถ้าลบผิด)" }
    if (status === "PENDING_REVIEW" || status === "REVISION_REQUESTED")
      return { label: "ถอนโครงการ", needsReason: true, note: "โครงการจะออกจากคิวตรวจของเจ้าหน้าที่ ระบุเหตุผลให้เจ้าหน้าที่ทราบ" }
    return null
  }
  if (role === "officer" && ["DRAFT", "PENDING_REVIEW", "REVISION_REQUESTED", "REJECTED"].includes(status)) {
    return { label: "ลบโครงการ", needsReason: true, note: "ย้ายไปถังขยะ — กู้คืนได้ที่เมนู \"ถังขยะ\"" }
  }
  return null
}

interface DeleteProjectButtonProps {
  project: PlanProject
  role: Role
  onDeleted: () => void
  size?: "sm" | "md"
}

export function DeleteProjectButton({ project, role, onDeleted, size = "sm" }: DeleteProjectButtonProps) {
  const kind = deleteKind(role, project.status)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!kind) return null

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await planService.deleteProject(project.id, reason.trim())
      setOpen(false)
      onDeleted()
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "ลบไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button data-testid="delete-project" variant="ghost" size={size} className="text-rose-700 hover:bg-rose-50" onClick={() => setOpen(true)}>
        {kind.label}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <Card data-testid="delete-dialog" className="w-full max-w-md space-y-3 p-5">
            <div className="text-base font-bold text-ink">{kind.label}</div>
            <div className="text-sm text-ink">{project.name}</div>
            <p className="text-xs text-muted">{kind.note}</p>
            {kind.needsReason && (
              <label className="block text-xs font-semibold text-ink">
                เหตุผล
                <textarea
                  data-testid="delete-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </label>
            )}
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
                ยกเลิก
              </Button>
              <Button
                data-testid="delete-confirm"
                variant="danger"
                size="sm"
                onClick={confirm}
                disabled={busy || (kind.needsReason && !reason.trim())}
              >
                {busy ? "กำลังลบ..." : kind.label}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

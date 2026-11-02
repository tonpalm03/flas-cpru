import { useCallback, useEffect, useState } from "react"
import { Role, WorkflowAction, WorkflowView } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { actionLabels } from "../../lib/formatters"
import { isViewable, planService } from "../../services/planService"
import { budgetService } from "../../services/budgetService"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { Icon } from "../ui/Icons"
import { StatusBadge } from "../ui/StatusBadge"
import { DialogInput, WorkflowActionDialog } from "./WorkflowActionDialog"

interface WorkflowPanelProps {
  projectCode: string
  role: Role
  onChanged: () => void
  onEdit?: () => void
}

type StageState = "done" | "current" | "pending" | "stopped"

interface Stage {
  key: string
  label: string
  state: StageState
  detail?: string
}

const SIGNING_PHASE = ["APPROVED_FOR_PRINT", "WAITING_FOR_SIGNATURES", "WAITING_FOR_SCAN", "COMPLETED_WITH_SCAN", "COMPLETED"]
const EDITABLE_BY_TEACHER = ["DRAFT", "REVISION_REQUESTED"]
type DialogAction = Exclude<WorkflowAction, "submit">

function formatThaiDate(value?: string | null): string {
  if (!value) return ""
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value.replace(" ", "T"))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}

function buildStages(view: WorkflowView): Stage[] {
  const status = view.status
  const inSigning = SIGNING_PHASE.includes(status)
  const stages: Stage[] = [
    {
      key: "submit",
      label: "อาจารย์ส่งโครงร่าง",
      state: EDITABLE_BY_TEACHER.includes(status) ? "current" : "done",
    },
    {
      key: "review",
      label: "เจ้าหน้าที่แผนตรวจและอนุมัติ",
      state: inSigning ? "done" : status === "PENDING_REVIEW" ? "current" : status === "REJECTED" ? "stopped" : "pending",
    },
    ...view.steps.map((step) => ({
      key: step.code,
      label: step.label + (step.mode === "OFFLINE" ? " (เอกสารกระดาษ)" : ""),
      state: step.state as StageState,
      detail: step.state === "done" ? `${formatThaiDate(step.signed_at)} · บันทึกโดย ${step.recorded_by}${step.note ? ` · ${step.note}` : ""}` : undefined,
    })),
    {
      key: "scan",
      label: "เจ้าหน้าที่อัปโหลดเอกสารสแกน",
      state: status === "COMPLETED_WITH_SCAN" || status === "COMPLETED" ? "done" : status === "WAITING_FOR_SCAN" ? "current" : "pending",
    },
  ]
  return stages
}

const stageStyles: Record<StageState, { dot: string; text: string }> = {
  done: { dot: "bg-brand text-white", text: "text-ink" },
  current: { dot: "bg-accent text-brand ring-4 ring-accent/30", text: "text-ink font-bold" },
  pending: { dot: "bg-slate-200 text-slate-500", text: "text-slate-500" },
  stopped: { dot: "bg-rose-500 text-white", text: "text-rose-700 font-bold" },
}

export function WorkflowPanel({ projectCode, role, onChanged, onEdit }: WorkflowPanelProps) {
  const [view, setView] = useState<WorkflowView | null>(null)
  const [notInWorkflow, setNotInWorkflow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [dialog, setDialog] = useState<DialogAction | null>(null)
  const [notices, setNotices] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  // เปลี่ยนโครงการ → ล้างสถานะ/คำเตือนของโครงการเดิมก่อนโหลดใหม่
  useEffect(() => {
    setView(null)
    setWarnings([])
    setDialog(null)
  }, [projectCode])

  const load = useCallback(async () => {
    setError(null)
    try {
      setView(await planService.getWorkflow(projectCode))
      setNotInWorkflow(false)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setNotInWorkflow(true)
      } else {
        setError(e instanceof ApiError ? e.detail : "โหลดสถานะเอกสารไม่สำเร็จ")
      }
    }
  }, [projectCode])

  useEffect(() => {
    load()
  }, [load, role])

  const run = async (task: () => Promise<WorkflowView>) => {
    setBusy(true)
    setError(null)
    try {
      const next = await task()
      setView(next)
      setWarnings(next.warnings)
      setDialog(null)
      onChanged()
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "ดำเนินการไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  // refresh: เปิดไฟล์สแกนแล้วโหลดรายการโครงการใหม่ (ป้าย "ใหม่" ในงานของฉันจะได้หาย)
  const download = async (task: () => Promise<void>, refresh = false) => {
    setError(null)
    try {
      await task()
      if (refresh) onChanged()
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "ดาวน์โหลดไม่สำเร็จ")
    }
  }

  const openDialog = async (action: DialogAction) => {
    setNotices([])
    setDialog(action)
    if (action !== "approve") return
    // อนุมัติแล้วเกินวงเงินสาขา: แสดงคำเตือนก่อนยืนยัน (โหลดไม่ได้ก็ยังอนุมัติได้ — backend ตรวจซ้ำและบันทึกไว้)
    try {
      setNotices((await budgetService.getBudgetCheck(projectCode)).warnings)
    } catch {
      setNotices([])
    }
  }

  const confirmDialog = async (input: DialogInput) => {
    if (!dialog || !view) return
    if (dialog === "upload_scan") {
      if (input.file) await run(() => planService.uploadScan(projectCode, input.file as File))
      return
    }
    const payload: { reason?: string; step_code?: string; signed_at?: string; note?: string } = {}
    if (input.reason) payload.reason = input.reason
    if (dialog === "record_signature") {
      payload.step_code = view.current_step_code ?? undefined
      payload.signed_at = input.signed_at
      payload.note = input.note
    }
    if (dialog === "undo_signature") {
      // ระบุขั้นที่ย้อน — กดซ้ำเร็ว ๆ คำขอที่สองจะถูกปฏิเสธแทนการย้อนเกิน
      payload.step_code = [...view.steps].filter((s) => s.state === "done").sort((a, b) => b.order - a.order)[0]?.code
    }
    await run(() => planService.performAction(projectCode, dialog, payload))
  }

  if (notInWorkflow) {
    return (
      <Card className="p-4 text-xs text-muted">
        โครงการนี้เป็นข้อมูลอ้างอิง ไม่อยู่ในระบบติดตามเอกสาร
      </Card>
    )
  }

  if (!view) {
    return <Card className="p-4 text-xs text-muted">{error ?? "กำลังโหลดสถานะเอกสาร..."}</Card>
  }

  const stages = buildStages(view)
  const currentStep = view.steps.find((s) => s.code === view.current_step_code)
  const showReason = (view.status === "REVISION_REQUESTED" || view.status === "REJECTED") && view.last_reason
  const canEdit = role === "teacher" && EDITABLE_BY_TEACHER.includes(view.status) && onEdit
  const canPreview = role === "officer" && view.status === "PENDING_REVIEW"

  return (
    <Card className="p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted">สถานะเอกสารโครงการ</div>
          <div className="mt-1">
            <StatusBadge status={view.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" icon="edit" onClick={onEdit}>
              แก้ไขโครงการ
            </Button>
          )}
          {canPreview && (
            <Button variant="outline" size="sm" icon="eye" onClick={() => download(() => planService.previewDocument(projectCode))}>
              ดูตัวอย่างเอกสาร
            </Button>
          )}
          {view.available_actions.map((action) =>
            action === "submit" ? (
              <Button
                key={action}
                size="sm"
                icon="send"
                disabled={busy}
                onClick={() => run(() => planService.performAction(projectCode, "submit"))}
              >
                {actionLabels.submit}
              </Button>
            ) : (
              <Button
                key={action}
                size="sm"
                variant={action === "reject" || action === "undo_scan" ? "danger" : action === "approve" ? "primary" : "outline"}
                disabled={busy}
                onClick={() => openDialog(action)}
              >
                {action === "record_signature" && currentStep ? `บันทึก: ${currentStep.label}` : actionLabels[action]}
              </Button>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{error}</div>
      )}
      {warnings.map((warning) => (
        <div key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          {warning}
        </div>
      ))}
      {showReason && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="font-bold">{view.status === "REJECTED" ? "เหตุผลที่ไม่อนุมัติ" : "เหตุผลที่ตีกลับให้แก้ไข"}</div>
          <div className="mt-1 whitespace-pre-line">{view.last_reason}</div>
        </div>
      )}

      <ol className="space-y-3">
        {stages.map((stage, index) => (
          <li key={stage.key} className="flex items-start gap-3">
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${stageStyles[stage.state].dot}`}>
              {stage.state === "done" ? <Icon name="check" size={14} /> : index + 1}
            </span>
            <div className="text-xs">
              <div className={stageStyles[stage.state].text}>{stage.label}</div>
              {stage.detail && <div className="mt-0.5 text-[11px] text-muted">{stage.detail}</div>}
            </div>
          </li>
        ))}
      </ol>

      {view.documents.length > 0 && (
        <div className="space-y-2 border-t border-line pt-4">
          <div className="text-xs font-bold text-ink">เอกสาร</div>
          {view.documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2 text-xs">
              <div>
                <div className="font-semibold">
                  {doc.kind === "SIGNED_SCAN" ? "เอกสารลงนามครบแล้ว (สแกน)" : "ไฟล์โครงการสำหรับพิมพ์"} · ฉบับที่ {doc.version}
                </div>
                <div className="text-[11px] text-muted">
                  {doc.file_name} · {formatThaiDate(doc.created_at)} · {doc.created_by}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {doc.kind === "SIGNED_SCAN" && isViewable(doc.content_type) && (
                  <Button data-testid="open-scan" variant="outline" size="sm" icon="eye" onClick={() => download(() => planService.openDocument(doc), true)}>
                    เปิดดู / พิมพ์
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  icon="download"
                  onClick={() => download(() => planService.downloadDocument(doc), doc.kind === "SIGNED_SCAN")}
                >
                  ดาวน์โหลด
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <WorkflowActionDialog
          action={dialog}
          stepLabel={dialog === "record_signature" ? currentStep?.label : undefined}
          notices={dialog === "approve" ? notices : []}
          onCancel={() => setDialog(null)}
          onConfirm={confirmDialog}
        />
      )}
    </Card>
  )
}

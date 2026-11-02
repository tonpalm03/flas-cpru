import { ReactNode, useState } from "react"
import { PlanProject } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { hasReturnedRequest, isNewSignedScan } from "../../lib/workStages"
import { isViewable, planService } from "../../services/planService"
import { Button } from "../ui/Button"
import { DeleteProjectButton } from "./DeleteProjectButton"
import { Card } from "../ui/Card"
import { StatusBadge } from "../ui/StatusBadge"

interface MyWorkProps {
  projects: PlanProject[]
  onEdit: (project: PlanProject) => void
  onSelectProject: (project: PlanProject) => void
  onChanged: () => void
}

const IN_PROGRESS = ["PENDING_REVIEW", "WAITING_FOR_SIGNATURES", "WAITING_FOR_SCAN"]

function formatDate(value?: string): string {
  if (!value) return ""
  const date = new Date(value.replace(" ", "T"))
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}

/** หน้าแรกของอาจารย์: สิ่งที่ต้องทำต่อ และเอกสารลงนามครบที่พร้อมพิมพ์ */
export function MyWork({ projects, onEdit, onSelectProject, onChanged }: MyWorkProps) {
  const [error, setError] = useState<string | null>(null)
  const live = projects.filter((p) => p.dbId !== undefined)
  const revisions = live.filter((p) => p.status === "REVISION_REQUESTED")
  const drafts = live.filter((p) => p.status === "DRAFT")
  const toPrint = live.filter((p) => p.status === "APPROVED_FOR_PRINT" && p.proposalDoc)
  const signed = live.filter((p) => p.scanDoc && ["COMPLETED_WITH_SCAN", "COMPLETED"].includes(p.status))
  const inProgress = live.filter((p) => IN_PROGRESS.includes(p.status))
  // คำขอเบิก/คำขอปิดโครงการที่เจ้าหน้าที่ตีกลับ — รออาจารย์แก้แล้วส่งใหม่ (ที่แท็บ "งบและการเบิกจ่าย")
  const returnedRequests = live.filter(hasReturnedRequest)

  const run = async (task: () => Promise<void>, refresh = false) => {
    setError(null)
    try {
      await task()
      if (refresh) onChanged()
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "เปิดไฟล์ไม่สำเร็จ")
    }
  }

  const nothingToDo = revisions.length + drafts.length + toPrint.length + signed.length + inProgress.length + returnedRequests.length === 0

  return (
    <Card className="space-y-4 p-4 lg:space-y-5 lg:p-6" data-testid="mywork">
      <div>
        <h2 className="text-base font-bold text-ink">สิ่งที่ต้องทำ</h2>
        <p className="hidden text-xs text-muted lg:block">สิ่งที่ต้องทำต่อ และเอกสารที่ลงนามครบแล้วพร้อมพิมพ์ไปใช้</p>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{error}</div>}

      {nothingToDo && <div className="py-6 text-center text-xs text-muted">ยังไม่มีโครงการ — เริ่มที่เมนู "เสนอโครงการใหม่"</div>}

      {returnedRequests.length > 0 && (
        <Section title="คำขอเบิก/ขอปิดโครงการที่ถูกตีกลับ" tone="amber" testId="mywork-returned">
          {returnedRequests.map((p) => (
            <Row key={p.id} project={p} onSelect={onSelectProject}>
              <span className="max-w-md text-xs text-rose-700">
                {(p.requestsReturned || 0) > 0 && `คำขอเบิก: ${p.requestsReturnReason ?? "ถูกตีกลับ"}`}
                {(p.requestsReturned || 0) > 0 && p.closureRequestStatus === "RETURNED" && " · "}
                {p.closureRequestStatus === "RETURNED" && `ขอปิดโครงการ: ${p.closureReturnReason ?? "ถูกตีกลับ"}`}
              </span>
              <Button size="sm" variant="outline" icon="edit" onClick={() => onSelectProject(p)}>
                เปิดเพื่อแก้แล้วส่งใหม่
              </Button>
            </Row>
          ))}
        </Section>
      )}

      {signed.length > 0 && (
        <Section title="เอกสารลงนามครบแล้ว พร้อมพิมพ์" tone="emerald" testId="mywork-signed">
          {signed.map((p) => (
            <Row key={p.id} project={p} onSelect={onSelectProject}>
              <div className="flex flex-wrap items-center gap-2">
                {isNewSignedScan(p) && (
                  <span data-testid="new-badge" className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-brand">
                    ใหม่
                  </span>
                )}
                <span className="text-[11px] text-muted">
                  อนุมัติแล้ว งบพร้อมใช้ <strong className="font-mono text-emerald-700">฿{p.amount.toLocaleString("th-TH")}</strong> · อัปโหลดเมื่อ{" "}
                  {formatDate(p.scanDoc?.uploaded_at)}
                </span>
                {isViewable(p.scanDoc?.content_type) && (
                  <Button data-testid="open-signed" size="sm" icon="eye" onClick={() => run(() => planService.openDocument(p.scanDoc!), true)}>
                    เปิดดู / พิมพ์
                  </Button>
                )}
                <Button
                  data-testid="download-signed"
                  variant="outline"
                  size="sm"
                  icon="download"
                  onClick={() => run(() => planService.downloadDocument(p.scanDoc!), true)}
                >
                  ดาวน์โหลด
                </Button>
              </div>
            </Row>
          ))}
        </Section>
      )}

      {revisions.length > 0 && (
        <Section title="ถูกตีกลับให้แก้ไข" tone="amber" testId="mywork-revision">
          {revisions.map((p) => (
            <Row key={p.id} project={p} onSelect={onSelectProject}>
              {p.lastReason && <div className="max-w-md text-[11px] text-amber-900">เหตุผล: {p.lastReason}</div>}
              <Button size="sm" icon="edit" onClick={() => onEdit(p)}>
                แก้ไขและส่งใหม่
              </Button>
            </Row>
          ))}
        </Section>
      )}

      {toPrint.length > 0 && (
        <Section title="อนุมัติแล้ว — พิมพ์และลงนาม แล้วส่งเอกสารให้เจ้าหน้าที่แผน" tone="sky" testId="mywork-print">
          {toPrint.map((p) => (
            <Row key={p.id} project={p} onSelect={onSelectProject}>
              <Button
                data-testid="download-print"
                size="sm"
                icon="download"
                onClick={() => run(() => planService.downloadDocument(p.proposalDoc!))}
              >
                ดาวน์โหลดไฟล์สำหรับพิมพ์
              </Button>
            </Row>
          ))}
        </Section>
      )}

      {drafts.length > 0 && (
        <Section title="แบบร่าง" tone="slate" testId="mywork-draft">
          {drafts.map((p) => (
            <Row key={p.id} project={p} onSelect={onSelectProject}>
              <DeleteProjectButton project={p} role="teacher" onDeleted={onChanged} />
              <Button variant="outline" size="sm" icon="edit" onClick={() => onEdit(p)}>
                แก้ไขต่อ
              </Button>
            </Row>
          ))}
        </Section>
      )}

      {inProgress.length > 0 && (
        <Section title="อยู่ระหว่างดำเนินการ" tone="slate" testId="mywork-progress">
          {inProgress.map((p) => (
            <Row key={p.id} project={p} onSelect={onSelectProject}>
              <span className="text-[11px] text-muted">
                {p.status === "WAITING_FOR_SIGNATURES" && p.currentStepLabel ? `รอ: ${p.currentStepLabel}` : ""}
                {p.status === "WAITING_FOR_SCAN" ? "เซ็นครบแล้ว รอเจ้าหน้าที่อัปโหลดสแกน" : ""}
              </span>
            </Row>
          ))}
        </Section>
      )}
    </Card>
  )
}

const tones = {
  emerald: "border-emerald-200 bg-emerald-50/50",
  amber: "border-amber-200 bg-amber-50/50",
  sky: "border-sky-200 bg-sky-50/50",
  slate: "border-line bg-surface",
}

function Section({ title, tone, testId, children }: { title: string; tone: keyof typeof tones; testId: string; children: ReactNode }) {
  return (
    <div data-testid={testId} className={`space-y-1 rounded-xl border p-3 lg:space-y-2 lg:p-4 ${tones[tone]}`}>
      <div className="text-xs font-bold text-ink">{title}</div>
      <div className="divide-y divide-black/5">{children}</div>
    </div>
  )
}

function Row({ project, onSelect, children }: { project: PlanProject; onSelect: (p: PlanProject) => void; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 lg:gap-3 lg:py-2">
      <button onClick={() => onSelect(project)} className="min-w-0 text-left max-lg:w-full">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">{project.id}</span>
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-0.5 text-sm font-semibold leading-snug text-ink hover:underline">{project.name}</div>
      </button>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

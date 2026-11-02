import { PlanProject } from "../../types/plan"
import { STAGES, WorkStage, projectsInStage } from "../../lib/workStages"
import { Icon, IconName } from "../ui/Icons"

interface StageCardsProps {
  projects: PlanProject[]
  onOpenStage: (stage: WorkStage) => void
  /** คำอธิบายแทนของเดิมใน STAGES (เช่น มุมของอาจารย์) */
  hints?: Partial<Record<WorkStage, string>>
  /** การ์ดที่กำลังเลือก (ใช้เป็นตัวกรอง) */
  active?: WorkStage | null
}

const icons: Partial<Record<WorkStage, IconName>> = {
  review: "check",
  signing: "edit",
  scan: "upload",
  money: "wallet",
}

/** การ์ดจำนวนโครงการแยกตามขั้นงาน (หน้าภาพรวมของอาจารย์ — กดแล้วกรองรายการโครงการ) */
export function StageCards({ projects, onOpenStage, hints = {}, active = null }: StageCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
      {STAGES.filter((stage) => stage.id !== "closed").map((stage, index) => {
        const count = projectsInStage(projects, stage.id).length
        const selected = active === stage.id
        return (
          <button
            key={stage.id}
            type="button"
            data-testid={`stage-card-${stage.id}`}
            aria-pressed={selected}
            onClick={() => onOpenStage(stage.id)}
            className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.98] lg:p-4 lg:hover:-translate-y-0.5 lg:hover:shadow-md ${
              selected ? "border-brand bg-brand-soft ring-2 ring-brand/30" : count > 0 ? "border-brand/20 bg-white" : "border-line bg-white/60"
            }`}
          >
            {/* มือถือ: ชื่อขั้น + จำนวนในแถวเดียว (คำอธิบายแสดงเฉพาะจอใหญ่) */}
            <div className="flex items-center justify-between gap-2 lg:block">
              <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-brand-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Icon name={icons[stage.id] ?? "folder"} size={14} />
                </span>
                <span className="leading-tight">
                  {index + 1}. {stage.label}
                </span>
              </span>
              <div className={`shrink-0 font-mono text-2xl font-black lg:mt-2 lg:text-3xl ${count > 0 ? "text-brand" : "text-slate-300"}`}>{count}</div>
            </div>
            <div className="mt-1 hidden text-[11px] text-muted lg:block">{hints[stage.id] ?? stage.hint}</div>
          </button>
        )
      })}
    </div>
  )
}

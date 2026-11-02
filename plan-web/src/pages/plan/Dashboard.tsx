import { useMemo, useState } from "react"
import { Role, PlanProject, PlanPage } from "../../types/plan"
import { formatMoney, statusLabels } from "../../lib/formatters"
import { pageAllowed } from "../../lib/pageAccess"
import { STAGES, TEACHER_STAGE_HINTS, WorkStage, officerAttention, projectsInStage } from "../../lib/workStages"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { MyWork } from "../../components/plan/MyWork"
import { StageCards } from "../../components/plan/StageCards"
import { useIsPhone } from "../../lib/useIsPhone"
import { usePhoneBar } from "../../lib/phoneBar"

interface DashboardProps {
  role: Role
  projects: PlanProject[]
  onNavigate: (page: PlanPage) => void
  onSelectProject: (project: PlanProject) => void
  onEditProject: (project: PlanProject) => void
  onChanged: () => void
}

const NOT_PROPOSED = ["DRAFT", "REJECTED"]

/** หน้าแรก: อาจารย์เห็นการ์ดขั้นงานของโครงการตัวเองและงานของฉัน; เจ้าหน้าที่/ผู้บริหารเห็นตัวเลขงบของปีงบและรายการโครงการ (งานค้างแยกขั้นงานอยู่ในหน้างานของเจ้าหน้าที่) */
export function Dashboard({ role, projects, onNavigate, onSelectProject, onEditProject, onChanged }: DashboardProps) {
  const isTeacher = role === "teacher"
  const fiscalYear = projects.reduce((year, p) => Math.max(year, p.fiscalYear || 0), 0) || 2570
  const yearProjects = projects.filter((p) => (p.fiscalYear || fiscalYear) === fiscalYear)
  // อาจารย์: กดการ์ดขั้นงาน = กรองรายการ "โครงการของฉัน" (กดซ้ำ = แสดงทั้งหมด)
  const [stageFilter, setStageFilter] = useState<WorkStage | null>(null)
  const tableProjects = stageFilter ? projectsInStage(yearProjects, stageFilter) : yearProjects
  const stageLabel = STAGES.find((s) => s.id === stageFilter)?.label
  // มือถือ: ชื่อหน้าอยู่บนแถบด้านบน ส่วนปุ่มเสนอโครงการ/งานของเจ้าหน้าที่อยู่ในแถบเมนูล่างแล้ว
  const isPhone = useIsPhone()
  usePhoneBar(isPhone ? { title: isTeacher ? "งานของฉัน" : "ภาพรวม", subtitle: `ปีงบประมาณ ${fiscalYear} · คณะศิลปศาสตร์และวิทยาศาสตร์` } : null)

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="hidden flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:flex">
        <div>
          <div className="text-xs font-semibold text-brand-2">คณะศิลปศาสตร์และวิทยาศาสตร์ · ปีงบประมาณ {fiscalYear}</div>
          <h1 className="mt-0.5 text-2xl font-bold text-ink">{isTeacher ? "งานและโครงการของฉัน" : "ภาพรวมโครงการและงบประมาณ"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === "officer" && (
            <Button variant="outline" icon="check" onClick={() => onNavigate("approvals")}>
              งานของเจ้าหน้าที่ ({officerAttention(projects)})
            </Button>
          )}
          {pageAllowed(role, "proposal") && (
            <Button variant="accent" icon="plus" onClick={() => onNavigate("proposal")}>
              เสนอโครงการใหม่
            </Button>
          )}
        </div>
      </div>

      {isTeacher ? (
        <>
          <StageCards
            projects={yearProjects}
            hints={TEACHER_STAGE_HINTS}
            active={stageFilter}
            onOpenStage={(stage) => setStageFilter((current) => (current === stage ? null : stage))}
          />
          <MyWork projects={projects} onEdit={onEditProject} onSelectProject={onSelectProject} onChanged={onChanged} />
        </>
      ) : (
        <BudgetFigures projects={yearProjects} />
      )}

      <ProjectTable
        title={isTeacher ? (stageLabel ? `โครงการของฉัน · ${stageLabel}` : "โครงการของฉัน") : `โครงการปีงบประมาณ ${fiscalYear}`}
        projects={isTeacher ? tableProjects : yearProjects}
        onSelectProject={onSelectProject}
        onClearFilter={isTeacher && stageFilter ? () => setStageFilter(null) : undefined}
      />
    </div>
  )
}

function BudgetFigures({ projects }: { projects: PlanProject[] }) {
  const proposed = projects.filter((p) => !NOT_PROPOSED.includes(p.status))
  const requested = proposed.reduce((sum, p) => sum + p.amount, 0)
  const locked = projects.reduce((sum, p) => sum + (p.budgetLocked || 0), 0)
  const spent = projects.reduce((sum, p) => sum + p.spent, 0)
  const figures = [
    { label: "โครงการที่เสนอแล้ว", value: `${proposed.length}`, note: `จากทั้งหมด ${projects.length} โครงการ (รวมแบบร่าง)`, testId: "kpi-proposed" },
    { label: "วงเงินที่เสนอ", value: `฿${formatMoney(requested)}`, note: "ไม่รวมแบบร่างและไม่อนุมัติ", testId: "kpi-requested" },
    { label: "งบที่ล็อกแล้ว", value: `฿${formatMoney(locked)}`, note: "อัปโหลดเอกสารลงนามครบแล้ว", testId: "kpi-locked" },
    {
      label: "เบิกจ่ายแล้ว",
      value: `฿${formatMoney(spent)}`,
      note: locked > 0 ? `${((spent / locked) * 100).toFixed(1)}% ของงบที่ล็อก` : "ยังไม่มีการเบิกจ่าย",
      testId: "kpi-spent",
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {figures.map((figure) => (
        <Card key={figure.label} className="p-3.5 lg:p-4">
          <div className="text-xs font-semibold text-muted">{figure.label}</div>
          <div data-testid={figure.testId} className="mt-1 truncate font-mono text-lg font-bold text-brand sm:text-2xl">
            {figure.value}
          </div>
          <div className="mt-0.5 hidden text-[11px] text-muted lg:block">{figure.note}</div>
        </Card>
      ))}
    </div>
  )
}

function ProjectTable({
  title,
  projects,
  onSelectProject,
  onClearFilter,
}: {
  title: string
  projects: PlanProject[]
  onSelectProject: (p: PlanProject) => void
  onClearFilter?: () => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const statuses = useMemo(() => [...new Set(projects.map((p) => p.status))], [projects])
  const visible = projects.filter((p) => {
    const q = query.trim().toLowerCase()
    return (!status || p.status === status) && (!q || [p.id, p.name, p.owner, p.unit].some((v) => (v || "").toLowerCase().includes(q)))
  })

  return (
    <Card className="space-y-3 p-4 lg:space-y-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-ink">
          {title} <span className="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">{visible.length}</span>
          {onClearFilter && (
            <button type="button" onClick={onClearFilter} className="ml-2 text-xs font-semibold text-brand-2 hover:underline">
              แสดงทั้งหมด
            </button>
          )}
        </h2>
        <div className="flex gap-2">
          <input
            data-testid="dashboard-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาในรายการ"
            className="min-w-0 flex-1 rounded-xl border border-line-strong px-3 py-2 text-sm sm:w-56 sm:flex-none"
          />
          <select
            aria-label="กรองตามสถานะ"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-32 shrink-0 rounded-xl border border-line-strong bg-white px-3 py-2 text-sm sm:w-auto"
          >
            <option value="">ทุกสถานะ</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">ยังไม่มีโครงการ</div>
      ) : (
        <>
          {/* จอใหญ่: ตาราง */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">โครงการ</th>
                  <th className="px-3 py-2 font-semibold">สถานะ</th>
                  <th className="px-3 py-2 text-right font-semibold">วงเงิน</th>
                  <th className="px-3 py-2 text-right font-semibold">เบิกแล้ว</th>
                  <th className="px-3 py-2 text-right font-semibold">คงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((p) => (
                  <tr key={p.id} data-testid="dashboard-row" onClick={() => onSelectProject(p)} className="cursor-pointer hover:bg-surface">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-ink">{p.name}</div>
                      <div className="text-xs text-muted">
                        <span className="font-mono">{p.id}</span> · {p.owner} · {p.unit}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{formatMoney(p.amount)}</td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-700">{formatMoney(p.spent)}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-brand">{formatMoney(p.amount - p.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* จอเล็ก: การ์ด */}
          <div className="-mx-1 space-y-2 md:hidden">
            {visible.map((p) => (
              <button
                key={p.id}
                data-testid="dashboard-card"
                onClick={() => onSelectProject(p)}
                className="w-full rounded-xl border border-line p-3.5 text-left active:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] text-muted">{p.id}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-1 text-sm font-semibold leading-snug text-ink">{p.name}</div>
                <div className="mt-1.5 flex justify-between gap-2 text-xs text-muted">
                  <span className="truncate">{p.unit}</span>
                  <span className="shrink-0 font-mono">
                    ฿{formatMoney(p.amount)} · เบิก ฿{formatMoney(p.spent)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

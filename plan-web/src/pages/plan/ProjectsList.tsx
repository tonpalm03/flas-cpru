import { useMemo, useState } from "react"
import { PlanProject, PlanPage, ProjectStatus, Role } from "../../types/plan"
import { formatMoney, statusLabels } from "../../lib/formatters"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { PageHeader } from "../../components/ui/PageHeader"
import { useIsPhone } from "../../lib/useIsPhone"
import { Icon } from "../../components/ui/Icons"

interface ProjectsListProps {
  projects: PlanProject[]
  role: Role
  onNavigate: (page: PlanPage) => void
  onSelectProject: (project: PlanProject) => void
}

export function ProjectsList({
  projects,
  role,
  onNavigate,
  onSelectProject,
}: ProjectsListProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [filterUnit, setFilterUnit] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  // สาขาวิชาและปีงบจากโครงการจริง (ไม่ใช้รายชื่อตายตัว)
  const units = useMemo(() => [...new Set(projects.map((p) => p.unit).filter(Boolean))].sort(), [projects])
  const years = useMemo(() => [...new Set(projects.map((p) => p.fiscalYear).filter(Boolean))].sort(), [projects])

  const filtered = projects.filter((p) => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false
    if (filterUnit !== "ALL" && p.unit !== filterUnit) return false
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.id.toLowerCase().includes(search.toLowerCase()) &&
      !p.owner.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }
    return true
  })

  // มือถือ: ปุ่มเสนอโครงการอยู่ในแถบเมนูล่างแล้ว
  const isPhone = useIsPhone()

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        eyebrow="โครงการ"
        title={role === "teacher" ? "โครงการของฉัน" : "โครงการทั้งหมด"}
        description={`${projects.length} โครงการ${years.length ? ` · ปีงบประมาณ ${years.join(", ")}` : ""} — เลือกโครงการเพื่อดูรายละเอียด สถานะเอกสาร และการเบิกจ่าย`}
        actions={
          isPhone ? undefined : (
            <Button variant="accent" size="md" icon="plus" onClick={() => onNavigate("proposal")}>
              เสนอโครงการใหม่
            </Button>
          )
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Icon
                name="search"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อโครงการ รหัส หรืออาจารย์"
                className="w-full rounded-xl border border-line-strong py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-line-strong bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">ทุกสถานะ</option>
              {(Object.keys(statusLabels) as ProjectStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>

            {units.length > 1 && (
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="rounded-xl border border-line-strong bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="ALL">ทุกสาขาวิชา</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-muted">
            แสดงผล {filtered.length} จาก {projects.length} รายการ
          </div>
        </div>
      </Card>

      {filtered.length === 0 && (
        <Card className="py-14 text-center text-sm text-muted">
          {projects.length === 0 ? "ยังไม่มีโครงการ — กด “เสนอโครงการใหม่” เพื่อเริ่ม" : "ไม่พบโครงการตามคำค้นหรือตัวกรองที่เลือก"}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const used = p.spent + p.advance
          const percent = p.amount > 0 ? Math.round((used / p.amount) * 100) : 0
          return (
            <Card
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProject(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelectProject(p)
                }
              }}
              data-testid="project-card"
              className="cursor-pointer p-4 transition-all active:bg-surface lg:p-5 lg:hover:border-brand/30 lg:hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-muted">
                  {p.id}
                </span>
                <StatusBadge status={p.status} />
              </div>

              <h3 className="mt-2 text-base font-bold text-ink line-clamp-1">
                {p.name}
              </h3>
              <p className="mt-1 text-xs text-muted line-clamp-2">
                {p.objective}
              </p>

              <div className="mt-4 pt-3 border-t border-line space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>ผู้รับผิดชอบ</span>
                  <span className="font-medium text-ink">{p.owner}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>สาขาวิชา</span>
                  <span className="font-medium text-ink">{p.unit}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-surface">
                  <span className="font-bold text-ink">วงเงินโครงการ</span>
                  <span className="font-mono font-bold text-brand text-sm">
                    ฿{formatMoney(p.amount)}
                  </span>
                </div>

                {/* Mini Budget Usage Bar */}
                {["COMPLETED_WITH_SCAN", "COMPLETED"].includes(p.status) && (
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-muted">
                      <span>เบิกแล้ว {percent}%</span>
                      <span>เหลือ ฿{formatMoney(p.amount - used)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-brand-soft overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

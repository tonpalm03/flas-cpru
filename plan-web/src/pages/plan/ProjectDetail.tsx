import { useCallback, useEffect, useState } from "react"
import { PlanProject, PlanPage, Role } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { ProjectLedgerData, budgetService } from "../../services/budgetService"
import { planService } from "../../services/planService"
import { useFiscalYearConfig } from "../../hooks/useFiscalYearConfig"
import { ProjectLedger } from "../../components/plan/ProjectLedger"
import { ProjectFacts, ProjectItems, ProjectStrategy, projectYear } from "../../components/plan/ProjectSummary"
import { formatMoney, formatBahtText } from "../../lib/formatters"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { PageHeader } from "../../components/ui/PageHeader"
import { Tabs } from "../../components/ui/Tabs"
import { WorkflowPanel } from "../../components/plan/WorkflowPanel"
import { DeleteProjectButton } from "../../components/plan/DeleteProjectButton"

interface ProjectDetailProps {
  project: PlanProject
  role: Role
  onNavigate: (page: PlanPage) => void
  onInitiateClosure: (project: PlanProject) => void
  onChanged: () => void
  onEdit: (project: PlanProject) => void
  onDeleted: () => void
}

type DetailTab = "overview" | "items" | "strategy" | "ledger"

export function ProjectDetail({ project, role, onNavigate, onInitiateClosure, onChanged, onEdit, onDeleted }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview")
  const [ledger, setLedger] = useState<ProjectLedgerData | null>(null)
  const [ledgerError, setLedgerError] = useState<string | null>(null)
  const { config } = useFiscalYearConfig(projectYear(project))

  const loadLedger = useCallback(async () => {
    setLedgerError(null)
    try {
      setLedger(await budgetService.getProjectLedger(project.id))
    } catch (e) {
      setLedgerError(e instanceof ApiError ? e.detail : "โหลดงบของโครงการไม่สำเร็จ")
    }
  }, [project.id])

  useEffect(() => {
    loadLedger()
  }, [loadLedger, project.status])

  const spent = ledger?.totals.spent ?? project.spent
  const remaining = project.amount - spent
  const percent = project.amount > 0 ? (spent / project.amount) * 100 : 0
  const disbursementCount = ledger?.disbursements.filter((d) => !d.voided_at).length ?? 0
  // ไฟล์ Word ตามแบบฟอร์มของปีงบ (ข้อมูลล่าสุด) — backend ให้เฉพาะอาจารย์เจ้าของและเจ้าหน้าที่แผน
  const canPreviewWord = role === "teacher" || role === "officer"

  const handlePreviewWord = async () => {
    try {
      await planService.previewDocument(project.id)
    } catch (e) {
      alert(e instanceof ApiError ? `สร้างไฟล์ Word ไม่สำเร็จ: ${e.detail}` : "สร้างไฟล์ Word ไม่สำเร็จ")
    }
  }

  const handleLedgerChange = (next: ProjectLedgerData) => {
    setLedger(next)
    onChanged()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        eyebrow={`รหัส ${project.id} · ปีงบประมาณ ${projectYear(project)}`}
        title={project.name}
        phoneBarTitle="รายละเอียดโครงการ"
        description={[project.owner, `สาขาวิชา${project.unit}`, project.quarter || project.date].filter(Boolean).join(" · ")}
        onBack={() => onNavigate(role === "teacher" ? "projects" : "dashboard")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DeleteProjectButton project={project} role={role} onDeleted={onDeleted} />
            {canPreviewWord && (
              <Button variant="outline" size="sm" icon="download" onClick={handlePreviewWord}>
                ไฟล์ Word ตามแบบฟอร์ม
              </Button>
            )}
            {role === "officer" && project.status === "COMPLETED_WITH_SCAN" && (
              <Button data-testid="start-closure" variant="outline" size="sm" icon="return" onClick={() => onInitiateClosure(project)}>
                ปิดโครงการ / คืนงบคงเหลือ
              </Button>
            )}
          </div>
        }
      />

      {/* ขั้นเอกสาร: ร่าง → ตรวจ → พิมพ์เซ็น → เดินเซ็น → สแกน (ปุ่มตามบทบาท) */}
      <WorkflowPanel projectCode={project.id} role={role} onChanged={onChanged} onEdit={() => onEdit(project)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-muted">งบประมาณโครงการ</div>
          <div className="mt-1 font-mono text-xl font-bold text-brand sm:text-2xl">฿{formatMoney(project.amount)}</div>
          <div className="mt-0.5 text-[11px] text-muted">({formatBahtText(project.amount)})</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-muted">เบิกจ่ายแล้ว</div>
          <div className="mt-1 font-mono text-xl font-bold text-ink sm:text-2xl">฿{formatMoney(spent)}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(percent, 100)}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-muted">{percent.toFixed(1)}% ของงบโครงการ</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-muted">คงเหลือ</div>
          <div className="mt-1 font-mono text-xl font-bold text-ink sm:text-2xl">฿{formatMoney(remaining)}</div>
          <div className="mt-0.5 text-[11px] text-muted">{disbursementCount > 0 ? `เบิกแล้ว ${disbursementCount} รายการ` : "ยังไม่มีรายการเบิก"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-muted">สถานะ</div>
          <div className="mt-2">
            <StatusBadge status={project.status} />
          </div>
          {project.currentStepLabel && <div className="mt-1.5 text-[11px] text-muted">รอ: {project.currentStepLabel}</div>}
        </Card>
      </div>

      <div className="space-y-4">
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "overview", label: "รายละเอียด" },
            { id: "items", label: "ค่าใช้จ่าย (ข้อ 9)", badge: project.formData?.multiplierItems?.length || undefined },
            { id: "strategy", label: "ยุทธศาสตร์และกิจกรรม" },
            { id: "ledger", label: "งบและการเบิกจ่าย", badge: disbursementCount || undefined, testId: "ledger-tab" },
          ]}
        />
        {activeTab !== "ledger" && (
          <Card className="p-4 sm:p-6">
            {activeTab === "overview" && <ProjectFacts project={project} config={config} />}
            {activeTab === "items" && <ProjectItems project={project} config={config} />}
            {activeTab === "strategy" && <ProjectStrategy project={project} config={config} />}
          </Card>
        )}
        {/* ProjectLedger มีการ์ดของตัวเอง */}
        {activeTab === "ledger" && (
          <ProjectLedger projectCode={project.id} ledger={ledger} error={ledgerError} onChange={handleLedgerChange} />
        )}
      </div>
    </div>
  )
}

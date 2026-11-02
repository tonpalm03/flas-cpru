import { useEffect, useMemo, useState } from "react"
import { PlanProject, Role, PlanPage } from "../../types/plan"
import { ALL_STAGE, STAGES, WorkStage, projectsInStage, waitingText } from "../../lib/workStages"
import { ScanDropZone } from "../../components/plan/ScanDropZone"
import { LoadedProjectLedger } from "../../components/plan/ProjectLedger"
import { useFiscalYearConfig } from "../../hooks/useFiscalYearConfig"
import { formatMoney } from "../../lib/formatters"
import { exportMultiplierToExcel } from "../../lib/excelExporter"
import { ApiError } from "../../lib/api"
import { planService } from "../../services/planService"
import { OfficerEditModal } from "../../components/plan/OfficerEditModal"
import { WorkflowPanel } from "../../components/plan/WorkflowPanel"
import { ProjectFacts, ProjectItems, ProjectStrategy, projectYear } from "../../components/plan/ProjectSummary"
import { Tabs } from "../../components/ui/Tabs"
import { DeleteProjectButton } from "../../components/plan/DeleteProjectButton"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { PageHeader } from "../../components/ui/PageHeader"
import { Icon } from "../../components/ui/Icons"
import { useIsPhone } from "../../lib/useIsPhone"
import { useBackLayer } from "../../lib/backLayers"
import { usePhoneBar } from "../../lib/phoneBar"

interface ApprovalsPageProps {
  role: Role
  projects: PlanProject[]
  stage: WorkStage
  onStageChange: (stage: WorkStage) => void
  onNavigate: (page: PlanPage) => void
  onProjectUpdated: () => void
  onInitiateClosure: (project: PlanProject) => void
}

const TABS = [...STAGES, ALL_STAGE]

const REVIEW_CHECKS = [
  "ข้อมูลครบตามแบบฟอร์ม 14 ข้อ",
  "การคำนวณค่าใช้จ่ายและอัตราเป็นไปตามระเบียบการเงิน",
  "กิจกรรมสอดคล้องกับยุทธศาสตร์และตัวชี้วัดของมหาวิทยาลัยและคณะ",
]

/** หน้างานของเจ้าหน้าที่แผน แยกแท็บตามขั้นงาน (บทบาทอื่นเห็นแบบดูอย่างเดียว) */
export function ApprovalsPage({
  role,
  projects,
  stage,
  onStageChange,
  onNavigate,
  onProjectUpdated,
  onInitiateClosure,
}: ApprovalsPageProps) {
  const isOfficer = role === "officer"
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState("")
  const [detailTab, setDetailTab] = useState<"overview" | "items" | "strategy">("overview")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // ปุ่มที่กดได้ในแต่ละหมวดมาจาก WorkflowPanel / ช่องอัปโหลดสแกน / ทะเบียนเบิกจ่าย ตามบทบาท
  const stageProjects = projectsInStage(projects, stage)
  const departments = useMemo(() => [...new Set(stageProjects.map((p) => p.unit))].sort(), [stageProjects])
  const displayedList = stageProjects.filter((p) => {
    const q = query.trim().toLowerCase()
    return (
      (!department || p.unit === department) &&
      (!q || [p.id, p.name, p.owner, p.unit].some((value) => value.toLowerCase().includes(q)))
    )
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  // มือถือ: รายการเต็มจอ แตะแล้วเปิดรายละเอียดเต็มจอ (ปุ่มย้อนกลับ = กลับไปที่รายการ)
  const isPhone = useIsPhone()
  const [phoneOpen, setPhoneOpen] = useState(false)
  useBackLayer(isPhone && phoneOpen, () => setPhoneOpen(false))
  // เปลี่ยนหมวด → เริ่มที่โครงการแรกของหมวด
  useEffect(() => {
    setSelectedId(null)
    setDepartment("")
  }, [stage])
  const actionFirst = stage === "signing" || stage === "scan"

  const chosen = displayedList.find((p) => p.id === selectedId)
  const activeProject = isPhone ? (phoneOpen ? chosen : undefined) : chosen || displayedList[0]
  // มือถือ: ส่งต่อแล้วโครงการย้ายไปขั้นอื่น → บอกว่าเสร็จแล้ว แทนการกระโดดไปโครงการอื่น
  const phoneDone = isPhone && phoneOpen && !chosen
  const stageLabel = TABS.find((t) => t.id === stage)?.label
  usePhoneBar(isPhone && phoneOpen ? { title: chosen?.id ?? "รายละเอียดงาน", subtitle: stageLabel, back: true } : null)
  const listHidden = isPhone && phoneOpen
  const detailHidden = isPhone && !phoneOpen
  const { config: yearConfig } = useFiscalYearConfig(activeProject ? projectYear(activeProject) : 2570)

  // ไฟล์ Word จากแบบฟอร์มจริงของปีงบ — ไฟล์เดียวกับที่ระบบจะสร้างตอนอนุมัติ
  const handleExportWord = async () => {
    if (!activeProject) return
    try {
      await planService.previewDocument(activeProject.id)
    } catch (e) {
      alert(e instanceof ApiError ? `ส่งออก Word ไม่สำเร็จ: ${e.detail}` : "ส่งออก Word ไม่สำเร็จ")
    }
  }

  const handleExportExcel = () => {
    if (!activeProject) return
    const multiplierItems = activeProject.formData?.multiplierItems || []
    exportMultiplierToExcel({
      projectName: activeProject.name,
      fiscalYear: projectYear(activeProject),
      facultyOrUnit: activeProject.formData?.facultyName || activeProject.unit,
      multiplierItems,
      activities: activeProject.formData?.activityDefinitions,
      expenseCategories: yearConfig?.expense_categories,
      budgetSources: yearConfig?.budget_sources,
    })
  }

  const roleStageLabels: Record<Role, string> = {
    teacher: "อาจารย์ (ดูสถานะ)",
    head: "ประธานสาขา (ดูสถานะ)",
    officer: "เจ้าหน้าที่แผนตรวจสอบและติดตามการลงนาม",
    plan_head: "หัวหน้างานแผน (ดูสถานะ — ลงนามบนเอกสารกระดาษ)",
    dean: "คณบดี (ดูสถานะ — ลงนามบนเอกสารกระดาษ)",
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        eyebrow="งานตามขั้นตอน"
        title={isOfficer ? "งานของเจ้าหน้าที่แผน" : "ติดตามโครงการ"}
        description={`${TABS.find((t) => t.id === stage)?.hint ?? ""} · ${roleStageLabels[role]}`}
        onBack={() => onNavigate("dashboard")}
      />

      {/* แท็บขั้นงาน พร้อมจำนวนงานในแต่ละหมวด */}
      <div className={`space-y-3 rounded-2xl border border-line bg-white p-3 lg:p-4 ${listHidden ? "hidden" : ""}`}>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          {TABS.map((tab, index) => {
            const count = projectsInStage(projects, tab.id).length
            const active = tab.id === stage
            return (
              <button
                key={tab.id}
                data-testid={`stage-tab-${tab.id}`}
                aria-pressed={active}
                onClick={() => onStageChange(tab.id)}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  active ? "bg-brand text-white shadow-xs" : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                {tab.id !== "all" && tab.id !== "closed" && <span className={active ? "text-accent" : "text-muted"}>{index + 1}</span>}
                <span>{tab.label}</span>
                <span
                  data-testid={`stage-count-${tab.id}`}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/20" : count > 0 && tab.id !== "all" && tab.id !== "closed" ? "bg-accent text-brand" : "bg-white text-muted"}`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 lg:flex-wrap">
          <input
            data-testid="queue-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อโครงการ รหัส หรือผู้รับผิดชอบ"
            className="min-w-0 flex-1 rounded-xl border border-line-strong px-3 py-2 text-xs lg:basis-60"
          />
          <select
            data-testid="queue-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-32 shrink-0 rounded-xl border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-brand lg:w-auto"
          >
            <option value="">ทุกสาขา</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:min-h-[580px] lg:grid-cols-12 lg:gap-6">
        {/* รายการโครงการในขั้นงาน */}
        <Card className={`min-w-0 p-3 lg:p-4 flex flex-col ${stage === "money" ? "lg:col-span-4" : "lg:col-span-5"} ${listHidden ? "hidden" : ""}`}>
          <div className="flex items-center justify-between px-1 pb-3 border-b border-line lg:px-0">
            <span className="text-xs font-bold text-ink">
              รายการโครงการ ({displayedList.length})
            </span>
            <span className="text-[11px] text-muted">{isPhone ? "แตะเพื่อเปิด" : "เลือกเพื่อดูรายละเอียด"}</span>
          </div>

          <div className="mt-2 flex-1 divide-y divide-line lg:mt-3 lg:max-h-[650px] lg:overflow-y-auto">
            {displayedList.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted">
                <Icon name="check" size={36} className="mx-auto mb-2 text-leaf" />
                {stageProjects.length === 0 ? "ไม่มีงานค้างในหมวดนี้" : "ไม่พบโครงการตามคำค้น/สาขาที่เลือก"}
              </div>
            ) : (
              displayedList.map((p) => {
                const isSelected = p.id === (activeProject?.id || selectedId)
                return (
                  <div
                    key={p.id}
                    data-testid="queue-row"
                    onClick={(event) => {
                      setSelectedId(p.id)
                      // มือถือ: เปิดรายละเอียดเต็มจอ (ยกเว้นแตะในช่องอัปโหลดสแกน/ปุ่มในแถว)
                      const target = event.target as HTMLElement
                      if (isPhone && !target.closest("button, input, label, [data-testid=scan-dropzone]")) {
                        setPhoneOpen(true)
                        window.scrollTo(0, 0)
                      }
                    }}
                    className={`cursor-pointer p-3.5 rounded-xl transition-all ${
                      isSelected
                        ? "bg-brand-soft border border-brand/20 shadow-xs"
                        : "hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-muted">
                        {p.id}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-1 font-bold text-sm text-ink line-clamp-1">
                      {p.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted">
                      <span>{p.owner} · {p.unit}</span>
                      <span className="font-mono font-bold text-brand">
                        ฿{formatMoney(p.amount)}
                      </span>
                    </div>
                    <QueueRowDetail project={p} stage={stage} canUpload={isOfficer} onUploaded={onProjectUpdated} />
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* รายละเอียด + ปุ่มตามบทบาท */}
        <Card id="queue-detail" className={`min-w-0 p-4 lg:p-6 flex flex-col justify-between ${stage === "money" ? "lg:col-span-8" : "lg:col-span-7"} ${detailHidden ? "hidden" : ""}`}>
          {phoneDone ? (
            <div data-testid="queue-detail-done" className="space-y-3 py-10 text-center">
              <Icon name="check" size={40} className="mx-auto text-leaf" />
              <div className="text-base font-bold text-ink">ดำเนินการแล้ว</div>
              <p className="text-sm text-muted">โครงการนี้ไม่อยู่ในหมวด "{stageLabel}" แล้ว</p>
              <Button variant="outline" icon="back" onClick={() => history.back()}>
                กลับไปที่รายการ
              </Button>
            </div>
          ) : activeProject && stage === "money" ? (
            <MoneyDetail
              project={activeProject}
              canClose={isOfficer && activeProject.status === "COMPLETED_WITH_SCAN"}
              onClose={() => onInitiateClosure(activeProject)}
              onChanged={onProjectUpdated}
            />
          ) : activeProject ? (
            <div className="space-y-5">
              {/* มือถือ: ป้ายสถานะอยู่เหนือชื่อ ให้ชื่อโครงการกว้างเต็มบรรทัด */}
              <div className="flex flex-col-reverse items-start gap-2 border-b border-line pb-4 lg:flex-row lg:flex-wrap lg:justify-between lg:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span className="font-mono font-bold">{activeProject.id}</span>
                    <span>ปีงบประมาณ {projectYear(activeProject)}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-ink">{activeProject.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>
                      ผู้เสนอ <strong className="text-ink">{activeProject.owner}</strong>
                    </span>
                    <span>
                      สาขาวิชา<strong className="text-ink">{activeProject.unit}</strong>
                    </span>
                    {activeProject.date && <span>กำหนดจัด {activeProject.date}</span>}
                  </div>
                </div>
                <StatusBadge status={activeProject.status} />
              </div>

              {activeProject.formData?.officerReviewNotes && (
                <div className="flex items-start gap-2.5 rounded-xl border border-line bg-brand-soft/60 p-3 text-xs text-ink">
                  <Icon name="edit" size={16} className="mt-0.5 shrink-0 text-brand-2" />
                  <div>
                    <span className="font-bold">บันทึกจากเจ้าหน้าที่แผน:</span> {activeProject.formData.officerReviewNotes}
                    {activeProject.formData.officerReviewedAt && (
                      <div className="mt-0.5 text-[11px] text-muted">
                        เมื่อ {new Date(activeProject.formData.officerReviewedAt).toLocaleDateString("th-TH")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {actionFirst && (
                <WorkflowPanel key={activeProject.id} projectCode={activeProject.id} role={role} onChanged={onProjectUpdated} />
              )}

              <Tabs
                value={detailTab}
                onChange={setDetailTab}
                tabs={[
                  { id: "overview", label: "ภาพรวม" },
                  { id: "items", label: "ค่าใช้จ่าย (ข้อ 9)", badge: activeProject.formData?.multiplierItems?.length || undefined },
                  { id: "strategy", label: "ยุทธศาสตร์และกิจกรรม" },
                ]}
              />
              {detailTab === "overview" && <ProjectFacts project={activeProject} config={yearConfig} />}
              {detailTab === "items" && <ProjectItems project={activeProject} config={yearConfig} />}
              {detailTab === "strategy" && <ProjectStrategy project={activeProject} config={yearConfig} />}

              <div className="flex flex-wrap gap-2">
                {isOfficer && activeProject.status === "PENDING_REVIEW" && (
                  <Button data-testid="officer-edit" variant="outline" size="sm" icon="edit" onClick={() => setIsEditModalOpen(true)}>
                    แก้ไขแทนอาจารย์
                  </Button>
                )}
                {isOfficer && (
                  <Button variant="outline" size="sm" icon="download" onClick={handleExportWord}>
                    ไฟล์ Word ตามแบบฟอร์ม
                  </Button>
                )}
                <Button variant="outline" size="sm" icon="download" onClick={handleExportExcel}>
                  Excel รายการค่าใช้จ่าย
                </Button>
                <DeleteProjectButton project={activeProject} role={role} onDeleted={onProjectUpdated} />
              </div>

              {/* สิ่งที่ควรตรวจก่อนอนุมัติ (เตือนความจำ — ไม่ได้บังคับติ๊ก) */}
              {stage === "review" && isOfficer && (
                <div className="rounded-xl border border-line bg-surface p-4 text-xs">
                  <div className="font-bold text-ink">ก่อนอนุมัติ ตรวจให้ครบ</div>
                  <ul className="mt-2 space-y-1.5 text-muted">
                    {REVIEW_CHECKS.map((check) => (
                      <li key={check} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-2" />
                        {check}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* สถานะเอกสาร + ปุ่มตามบทบาท (อนุมัติ/ตีกลับ/บันทึกการลงนาม) */}
              {!actionFirst && (
                <WorkflowPanel key={activeProject.id} projectCode={activeProject.id} role={role} onChanged={onProjectUpdated} />
              )}
            </div>
          ) : (
            <div className="grid place-items-center flex-1 text-sm text-muted">
              {displayedList.length === 0 ? "ไม่มีงานในหมวดนี้" : "เลือกโครงการจากรายการด้านซ้าย"}
            </div>
          )}
        </Card>
      </div>

      {/* Plan Officer Collaborative Direct Edit Modal */}
      {activeProject && (
        <OfficerEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={activeProject}
          onSaved={() => {
            onProjectUpdated()
          }}
        />
      )}
    </div>
  )
}

/** ข้อมูลเพิ่มในแถวตามหมวด: ขั้นลงนามที่รออยู่, ช่องอัปโหลดสแกน, ยอดเบิก */
function QueueRowDetail({
  project,
  stage,
  canUpload,
  onUploaded,
}: {
  project: PlanProject
  stage: WorkStage
  canUpload: boolean
  onUploaded: () => void
}) {
  const waiting = waitingText(project.updatedAt)
  if (stage === "signing") {
    return (
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-brand-2">
          {project.status === "APPROVED_FOR_PRINT" ? "รออาจารย์พิมพ์และลงนาม" : `รอ: ${project.currentStepLabel ?? "ลงนาม"}`}
        </span>
        {waiting && <span className="text-amber-700">{waiting}</span>}
      </div>
    )
  }
  if (stage === "scan") {
    return (
      <div className="mt-1.5 text-[11px]">
        <div className="flex justify-between text-muted">
          <span>เซ็นครบแล้ว รออัปโหลดเอกสารสแกน</span>
          {waiting && <span className="text-amber-700">{waiting}</span>}
        </div>
        {canUpload && <ScanDropZone project={project} onUploaded={onUploaded} />}
      </div>
    )
  }
  if (stage === "money") {
    const percent = project.amount > 0 ? Math.min((project.spent / project.amount) * 100, 100) : 0
    return (
      <div className="mt-1.5 space-y-1 text-[11px] text-muted">
        <div className="flex justify-between">
          <span>
            เบิกแล้ว <strong className="font-mono text-emerald-700">฿{formatMoney(project.spent)}</strong> · คงเหลือ{" "}
            <strong className="font-mono text-brand">฿{formatMoney(project.amount - project.spent)}</strong>
          </span>
          <span className="flex flex-wrap justify-end gap-1">
            {(project.requestsPending || 0) > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-brand">คำขอเบิกรอ {project.requestsPending}</span>
            )}
            {project.closureRequestStatus === "PENDING" ? (
              <span className="rounded-full bg-brand px-2 py-0.5 font-bold text-white">ขอปิดโครงการ</span>
            ) : (
              !(project.requestsPending || 0) && <span className="font-semibold text-emerald-700">พร้อมปิดโครงการ</span>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
        </div>
      </div>
    )
  }
  if (stage === "review" && waiting) {
    return <div className="mt-1 text-right text-[11px] text-amber-700">ส่งมา{waiting === "วันนี้" ? "วันนี้" : ` ${waiting.replace("ค้าง ", "")}แล้ว`}</div>
  }
  return null
}

/** รายละเอียดหมวดเบิกจ่าย/ปิดโครงการ: ทะเบียนการเบิกจ่าย + ปุ่มปิดโครงการ */
function MoneyDetail({
  project,
  canClose,
  onClose,
  onChanged,
}: {
  project: PlanProject
  canClose: boolean
  onClose: () => void
  onChanged: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
        <div>
          <div className="font-mono text-xs font-bold text-muted">{project.id}</div>
          <h2 className="mt-1 text-lg font-bold text-ink">{project.name}</h2>
          <div className="mt-1 text-xs text-muted">
            {project.owner} · สาขาวิชา{project.unit}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-end">
          <StatusBadge status={project.status} />
          {canClose && (
            <Button data-testid="close-project" variant="accent" size="sm" icon="return" onClick={onClose}>
              ปิดโครงการ / คืนงบคงเหลือ
            </Button>
          )}
        </div>
      </div>
      <LoadedProjectLedger key={project.id} projectCode={project.id} onChanged={onChanged} />
    </div>
  )
}

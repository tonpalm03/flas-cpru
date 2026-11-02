import { useState, useEffect, useRef } from "react"
import { CpruProjectFormData, PlanPage, PlanProject } from "./types/plan"
import { planService } from "./services/planService"
import { authService } from "./services/authService"
import { SessionUser, useSession } from "./lib/currentUser"
import { LoginPage } from "./pages/LoginPage"
import { Sidebar } from "./components/layout/Sidebar"
import { Header } from "./components/layout/Header"
import { MobileTopBar } from "./components/layout/MobileTopBar"
import { BottomNav } from "./components/layout/BottomNav"
import { MoreSheet } from "./components/layout/MoreSheet"
import { MobileSearch } from "./components/layout/MobileSearch"
import { ChangePasswordDialog } from "./components/layout/ChangePasswordDialog"
import { useInstallApp } from "./components/layout/InstallApp"
import { FOCUS_PAGES, pageTitle, phoneNav } from "./components/layout/phoneNav"
import { Dashboard } from "./pages/plan/Dashboard"
import { BudgetSetup } from "./pages/plan/BudgetSetup"
import { ProjectsList } from "./pages/plan/ProjectsList"
import { ProposalWizard } from "./pages/plan/ProposalWizard"
import { ProjectDetail } from "./pages/plan/ProjectDetail"
import { ApprovalsPage } from "./pages/plan/ApprovalsPage"
import { ClosurePage } from "./pages/plan/ClosurePage"
import { UsersPage } from "./pages/plan/UsersPage"
import { TrashPage } from "./pages/plan/TrashPage"
import { LedgerPage } from "./pages/plan/LedgerPage"
import { WorkStage, officerAttention, readStoredStage, storeStage, teacherAttention } from "./lib/workStages"
import { pageAllowed } from "./lib/pageAccess"
import { useIsPhone } from "./lib/useIsPhone"
import { usePhoneBarState } from "./lib/phoneBar"
import { dropLayers, hasOpenLayer } from "./lib/backLayers"
import { confirmLeave } from "./lib/leaveGuard"

export default function App() {
  const session = useSession()
  // รอ Firebase อ่าน login ของเว็บคณะก่อน — ไม่ให้หน้า login แวบขึ้นมาตอนเข้าจากเมนูของเว็บคณะ
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    authService
      .refresh()
      .catch(() => undefined)
      .finally(() => setChecked(true))
  }, [])

  if (!session && !checked) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">กำลังเข้าสู่ระบบแผน...</div>
  if (!session) return <LoginPage />
  // เปลี่ยนผู้ใช้ = เริ่มหน้าใหม่ทั้งหมด (ไม่ค้างข้อมูลของคนก่อน)
  return <PlanApp key={session.user.username} user={session.user} />
}

const VALID_PAGES: PlanPage[] = ["dashboard", "budget", "projects", "proposal", "approvals", "closure", "users", "trash", "ledger"]

// การเปลี่ยนหน้าเก็บใน history ของเบราว์เซอร์ → ปุ่มย้อนกลับของมือถือ/เบราว์เซอร์พากลับหน้าก่อนหน้าในระบบ
// depth = จำนวนหน้าที่เปิดต่อจากหน้าแรกของแท็บนี้ (0 = ย้อนต่อจะออกจากระบบ)
interface NavState {
  page: PlanPage
  depth: number
  /** รหัสโครงการที่เปิดดู (หน้ารายละเอียด/ปิดโครงการ) */
  project?: string
  /** รหัสโครงการที่กำลังแก้ไขในฟอร์ม */
  edit?: string
}

function pageFromUrl(): PlanPage | null {
  const hash = window.location.hash.replace("#", "") as PlanPage
  const pageParam = new URLSearchParams(window.location.search).get("page") as PlanPage
  const target = hash || pageParam
  return target && VALID_PAGES.includes(target) ? target : null
}

const entryKey = (state: Pick<NavState, "page" | "project" | "edit">) => `${state.page}|${state.project ?? ""}|${state.edit ?? ""}`

function PlanApp({ user }: { user: SessionUser }) {
  const currentRole = user.role
  const isPhone = useIsPhone()
  const [currentPage, setCurrentPage] = useState<PlanPage>(() => pageFromUrl() ?? "dashboard")
  const [projects, setProjects] = useState<PlanProject[]>([])
  const [selectedProject, setSelectedProject] = useState<PlanProject | null>(null)
  const [editingProject, setEditingProject] = useState<PlanProject | null>(null)
  // ร่างจากไฟล์ Word หรือไฟล์สแกนที่นำเข้า (seq เปลี่ยน = เปิดฟอร์มใหม่ด้วยข้อมูลชุดใหม่)
  const [importedDraft, setImportedDraft] = useState<{ form: CpruProjectFormData; warnings: string[]; file: File; seq: number } | null>(null)
  // หมวดงานล่าสุดในหน้างานเจ้าหน้าที่ (จำไว้ในเบราว์เซอร์)
  const [workStage, setWorkStage] = useState<WorkStage>(readStoredStage)
  // มือถือ: แผ่น "เพิ่มเติม" หน้าค้นหา และกล่องเปลี่ยนรหัสผ่าน
  const [moreOpen, setMoreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const phoneBar = usePhoneBarState()
  const install = useInstallApp()

  const projectsRef = useRef<PlanProject[]>([])
  const entryRef = useRef(entryKey({ page: currentPage }))
  // รายการ history ของหน้าที่เปิดอยู่ — ใช้ใส่กลับเมื่อผู้ใช้กดย้อนกลับแล้วเลือกไม่ออกจากฟอร์มที่ยังไม่บันทึก
  const currentStateRef = useRef<NavState>({ page: currentPage, depth: 0 })
  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  const navigate = (page: PlanPage, extra: { project?: string; edit?: string } = {}) => {
    const next: NavState = { page, depth: Number(history.state?.depth ?? 0) + 1, ...extra }
    // แตะเมนูของหน้าที่เปิดอยู่ = ปิดสิ่งที่เปิดซ้อนอยู่ หรือเลื่อนกลับขึ้นบนสุด
    if (entryKey(next) === entryRef.current) {
      if (hasOpenLayer()) history.back()
      else window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (!confirmLeave()) return
    entryRef.current = entryKey(next)
    currentStateRef.current = next
    // เปลี่ยนหน้าจากแผ่นที่เปิดซ้อนอยู่: แทนที่รายการของแผ่น (ย้อนกลับแล้วไม่เจอแผ่นค้าง)
    if (dropLayers()) history.replaceState(next, "", `#${page}`)
    else history.pushState(next, "", `#${page}`)
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const replacePage = (page: PlanPage) => {
    const next: NavState = { page, depth: Number(history.state?.depth ?? 0) }
    entryRef.current = entryKey(next)
    currentStateRef.current = next
    history.replaceState(next, "", `#${page}`)
    setCurrentPage(page)
  }

  // เมนู (ซ้าย/ล่าง/เพิ่มเติม): เปิดหน้าใหม่แบบเริ่มต้น
  const openFromMenu = (page: PlanPage) => {
    // เมนูของหน้าที่เปิดอยู่: ไม่ล้างอะไร (ปิดสิ่งที่ซ้อนอยู่/เลื่อนขึ้นบนสุด)
    if (entryKey({ page }) === entryRef.current) return navigate(page)
    // ถามเรื่องฟอร์มที่ยังไม่บันทึกก่อนล้างสถานะของหน้าเดิม (ตอบ "ยกเลิก" = ฟอร์มยังอยู่ครบ)
    if (!confirmLeave()) return
    if (page !== "project-detail") setSelectedProject(null)
    if (page === "proposal") {
      setEditingProject(null)
      setImportedDraft(null)
    }
    navigate(page)
  }

  const goBack = () => {
    if (hasOpenLayer() || Number(history.state?.depth ?? 0) > 0) history.back()
    else replacePage("dashboard")
  }

  const changeStage = (stage: WorkStage) => {
    setWorkStage(stage)
    storeStage(stage)
  }

  const startClosure = (project: PlanProject) => {
    setSelectedProject(project)
    navigate("closure", { project: project.id })
  }

  const loadProjects = async () => {
    try {
      const list = await planService.getProjects()
      setProjects(list)
      return list
    } catch (e) {
      // 401 → api.ts พากลับหน้า login เอง; อย่างอื่นแสดงรายการว่างแทนข้อมูลผิดแหล่ง
      console.warn("โหลดรายการโครงการไม่สำเร็จ", e)
      setProjects([])
      return []
    }
  }

  // หลังเปลี่ยนสถานะเอกสาร โหลดรายการใหม่และอัปเดตโครงการที่เปิดอยู่
  const handleProjectChanged = async () => {
    const list = await loadProjects()
    setSelectedProject((prev) => list.find((p) => p.id === prev?.id) ?? prev)
  }

  useEffect(() => {
    loadProjects()
    // หน้าแรกของแท็บนี้ในระบบ
    currentStateRef.current = { ...history.state, page: currentPage, depth: Number(history.state?.depth ?? 0) }
    history.replaceState(currentStateRef.current, "")

    // ย้อนกลับ/ไปข้างหน้า หรือพิมพ์ #หน้า เอง
    const syncFromHistory = () => {
      const state = history.state as Partial<NavState> | null
      let page = state?.page ?? pageFromUrl()
      if (!page) return
      if (!state?.page) history.replaceState({ ...state, page, depth: 1 } satisfies NavState, "")
      const key = entryKey({ page, project: state?.project, edit: state?.edit })
      // ปิดแผ่นที่เปิดซ้อน = ยังอยู่หน้าเดิม ไม่ต้องเปิดหน้าใหม่ (ฟอร์มที่กรอกไว้ไม่หาย)
      if (key === entryRef.current) return
      // ฟอร์มที่ยังไม่บันทึก: ผู้ใช้เลือกอยู่ต่อ → ใส่หน้าเดิมกลับเข้า history
      if (!confirmLeave()) {
        history.pushState(currentStateRef.current, "", `#${currentStateRef.current.page}`)
        return
      }
      entryRef.current = key
      currentStateRef.current = history.state as NavState
      const find = (code?: string) => (code ? projectsRef.current.find((p) => p.id === code) ?? null : null)
      if (page === "project-detail" || page === "closure") {
        const project = find(state?.project)
        if (project) setSelectedProject(project)
        else page = "dashboard"
      }
      if (page === "proposal") {
        setEditingProject(find(state?.edit))
        setImportedDraft(null)
      }
      setCurrentPage(page)
    }
    window.addEventListener("popstate", syncFromHistory)

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "NAVIGATE_PAGE" && e.data?.page) {
        setCurrentPage(e.data.page as PlanPage)
      }
      if (e.data?.type === "SET_CLEAN_MODE") {
        localStorage.setItem("codefusion_clean_mode", e.data.clean ? "true" : "false")
        loadProjects()
      }
    }
    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("popstate", syncFromHistory)
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  // หน้าที่บทบาทนี้เปิดไม่ได้ (เช่น ลิงก์ #proposal ของเจ้าหน้าที่) → กลับหน้าภาพรวม
  useEffect(() => {
    if (!pageAllowed(currentRole, currentPage)) replacePage("dashboard")
  }, [currentRole, currentPage])

  const handleSelectProject = (project: PlanProject) => {
    // ค้นหาเจอโครงการที่เปิดอยู่แล้ว: แค่ปิดหน้าค้นหา (ปิดเองย้อน history ให้ครั้งเดียว)
    if (entryKey({ page: "project-detail", project: project.id }) !== entryRef.current) {
      setSelectedProject(project)
      navigate("project-detail", { project: project.id })
    }
    setSearchOpen(false)
  }

  // หลังบันทึก/ส่งโครงการ โหลดรายการใหม่จาก backend (ทั้งสร้างใหม่และแก้ไข)
  const handleProjectCreated = (_project: PlanProject) => {
    loadProjects()
  }

  const handleEditProject = (project: PlanProject) => {
    setImportedDraft(null)
    setEditingProject(project)
    navigate("proposal", { edit: project.id })
  }

  const badges: Partial<Record<PlanPage, number>> =
    currentRole === "officer"
      ? { approvals: officerAttention(projects) }
      : currentRole === "teacher"
        ? { projects: teacherAttention(projects) }
        : {}

  const pages = (
    <>
      {currentPage === "dashboard" && (
        <Dashboard
          role={currentRole}
          projects={projects}
          onNavigate={navigate}
          onSelectProject={handleSelectProject}
          onEditProject={handleEditProject}
          onChanged={loadProjects}
        />
      )}

      {currentPage === "budget" && pageAllowed(currentRole, "budget") && <BudgetSetup role={currentRole} onNavigate={navigate} />}

      {currentPage === "projects" && pageAllowed(currentRole, "projects") && (
        <ProjectsList projects={projects} role={currentRole} onNavigate={navigate} onSelectProject={handleSelectProject} />
      )}

      {currentPage === "proposal" && pageAllowed(currentRole, "proposal") && (
        <ProposalWizard
          key={editingProject?.id ?? (importedDraft ? `import-${importedDraft.seq}` : "new")}
          initialProject={editingProject ?? undefined}
          importedForm={editingProject ? undefined : importedDraft?.form}
          importWarnings={importedDraft?.warnings}
          importedFile={editingProject ? undefined : importedDraft?.file}
          onImported={(form, warnings, file) => setImportedDraft((prev) => ({ form, warnings, file, seq: (prev?.seq ?? 0) + 1 }))}
          onNavigate={navigate}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {currentPage === "project-detail" && selectedProject && (
        <ProjectDetail
          project={selectedProject}
          role={currentRole}
          onChanged={handleProjectChanged}
          onEdit={handleEditProject}
          onNavigate={navigate}
          onInitiateClosure={startClosure}
          onDeleted={() => {
            setSelectedProject(null)
            navigate("dashboard")
            loadProjects()
          }}
        />
      )}

      {currentPage === "approvals" && (
        <ApprovalsPage
          role={currentRole}
          projects={projects}
          stage={workStage}
          onStageChange={changeStage}
          onNavigate={navigate}
          onProjectUpdated={loadProjects}
          onInitiateClosure={startClosure}
        />
      )}

      {currentPage === "closure" && selectedProject && (
        <ClosurePage project={selectedProject} onNavigate={navigate} onClosed={loadProjects} />
      )}

      {currentPage === "users" && pageAllowed(currentRole, "users") && <UsersPage />}

      {currentPage === "trash" && pageAllowed(currentRole, "trash") && <TrashPage onRestored={loadProjects} />}

      {currentPage === "ledger" && pageAllowed(currentRole, "ledger") && (
        <LedgerPage projects={projects} onNavigate={navigate} onSelectProject={handleSelectProject} />
      )}
    </>
  )

  if (isPhone) {
    const { tabs, more } = phoneNav(currentRole)
    const focus = FOCUS_PAGES.includes(currentPage)
    const isTabRoot = !focus && tabs.some((tab) => tab.id === currentPage)
    const showBack = phoneBar?.back || !isTabRoot
    // ปุ่มติดตั้งบนแถบด้านบน: เฉพาะหน้าหลัก และเฉพาะตอนที่ติดตั้งได้ทันที/บน iPhone (ที่อื่นอยู่ในแผ่น "เพิ่มเติม")
    const canInstallNow = currentPage === "dashboard" && (install.state === "prompt" || install.state === "ios")
    return (
      <div className="min-h-screen bg-surface text-ink">
        <MobileTopBar
          title={phoneBar?.title ?? pageTitle(currentRole, currentPage)}
          subtitle={phoneBar?.subtitle}
          onBack={showBack ? goBack : undefined}
          onSearch={() => setSearchOpen(true)}
          onInstall={canInstallNow ? install.start : undefined}
        />
        <main className={`mx-auto w-full max-w-3xl px-4 pt-4 ${focus ? "pb-8" : "pb-28"}`}>{pages}</main>
        {!focus && (
          <BottomNav
            tabs={tabs}
            more={more}
            currentPage={currentPage}
            badges={badges}
            moreBadge={more.reduce((sum, item) => sum + (badges[item.id] ?? 0), 0)}
            onNavigate={openFromMenu}
            onMore={() => setMoreOpen(true)}
          />
        )}
        <MoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          user={user}
          items={more}
          badges={badges}
          onNavigate={(page) => {
            // หน้าที่เปิดอยู่แล้ว: แค่ปิดแผ่น
            if (entryKey({ page }) !== entryRef.current) openFromMenu(page)
            setMoreOpen(false)
          }}
          onChangePassword={() => {
            setMoreOpen(false)
            setChangingPassword(true)
          }}
        />
        <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} projects={projects} onSelectProject={handleSelectProject} />
        {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
        {install.sheet}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <Sidebar currentPage={currentPage} onNavigate={openFromMenu} currentRole={currentRole} badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <Header user={user} projects={projects} onSelectProject={handleSelectProject} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-8">{pages}</main>
      </div>
    </div>
  )
}

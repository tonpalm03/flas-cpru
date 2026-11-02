import { useState, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CpruProjectFormData,
  PlanPage,
  PlanProject,
  BudgetItem,
  MultiplierBudgetItem,
  ProjectActivityDefinition,
  ProjectOKRItem,
  ProjectPersonnel,
} from "../../types/plan"
import { useFiscalYearConfig } from "../../hooks/useFiscalYearConfig"
import { getFiscalYears } from "../../services/fiscalYearService"
import { ApiError } from "../../lib/api"
import { getCurrentUser } from "../../lib/currentUser"
import { formatMoney, formatBahtText } from "../../lib/formatters"
import { exportMultiplierToExcel } from "../../lib/excelExporter"
import { normalizeActivity, withDerivedFields } from "../../lib/fiscalPeriod"
import { NewProjectInput, planService } from "../../services/planService"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Field } from "../../components/ui/Field"
import { PageHeader } from "../../components/ui/PageHeader"
import { Icon } from "../../components/ui/Icons"
import { Stepper, StepItem } from "../../components/ui/Stepper"
import { StrategicAlignmentStep, missingFacultyPlanMessage } from "../../components/plan/StrategicAlignmentStep"
import { ActivityDefinitionStep } from "../../components/plan/ActivityDefinitionStep"
import { OkrTable, incompleteOkrRows, newOkr, okrsFromForm } from "../../components/plan/OkrTable"
import { BudgetMultiplierGrid } from "../../components/plan/BudgetMultiplierGrid"
import { DocxImportCard } from "../../components/plan/DocxImportCard"
import { FormPreview, FormPreviewSheet } from "../../components/plan/FormPreview"
import { useIsWideScreen } from "../../lib/useIsWideScreen"
import { useLeaveGuard } from "../../lib/leaveGuard"

interface ProposalWizardProps {
  onNavigate: (page: PlanPage) => void
  onProjectCreated: (project: PlanProject) => void
  // แก้ไขโครงการเดิม (สถานะ DRAFT หรือ REVISION_REQUESTED) — ไม่ส่งมา = เสนอโครงการใหม่
  initialProject?: PlanProject
  // ร่างจากไฟล์ Word หรือไฟล์สแกนที่นำเข้า (โครงการใหม่ — ยังไม่บันทึก) + สิ่งที่ต้องตรวจทาน
  importedForm?: CpruProjectFormData
  importWarnings?: string[]
  // ไฟล์ที่นำเข้า (PDF สแกน / Word) — แสดงในแท็บ "ไฟล์ต้นฉบับ" ของตัวอย่างแบบฟอร์ม ไว้เทียบ
  importedFile?: File
  onImported?: (form: CpruProjectFormData, warnings: string[], file: File) => void
}


// ----------------------------------------------------------------------------
// ZOD VALIDATION SCHEMAS
// ----------------------------------------------------------------------------
const proposalFormSchema = z.object({
  // Step 1: Core Data & Cascading Hierarchical Budget
  fiscalYear: z.number().int().min(2560, "ปีงบประมาณไม่ถูกต้อง"),
  projectCategory: z.string().min(1, "กรุณาเลือกประเภทโครงการ"),
  projectCategoryOther: z.string().optional(),
  department: z.string().min(2, "กรุณาระบุหน่วยงานที่ดำเนินการ"),
  // เดิมเลือกหมวดงบจากหน้า No-Code (ซ่อนแล้ว) — เก็บค่าเดิมไว้เพื่อให้ร่างรุ่นเก่าเปิดได้
  primaryBudgetId: z.string().optional(),
  subBudgetId: z.string().optional(),
  title: z.string().min(5, "กรุณากรอกชื่อโครงการอย่างน้อย 5 ตัวอักษร"),
  startDate: z.string().min(1, "กรุณาระบุวันที่เริ่มกิจกรรม"),
  endDate: z.string().min(1, "กรุณาระบุวันที่สิ้นสุดกิจกรรม"),
  targetGroup: z.string().min(3, "กรุณาระบุกลุ่มเป้าหมายผู้เข้าร่วม"),

  // Background & Rationale (Section 5 - 3 paragraphs)
  backgroundProblem: z.string().min(5, "กรุณาระบุที่มาและสาเหตุของปัญหา"),
  backgroundSolution: z.string().min(5, "กรุณาระบุแนวทางการแก้ปัญหา"),
  backgroundImpact: z.string().min(5, "กรุณาระบุสิ่งที่จะเกิดขึ้นหรือเปลี่ยนแปลง"),

  // Dynamic Form Data (JSON Schema answers from template)
  dynamicAnswers: z.record(z.string(), z.any()),
})

export type ProposalFormData = z.infer<typeof proposalFormSchema>

// มือถือ: ปุ่มย้อนกลับ/ถัดไปของแต่ละขั้นติดอยู่ล่างจอ กดได้โดยไม่ต้องเลื่อนลงไปท้ายฟอร์ม
const PHONE_STEP_BAR =
  "max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:-mx-4 max-lg:-mb-4 max-lg:rounded-b-2xl max-lg:bg-white/95 max-lg:px-4 max-lg:pt-3 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:backdrop-blur"

const WIZARD_STEPS: StepItem[] = [
  { id: 1, title: "ข้อมูลโครงการ", description: "ข้อ 1, 2 และ 5" },
  { id: 2, title: "ยุทธศาสตร์", description: "ข้อ 3 และ 4" },
  { id: 3, title: "กิจกรรมและ OKR", description: "ข้อ 6–8" },
  { id: 4, title: "งบประมาณ", description: "ข้อ 9" },
  { id: 5, title: "สรุปและส่ง", description: "ข้อ 10–14" },
]

const PREVIEW_BESIDE_KEY = "fastcpru.formPreviewBeside"
// ข้อของแบบฟอร์มที่ตรงกับแต่ละขั้น (เลื่อนตัวอย่างไปที่ข้อนั้น)
const STEP_FORM_ITEM: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 9, 5: 10 }

function readPreviewBeside(): boolean {
  try {
    return localStorage.getItem(PREVIEW_BESIDE_KEY) !== "0"
  } catch {
    return true
  }
}

function rememberPreviewBeside(show: boolean) {
  try {
    localStorage.setItem(PREVIEW_BESIDE_KEY, show ? "1" : "0")
  } catch {
    // เบราว์เซอร์ไม่ให้เก็บค่า — ใช้ค่าเริ่มต้นครั้งหน้า
  }
}

export function ProposalWizard({
  onNavigate,
  onProjectCreated,
  initialProject,
  importedForm,
  importWarnings = [],
  importedFile,
  onImported,
}: ProposalWizardProps) {
  const init = initialProject?.formData ?? importedForm
  const isEditing = Boolean(initialProject)
  // ผู้ใช้ที่ login — เติมเป็นผู้รับผิดชอบโครงการและหน่วยงานของโครงการใหม่
  const me = getCurrentUser().info
  const [currentStep, setCurrentStep] = useState<number>(1)
  // ตัวอย่างแบบฟอร์ม: จอกว้างแสดงคู่กับฟอร์ม (ซ่อนได้ จำไว้ในเครื่อง) · จอแคบเปิดเต็มจอจากปุ่มลอย
  const wideScreen = useIsWideScreen()
  const [previewBeside, setPreviewBeside] = useState(() => readPreviewBeside())
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [submittedProject, setSubmittedProject] = useState<PlanProject | null>(null)

  // เวลาที่บันทึกแบบร่างล่าสุดในหน้านี้ (แสดงในแถบด้านบน)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  // แก้ข้อมูลแล้วยังไม่ได้บันทึก (ข้อมูลที่นำเข้าจาก Word ก็ยังไม่ได้บันทึก) → ถามก่อนออกจากหน้า
  const [unsaved, setUnsaved] = useState(Boolean(importedForm))
  useLeaveGuard(unsaved ? 'ข้อมูลที่กรอกยังไม่ได้บันทึก — ออกจากหน้านี้หรือไม่?\n(กด "ยกเลิก" แล้วกด "บันทึกแบบร่าง" เพื่อเก็บไว้แก้ต่อ)' : null)

  // --------------------------------------------------------------------------
  // ADVANCED ENTERPRISE STATE (Sections 3, 4, 6, 7, 8, 9, 10-14)
  // --------------------------------------------------------------------------
  // Sections 3 & 4: Strategic Alignment
  const [selectedUniMissions, setSelectedUniMissions] = useState<number[]>(init?.universityMissionIds ?? [])
  const [selectedUniStrategies, setSelectedUniStrategies] = useState<number[]>(init?.universityStrategyIds ?? [])
  // คณะมาจากข้อมูลผู้ใช้ปัจจุบัน (วันที่ระบบ login ของทีมเสร็จ แก้ที่ lib/currentUser.ts ที่เดียว)
  const facultyName = init?.facultyName ?? me.faculty ?? ""
  const [selectedFacultyMissions, setSelectedFacultyMissions] = useState<number[]>(init?.facultyMissionIds ?? [])
  const [selectedFacultyStrategies, setSelectedFacultyStrategies] = useState<number[]>(init?.facultyStrategyIds ?? [])

  // Section 6: OKRs ของโครงการ — จำนวนแถวตามที่โครงการมี ไม่ผูกกับกิจกรรม
  const [okrs, setOkrs] = useState<ProjectOKRItem[]>(() => (init ? okrsFromForm(init) : [newOkr()]))

  // Sections 6, 7 & 8: Activities Definition
  // ร่างรุ่นก่อน (จำนวนเป้าหมายรวม, ไตรมาสเดียว) แปลงเป็นกลุ่มเป้าหมาย + เดือนเริ่ม/สิ้นสุด
  const initialFiscalYear = init?.fiscalYear ?? initialProject?.fiscalYear ?? 2570
  const [activities, setActivities] = useState<ProjectActivityDefinition[]>(() => (init?.activityDefinitions ?? [
    {
      id: "act-1",
      index: 1,
      name: "กิจกรรมที่ 1 : ",
      subItems: [],
      location: "",
      committeeCount: 0,
      targetGroups: [{ name: "", count: 0 }],
      targetCount: 0,
      startMonth: 10,
      endMonth: 12,
      quarter: 1,
      monthRange: "",
      methods: ["1.1 "],
      kpi: "",
      multiplierItems: [],
    },
  ]).map((a) => withDerivedFields(normalizeActivity(a), initialFiscalYear)))

  // Section 9: Smart Multiplier Items (ตารางแตกตัวคูณ 4 มิติ)
  const [multiplierItems, setMultiplierItems] = useState<MultiplierBudgetItem[]>(init?.multiplierItems ?? [])
  // ข้อ 9 "งบประมาณ อื่น ๆ ระบุที่มาของแหล่งงบประมาณ" (ไม่กรอก → เอกสารใช้รายละเอียดประเภทโครงการ "อื่น ๆ")
  const [offBudgetDetail, setOffBudgetDetail] = useState<string>(init?.budgetSources?.offBudgetDetail ?? "")

  // Sections 10-14: Impacts, Evaluations & Personnel
  const [impacts, setImpacts] = useState<string[]>(init?.impacts ?? [""])
  const [evaluations, setEvaluations] = useState<string[]>(init?.evaluations ?? [""])
  // Section 12-14: Personnel State (100% customizable & editable by teachers)
  const [leaderName, setLeaderName] = useState<string>(init?.leader?.name ?? me.name)
  const [leaderPosition, setLeaderPosition] = useState<string>(init?.leader?.position ?? me.position ?? "")
  const [leaderPhone, setLeaderPhone] = useState<string>(init?.leader?.phone ?? me.phone ?? "")

  // ข้อ 13: รายบุคคล (ชื่อ ตำแหน่ง เบอร์โทร) — ร่างรุ่นก่อนเป็นข้อความเดียว ย้ายมาเป็นแถวแรก
  const [coLeaders, setCoLeaders] = useState<ProjectPersonnel[]>(() => {
    const saved = (init?.coLeaders || []).filter((p) => p.name?.trim())
    if (saved.length > 0) return saved
    if (init?.coLeadersText?.trim()) return [{ name: init.coLeadersText.trim(), position: "", phone: "" }]
    return [{ name: "", position: "", phone: "" }]
  })
  const updateCoLeader = (index: number, updates: Partial<ProjectPersonnel>) =>
    setCoLeaders((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)))

  // ข้อ 14: แบบฟอร์มมีแค่ชื่อและตำแหน่ง — ค่าเริ่มต้นมาจากไฟล์ตั้งค่าปีงบ (คณบดี) ดู effect ด้านล่าง
  const [supervisorName, setSupervisorName] = useState<string>(init?.supervisor?.name ?? "")
  const [supervisorPosition, setSupervisorPosition] = useState<string>(init?.supervisor?.position ?? "")

  // --------------------------------------------------------------------------
  // REACT HOOK FORM SETUP WITH ZOD
  // --------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
    mode: "onChange",
    defaultValues: {
      fiscalYear: initialFiscalYear,
      // โครงการที่คณะส่งจริงเลือก "ตามแผนภารกิจหน่วยงาน" ทั้งหมด จึงเป็นค่าเริ่มต้น
      projectCategory: init?.projectCategoryCode ?? "unit_mission",
      projectCategoryOther: init?.projectCategoryOther ?? "",
      department: init?.department ?? [me.faculty, me.department && `(สาขาวิชา${me.department})`].filter(Boolean).join(" "),
      primaryBudgetId: "bc-national",
      subBudgetId: "bc-nat-ops",
      title: initialProject?.name ?? importedForm?.title ?? "",
      startDate: init?.startDate ?? "",
      endDate: init?.endDate ?? "",
      targetGroup: init?.targetGroup ?? initialProject?.targetGroup ?? "",
      backgroundProblem: init?.backgroundProblem ?? "",
      backgroundSolution: init?.backgroundSolution ?? "",
      backgroundImpact: init?.backgroundImpact ?? "",
      dynamicAnswers: {},
    },
  })

  // Watchers
  const watchedFiscalYear = watch("fiscalYear")
  const watchedProjectCategory = watch("projectCategory")
  const watchedTitle = watch("title")
  const watchedEndDate = watch("endDate")
  const watchedTargetGroup = watch("targetGroup")
  const watchedDynamicAnswers = watch("dynamicAnswers") || {}

  // ข้อมูลประจำปีงบ (แผนยุทธศาสตร์, ประเภทโครงการ, หมวดรายจ่าย, แหล่งงบ) จาก backend/fiscal_years/{ปี}
  const { config: yearConfig, loading: yearConfigLoading, error: yearConfigError } = useFiscalYearConfig(watchedFiscalYear)
  const [fiscalYears, setFiscalYears] = useState<number[]>([])
  useEffect(() => {
    getFiscalYears().then(setFiscalYears).catch(() => setFiscalYears([]))
  }, [])
  useEffect(() => {
    if (!yearConfig) return
    const legacyLabel = init?.projectCategoryCode ? "" : init?.projectCategory
    const match = legacyLabel
      ? yearConfig.project_categories.find((c) => c.label === legacyLabel || c.aliases.includes(legacyLabel))
      : undefined
    // ตัวเลือกประเภทมาจาก config ที่โหลดทีหลัง — ตั้งค่าซ้ำให้ select แสดงค่าที่เก็บไว้ ไม่ใช่ตัวเลือกแรก
    setValue("projectCategory", match?.code ?? getValues("projectCategory"))
  }, [yearConfig])

  useEffect(() => {
    const dean = yearConfig?.faculty_plans[facultyName]?.default_supervisor
    if (!dean || init?.supervisor?.name || supervisorName) return
    setSupervisorName(dean.name)
    setSupervisorPosition(dean.position)
  }, [yearConfig])

  const categoryLabel = (code: string) =>
    yearConfig?.project_categories.find((c) => c.code === code)?.label || code
  const expenseLabel = (code: string) =>
    yearConfig?.expense_categories.find((c) => c.code === code)?.label || code

  // Total sums from Smart Multiplier Grid
  const grandTotalAmount = useMemo(() => {
    return multiplierItems.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)
  }, [multiplierItems])

  const nationalTotal = useMemo(() => {
    return multiplierItems
      .filter((i) => i.fundSource === "national")
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)
  }, [multiplierItems])

  const revenueTotal = useMemo(() => {
    return multiplierItems
      .filter((i) => i.fundSource === "revenue")
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)
  }, [multiplierItems])

  const offBudgetTotal = useMemo(() => {
    return multiplierItems
      .filter((i) => i.fundSource === "off_budget")
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)
  }, [multiplierItems])

  const thaiBahtText = useMemo(() => {
    return formatBahtText(grandTotalAmount)
  }, [grandTotalAmount])

  // Section 7 Activity Budgets Sum
  const sumOfActivityBudgets = useMemo(() => {
    return activities.reduce((sum, a) => sum + (Number(a.budgetAmount) || 0), 0)
  }, [activities])

  // Is Section 7 Budget 100% Aligned with Section 9 Multiplier Grid?
  const isBudgetAligned = useMemo(() => {
    if (activities.length === 1) return true
    return sumOfActivityBudgets === grandTotalAmount
  }, [activities.length, sumOfActivityBudgets, grandTotalAmount])

  // Auto-sync Section 7 budget with Section 9 grand total for single-activity projects
  useEffect(() => {
    if (activities.length === 1 && grandTotalAmount > 0) {
      if (activities[0].budgetAmount !== grandTotalAmount) {
        setActivities((prev) => [
          {
            ...prev[0],
            budgetAmount: grandTotalAmount,
          },
        ])
      }
    }
  }, [grandTotalAmount, activities.length])

  // Auto-align helper when multiple activities differ from Section 9 total
  const handleAutoAlignBudgets = () => {
    if (activities.length === 1) {
      setActivities((prev) => [{ ...prev[0], budgetAmount: grandTotalAmount }])
    } else {
      const perAct = Math.round(grandTotalAmount / activities.length)
      setActivities((prev) =>
        prev.map((a, i) => ({
          ...a,
          budgetAmount: i === prev.length - 1 ? grandTotalAmount - perAct * (prev.length - 1) : perAct,
        }))
      )
    }
  }

  // STEP TRANSITIONS GUARDS
  // --------------------------------------------------------------------------
  const handleGoToNextStep = async () => {
    if (currentStep === 1) {
      if (!yearConfig) {
        alert(yearConfigError || "กำลังโหลดข้อมูลปีงบประมาณ กรุณารอสักครู่")
        return
      }
      const isStep1Valid = await trigger([
        "title",
        "startDate",
        "endDate",
        "targetGroup",
        "backgroundProblem",
        "backgroundSolution",
        "backgroundImpact",
      ], { shouldFocus: true })
      // ช่องที่ยังไม่กรอกอาจอยู่นอกจอ (มือถือ) — shouldFocus เลื่อนไปที่ช่องแรกที่ขาด และแต่ละช่องแสดงข้อความเตือน
      if (!isStep1Valid) return
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (selectedUniMissions.length === 0 || selectedUniStrategies.length === 0) {
        alert("กรุณาเลือกความสอดคล้องกับพันธกิจและยุทธศาสตร์มหาวิทยาลัย (ข้อ 3) อย่างน้อย 1 ข้อ")
        return
      }
      if (yearConfig && !yearConfig.faculty_plans[facultyName]) {
        alert(missingFacultyPlanMessage(facultyName, yearConfig.fiscal_year))
        return
      }
      if (selectedFacultyMissions.length === 0 || selectedFacultyStrategies.length === 0) {
        alert("กรุณาเลือกความสอดคล้องกับพันธกิจและยุทธศาสตร์ของคณะ (ข้อ 4) อย่างน้อย 1 ข้อ")
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      const incomplete = incompleteOkrRows(okrs)
      if (incomplete.length > 0) {
        alert(`กรุณากรอกวัตถุประสงค์ ผลลัพธ์หลัก และค่าเป้าหมายให้ครบ (ข้อ 6 แถวที่ ${incomplete.join(", ")}) หรือลบแถวที่ไม่ใช้`)
        return
      }
      if (activities.length === 0) {
        alert("กรุณาระบุกิจกรรมของโครงการอย่างน้อย 1 กิจกรรม")
        return
      }
      setCurrentStep(4)
    } else if (currentStep === 4) {
      if (multiplierItems.length === 0) {
        alert("กรุณาระบุรายการในตารางแตกตัวคูณงบประมาณอย่างน้อย 1 รายการ")
        return
      }
      if (grandTotalAmount <= 0) {
        alert("ยอดรวมงบประมาณต้องมากกว่า 0 บาท")
        return
      }
      const unassigned = activities.length > 1
        ? multiplierItems.filter((i) => !activities.some((a) => a.id === i.activityId)).length
        : 0
      if (unassigned > 0) {
        alert(`กรุณาเลือกกิจกรรมให้ทุกรายการในตารางแตกตัวคูณ (ยังไม่ระบุกิจกรรม ${unassigned} รายการ)`)
        return
      }
      if (offBudgetTotal > 0 && !offBudgetDetail.trim() && !getValues("projectCategoryOther")?.trim()) {
        alert("กรุณาระบุที่มาของแหล่งงบประมาณอื่น ๆ (ข้อ 9)")
        return
      }
      setCurrentStep(5)
    }
  }

  // --------------------------------------------------------------------------
  // SUBMISSION LOGIC (Step 5)
  // --------------------------------------------------------------------------
  const savingRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)

  // โครงการที่บันทึกแล้วในหน้านี้ — บันทึกครั้งถัดไป (เช่น ส่งออก Word แล้วค่อยส่งตรวจ) ต้องอัปเดตโครงการเดิม ไม่สร้างใหม่
  const persistedRef = useRef<PlanProject | undefined>(initialProject)

  // ข้อมูลโครงการจากฟอร์มทุกขั้น — ใช้ทั้งตอนบันทึกและตัวอย่างแบบฟอร์มข้างหน้า (ต้องเป็นข้อมูลชุดเดียวกัน)
  const buildProjectInput = (data: ProposalFormData): NewProjectInput => ({
    name: (data.title || "").trim(),
    owner: leaderName,
    // สาขาของผู้ใช้เป็นกุญแจวงเงินจัดสรร (budget_allocations.department); ชื่อหน่วยงานเต็มเก็บใน formData.department
    unit: getCurrentUser().info.department,
    amount: grandTotalAmount,
    date: data.startDate,
    status: "DRAFT" as const,
    objective: okrs[0]?.objective || data.backgroundSolution,
    targetGroup: data.targetGroup,
    fiscalYear: data.fiscalYear,
    formData: {
      fiscalYear: data.fiscalYear,
      projectCategoryCode: data.projectCategory,
      projectCategory: categoryLabel(data.projectCategory),
      projectCategoryOther: data.projectCategoryOther,
      title: data.title,
      department: data.department,
      startDate: data.startDate,
      endDate: data.endDate,
      targetGroup: data.targetGroup,
      universityMissionIds: selectedUniMissions,
      universityStrategyIds: selectedUniStrategies,
      facultyName: facultyName,
      facultyMissionIds: selectedFacultyMissions,
      facultyStrategyIds: selectedFacultyStrategies,
      backgroundProblem: data.backgroundProblem,
      backgroundSolution: data.backgroundSolution,
      backgroundImpact: data.backgroundImpact,
      okrs: okrs,
      activities: activities.map((a) => ({
        id: a.id,
        name: a.name,
        location: a.location,
        committeeCount: a.committeeCount,
        targetCount: a.targetCount,
        quarter: a.quarter,
        monthRange: a.monthRange,
        amount: a.budgetAmount || grandTotalAmount,
      })),
      activityMethods: activities.map((a) => ({
        id: a.id,
        name: a.name,
        methods: a.methods,
        kpi: a.kpi,
      })),
      activityDefinitions: activities.map((a) => withDerivedFields(a, data.fiscalYear)),
      budgetSources: {
        national: nationalTotal,
        revenue: revenueTotal,
        offBudget: offBudgetTotal,
        offBudgetDetail: offBudgetTotal > 0 ? offBudgetDetail.trim() : "",
      },
      expenses: multiplierItems.map((m) => ({
        id: m.id,
        activityName: activities[0]?.name || "กิจกรรมหลัก",
        category: m.category,
        description: m.name,
        nationalAmount: m.fundSource === "national" ? m.totalAmount : 0,
        revenueAmount: m.fundSource === "revenue" ? m.totalAmount : 0,
        offBudgetAmount: m.fundSource === "off_budget" ? m.totalAmount : 0,
      })),
      multiplierItems: multiplierItems,
      impacts: impacts,
      evaluations: evaluations,
      leader: {
        name: leaderName,
        position: leaderPosition,
        phone: leaderPhone,
      },
      coLeaders: coLeaders
        .map((p) => ({ name: p.name.trim(), position: p.position.trim(), phone: p.phone.trim() }))
        .filter((p) => p.name),
      coLeadersText: "",
      supervisor: {
        name: supervisorName,
        position: supervisorPosition,
      },
    },
    budgetSources: {
      national: nationalTotal,
      revenue: revenueTotal,
      offBudget: offBudgetTotal,
    },
  })

  const allValues = watch()
  const previewInput = buildProjectInput(allValues)
  const previewKey = JSON.stringify(previewInput)
  const loadPreview = (signal: AbortSignal) => planService.previewDraftDocument(buildProjectInput(getValues()), signal)
  const showBeside = wideScreen && previewBeside
  const previewProps = {
    loadDocument: loadPreview,
    dataKey: previewKey,
    sourceFile: isEditing ? undefined : importedFile,
    item: STEP_FORM_ITEM[currentStep] ?? 0,
  }

  const saveProject = async (data: ProposalFormData): Promise<PlanProject> => {
    // Convert multiplier items to standard budget items
    const budgetItems: BudgetItem[] = multiplierItems.map((m) => ({
      category: expenseLabel(m.category),
      description: `${m.name} (${m.targetQty} ${m.targetUnit} x ${m.durationQty} ${m.durationUnit} x ${formatMoney(m.unitRate)}บ. x ${m.frequencyQty} ${m.frequencyUnit})`,
      amount: m.totalAmount,
    }))

    const projectInput = buildProjectInput(data)

    // บันทึก: โครงการใหม่ → สร้างแบบร่าง, แก้ไข → อัปเดตโครงการเดิม (สถานะเปลี่ยนผ่าน workflow เท่านั้น)
    const existing = persistedRef.current
    const saved = existing
      ? await planService.updateProjectData(existing.id, existing.dbId, projectInput)
      : await planService.createProject(projectInput, budgetItems)
    saved.budgetItems = budgetItems
    persistedRef.current = saved
    setLastSavedAt(new Date())
    setUnsaved(false)
    onProjectCreated(saved)
    return saved
  }

  // กันกดบันทึก/ส่ง/ส่งออกซ้ำระหว่างที่คำขอแรกยังไม่เสร็จ (ดับเบิลคลิกเคยสร้างโครงการซ้ำ)
  const runExclusive = async (task: () => Promise<void>) => {
    if (savingRef.current) return
    savingRef.current = true
    setIsSaving(true)
    try {
      await task()
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  const onFormSubmit = (data: ProposalFormData, isDraft = false) =>
    runExclusive(async () => {
      let saved: PlanProject
      try {
        saved = await saveProject(data)
      } catch (e) {
        console.error(e)
        alert(e instanceof ApiError ? e.detail : "เกิดข้อผิดพลาดในการบันทึกโครงการ")
        return
      }

      if (isDraft) return

      try {
        await planService.performAction(saved.id, "submit")
      } catch (submitError) {
        alert(
          `บันทึกแบบร่างแล้ว แต่ส่งให้เจ้าหน้าที่ตรวจไม่สำเร็จ: ${
            submitError instanceof ApiError ? submitError.detail : "เกิดข้อผิดพลาด"
          }`
        )
        onNavigate("projects")
        return
      }
      onProjectCreated(saved)
      setSubmittedProject({ ...saved, status: "PENDING_REVIEW" })
    })

  // บันทึกร่างได้ทุกขั้นตอน โดยไม่บังคับกรอกครบ
  const handleSaveDraft = () => onFormSubmit(getValues(), true)

  // --------------------------------------------------------------------------
  // ส่งออก Word: บันทึกแบบร่างก่อน แล้วดาวน์โหลดไฟล์ที่สร้างจากแบบฟอร์มจริงของปีงบ
  // (ไฟล์เดียวกับที่เจ้าหน้าที่แผนจะอนุมัติ)
  // --------------------------------------------------------------------------
  const handleDownloadWordDoc = () =>
    runExclusive(async () => {
      try {
        const saved = await saveProject(getValues())
        await planService.previewDocument(saved.id)
      } catch (e) {
        console.error(e)
        alert(e instanceof ApiError ? `ส่งออก Word ไม่สำเร็จ: ${e.detail}` : "ส่งออก Word ไม่สำเร็จ")
      }
    })

  // หลังส่งตรวจแล้วแก้ไม่ได้ จึงดาวน์โหลดจากข้อมูลที่บันทึกไว้โดยไม่บันทึกซ้ำ
  const handleDownloadSubmittedWord = async (code: string) => {
    try {
      await planService.previewDocument(code)
    } catch (e) {
      alert(e instanceof ApiError ? `ส่งออก Word ไม่สำเร็จ: ${e.detail}` : "ส่งออก Word ไม่สำเร็จ")
    }
  }

  return (
    <div
      className={`mx-auto space-y-4 pb-4 lg:space-y-6 lg:pb-20 ${showBeside ? "max-w-[1680px]" : "max-w-6xl"}`}
      onChange={() => {
        if (!unsaved) setUnsaved(true)
      }}
    >
      {/* Page Header */}
      <PageHeader
        eyebrow={isEditing ? `แก้ไขโครงการ ${initialProject?.id}` : "เสนอโครงการ"}
        title={isEditing ? "แก้ไขโครงการ" : "เสนอโครงการใหม่"}
        description="กรอกตามแบบฟอร์มโครงการ 14 ข้อของมหาวิทยาลัย — บันทึกแบบร่างได้ทุกขั้นตอน แล้วส่งให้เจ้าหน้าที่แผนตรวจเมื่อพร้อม"
        onBack={() => onNavigate("projects")}
      />

      {initialProject?.status === "REVISION_REQUESTED" && initialProject.lastReason && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="font-bold">เจ้าหน้าที่แผนตีกลับให้แก้ไข</div>
          <div className="mt-1 whitespace-pre-line">{initialProject.lastReason}</div>
        </div>
      )}

      {importedForm && !isEditing && (
        <div data-testid="import-summary" className="rounded-2xl border border-line bg-white p-4 text-xs text-ink shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <Icon name="check" size={16} className="text-brand-2" />
            นำเข้าข้อมูลจากไฟล์แล้ว — ตรวจทานทุกขั้นก่อนบันทึก
          </div>
          <p className="mt-1 text-muted">
            ระบบยังไม่ได้บันทึกจนกว่าจะกด "บันทึกแบบร่าง" หรือส่งให้เจ้าหน้าที่ตรวจ · ค่าใช้จ่ายข้อ 9 นำเข้าเป็นยอดต่อหมวด แตกตัวคูณเพิ่มได้ในขั้นที่ 4
          </p>
          {importWarnings.length > 0 && (
            <ul data-testid="import-warnings" className="mt-2 space-y-1">
              {importWarnings.map((warning) => (
                <li key={warning} className="flex items-start gap-2 text-amber-800">
                  <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* แถบขั้นตอน + บันทึกแบบร่าง ติดด้านบนขณะเลื่อนหน้า */}
      <div
        data-testid="wizard-progress"
        className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 -mt-4 border-b border-line bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:top-16 lg:mx-0 lg:mt-0 lg:rounded-2xl lg:border lg:p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="hidden lg:block">
              <Stepper
                steps={WIZARD_STEPS}
                currentStep={currentStep}
                onStepClick={(s) => {
                  if (s < currentStep) setCurrentStep(s)
                }}
              />
            </div>
            <div className="lg:hidden">
              <div className="text-[11px] font-semibold text-brand-2">
                ขั้นที่ {currentStep} จาก {WIZARD_STEPS.length} · {WIZARD_STEPS[currentStep - 1].description}
              </div>
              <div className="truncate text-sm font-bold text-ink">{WIZARD_STEPS[currentStep - 1].title}</div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {wideScreen && !previewBeside && (
                <Button
                  variant="outline"
                  size="sm"
                  icon="eye"
                  type="button"
                  data-testid="show-form-preview"
                  onClick={() => {
                    setPreviewBeside(true)
                    rememberPreviewBeside(true)
                  }}
                >
                  ดูตัวอย่างแบบฟอร์ม
                </Button>
              )}
              <Button variant="outline" size="sm" icon="check" type="button" onClick={handleSaveDraft} disabled={isSubmitting || isSaving}>
                บันทึกแบบร่าง
              </Button>
            </div>
            <span data-testid="save-status" className="text-[11px] text-muted">
              {isSaving
                ? "กำลังบันทึก..."
                : lastSavedAt
                  ? `บันทึกแล้ว ${lastSavedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`
                  : persistedRef.current
                    ? "แก้ไขแล้วกดบันทึกแบบร่าง"
                    : "ยังไม่ได้บันทึก"}
            </span>
          </div>
        </div>
      </div>

      <div className={showBeside ? "grid grid-cols-[minmax(0,1fr)_minmax(0,46%)] items-start gap-6" : ""}>
      <form className="min-w-0" onSubmit={handleSubmit((d) => onFormSubmit(d, false))}>
        {/* ========================================================================= */}
        {/* STEP 1: Core Data & Project Category (ข้อ 1-2 & 5)                          */}
        {/* ========================================================================= */}
        {currentStep === 1 && !isEditing && onImported && (
          <DocxImportCard
            onImported={onImported}
            confirmReplace={() =>
              !(watchedTitle || "").trim() || window.confirm("ข้อมูลที่กรอกไว้ในหน้านี้จะถูกแทนที่ด้วยข้อมูลจากไฟล์ ต้องการนำเข้าหรือไม่?")
            }
          />
        )}

        {currentStep === 1 && (
          <Card className="p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-sm">
            <div className="hidden border-b border-line pb-3 lg:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                ขั้นตอนที่ 1 จาก 5
              </span>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                ข้อมูลโครงการและหลักการเหตุผล (ข้อ 1, 2 และ 5)
              </h2>
              <p className="text-xs text-muted">
                ข้อมูลผู้เสนอมาจากบัญชีที่เข้าสู่ระบบ
              </p>
            </div>

            {yearConfigError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
                {yearConfigError} — เลือกปีงบประมาณที่ตั้งค่าแล้ว หรือแจ้งเจ้าหน้าที่แผน
              </div>
            )}

            {/* Applicant SSO Badge */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white font-bold text-sm">
                  {me.name.replace(/^(อ\.|ผศ\.|รศ\.|ดร\.|นาย|นางสาว|นาง)+/, "").slice(0, 2)}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                    ผู้เสนอโครงการ (จากบัญชีที่เข้าสู่ระบบ)
                  </span>
                  <div className="text-sm font-bold text-brand">
                    {me.name}{me.position ? ` (${me.position})` : ""}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    {me.department ? `สาขาวิชา${me.department} · ` : ""}{facultyName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">ปีงบประมาณ:</span>
                <select
                  {...register("fiscalYear", { valueAsNumber: true })}
                  className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-center font-bold text-emerald-900 text-xs"
                >
                  {(fiscalYears.includes(watchedFiscalYear) ? fiscalYears : [watchedFiscalYear, ...fiscalYears]).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Category Selection */}
            <Field label="ประเภทโครงการ (ตามแบบฟอร์ม มรภ.ชัยภูมิ)" required>
              <select
                {...register("projectCategory")}
                className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {(yearConfig?.project_categories || []).map((category) => (
                  <option key={category.code} value={category.code}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Other Category Detail Input */}
            {watchedProjectCategory === "other" && (
              <Field label="ระบุรายละเอียดประเภทโครงการ / แหล่งงบประมาณภายนอก" required hint="เช่น ทุนสนับสนุนวิจัย บพท., กองทุน ววน., เงินอุดหนุน อบจ.">
                <input
                  type="text"
                  placeholder="เช่น ทุนสนับสนุนการวิจัยและนวัตกรรมเพื่อการพัฒนาเชิงพื้นที่ (บพท.)"
                  {...register("projectCategoryOther")}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </Field>
            )}

            {/* Title (Section 1) */}
            <Field label="1. ชื่อโครงการ" required>
              <input
                type="text"
                {...register("title")}
                placeholder="เช่น โครงการอบรมเชิงปฏิบัติการพัฒนาทักษะดิจิทัลและ AI สำหรับนักศึกษา ประจำปี 2570"
                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 ${
                  errors.title ? "border-rose-400 focus:ring-rose-200" : "border-line-strong focus:ring-brand/20"
                }`}
              />
              {errors.title && (
                <p className="text-rose-600 text-[11px] mt-1 font-semibold">{errors.title.message}</p>
              )}
            </Field>

            {/* Department (Section 2) */}
            <Field label="2. หน่วยงานที่ดำเนินการ" required hint="ใส่ให้จากสังกัดของอาจารย์ แก้เป็นศูนย์หรือกลุ่มวิจัยได้">
              <input
                type="text"
                {...register("department")}
                placeholder="เช่น คณะศิลปศาสตร์และวิทยาศาสตร์ (สาขาวิชาเทคโนโลยีสารสนเทศ)"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 ${
                  errors.department ? "border-rose-400 focus:ring-rose-200" : "border-line-strong focus:ring-brand/20"
                }`}
              />
              {errors.department && (
                <p className="text-rose-600 text-[11px] mt-1 font-semibold">{errors.department.message}</p>
              )}
            </Field>

            {/* Activity Dates & Target Group */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="วันที่เริ่มกิจกรรม" required error={errors.startDate?.message}>
                  <input
                    type="date"
                    {...register("startDate")}
                    className="w-full rounded-xl border border-line-strong px-3.5 py-2 text-xs font-medium"
                  />
                </Field>
                <Field label="วันที่สิ้นสุดกิจกรรม" required error={errors.endDate?.message}>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="w-full rounded-xl border border-line-strong px-3.5 py-2 text-xs font-medium"
                  />
                </Field>
              </div>

              <Field label="กลุ่มเป้าหมายผู้เข้าร่วม" required error={errors.targetGroup?.message}>
                <input
                  type="text"
                  {...register("targetGroup")}
                  placeholder="เช่น นักศึกษาและอาจารย์ จำนวน 50 คน"
                  className="w-full rounded-xl border border-line-strong px-3.5 py-2 text-xs"
                />
              </Field>
            </div>

            {/* Section 5: Background & Rationale (3 paragraphs) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>ข้อ 5. หลักการและเหตุผล (3 ย่อหน้าตามแบบฟอร์ม)</span>
              </h3>

              <div className="space-y-3">
                <Field label="ย่อหน้าที่ 1: ที่มา สาเหตุของปัญหา หรือเหตุผลที่ต้องดำเนินโครงการ" required error={errors.backgroundProblem?.message}>
                  <textarea
                    rows={2}
                    {...register("backgroundProblem")}
                    placeholder="อ้างที่มา สาเหตุของปัญหา..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-brand"
                  />
                </Field>

                <Field label="ย่อหน้าที่ 2: จากปัญหาในย่อหน้าแรก หน่วยงานจำเป็นต้องลดหรือแก้ปัญหานั้นอย่างไร" required error={errors.backgroundSolution?.message}>
                  <textarea
                    rows={2}
                    {...register("backgroundSolution")}
                    placeholder="หน่วยงานจึงจำเป็นจะต้องลดหรือแก้ปัญหานั้นโดย..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-brand"
                  />
                </Field>

                <Field label="ย่อหน้าที่ 3: กลุ่มเป้าหมาย วัตถุประสงค์ และสิ่งที่จะเกิดขึ้นหรือเปลี่ยนแปลง" required error={errors.backgroundImpact?.message}>
                  <textarea
                    rows={2}
                    {...register("backgroundImpact")}
                    placeholder="สิ่งที่จะเกิดขึ้นหรือเปลี่ยนแปลงจากสิ่งที่ทำ..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-brand"
                  />
                </Field>
              </div>
            </div>

            <div className={`flex justify-end pt-4 border-t border-line ${PHONE_STEP_BAR}`}>
              {/* ขั้นถัดไปใช้แผนยุทธศาสตร์ของปีงบ — รอโหลดเสร็จก่อน (กดเร็วเกินเคยได้ข้อความ "กำลังโหลด" แล้วไม่ไปต่อ) */}
              <Button
                variant="primary"
                size="md"
                onClick={handleGoToNextStep}
                type="button"
                iconRight="chevron"
                className="max-lg:flex-1"
                disabled={yearConfigLoading}
              >
                {yearConfigLoading ? "กำลังโหลดแผนยุทธศาสตร์..." : "ถัดไป: ยุทธศาสตร์"}
              </Button>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Strategic Alignment (ข้อ 3 & 4)                                   */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <Card className="p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-sm">
            <div className="hidden border-b border-line pb-3 lg:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                ขั้นตอนที่ 2 จาก 5
              </span>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                ความสอดคล้องเชิงยุทธศาสตร์ 5 ปี (ข้อ 3 และ 4)
              </h2>
              <p className="text-xs text-muted">
                ติ๊กเลือกความสอดคล้องกับแผนระดับมหาวิทยาลัย (ข้อ 3) และระดับคณะ (ข้อ 4) โดยไม่ต้องพิมพ์ใหม่
              </p>
            </div>

            {yearConfig ? (
            <StrategicAlignmentStep
              config={yearConfig}
              selectedUniMissions={selectedUniMissions}
              onChangeUniMissions={setSelectedUniMissions}
              selectedUniStrategies={selectedUniStrategies}
              onChangeUniStrategies={setSelectedUniStrategies}
              facultyName={facultyName}
              selectedFacultyMissions={selectedFacultyMissions}
              onChangeFacultyMissions={setSelectedFacultyMissions}
              selectedFacultyStrategies={selectedFacultyStrategies}
              onChangeFacultyStrategies={setSelectedFacultyStrategies}
            />
            ) : (
              <div className="py-10 text-center text-xs text-muted">
                {yearConfigLoading ? "กำลังโหลดแผนยุทธศาสตร์ของปีงบประมาณ..." : yearConfigError}
              </div>
            )}

            <div className={`flex justify-between gap-3 pt-4 border-t border-line ${PHONE_STEP_BAR}`}>
              <Button variant="outline" size="md" onClick={() => setCurrentStep(1)} type="button">
                ย้อนกลับ
              </Button>
              <Button variant="primary" size="md" onClick={handleGoToNextStep} type="button" iconRight="chevron" className="max-lg:flex-1">
                ถัดไป: กิจกรรมและ OKR
              </Button>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Activities & OKRs (ข้อ 6, 7 & 8)                                  */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <Card className="p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-sm">
            <div className="hidden border-b border-line pb-3 lg:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                ขั้นตอนที่ 3 จาก 5
              </span>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                วัตถุประสงค์ (OKR) กิจกรรม และวิธีดำเนินงาน (ข้อ 6, 7 และ 8)
              </h2>
              <p className="text-xs text-muted">
                สามารถเพิ่ม 1 กิจกรรม หรือหลายกิจกรรมย่อยได้ตามโครงสร้างแผนงานของโครงการ
              </p>
            </div>

            <OkrTable okrs={okrs} onChange={setOkrs} />

            <ActivityDefinitionStep
              activities={activities}
              onChange={setActivities}
              fiscalYear={watchedFiscalYear}
            />

            <div className={`flex justify-between gap-3 pt-4 border-t border-line ${PHONE_STEP_BAR}`}>
              <Button variant="outline" size="md" onClick={() => setCurrentStep(2)} type="button">
                ย้อนกลับ
              </Button>
              <Button variant="primary" size="md" onClick={handleGoToNextStep} type="button" iconRight="chevron" className="max-lg:flex-1">
                ถัดไป: งบประมาณ
              </Button>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: Smart Budget Multiplier Grid (ข้อ 9)                              */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <Card className="p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-sm">
            <div className="hidden border-b border-line pb-3 lg:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                ขั้นตอนที่ 4 จาก 5
              </span>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                ตารางรายละเอียดแตกตัวคูณงบประมาณ (ข้อ 9)
              </h2>
              <p className="text-xs text-muted">
                สูตรมาตรฐาน: <strong>[กลุ่มเป้าหมาย] × [ระยะเวลา] × [เรทบาท] × [จำนวนครั้ง] = [ยอดรวม]</strong> คำนวณสดและส่งออก Excel ได้ทันที
              </p>
            </div>

            <BudgetMultiplierGrid
              items={multiplierItems}
              onChange={setMultiplierItems}
              projectName={watchedTitle}
              fiscalYear={watchedFiscalYear}
              facultyOrUnit={facultyName}
              expenseCategories={yearConfig?.expense_categories || []}
              budgetSources={yearConfig?.budget_sources || []}
              activities={activities.map((a) => ({ id: a.id, name: a.name }))}
            />

            {offBudgetTotal > 0 && (
              <Field label="ข้อ 9: งบประมาณ อื่น ๆ — ระบุที่มาของแหล่งงบประมาณ" required hint="พิมพ์ต่อท้ายบรรทัดงบประมาณอื่น ๆ ในเอกสาร">
                <input
                  type="text"
                  data-testid="off-budget-detail"
                  value={offBudgetDetail}
                  onChange={(e) => setOffBudgetDetail(e.target.value)}
                  placeholder={watch("projectCategoryOther") || "เช่น ทุนสนับสนุนการวิจัย บพท., เงินอุดหนุน อบจ."}
                  className="w-full rounded-xl border border-line-strong px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </Field>
            )}

            {/* Budget Alignment Guardrail between Section 7 and Section 9 */}
            <div className={`rounded-xl border p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isBudgetAligned
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}>
              <div className="flex items-center gap-2.5">
                <Icon name={isBudgetAligned ? "check" : "alert"} size={18} className="shrink-0" />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>งบกิจกรรมข้อ 7 กับรายการค่าใช้จ่ายข้อ 9:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isBudgetAligned ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"
                    }`}>
                      {isBudgetAligned ? "ตรงกัน" : "ยอดรวมยังไม่ตรงกัน"}
                    </span>
                  </div>
                  <div className="text-[11px] mt-0.5 text-slate-600">
                    {activities.length === 1 ? (
                      <span>โครงการ 1 กิจกรรม: ยอดงบกิจกรรมในข้อ 7 ผูกติดและซิงค์อัตโนมัติกับยอดแตกตัวคูณข้อ 9 (<strong>฿{formatMoney(grandTotalAmount)}</strong>)</span>
                    ) : (
                      <span>
                        ผลรวมงบกิจกรรมข้อ 7: <strong>฿{formatMoney(sumOfActivityBudgets)}</strong> | ยอดรวมแตกตัวคูณข้อ 9: <strong>฿{formatMoney(grandTotalAmount)}</strong>
                        {!isBudgetAligned && <span className="text-amber-800 font-bold ml-1">(ส่วนต่าง ฿{formatMoney(Math.abs(sumOfActivityBudgets - grandTotalAmount))})</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isBudgetAligned && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleAutoAlignBudgets}
                  className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 font-bold shadow-2xs whitespace-nowrap"
                >
                  ปรับยอดข้อ 7 ให้ตรงกับข้อ 9
                </Button>
              )}
            </div>

            <div className={`flex justify-between gap-3 pt-4 border-t border-line ${PHONE_STEP_BAR}`}>
              <Button variant="outline" size="md" onClick={() => setCurrentStep(3)} type="button">
                ย้อนกลับ
              </Button>
              <Button variant="primary" size="md" onClick={handleGoToNextStep} type="button" iconRight="chevron" className="max-lg:flex-1">
                ถัดไป: สรุปและส่ง
              </Button>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: Impacts, Personnel & Review (ข้อ 10-14)                           */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <Card className="p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-sm">
            <div className="hidden border-b border-line pb-3 lg:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                ขั้นตอนที่ 5 จาก 5
              </span>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                ผลประโยชน์ ผู้รับผิดชอบ (ข้อ 10-14) และสรุปตรวจสอบ
              </h2>
              <p className="text-xs text-muted">
                ตรวจทานความถูกต้องก่อนส่งเสนอโครงการไปยังเจ้าหน้าที่นโยบายและแผน
              </p>
            </div>

            {/* Section 10: Impacts */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">10. ผลประโยชน์ที่คาดว่าจะได้รับ</h4>
                <button
                  type="button"
                  onClick={() => setImpacts([...impacts, ""])}
                  className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                >
                  + เพิ่มผลประโยชน์
                </button>
              </div>
              <div className="space-y-1.5">
                {impacts.map((imp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">10.{idx + 1}</span>
                    <input
                      type="text"
                      value={imp}
                      onChange={(e) => {
                        const newImp = [...impacts]
                        newImp[idx] = e.target.value
                        setImpacts(newImp)
                      }}
                      placeholder="เช่น ผู้เข้าร่วมนำความรู้ไปใช้ในการเรียนและการปฏิบัติงานได้"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
                    />
                    {impacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setImpacts(impacts.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 11: Evaluations */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">11. การติดตามและประเมินผล</h4>
                  <p className="text-[10px] text-slate-500">ข้อติดตามและรายงานผลต่อผู้บริหาร/กองนโยบายและแผน ระบบใส่ต่อท้ายให้ตามแบบฟอร์ม</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEvaluations([...evaluations, ""])}
                  className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                >
                  + เพิ่มการประเมิน
                </button>
              </div>
              <div className="space-y-1.5">
                {evaluations.map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">11.{idx + 1}</span>
                    <input
                      type="text"
                      value={ev}
                      onChange={(e) => {
                        const newEv = [...evaluations]
                        newEv[idx] = e.target.value
                        setEvaluations(newEv)
                      }}
                      placeholder="เช่น ประเมินความพึงพอใจ โดยใช้แบบประเมินความพึงพอใจ"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
                    />
                    {evaluations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEvaluations(evaluations.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sections 12-14: Personnel (100% Editable) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">12–14. ผู้รับผิดชอบและผู้กำกับติดตามโครงการ</h4>
              </div>
              <div className="space-y-3 text-xs">
                {/* Section 12: Leader */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">12. ผู้รับผิดชอบโครงการ</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={leaderName}
                      onChange={(e) => setLeaderName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                    />
                    <input
                      type="text"
                      value={leaderPosition}
                      onChange={(e) => setLeaderPosition(e.target.value)}
                      placeholder="ตำแหน่ง เช่น อาจารย์ประจำสาขาวิชา"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-brand"
                    />
                    <input
                      type="text"
                      value={leaderPhone}
                      onChange={(e) => setLeaderPhone(e.target.value)}
                      placeholder="เบอร์โทร เช่น 081-234-5678"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Section 13: Co-Leaders (รายบุคคล) */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2" data-testid="co-leaders">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">13. ผู้รับผิดชอบร่วม</span>
                    <button
                      type="button"
                      onClick={() => setCoLeaders((prev) => [...prev, { name: "", position: "", phone: "" }])}
                      className="text-[11px] font-bold text-brand hover:underline"
                    >
                      + เพิ่มผู้รับผิดชอบร่วม
                    </button>
                  </div>
                  {coLeaders.map((person, index) => (
                    <div key={index} className="flex items-center gap-2" data-testid="co-leader-row">
                      <span className="w-5 text-right text-[11px] font-bold text-slate-400">{index + 1}.</span>
                      <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updateCoLeader(index, { name: e.target.value })}
                          placeholder="ชื่อ-นามสกุล"
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                        />
                        <input
                          type="text"
                          value={person.position}
                          onChange={(e) => updateCoLeader(index, { position: e.target.value })}
                          placeholder="ตำแหน่ง"
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-brand"
                        />
                        <input
                          type="text"
                          value={person.phone}
                          onChange={(e) => updateCoLeader(index, { phone: e.target.value })}
                          placeholder="เบอร์โทร"
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-brand"
                        />
                      </div>
                      {coLeaders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCoLeaders((prev) => prev.filter((_, i) => i !== index))}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="ลบรายชื่อนี้"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <span className="text-[10px] text-slate-400">* แถวที่ไม่กรอกชื่อจะไม่แสดงในเอกสาร</span>
                </div>

                {/* Section 14: Supervisor (แบบฟอร์มมีชื่อและตำแหน่ง) */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">14. ผู้กำกับติดตามโครงการ</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                      data-testid="supervisor-name"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                    />
                    <input
                      type="text"
                      value={supervisorPosition}
                      onChange={(e) => setSupervisorPosition(e.target.value)}
                      placeholder="ตำแหน่ง เช่น คณบดี"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Review Card */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/30 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    ตรวจสอบภาพรวมก่อนส่งเรื่อง
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{watchedTitle}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-800 font-mono">
                    ฿{formatMoney(grandTotalAmount)}
                  </span>
                  <div className="text-[11px] text-emerald-700">(-{thaiBahtText}-)</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">ยุทธศาสตร์ มรภ.ชัยภูมิ:</span>
                  <span className="font-bold text-slate-800">
                    พันธกิจ {selectedUniMissions.length} ข้อ / ยุทธศาสตร์ {selectedUniStrategies.length} ข้อ
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">ยุทธศาสตร์ {facultyName}:</span>
                  <span className="font-bold text-slate-800">
                    พันธกิจ {selectedFacultyMissions.length} ข้อ / ยุทธศาสตร์ {selectedFacultyStrategies.length} ข้อ
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">จำนวนกิจกรรม (ข้อ 7):</span>
                  <span className="font-bold text-slate-800">{activities.length} กิจกรรม</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">รายการแตกตัวคูณ (ข้อ 9):</span>
                  <span className="font-bold text-emerald-700">{multiplierItems.length} รายการ</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">งบข้อ 7 กับข้อ 9:</span>
                  <span className={`font-bold flex items-center gap-1 ${isBudgetAligned ? "text-emerald-700" : "text-amber-700"}`}>
                    {isBudgetAligned ? "ตรงกัน" : `ต่างกัน ฿${formatMoney(Math.abs(sumOfActivityBudgets - grandTotalAmount))}`}
                  </span>
                </div>
              </div>
            </div>

            {/* ขั้นตอนหลังส่ง (ตาม workflow จริงของระบบ) */}
            <div className="space-y-2 rounded-xl border border-line bg-brand-soft/50 p-4 text-xs text-ink">
              <div className="font-bold">หลังส่งแล้ว โครงการจะไปตามขั้นตอนนี้</div>
              <ol className="flex flex-wrap items-center gap-2 text-[11px]">
                {[
                  "เจ้าหน้าที่แผนตรวจและอนุมัติ",
                  "อาจารย์ดาวน์โหลดไฟล์ไปพิมพ์และลงนาม",
                  "เดินเอกสารให้หัวหน้างานแผนและคณบดีลงนาม",
                  "เจ้าหน้าที่อัปโหลดสแกน — งบพร้อมใช้",
                ].map((step, index) => (
                  <li key={step} className="flex items-center gap-2">
                    {index > 0 && <Icon name="chevron" size={14} className="text-muted" />}
                    <span className="rounded-lg border border-line bg-white px-2.5 py-1 font-semibold">
                      {index + 1}. {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Bar — มือถือ: ปุ่มส่งออกอยู่ในเนื้อหา ปุ่มย้อนกลับ/ส่งตรวจติดอยู่ล่างจอ */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-4 border-t border-line">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(4)} type="button" className="max-lg:hidden">
                ย้อนกลับไปแก้ไข
              </Button>

              <div className="flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={handleDownloadWordDoc}
                  disabled={isSubmitting || isSaving}
                  icon="download"
                  className="border-brand text-brand hover:bg-brand/5"
                >
                  ส่งออก Word ตามแบบฟอร์ม
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() =>
                    exportMultiplierToExcel({
                      projectName: watchedTitle,
                      fiscalYear: watchedFiscalYear,
                      facultyOrUnit: facultyName,
                      multiplierItems,
                      expenseCategories: yearConfig?.expense_categories,
                      budgetSources: yearConfig?.budget_sources,
                    })
                  }
                  icon="download"
                >
                  ส่งออก Excel รายการค่าใช้จ่าย
                </Button>

                <Button
                  variant="accent"
                  size="lg"
                  icon="send"
                  type="submit"
                  disabled={isSubmitting || isSaving}
                  className="max-lg:hidden"
                >
                  {isSubmitting || isSaving ? "กำลังส่ง..." : "บันทึกและส่งให้เจ้าหน้าที่ตรวจ"}
                </Button>
              </div>
            </div>
            <div className={`flex gap-3 lg:hidden ${PHONE_STEP_BAR}`}>
              <Button variant="outline" size="md" onClick={() => setCurrentStep(4)} type="button">
                ย้อนกลับ
              </Button>
              <Button variant="accent" size="md" icon="send" type="submit" disabled={isSubmitting || isSaving} className="flex-1">
                {isSubmitting || isSaving ? "กำลังส่ง..." : "ส่งให้เจ้าหน้าที่ตรวจ"}
              </Button>
            </div>
          </Card>
        )}
      </form>
      {showBeside && (
        <aside className="sticky top-44 h-[calc(100dvh-12rem)]" aria-label="ตัวอย่างแบบฟอร์ม">
          <FormPreview
            {...previewProps}
            onClose={() => {
              setPreviewBeside(false)
              rememberPreviewBeside(false)
            }}
            closeLabel="ซ่อนตัวอย่างแบบฟอร์ม"
          />
        </aside>
      )}
      </div>

      {/* จอแคบ: ปุ่มลอยเปิดตัวอย่างเต็มจอ (อยู่เหนือแถบปุ่มถัดไป/ย้อนกลับ) */}
      {!wideScreen && (
        <>
          <button
            type="button"
            data-testid="open-form-preview"
            onClick={() => setPreviewSheetOpen(true)}
            className="fixed right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-1 rounded-full bg-brand px-3 py-2 text-xs font-bold text-white shadow-lg lg:bottom-6"
          >
            <Icon name="eye" size={16} />
            ดูแบบฟอร์ม
          </button>
          <FormPreviewSheet {...previewProps} open={previewSheetOpen} onClose={() => setPreviewSheetOpen(false)} />
        </>
      )}

      {/* Submission Success Modal */}
      {submittedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 text-brand">
              <Icon name="check" size={32} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-900">
                ส่งเสนอโครงการสำเร็จแล้ว
              </h3>
              <p className="text-xs text-slate-500">
                ระบบส่งโครงการให้เจ้าหน้าที่แผนตรวจแล้ว ติดตามสถานะได้ที่หน้า "งานของฉัน"
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">รหัสโครงการ:</span>
                <span className="font-mono font-bold text-brand">{submittedProject.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ชื่อโครงการ:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[260px]">
                  {submittedProject.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วงเงินงบประมาณทั้งสิ้น:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ฿{formatMoney(submittedProject.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">สถานะปัจจุบัน:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                  รอเจ้าหน้าที่แผนตรวจสอบ
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                icon="download"
                onClick={() => handleDownloadSubmittedWord(submittedProject.id)}
              >
                ดาวน์โหลดไฟล์ Word
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  onProjectCreated(submittedProject)
                  onNavigate("projects")
                }}
              >
                ไปที่รายการโครงการ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

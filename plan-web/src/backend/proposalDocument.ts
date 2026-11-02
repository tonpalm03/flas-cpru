/**
 * ข้อมูลโครงการ → ค่าของ tag ในแบบฟอร์มโครงร่างโครงการ (.docx) ของปีงบประมาณ
 * แปลงจาก backend/services/proposal_document.py ของระบบเดิมแบบบรรทัดต่อบรรทัด ให้เอกสารออกมาเหมือนเดิม
 */
import { FiscalYearConfig } from "../types/plan"
import { bahtText } from "./thaiBaht"

// อักขระฟอนต์ Wingdings แบบเดียวกับแบบฟอร์มต้นฉบับ: þ = ☑, r = ☐
const MARK_CHECKED = "þ"
const MARK_UNCHECKED = "r"

const UNASSIGNED_ACTIVITY = "ค่าใช้จ่ายที่ไม่ระบุกิจกรรม"

const THAI_MONTHS: Record<number, string> = {
  1: "มกราคม", 2: "กุมภาพันธ์", 3: "มีนาคม", 4: "เมษายน", 5: "พฤษภาคม", 6: "มิถุนายน",
  7: "กรกฎาคม", 8: "สิงหาคม", 9: "กันยายน", 10: "ตุลาคม", 11: "พฤศจิกายน", 12: "ธันวาคม",
}
// ร่างรุ่นก่อนเก็บ "(ไตรมาส N)" ไว้ท้ายช่วงเดือน — แบบฟอร์มพิมพ์ไตรมาสอีกบรรทัดอยู่แล้ว
const LEGACY_QUARTER_SUFFIX = /\s*\(ไตรมาส[^)]*\)\s*$/

export const PROVIDED_TAGS = new Set([
  "fiscal_year", "project_code", "project_name", "department_name",
  "cat_mark", "source_mark", "project_category_other",
  "university_plan_title", "university_missions", "university_strategies",
  "faculty_name", "faculty_plan_title", "faculty_missions", "faculty_strategies",
  "rationale_problem", "rationale_solution", "rationale_impact",
  "okrs", "activities",
  "budget_by_source", "budget_other_source", "total_budget", "total_budget_text", "budget_activities",
  "multiplier_groups",
  "impacts", "evaluations",
  "owner_name", "owner_position", "owner_phone", "co_leaders",
  "supervisor_name", "supervisor_position",
])

/** ข้อมูลโครงการไม่ตรงกับการตั้งค่าของปีงบ */
export class DocumentDataError extends Error {}

type Dict = Record<string, any>

/** โครงการที่ใช้สร้างเอกสาร (แถวโครงการ หรือข้อมูลที่กำลังกรอกที่ยังไม่บันทึก) */
export interface DocumentProject {
  project_code?: string
  title?: string
  department?: string
  faculty?: string
  owner?: string
  total_amount?: number
  form_data?: Dict
}

function withCommas(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/** เหมือน f"{x:,.Nf}" ของ Python */
function fixed(amount: number, decimals: number): string {
  const [whole, fraction] = Math.abs(amount).toFixed(decimals).split(".")
  const sign = amount < 0 && Number(Math.abs(amount).toFixed(decimals)) !== 0 ? "-" : ""
  return sign + withCommas(whole) + (fraction ? `.${fraction}` : "")
}

const round2 = (value: number) => Number(value.toFixed(2))

export function formatMoney(value: unknown): string {
  const amount = round2(number(value))
  if (amount === 0) return "-"
  return Number.isInteger(amount) ? fixed(amount, 0) : fixed(amount, 2)
}

function number(value: unknown): number {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function text(value: unknown): string {
  return String(value || "").trim()
}

function projectCategoryCode(form: Dict, config: FiscalYearConfig): string {
  const code = form.projectCategoryCode
  const label = text(form.projectCategory)
  for (const category of config.project_categories) {
    if (code && category.code === code) return category.code
  }
  for (const category of config.project_categories) {
    if (label && (label === category.label || (category.aliases || []).includes(label))) return category.code
  }
  throw new DocumentDataError(`ประเภทโครงการ '${code || label}' ไม่มีในการตั้งค่าปีงบประมาณ ${config.fiscal_year}`)
}

function planItems(items: { id: number; text: string }[], selectedIds: unknown): Dict[] {
  const selected = new Set(Array.isArray(selectedIds) ? selectedIds : [])
  return items.map((item) => ({ no: item.id, text: item.text, mark: selected.has(item.id) ? MARK_CHECKED : MARK_UNCHECKED }))
}

function activityDefinitions(form: Dict): Dict[] {
  if (Array.isArray(form.activityDefinitions) && form.activityDefinitions.length) return form.activityDefinitions
  const methods = new Map<unknown, Dict>((form.activityMethods || []).map((m: Dict) => [m.id, m]))
  return (form.activities || []).map((activity: Dict) => ({
    ...activity,
    methods: methods.get(activity.id)?.methods ?? [],
    kpi: methods.get(activity.id)?.kpi ?? "",
    budgetAmount: activity.amount,
  }))
}

function validatedItems(form: Dict, config: FiscalYearConfig): Dict[] {
  const categoryCodes = new Set(config.expense_categories.map((c) => c.code))
  const sourceCodes = new Set(config.budget_sources.map((s) => s.code))
  const items: Dict[] = form.multiplierItems || []
  for (const item of items) {
    const name = text(item.name) || text(item.id)
    if (!categoryCodes.has(item.category)) {
      throw new DocumentDataError(
        `รายการ '${name}' ใช้หมวดรายจ่าย '${item.category}' ซึ่งไม่มีในการตั้งค่าปีงบประมาณ ${config.fiscal_year}`,
      )
    }
    if (!sourceCodes.has(item.fundSource)) {
      throw new DocumentDataError(
        `รายการ '${name}' ใช้แหล่งงบ '${item.fundSource}' ซึ่งไม่มีในการตั้งค่าปีงบประมาณ ${config.fiscal_year}`,
      )
    }
  }
  return items
}

/** ให้ชื่อกิจกรรมขึ้นต้นด้วย "กิจกรรมที่ N :" ตามแบบฟอร์มเสมอ */
function activityName(index: number, name: string): string {
  return name.startsWith("กิจกรรมที่") ? name : `กิจกรรมที่ ${index} : ${name}`
}

/** ชื่อกิจกรรมตามด้วยรายการย่อย ("- ...") แบบที่ใช้ในข้อ 7, 8 และ 9 ของแบบฟอร์ม */
function activityTitle(index: number, definition: Dict): string {
  const lines = [activityName(index, text(definition.name))]
  for (const item of (definition.subItems || []).map(text)) if (item) lines.push(`- ${item}`)
  return lines.join("\n")
}

/** ต่อท้าย "กลุ่มเป้าหมาย": แยกเป็นบรรทัดตามกลุ่มที่มีชื่อ หรือจำนวนรวมถ้าไม่ได้แยกกลุ่ม
 * กลุ่มที่ไม่ใส่จำนวนพิมพ์แค่ชื่อ (ใช้กับหน่วยอื่นที่ไม่ใช่คน เช่น "ร้านจำหน่ายอาหาร 20 ร้าน") */
function targetText(definition: Dict): string {
  const groups: [string, number][] = (definition.targetGroups || []).map((g: Dict) => [text(g.name), Math.trunc(number(g.count))])
  const named = groups.filter(([name]) => name)
  if (named.length) return named.map(([name, count]) => (count ? `\n    - ${name} ${fixed(count, 0)} คน` : `\n    - ${name}`)).join("")
  const total = groups.length ? groups.reduce((sum, [, count]) => sum + count, 0) : Math.trunc(number(definition.targetCount))
  return total ? ` ${fixed(total, 0)} คน` : ""
}

function month(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : /^\s*-?\d+\s*$/.test(String(value ?? "")) ? Number(value) : NaN
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null
}

/** ลำดับเดือนในปีงบประมาณ: ต.ค. = 0 ... ก.ย. = 11 */
const fiscalIndex = (m: number) => (((m - 10) % 12) + 12) % 12

/** (ช่วงเดือน, ไตรมาส) เช่น ("มกราคม – กันยายน 70", "2,3,4") — ไตรมาสคำนวณจากเดือนเสมอ */
function period(definition: Dict, fiscalYear: number): [string, string] {
  const start = month(definition.startMonth)
  const end = month(definition.endMonth)
  if (start === null || end === null) {
    return [text(definition.monthRange).replace(LEGACY_QUARTER_SUFFIX, ""), text(definition.quarter)]
  }
  const [first, last] = [start, end].sort((a, b) => fiscalIndex(a) - fiscalIndex(b))
  const quarters = new Set<number>()
  for (let index = fiscalIndex(first); index <= fiscalIndex(last); index++) quarters.add(Math.floor(index / 3) + 1)
  const year = (m: number) => (m >= 10 ? fiscalYear - 1 : fiscalYear) % 100
  let range: string
  if (first === last) range = `${THAI_MONTHS[first]} ${year(first)}`
  else if (year(first) === year(last)) range = `${THAI_MONTHS[first]} – ${THAI_MONTHS[last]} ${year(last)}`
  else range = `${THAI_MONTHS[first]} ${year(first)} – ${THAI_MONTHS[last]} ${year(last)}`
  return [range, [...quarters].sort((a, b) => a - b).join(",")]
}

interface Group {
  name: string
  label: string
  no: number
  id: unknown
  unassigned?: boolean
  items: Dict[]
}

function groupItems(definitions: Dict[], items: Dict[]): Group[] {
  const groups: Group[] = definitions.map((d, i) => ({
    name: activityTitle(i + 1, d),
    label: activityName(i + 1, text(d.name)),
    no: i + 1,
    id: d.id,
    items: [],
  }))
  const byId = new Map(groups.map((g) => [g.id, g]))
  const unassigned: Dict[] = []
  for (const item of items) {
    const group = byId.get(item.activityId)
    if (group) group.items.push(item)
    else unassigned.push(item)
  }
  if (unassigned.length) {
    if (groups.length === 1) groups[0].items.push(...unassigned)
    else groups.push({ name: UNASSIGNED_ACTIVITY, label: UNASSIGNED_ACTIVITY, no: groups.length + 1, id: null, unassigned: true, items: unassigned })
  }
  return groups
}

const sum = (items: Dict[]) => items.reduce((total, i) => total + number(i.totalAmount), 0)

/** ผลรวมรายการแตกตัวคูณ (ยอดที่พิมพ์ในเอกสาร) — null ถ้าโครงการไม่มีรายการ */
export function lineItemsTotal(project: DocumentProject): number | null {
  const items = project.form_data?.multiplierItems
  if (!Array.isArray(items) || !items.length) return null
  return round2(sum(items))
}

function bySource(items: Dict[], config: FiscalYearConfig): Dict {
  return Object.fromEntries(config.budget_sources.map((s) => [s.code, formatMoney(sum(items.filter((i) => i.fundSource === s.code)))]))
}

function itemsText(items: Dict[]): string {
  const names = [...new Set(items.map((i) => text(i.name)).filter(Boolean))]
  return names.length ? `- ${names.join("/")}` : ""
}

function budgetActivity(group: Group, config: FiscalYearConfig): Dict {
  const categories: Dict[] = []
  for (const category of config.expense_categories) {
    const items = group.items.filter((i) => i.category === category.code)
    const total = sum(items)
    if (total <= 0) continue
    categories.push({
      label: category.label,
      by_source: bySource(items, config),
      total: formatMoney(total),
      // แบบฟอร์ม: บรรทัดเดียวคั่นด้วย "/" (ชื่อซ้ำแสดงครั้งเดียว)
      items_text: itemsText(items),
    })
  }
  return { name: group.name, by_source: bySource(group.items, config), total: formatMoney(sum(group.items)), categories }
}

/** จำนวนในตารางแตกตัวคูณ เช่น 1,000 หรือ 2.5 — ไม่ใส่ (0) เว้นว่าง */
function quantity(value: unknown): string {
  const amount = round2(number(value))
  if (amount === 0) return ""
  return Number.isInteger(amount) ? fixed(amount, 0) : fixed(amount, 2).replace(/0+$/, "")
}

/** กิจกรรมหนึ่งในตารางรายละเอียดแตกตัวคูณ (หน้าแนวนอนท้ายเอกสาร): กิจกรรม → หมวด → รายการ */
function multiplierGroup(group: Group, config: FiscalYearConfig): Dict {
  const categories: Dict[] = []
  for (const category of config.expense_categories) {
    const items = group.items.filter((i) => i.category === category.code)
    if (!items.length) continue
    categories.push({
      label: category.label,
      total: formatMoney(sum(items)),
      lines: items.map((i) => ({
        name: text(i.name),
        target_qty: quantity(i.targetQty),
        target_unit: text(i.targetUnit),
        duration_qty: quantity(i.durationQty),
        duration_unit: text(i.durationUnit),
        rate: formatMoney(i.unitRate),
        rate_unit: text(i.rateUnit) || "บาท",
        frequency_qty: quantity(i.frequencyQty),
        frequency_unit: text(i.frequencyUnit) || "ครั้ง",
        total: formatMoney(i.totalAmount),
      })),
    })
  }
  return { no: group.no, name: group.label, total: formatMoney(sum(group.items)), categories }
}

function coLeaders(form: Dict): Dict[] {
  let leaders = (form.coLeaders || [])
    .filter((p: Dict) => text(p.name))
    .map((p: Dict) => ({ name: text(p.name), position: text(p.position), phone: text(p.phone) }))
  if (!leaders.length && text(form.coLeadersText)) leaders = [{ name: text(form.coLeadersText), position: "", phone: "" }]
  return leaders
}

export function buildContext(project: DocumentProject, config: FiscalYearConfig): Dict {
  const form: Dict = project.form_data && typeof project.form_data === "object" ? project.form_data : {}

  const categoryCode = projectCategoryCode(form, config)

  const facultyName = text(form.facultyName) || text(project.faculty)
  const facultyPlan = config.faculty_plans[facultyName]
  if (!facultyPlan) throw new DocumentDataError(`ไม่พบแผนยุทธศาสตร์ของ '${facultyName}' ในการตั้งค่าปีงบประมาณ ${config.fiscal_year}`)

  const definitions = activityDefinitions(form)
  const items = validatedItems(form, config)
  const groups = groupItems(definitions, items)
  const groupById = new Map(groups.map((g) => [g.id, g]))

  let total: number
  let budgetActivities: Dict[] = []
  let multiplierGroups: Dict[] = []
  if (items.length) {
    total = sum(items)
    // กิจกรรมที่ไม่มีรายการค่าใช้จ่ายไม่ต้องแสดงในตารางข้อ 9
    budgetActivities = groups.filter((g) => g.items.length).map((g) => budgetActivity(g, config))
    multiplierGroups = groups.filter((g) => g.items.length).map((g) => multiplierGroup(g, config))
  } else {
    total = number(project.total_amount)
  }

  const activities = definitions.map((definition, i) => {
    const groupItemsList = groupById.get(definition.id)?.items || []
    // มีรายการแตกตัวคูณแล้ว → ใช้ยอดจากรายการเท่านั้น (ยอดที่พิมพ์เองใช้เฉพาะโครงการที่ยังไม่มีรายการ)
    const budget = items.length ? sum(groupItemsList) : number(definition.budgetAmount)
    const [range, quarters] = period(definition, config.fiscal_year)
    const committeeCount = Math.trunc(number(definition.committeeCount))
    return {
      no: i + 1,
      name: activityTitle(i + 1, definition),
      location: text(definition.location),
      // ไม่มีวิทยากร/คณะทำงาน → แบบฟอร์มไม่พิมพ์บรรทัดนั้น และกลุ่มเป้าหมายเลื่อนเป็นข้อ 2
      committee_count: committeeCount || "",
      target_no: committeeCount ? 3 : 2,
      target_text: targetText(definition),
      period: range,
      quarter: quarters,
      budget: formatMoney(budget),
      methods: (definition.methods || []).map(text).filter(Boolean),
      kpi: text(definition.kpi),
    }
  })

  const okrSource: Dict[] =
    Array.isArray(form.okrs) && form.okrs.length
      ? form.okrs
      : definitions.map((d) => ({ objective: d.objective, keyResult: d.okrKeyResult, target: d.okrTarget }))
  const okrs = okrSource.map((o, i) => ({ no: i + 1, objective: text(o.objective), key_result: text(o.keyResult), target: text(o.target) }))

  const leader: Dict = form.leader || {}
  const supervisor: Dict = form.supervisor || {}
  const budgetSources: Dict = form.budgetSources || {}

  return {
    fiscal_year: config.fiscal_year,
    project_code: text(project.project_code),
    project_name: text(project.title) || text(form.title),
    department_name: text(form.department) || text(project.department),
    cat_mark: Object.fromEntries(config.project_categories.map((c) => [c.code, c.code === categoryCode ? MARK_CHECKED : MARK_UNCHECKED])),
    source_mark: Object.fromEntries(
      config.budget_sources.map((s) => [
        s.code,
        items.some((i) => i.fundSource === s.code && number(i.totalAmount) > 0) ? MARK_CHECKED : MARK_UNCHECKED,
      ]),
    ),
    project_category_other: text(form.projectCategoryOther),
    university_plan_title: config.university_plan.title,
    university_missions: planItems(config.university_plan.missions, form.universityMissionIds),
    university_strategies: planItems(config.university_plan.strategies, form.universityStrategyIds),
    faculty_name: facultyName,
    faculty_plan_title: facultyPlan.title,
    faculty_missions: planItems(facultyPlan.missions, form.facultyMissionIds),
    faculty_strategies: planItems(facultyPlan.strategies, form.facultyStrategyIds),
    rationale_problem: text(form.backgroundProblem),
    rationale_solution: text(form.backgroundSolution),
    rationale_impact: text(form.backgroundImpact),
    okrs,
    activities,
    budget_by_source: bySource(items, config),
    budget_other_source: text(budgetSources.offBudgetDetail) || text(form.projectCategoryOther),
    total_budget: formatMoney(total),
    total_budget_text: bahtText(total),
    budget_activities: budgetActivities,
    multiplier_groups: multiplierGroups,
    impacts: (form.impacts || []).map(text).filter(Boolean),
    evaluations: (form.evaluations || []).map(text).filter(Boolean),
    owner_name: text(leader.name) || text(project.owner),
    owner_position: text(leader.position),
    owner_phone: text(leader.phone),
    co_leaders: coLeaders(form),
    supervisor_name: text(supervisor.name),
    supervisor_position: text(supervisor.position),
  }
}

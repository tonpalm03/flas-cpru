/**
 * ระบบแผน: แบบเสนอโครงการ มรภ.ชัยภูมิ (ข้อ 1-14) และสายงานตรวจโครงการ
 * อ้างอิงกติกาจากระบบแผนเดิมของทีม (FastCPRU/FastSystem) — ฟังก์ชันล้วน ไม่แตะฐานข้อมูล
 */
import type { UserProfile } from './types';
import fy2570 from './planFiscalYears/2570.json';

// ==========================================
// ข้อมูลประจำปีงบประมาณ (แหล่งงบ หมวดรายจ่าย ประเภทโครงการ แผนยุทธศาสตร์)
// ==========================================
export interface CodeLabel { code: string; label: string }
export interface PlanItem { id: number; text: string }
export interface StrategicPlan {
  title: string;
  missions: PlanItem[];
  strategies: PlanItem[];
  default_supervisor?: { name: string; position: string } | null;
}
export interface FiscalYearConfig {
  fiscal_year: number;
  budget_sources: CodeLabel[];
  expense_categories: (CodeLabel & { hint: string })[];
  project_categories: (CodeLabel & { aliases?: string[] })[];
  university_plan: StrategicPlan;
  faculty_plans: Record<string, StrategicPlan>;
}

const FISCAL_YEARS: Record<number, FiscalYearConfig> = {
  2570: fy2570 as FiscalYearConfig,
};

export const PLAN_FACULTY = 'คณะศิลปศาสตร์และวิทยาศาสตร์';
export const OTHER_CATEGORY_CODE = 'other';
export const OFF_BUDGET_SOURCE = 'off_budget';

export function availableFiscalYears(): number[] {
  return Object.keys(FISCAL_YEARS).map(Number).sort((a, b) => b - a);
}

/** ไม่ใช้ปีอื่นแทน ถ้าปีนั้นยังไม่ได้ตั้งค่า (ข้อมูลแต่ละปีไม่เหมือนกัน) */
export function getFiscalYearConfig(year: number): FiscalYearConfig | null {
  return FISCAL_YEARS[year] || null;
}

/** ปีงบประมาณ พ.ศ. ของวันที่ (เริ่ม 1 ต.ค.) */
export function fiscalYearOf(date = new Date()): number {
  const bangkok = new Date(date.getTime() + 7 * 3600 * 1000);
  const year = bangkok.getUTCFullYear() + 543;
  return bangkok.getUTCMonth() >= 9 ? year + 1 : year;
}

// ==========================================
// เดือนและไตรมาสในปีงบ (ต.ค. - ก.ย.)
// ==========================================
export const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
export const FISCAL_MONTHS = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const fiscalIndex = (month: number) => (month - 10 + 12) % 12;

/** ปี พ.ศ. 2 หลักของเดือนนั้นในปีงบ เช่น ต.ค. ของปีงบ 2570 = 69 */
export function monthYear(month: number, fiscalYear: number): number {
  return (month >= 10 ? fiscalYear - 1 : fiscalYear) % 100;
}

export function quartersOf(start: number, end: number): number[] {
  const [first, last] = [start, end].sort((a, b) => fiscalIndex(a) - fiscalIndex(b));
  const quarters = new Set<number>();
  for (let i = fiscalIndex(first); i <= fiscalIndex(last); i++) quarters.add(Math.floor(i / 3) + 1);
  return Array.from(quarters).sort();
}

export function periodText(start: number, end: number, fiscalYear: number): string {
  const [first, last] = [start, end].sort((a, b) => fiscalIndex(a) - fiscalIndex(b));
  const y1 = monthYear(first, fiscalYear);
  const y2 = monthYear(last, fiscalYear);
  if (first === last) return `${THAI_MONTHS[first]} ${y1}`;
  if (y1 === y2) return `${THAI_MONTHS[first]} – ${THAI_MONTHS[last]} ${y2}`;
  return `${THAI_MONTHS[first]} ${y1} – ${THAI_MONTHS[last]} ${y2}`;
}

// ==========================================
// แบบเสนอโครงการ (ข้อ 1-14)
// ==========================================
export interface PlanOkr { id: string; objective: string; keyResult: string; target: string }
export interface PlanTargetGroup { name: string; count: number }
export interface PlanActivity {
  id: string;
  name: string;
  subItems: string[];
  location: string;
  committeeCount: number;
  targetGroups: PlanTargetGroup[];
  startMonth: number;
  endMonth: number;
  methods: string[];
  kpi: string;
}
/** รายการแตกตัวคูณงบ: กลุ่มเป้าหมาย x ระยะเวลา x อัตรา x จำนวนครั้ง */
export interface PlanBudgetItem {
  id: string;
  activityId: string;
  category: string;
  name: string;
  targetQty: number;
  targetUnit: string;
  durationQty: number;
  durationUnit: string;
  unitRate: number;
  frequencyQty: number;
  fundSource: string;
}
export interface PlanPerson { name: string; position: string; phone: string }

export interface PlanForm {
  projectCategoryCode: string;
  projectCategoryOther: string;
  title: string;
  department: string;
  startDate: string;
  endDate: string;
  targetGroup: string;
  universityMissionIds: number[];
  universityStrategyIds: number[];
  facultyName: string;
  facultyMissionIds: number[];
  facultyStrategyIds: number[];
  backgroundProblem: string;
  backgroundSolution: string;
  backgroundImpact: string;
  okrs: PlanOkr[];
  activities: PlanActivity[];
  budgetItems: PlanBudgetItem[];
  offBudgetDetail: string;
  impacts: string[];
  evaluations: string[];
  leader: PlanPerson;
  coLeaders: PlanPerson[];
  supervisor: PlanPerson;
}

export type PlanStatus = 'DRAFT' | 'PENDING_REVIEW' | 'REVISION_REQUESTED' | 'REJECTED' | 'APPROVED_FOR_PRINT';
export type PlanAction = 'submit' | 'approve' | 'request_revision' | 'reject';

export interface PlanHistoryEntry {
  action: PlanAction | 'create';
  fromStatus?: PlanStatus;
  toStatus: PlanStatus;
  byId: string;
  byName: string;
  at: string;
  reason?: string;
}

export interface PlanProject {
  id: string;
  code?: string;              // เลขโครงการ เช่น PRJ-2570-001 (ออกตอนส่งตรวจครั้งแรก)
  fiscalYear: number;
  status: PlanStatus;
  form: PlanForm;
  totalAmount: number;
  ownerId: string;
  ownerName: string;
  department: string;
  lastReason?: string;
  history: PlanHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  revision: number;
}

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: 'แบบร่าง',
  PENDING_REVIEW: 'รอเจ้าหน้าที่แผนตรวจ',
  REVISION_REQUESTED: 'ตีกลับแก้ไข',
  REJECTED: 'ไม่อนุมัติ',
  APPROVED_FOR_PRINT: 'อนุมัติแล้ว รอพิมพ์/เซ็น',
};

export const PLAN_ACTION_LABELS: Record<PlanAction, string> = {
  submit: 'ส่งตรวจ',
  approve: 'อนุมัติ',
  request_revision: 'ตีกลับแก้ไข',
  reject: 'ไม่อนุมัติ',
};

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyPerson(): PlanPerson {
  return { name: '', position: '', phone: '' };
}

export function emptyActivity(): PlanActivity {
  return {
    id: newId('act'),
    name: '',
    subItems: [],
    location: '',
    committeeCount: 0,
    targetGroups: [{ name: '', count: 0 }],
    startMonth: 10,
    endMonth: 10,
    methods: [''],
    kpi: '',
  };
}

export function emptyOkr(): PlanOkr {
  return { id: newId('okr'), objective: '', keyResult: '', target: '' };
}

export function emptyBudgetItem(activityId: string, config: FiscalYearConfig | null): PlanBudgetItem {
  return {
    id: newId('bud'),
    activityId,
    category: config?.expense_categories[0]?.code || 'compensation',
    name: '',
    targetQty: 1,
    targetUnit: 'คน',
    durationQty: 1,
    durationUnit: 'ครั้ง',
    unitRate: 0,
    frequencyQty: 1,
    fundSource: config?.budget_sources[0]?.code || 'national',
  };
}

/** ฟอร์มเปล่าสำหรับโครงการใหม่ — ไม่เติมเนื้อหาตัวอย่าง เติมเฉพาะข้อมูลของผู้ใช้และผู้กำกับตามแผนคณะ */
export function emptyPlanForm(user: UserProfile | null, config: FiscalYearConfig | null): PlanForm {
  const facultyPlan = config?.faculty_plans[PLAN_FACULTY];
  const supervisor = facultyPlan?.default_supervisor;
  return {
    projectCategoryCode: '',
    projectCategoryOther: '',
    title: '',
    department: user?.department || '',
    startDate: '',
    endDate: '',
    targetGroup: '',
    universityMissionIds: [],
    universityStrategyIds: [],
    facultyName: PLAN_FACULTY,
    facultyMissionIds: [],
    facultyStrategyIds: [],
    backgroundProblem: '',
    backgroundSolution: '',
    backgroundImpact: '',
    okrs: [emptyOkr()],
    activities: [emptyActivity()],
    budgetItems: [],
    offBudgetDetail: '',
    impacts: [''],
    evaluations: [''],
    leader: { name: user?.name || '', position: user?.position || '', phone: user?.phoneNumber || '' },
    coLeaders: [],
    supervisor: { name: supervisor?.name || '', position: supervisor?.position || '', phone: '' },
  };
}

// ==========================================
// ยอดเงิน (เทียบด้วยสตางค์เพื่อกันปัญหาทศนิยม)
// ==========================================
const toNumber = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function budgetItemTotal(item: PlanBudgetItem): number {
  const satang = Math.round(toNumber(item.targetQty) * toNumber(item.durationQty) * toNumber(item.unitRate) * toNumber(item.frequencyQty) * 100);
  return satang / 100;
}

export function sumAmounts(values: number[]): number {
  return values.reduce((sum, v) => sum + Math.round(v * 100), 0) / 100;
}

export function planTotal(form: PlanForm): number {
  return sumAmounts(form.budgetItems.map(budgetItemTotal));
}

export function totalsBySource(form: PlanForm): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of form.budgetItems) {
    out[item.fundSource] = sumAmounts([out[item.fundSource] || 0, budgetItemTotal(item)]);
  }
  return out;
}

export function activityTotal(form: PlanForm, activityId: string): number {
  const single = form.activities.length === 1;
  return sumAmounts(form.budgetItems
    .filter(i => i.activityId === activityId || (single && !form.activities.some(a => a.id === i.activityId)))
    .map(budgetItemTotal));
}

export function formatBaht(amount: number): string {
  return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function targetCount(activity: PlanActivity): number {
  return activity.targetGroups.reduce((sum, g) => sum + toNumber(g.count), 0);
}

// ==========================================
// ตรวจความครบถ้วนทีละขั้น (ใช้ทั้งปุ่มถัดไปและก่อนส่งตรวจ)
// ==========================================
export const PLAN_STEPS = [
  { id: 1, title: 'ข้อมูลโครงการ', sections: 'ข้อ 1, 2 และ 5' },
  { id: 2, title: 'ยุทธศาสตร์', sections: 'ข้อ 3 และ 4' },
  { id: 3, title: 'กิจกรรมและ OKR', sections: 'ข้อ 6-8' },
  { id: 4, title: 'งบประมาณ', sections: 'ข้อ 9' },
  { id: 5, title: 'สรุปและส่ง', sections: 'ข้อ 10-14' },
] as const;

const blank = (s: string | undefined) => !String(s || '').trim();

export function validatePlanStep(step: number, form: PlanForm, config: FiscalYearConfig | null): string[] {
  const errors: string[] = [];
  if (!config) return ['ยังไม่ได้ตั้งค่าข้อมูลของปีงบประมาณนี้'];
  if (step === 1) {
    if (blank(form.projectCategoryCode)) errors.push('กรุณาเลือกประเภทโครงการ');
    if (form.projectCategoryCode === OTHER_CATEGORY_CODE && blank(form.projectCategoryOther)) errors.push('กรุณาระบุรายละเอียดประเภทโครงการ');
    if (String(form.title || '').trim().length < 5) errors.push('กรุณากรอกชื่อโครงการอย่างน้อย 5 ตัวอักษร (ข้อ 1)');
    if (String(form.department || '').trim().length < 2) errors.push('กรุณาระบุหน่วยงานที่ดำเนินการ (ข้อ 2)');
    if (blank(form.startDate) || blank(form.endDate)) errors.push('กรุณาระบุวันที่เริ่มและสิ้นสุดกิจกรรม');
    else if (form.endDate < form.startDate) errors.push('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
    if (blank(form.targetGroup)) errors.push('กรุณาระบุกลุ่มเป้าหมายผู้เข้าร่วม');
    if (blank(form.backgroundProblem) || blank(form.backgroundSolution) || blank(form.backgroundImpact)) errors.push('กรุณากรอกหลักการและเหตุผลให้ครบ 3 ย่อหน้า (ข้อ 5)');
  } else if (step === 2) {
    if (!form.universityMissionIds.length || !form.universityStrategyIds.length) errors.push('กรุณาเลือกความสอดคล้องกับพันธกิจและยุทธศาสตร์มหาวิทยาลัย (ข้อ 3) อย่างน้อย 1 ข้อ');
    if (!config.faculty_plans[form.facultyName]) errors.push(`ยังไม่มีแผนปฏิบัติราชการของ${form.facultyName || 'คณะ'} ในปีงบประมาณ ${config.fiscal_year}`);
    else if (!form.facultyMissionIds.length || !form.facultyStrategyIds.length) errors.push('กรุณาเลือกความสอดคล้องกับพันธกิจและยุทธศาสตร์ของคณะ (ข้อ 4) อย่างน้อย 1 ข้อ');
  } else if (step === 3) {
    if (!form.okrs.length) errors.push('กรุณาระบุวัตถุประสงค์อย่างน้อย 1 ข้อ (ข้อ 6)');
    const incomplete = form.okrs
      .map((o, i) => (blank(o.objective) || blank(o.keyResult) || blank(o.target) ? i + 1 : 0))
      .filter(Boolean);
    if (incomplete.length) errors.push(`กรุณากรอกวัตถุประสงค์ ผลลัพธ์หลัก และค่าเป้าหมายให้ครบ (ข้อ 6 แถวที่ ${incomplete.join(', ')}) หรือลบแถวที่ไม่ใช้`);
    if (!form.activities.length) errors.push('กรุณาระบุกิจกรรมของโครงการอย่างน้อย 1 กิจกรรม');
    form.activities.forEach((a, i) => {
      if (blank(a.name)) errors.push(`กรุณาระบุชื่อกิจกรรมที่ ${i + 1}`);
      if (blank(a.location)) errors.push(`กรุณาระบุสถานที่ของกิจกรรมที่ ${i + 1}`);
      if (!a.methods.some(m => !blank(m))) errors.push(`กรุณาระบุวิธีดำเนินงานของกิจกรรมที่ ${i + 1} (ข้อ 8)`);
      if (blank(a.kpi)) errors.push(`กรุณาระบุตัวชี้วัดของกิจกรรมที่ ${i + 1} (ข้อ 8)`);
    });
  } else if (step === 4) {
    if (!form.budgetItems.length) errors.push('กรุณาระบุรายการในตารางแตกตัวคูณงบประมาณอย่างน้อย 1 รายการ');
    else if (planTotal(form) <= 0) errors.push('ยอดรวมงบประมาณต้องมากกว่า 0 บาท');
    const unnamed = form.budgetItems.filter(i => blank(i.name)).length;
    if (unnamed) errors.push(`กรุณาระบุชื่อรายการงบประมาณให้ครบ (ยังว่าง ${unnamed} รายการ)`);
    if (form.activities.length > 1) {
      const unassigned = form.budgetItems.filter(i => !form.activities.some(a => a.id === i.activityId)).length;
      if (unassigned) errors.push(`กรุณาเลือกกิจกรรมให้ทุกรายการในตารางแตกตัวคูณ (ยังไม่ระบุกิจกรรม ${unassigned} รายการ)`);
    }
    if ((totalsBySource(form)[OFF_BUDGET_SOURCE] || 0) > 0 && blank(form.offBudgetDetail) && blank(form.projectCategoryOther)) {
      errors.push('กรุณาระบุที่มาของแหล่งงบประมาณอื่น ๆ (ข้อ 9)');
    }
  } else if (step === 5) {
    if (!form.impacts.some(s => !blank(s))) errors.push('กรุณาระบุผลประโยชน์ที่คาดว่าจะได้รับอย่างน้อย 1 ข้อ (ข้อ 10)');
    if (!form.evaluations.some(s => !blank(s))) errors.push('กรุณาระบุการติดตามและประเมินผลอย่างน้อย 1 ข้อ (ข้อ 11)');
    if (blank(form.leader.name) || blank(form.leader.position)) errors.push('กรุณาระบุชื่อและตำแหน่งผู้รับผิดชอบโครงการ (ข้อ 12)');
    if (blank(form.supervisor.name)) errors.push('กรุณาระบุผู้กำกับติดตามโครงการ (ข้อ 14)');
  }
  return errors;
}

/** ข้อที่ยังไม่ครบทั้งฟอร์ม พร้อมขั้นที่ต้องกลับไปแก้ */
export function validatePlanForm(form: PlanForm, config: FiscalYearConfig | null): { step: number; errors: string[] } | null {
  for (const s of PLAN_STEPS) {
    const errors = validatePlanStep(s.id, form, config);
    if (errors.length) return { step: s.id, errors };
  }
  return null;
}

/** ตัดแถวว่างที่ผู้ใช้ไม่ได้กรอกออกก่อนส่งตรวจ ไม่ให้เหลือบรรทัดว่างในเอกสาร */
export function cleanPlanForm(form: PlanForm): PlanForm {
  const nonBlank = (list: string[]) => list.map(s => s.trim()).filter(Boolean);
  return {
    ...form,
    activities: form.activities.map(a => ({
      ...a,
      subItems: nonBlank(a.subItems),
      methods: nonBlank(a.methods),
      targetGroups: a.targetGroups.filter(g => !blank(g.name) || toNumber(g.count) > 0),
    })),
    impacts: nonBlank(form.impacts),
    evaluations: nonBlank(form.evaluations),
    coLeaders: form.coLeaders.filter(p => !blank(p.name)),
  };
}

// ==========================================
// สิทธิ์และสายงาน (ร่าง -> ตรวจ -> อนุมัติ/ตีกลับ/ไม่อนุมัติ)
// ==========================================
function rolesOf(user: UserProfile | null | undefined): string[] {
  if (!user) return [];
  return [...(user.roles || []), user.role].filter(Boolean) as string[];
}

export function isPlanAdmin(user: UserProfile | null | undefined): boolean {
  const roles = rolesOf(user);
  return roles.includes('แอดมิน') || roles.includes('admin');
}

/** เจ้าหน้าที่แผนงาน: ตรวจ อนุมัติ ตีกลับ และแก้ไขแทนผู้เสนอระหว่างรอตรวจ */
export function isPlanOfficer(user: UserProfile | null | undefined): boolean {
  const roles = rolesOf(user);
  return isPlanAdmin(user) || roles.includes('แผนงาน') || roles.includes('staff_plan');
}

/** ผู้บริหารดูโครงการทั้งหมดได้ แต่ไม่ได้ตรวจแทนเจ้าหน้าที่แผน */
export function canViewAllPlans(user: UserProfile | null | undefined): boolean {
  const roles = rolesOf(user);
  return isPlanOfficer(user) || ['คณบดี', 'รองคณบดี', 'ผู้บริหาร', 'dean'].some(r => roles.includes(r));
}

export function isPlanOwner(user: UserProfile | null | undefined, project: PlanProject): boolean {
  return !!user && project.ownerId === user.id;
}

export function canViewPlan(user: UserProfile | null | undefined, project: PlanProject): boolean {
  return isPlanOwner(user, project) || canViewAllPlans(user);
}

export function canEditPlan(user: UserProfile | null | undefined, project: PlanProject): boolean {
  if (isPlanOwner(user, project) && (project.status === 'DRAFT' || project.status === 'REVISION_REQUESTED')) return true;
  return isPlanOfficer(user) && project.status === 'PENDING_REVIEW';
}

/** ร่างที่ยังไม่เคยส่งลบได้โดยเจ้าของ; แอดมินลบได้ทุกสถานะก่อนอนุมัติ */
export function canDeletePlan(user: UserProfile | null | undefined, project: PlanProject): boolean {
  if (project.status === 'APPROVED_FOR_PRINT') return false;
  if (isPlanAdmin(user)) return true;
  return isPlanOwner(user, project) && project.status === 'DRAFT' && !project.code;
}

const ACTION_RULES: Record<PlanAction, { from: PlanStatus[]; to: PlanStatus; officer: boolean; reason: boolean }> = {
  submit: { from: ['DRAFT', 'REVISION_REQUESTED'], to: 'PENDING_REVIEW', officer: false, reason: false },
  approve: { from: ['PENDING_REVIEW'], to: 'APPROVED_FOR_PRINT', officer: true, reason: false },
  request_revision: { from: ['PENDING_REVIEW'], to: 'REVISION_REQUESTED', officer: true, reason: true },
  reject: { from: ['PENDING_REVIEW'], to: 'REJECTED', officer: true, reason: true },
};

export function planActionNeedsReason(action: PlanAction): boolean {
  return ACTION_RULES[action].reason;
}

export class PlanWorkflowError extends Error {}

/** ตัดสินสถานะถัดไป หรือโยน PlanWorkflowError พร้อมเหตุผลภาษาไทย */
export function decidePlanAction(
  project: PlanProject,
  action: PlanAction,
  user: UserProfile | null | undefined,
  reason?: string
): PlanStatus {
  const rule = ACTION_RULES[action];
  if (!rule) throw new PlanWorkflowError('ไม่รู้จักคำสั่งนี้');
  if (!rule.from.includes(project.status)) {
    throw new PlanWorkflowError(`ไม่สามารถ${PLAN_ACTION_LABELS[action]}ได้ในสถานะ "${PLAN_STATUS_LABELS[project.status]}"`);
  }
  const allowed = rule.officer ? isPlanOfficer(user) : isPlanOwner(user, project);
  if (!allowed) throw new PlanWorkflowError('บทบาทของคุณไม่มีสิทธิ์ดำเนินการนี้');
  if (rule.reason && !String(reason || '').trim()) throw new PlanWorkflowError('กรุณาระบุเหตุผล');
  return rule.to;
}

export function availablePlanActions(project: PlanProject, user: UserProfile | null | undefined): PlanAction[] {
  return (Object.keys(ACTION_RULES) as PlanAction[]).filter(action => {
    try {
      decidePlanAction(project, action, user, 'x');
      return true;
    } catch {
      return false;
    }
  });
}

/** เลขโครงการตามลำดับในปีงบ เช่น PRJ-2570-001 */
export function planCode(fiscalYear: number, sequence: number): string {
  return `PRJ-${fiscalYear}-${String(sequence).padStart(3, '0')}`;
}

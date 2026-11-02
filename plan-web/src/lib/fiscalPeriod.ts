/**
 * เดือน/ไตรมาสในปีงบประมาณ (ต.ค. – ก.ย.) — กติกาเดียวกับ backend/services/proposal_document.py
 * เพื่อให้ที่ฟอร์มแสดงตรงกับที่เอกสาร Word พิมพ์
 */
import { ProjectActivityDefinition } from "../types/plan"

export const THAI_MONTHS = [
  "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

// ลำดับเดือนในปีงบ: ต.ค. ... ก.ย.
export const FISCAL_MONTHS = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const QUARTER_MONTHS: Record<number, [number, number]> = { 1: [10, 12], 2: [1, 3], 3: [4, 6], 4: [7, 9] }

export const fiscalIndex = (month: number) => (month - 10 + 12) % 12

/** ปี พ.ศ. 2 หลักของเดือนนั้นในปีงบ เช่น ต.ค. ของปีงบ 2570 = 69 */
export function monthYear(month: number, fiscalYear: number): number {
  return (month >= 10 ? fiscalYear - 1 : fiscalYear) % 100
}

export function quartersOf(start: number, end: number): number[] {
  const [first, last] = [start, end].sort((a, b) => fiscalIndex(a) - fiscalIndex(b))
  const quarters = new Set<number>()
  for (let i = fiscalIndex(first); i <= fiscalIndex(last); i++) quarters.add(Math.floor(i / 3) + 1)
  return [...quarters].sort()
}

export function periodText(start: number, end: number, fiscalYear: number): string {
  const [first, last] = [start, end].sort((a, b) => fiscalIndex(a) - fiscalIndex(b))
  const y1 = monthYear(first, fiscalYear)
  const y2 = monthYear(last, fiscalYear)
  if (first === last) return `${THAI_MONTHS[first]} ${y1}`
  if (y1 === y2) return `${THAI_MONTHS[first]} – ${THAI_MONTHS[last]} ${y2}`
  return `${THAI_MONTHS[first]} ${y1} – ${THAI_MONTHS[last]} ${y2}`
}

/** ช่วงเดือนและไตรมาสของกิจกรรมตามที่เอกสารจะพิมพ์ */
export function activityPeriod(act: ProjectActivityDefinition, fiscalYear: number): { period: string; quarters: string } {
  if (act.startMonth && act.endMonth) {
    return { period: periodText(act.startMonth, act.endMonth, fiscalYear), quarters: quartersOf(act.startMonth, act.endMonth).join(",") }
  }
  return { period: (act.monthRange || "").replace(/\s*\(ไตรมาส[^)]*\)\s*$/, ""), quarters: String(act.quarter || "") }
}

/**
 * กิจกรรมจากร่างรุ่นก่อน: กลุ่มเป้าหมายเป็นจำนวนรวม และเลือกได้ไตรมาสเดียว
 * → แปลงเป็นกลุ่มเป้าหมาย 1 แถว (ไม่มีชื่อ) และเดือนเริ่ม/สิ้นสุดของไตรมาสนั้น
 */
export function normalizeActivity(act: ProjectActivityDefinition): ProjectActivityDefinition {
  const [startMonth, endMonth] = act.startMonth && act.endMonth
    ? [act.startMonth, act.endMonth]
    : QUARTER_MONTHS[act.quarter] || QUARTER_MONTHS[1]
  return {
    ...act,
    subItems: act.subItems ?? [],
    targetGroups: act.targetGroups?.length ? act.targetGroups : [{ name: "", count: act.targetCount || 0 }],
    startMonth,
    endMonth,
  }
}

/** ค่าที่หน้าจออื่นยังอ่าน (จำนวนรวม, ไตรมาสแรก, ช่วงเดือน) ให้ตรงกับข้อมูลใหม่ */
export function withDerivedFields(act: ProjectActivityDefinition, fiscalYear: number): ProjectActivityDefinition {
  const groups = act.targetGroups || []
  const derived: Partial<ProjectActivityDefinition> = {
    targetCount: groups.length ? groups.reduce((sum, g) => sum + (Number(g.count) || 0), 0) : act.targetCount,
  }
  if (act.startMonth && act.endMonth) {
    derived.monthRange = periodText(act.startMonth, act.endMonth, fiscalYear)
    derived.quarter = quartersOf(act.startMonth, act.endMonth)[0] as 1 | 2 | 3 | 4
  }
  return { ...act, ...derived }
}

import { ProjectStatus, WorkflowAction } from "../types/plan"

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("th-TH").format(amount)
}

export function formatCompactMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1).replace(/\.0$/, "")}k`
  }
  return formatMoney(amount)
}

export function formatBahtText(num: number): string {
  if (isNaN(num) || num === 0) return "ศูนย์บาทถ้วน"
  if (num < 0) return "ลบ" + formatBahtText(-num)

  const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]
  const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"]

  function readMillion(n: number): string {
    const s = Math.floor(n).toString()
    const len = s.length
    let res = ""
    for (let i = 0; i < len; i++) {
      const d = parseInt(s[i], 10)
      const u = len - 1 - i
      if (d === 0) continue
      if (u === 1 && d === 1) {
        res += "สิบ"
      } else if (u === 1 && d === 2) {
        res += "ยี่สิบ"
      } else if (u === 0 && d === 1 && len > 1) {
        res += "เอ็ด"
      } else {
        res += digits[d] + units[u]
      }
    }
    return res
  }

  const integerPart = Math.floor(num)
  let text = ""
  if (integerPart >= 1_000_000) {
    const millions = Math.floor(integerPart / 1_000_000)
    const remainder = integerPart % 1_000_000
    text += readMillion(millions) + "ล้าน"
    if (remainder > 0) text += readMillion(remainder)
  } else {
    text = readMillion(integerPart)
  }

  return text ? `${text}บาทถ้วน` : "ศูนย์บาทถ้วน"
}

export const statusLabels: Record<ProjectStatus, string> = {
  DRAFT: "แบบร่าง",
  PENDING_REVIEW: "รอเจ้าหน้าที่ตรวจ",
  REVISION_REQUESTED: "ตีกลับแก้ไข",
  APPROVED_FOR_PRINT: "อนุมัติแล้ว รอพิมพ์/เซ็น",
  WAITING_FOR_SIGNATURES: "อยู่ระหว่างเดินเซ็น",
  WAITING_FOR_SCAN: "เซ็นครบ รอสแกน",
  COMPLETED_WITH_SCAN: "เสร็จสมบูรณ์",
  COMPLETED: "ปิดโครงการแล้ว",
  REJECTED: "ไม่อนุมัติ",
}

export const statusTones: Record<
  ProjectStatus,
  { bg: string; text: string; dot: string; border?: string }
> = {
  DRAFT: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  PENDING_REVIEW: {
    bg: "bg-blue-50 text-blue-800",
    text: "text-blue-800",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  REVISION_REQUESTED: {
    bg: "bg-rose-50 text-rose-800",
    text: "text-rose-800",
    dot: "bg-rose-500",
    border: "border-rose-200",
  },
  APPROVED_FOR_PRINT: {
    bg: "bg-emerald-50 text-emerald-800",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    border: "border-emerald-300",
  },
  WAITING_FOR_SIGNATURES: {
    bg: "bg-indigo-50 text-indigo-800",
    text: "text-indigo-800",
    dot: "bg-indigo-500",
    border: "border-indigo-200",
  },
  WAITING_FOR_SCAN: {
    bg: "bg-amber-50 text-amber-800",
    text: "text-amber-800",
    dot: "bg-amber-400",
    border: "border-amber-200",
  },
  COMPLETED_WITH_SCAN: {
    bg: "bg-brand/15 text-brand",
    text: "text-brand",
    dot: "bg-brand",
    border: "border-brand/30",
  },
  COMPLETED: {
    bg: "bg-emerald-50 text-emerald-800",

    text: "text-emerald-800",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  REJECTED: {
    bg: "bg-red-50 text-red-800",
    text: "text-red-800",
    dot: "bg-red-500",
    border: "border-red-200",
  },
}

export const actionLabels: Record<WorkflowAction, string> = {
  submit: "ส่งให้เจ้าหน้าที่ตรวจ",
  approve: "อนุมัติ (สร้างไฟล์ให้พิมพ์)",
  request_revision: "ตีกลับให้แก้ไข",
  reject: "ไม่อนุมัติ",
  record_signature: "บันทึกการลงนาม",
  undo_signature: "ย้อนการลงนามล่าสุด",
  upload_scan: "อัปโหลดเอกสารสแกน",
  undo_scan: "ย้อนการอัปโหลดสแกน",
}

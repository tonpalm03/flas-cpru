import { PlanPage, Role } from "../../types/plan"
import { pageAllowed } from "../../lib/pageAccess"
import { NavItem, navGroups } from "./Sidebar"

// เมนูของมือถือ: แถบล่างมีได้ 4 หน้า + "เพิ่มเติม" (หน้าที่เหลือ บัญชี ติดตั้งแอป อยู่ในแผ่นเพิ่มเติม)
const MAX_TABS = 4

// ชื่อสั้นสำหรับแถบล่าง (ชื่อเต็มอยู่บนแถบด้านบน)
const SHORT_LABELS: Partial<Record<PlanPage, string>> = {
  dashboard: "หน้าหลัก",
  proposal: "เสนอโครงการ",
  projects: "โครงการ",
  budget: "งบสาขา",
  ledger: "คุมงบ",
  users: "ผู้ใช้งาน",
  trash: "ถังขยะ",
}

export interface PhoneTab extends NavItem {
  short: string
}

export function phoneNav(role: Role): { tabs: PhoneTab[]; more: PhoneTab[] } {
  const items = navGroups(role)
    .flatMap((group) => group.items)
    .filter((item) => pageAllowed(role, item.id))
    .map((item) => ({
      ...item,
      short: item.id === "approvals" ? (role === "officer" ? "งาน" : "ติดตาม") : SHORT_LABELS[item.id] ?? item.label,
    }))
  return { tabs: items.slice(0, MAX_TABS), more: items.slice(MAX_TABS) }
}

// หน้าที่ทำงานต่อเนื่องจนจบ (กรอกฟอร์ม ปิดโครงการ): ซ่อนแถบล่าง มีปุ่มย้อนกลับแทน
export const FOCUS_PAGES: PlanPage[] = ["proposal", "closure"]

/** ชื่อหน้าบนแถบด้านบน เมื่อหน้านั้นไม่ได้ตั้งเอง */
export function pageTitle(role: Role, page: PlanPage): string {
  if (page === "dashboard") return role === "teacher" ? "งานของฉัน" : "ภาพรวม"
  if (page === "project-detail") return "รายละเอียดโครงการ"
  if (page === "closure") return "ปิดโครงการ"
  const item = navGroups(role)
    .flatMap((group) => group.items)
    .find((entry) => entry.id === page)
  return item?.label ?? "ระบบแผน"
}

import { PlanPage, Role } from "../types/plan"

// หน้าที่แต่ละบทบาทเปิดได้ — ใช้ทั้งเมนูซ้ายและตอนเปิดจากลิงก์ (#hash)
// เจ้าหน้าที่แผนไม่เสนอโครงการเอง: โครงการที่สร้างจะมีผู้สร้างเป็นเจ้าของ และส่งตรวจได้เฉพาะอาจารย์
// ส่วนรายการโครงการทั้งหมดของเจ้าหน้าที่อยู่ในแท็บ "ทั้งหมด" ของหน้างานเจ้าหน้าที่และช่องค้นหาด้านบนแล้ว
const PROPOSERS: Role[] = ["teacher", "head", "plan_head", "dean"]
const BUDGET_VIEWERS: Role[] = ["officer", "plan_head", "dean"]

const PAGE_ROLES: Partial<Record<PlanPage, Role[]>> = {
  proposal: PROPOSERS,
  projects: PROPOSERS,
  approvals: ["head", "officer", "plan_head", "dean"],
  budget: BUDGET_VIEWERS,
  ledger: BUDGET_VIEWERS,
  users: ["officer"],
  trash: ["officer"],
}

export function pageAllowed(role: Role, page: PlanPage): boolean {
  const roles = PAGE_ROLES[page]
  return !roles || roles.includes(role)
}

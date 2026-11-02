import { PlanProject } from "../types/plan"

// ค้นหาโครงการจากรหัส ชื่อ ผู้รับผิดชอบ หรือสาขา — ใช้ทั้งช่องค้นหาบนจอใหญ่และหน้าค้นหาบนมือถือ
export function searchProjects(projects: PlanProject[], query: string, limit = 8): PlanProject[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return projects.filter((p) => [p.id, p.name, p.owner, p.unit].some((value) => (value || "").toLowerCase().includes(q))).slice(0, limit)
}

/** ตัวย่อชื่อสำหรับรูปโปรไฟล์ (ตัดคำนำหน้า เช่น อ. ผศ. ดร.) */
export function initials(name: string): string {
  return name.replace(/^(อ\.|ผศ\.|รศ\.|ดร\.|นาย|นางสาว|นาง)+/, "").slice(0, 2)
}

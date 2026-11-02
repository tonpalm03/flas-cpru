import { useEffect, useState } from "react"
import { Role, PlanPage } from "../../types/plan"
import { getFiscalYears } from "../../services/fiscalYearService"
import { Icon, IconName } from "../ui/Icons"
import { pageAllowed } from "../../lib/pageAccess"

interface SidebarProps {
  currentPage: PlanPage
  onNavigate: (page: PlanPage) => void
  currentRole: Role
  /** ตัวเลขงานที่รอผู้ใช้คนนี้ ต่อเมนู */
  badges?: Partial<Record<PlanPage, number>>
}

export interface NavItem {
  id: PlanPage
  label: string
  icon: IconName
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

export const roleTitles: Record<Role, string> = {
  teacher: "อาจารย์ผู้รับผิดชอบ",
  head: "ประธานสาขาวิชา",
  officer: "เจ้าหน้าที่แผน",
  plan_head: "หัวหน้างานแผน",
  dean: "คณบดี",
}

export function navGroups(role: Role): NavGroup[] {
  return [
    {
      items: [
        { id: "dashboard", label: "ภาพรวม", icon: "home" },
        { id: "proposal", label: "เสนอโครงการใหม่", icon: "plus" },
        { id: "projects", label: role === "teacher" ? "โครงการของฉัน" : "โครงการทั้งหมด", icon: "folder" },
        { id: "approvals", label: role === "officer" ? "งานของเจ้าหน้าที่" : "ติดตามโครงการ", icon: "check" },
      ],
    },
    {
      title: "งบประมาณ",
      items: [
        { id: "budget", label: "จัดสรรงบสาขา", icon: "wallet" },
        { id: "ledger", label: "คุมงบโครงการ", icon: "receipt" },
      ],
    },
    {
      title: "ผู้ดูแลระบบ",
      items: [
        { id: "users", label: "จัดการผู้ใช้งาน", icon: "user" },
        { id: "trash", label: "ถังขยะ", icon: "trash" },
      ],
    },
  ]
}

/** เมนูด้านซ้ายของจอใหญ่ (มือถือใช้แถบล่าง BottomNav) */
export function Sidebar({ currentPage, onNavigate, currentRole, badges = {} }: SidebarProps) {
  const [fiscalYear, setFiscalYear] = useState<number | null>(null)
  useEffect(() => {
    getFiscalYears()
      .then((years) => setFiscalYear(years.length ? Math.max(...years) : null))
      .catch(() => setFiscalYear(null))
  }, [])

  const groups = navGroups(currentRole)
    .map((group) => ({ ...group, items: group.items.filter((item) => pageAllowed(currentRole, item.id)) }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <aside data-testid="sidebar" className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-strong text-white">
        {/* ชื่อระบบ + โลโก้คณะ (แถบสีไล่แบบโลโก้ด้านบน) */}
        <div className="bg-faculty-gradient h-1 shrink-0" />
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm">
              <img src={`${import.meta.env.BASE_URL}brand/faculty-logo.png`} alt="ตราคณะศิลปศาสตร์และวิทยาศาสตร์" className="size-8 object-contain" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold">ระบบแผนและงบประมาณ</div>
              <div className="text-[11px] text-white/60">{roleTitles[currentRole]}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group, index) => (
            <div key={group.title ?? index} className="space-y-1">
              {group.title && <div className="px-3 pb-1 text-[11px] font-semibold text-white/40">{group.title}</div>}
              {group.items.map((item) => {
                const active = currentPage === item.id
                const badge = badges[item.id]
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active ? "bg-white font-semibold text-brand" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon name={item.icon} size={18} className={active ? "text-brand" : "text-white/60"} />
                      {item.label}
                    </span>
                    {badge !== undefined && badge > 0 && (
                      <span data-testid={`nav-badge-${item.id}`} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-brand">
                        {badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs">
          <div className="text-white/50">ปีงบประมาณ</div>
          <div data-testid="sidebar-fiscal-year" className="font-mono text-base font-bold">
            {fiscalYear ?? "-"}
          </div>
          <div className="text-[11px] text-accent">คณะศิลปศาสตร์และวิทยาศาสตร์</div>
        </div>
      </aside>
    </>
  )
}

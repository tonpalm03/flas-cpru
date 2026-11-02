import { ReactNode } from "react"
import { PlanPage } from "../../types/plan"
import { Icon } from "../ui/Icons"
import { PhoneTab } from "./phoneNav"

interface BottomNavProps {
  tabs: PhoneTab[]
  /** หน้าที่อยู่ในแผ่น "เพิ่มเติม" */
  more: PhoneTab[]
  currentPage: PlanPage
  badges: Partial<Record<PlanPage, number>>
  /** ตัวเลขรวมของหน้าที่อยู่ใน "เพิ่มเติม" */
  moreBadge?: number
  onNavigate: (page: PlanPage) => void
  onMore: () => void
}

/** แถบเมนูด้านล่างของมือถือ (แบบแอปทั่วไป) */
export function BottomNav({ tabs, more, currentPage, badges, moreBadge = 0, onNavigate, onMore }: BottomNavProps) {
  return (
    <nav
      data-testid="bottom-nav"
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-xl">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            testId={`tab-${tab.id}`}
            label={tab.short}
            icon={<Icon name={tab.icon} size={22} />}
            active={tab.id === currentPage}
            badge={badges[tab.id]}
            badgeTestId={`nav-badge-${tab.id}`}
            onClick={() => onNavigate(tab.id)}
          />
        ))}
        <TabButton
          testId="open-account"
          label="เพิ่มเติม"
          icon={<Icon name="more" size={22} />}
          active={more.some((item) => item.id === currentPage)}
          badge={moreBadge}
          onClick={onMore}
        />
      </div>
    </nav>
  )
}

function TabButton({
  label,
  icon,
  active,
  badge,
  badgeTestId,
  onClick,
  testId,
}: {
  label: string
  icon: ReactNode
  active: boolean
  badge?: number
  badgeTestId?: string
  onClick: () => void
  testId: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 pt-2.5"
    >
      <span
        className={`relative grid h-8 w-14 place-items-center rounded-full transition-colors ${
          active ? "bg-brand-soft text-brand" : "text-muted"
        }`}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span
            data-testid={badgeTestId}
            className="absolute -top-1 right-1.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] font-bold leading-5 text-brand-strong ring-2 ring-white"
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className={`max-w-full truncate px-1 text-xs ${active ? "font-bold text-brand" : "font-medium text-muted"}`}>{label}</span>
    </button>
  )
}

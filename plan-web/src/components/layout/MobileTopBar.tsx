import { Icon } from "../ui/Icons"

interface MobileTopBarProps {
  title: string
  subtitle?: string
  /** มี = แสดงปุ่มย้อนกลับแทนตราคณะ */
  onBack?: () => void
  onSearch: () => void
  /** มี = แสดงปุ่ม "ติดตั้งแอป" (ยังไม่ได้ติดตั้ง และติดตั้งได้ทันที) */
  onInstall?: () => void
}

/** แถบด้านบนของมือถือ: ชื่อหน้า ปุ่มย้อนกลับ ค้นหา และติดตั้งแอป */
export function MobileTopBar({ title, subtitle, onBack, onSearch, onInstall }: MobileTopBarProps) {
  return (
    <header
      data-testid="mobile-topbar"
      className="sticky top-0 z-30 bg-brand-strong pt-[env(safe-area-inset-top)] text-white shadow-[0_1px_0_rgba(255,255,255,0.06)]"
    >
      <div className="flex h-14 items-center gap-1 px-2">
        {onBack ? (
          <button
            type="button"
            data-testid="topbar-back"
            onClick={onBack}
            aria-label="ย้อนกลับ"
            className="grid size-11 shrink-0 place-items-center rounded-full active:bg-white/10"
          >
            <Icon name="back" size={24} />
          </button>
        ) : (
          <span className="mx-1.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white p-1">
            <img src={`${import.meta.env.BASE_URL}brand/faculty-logo.png`} alt="" className="size-7 object-contain" />
          </span>
        )}
        <div className="min-w-0 flex-1 px-1 leading-tight">
          <h1 data-testid="topbar-title" className="truncate text-[17px] font-bold">
            {title}
          </h1>
          {subtitle && <div className="truncate text-xs text-white/65">{subtitle}</div>}
        </div>
        {onInstall && (
          <button
            type="button"
            data-testid="install-app"
            onClick={onInstall}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 text-[13px] font-bold text-brand-strong active:bg-accent-hover"
          >
            <Icon name="download" size={16} />
            ติดตั้งแอป
          </button>
        )}
        <button
          type="button"
          data-testid="open-search"
          onClick={onSearch}
          aria-label="ค้นหาโครงการ"
          className="grid size-11 shrink-0 place-items-center rounded-full active:bg-white/10"
        >
          <Icon name="search" size={22} />
        </button>
      </div>
    </header>
  )
}

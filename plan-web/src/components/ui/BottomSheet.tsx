import React, { useEffect } from "react"
import { useBackLayer } from "../../lib/backLayers"
import { Icon } from "./Icons"

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** ชื่อแผ่น (อ่านโดยโปรแกรมอ่านหน้าจอ และแสดงด้านบนถ้าใส่ showTitle) */
  title: string
  showTitle?: boolean
  testId?: string
  children: React.ReactNode
}

/** แผ่นเลื่อนขึ้นจากด้านล่างของมือถือ — แตะพื้นหลังหรือกดย้อนกลับเพื่อปิด */
export function BottomSheet({ open, onClose, title, showTitle = false, testId, children }: BottomSheetProps) {
  useBackLayer(open, onClose)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    // ไม่ให้หน้าด้านหลังเลื่อนตามนิ้ว
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="sheet-backdrop absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        className="sheet-panel relative max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex justify-center bg-white pb-1 pt-2.5">
          <span className="h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        </div>
        {showTitle && <h2 className="px-5 pb-2 pt-1 text-base font-bold text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

/** แถวรายการในแผ่น (ไอคอน + ข้อความ + ลูกศร) */
export function SheetRow({
  icon,
  label,
  detail,
  tone = "default",
  badge,
  chevron = true,
  onClick,
  testId,
}: {
  icon: React.ReactNode
  label: string
  detail?: string
  tone?: "default" | "danger" | "brand"
  badge?: number
  chevron?: boolean
  onClick: () => void
  testId?: string
}) {
  const color = tone === "danger" ? "text-rose-700" : tone === "brand" ? "text-brand" : "text-ink"
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-4 px-5 py-3 text-left active:bg-surface ${color}`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone === "danger" ? "bg-rose-50" : "bg-brand-soft text-brand"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        {detail && <span className="block text-xs text-muted">{detail}</span>}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-brand-strong">{badge}</span>
      )}
      {chevron && <Icon name="chevron" size={18} className="shrink-0 text-muted" />}
    </button>
  )
}

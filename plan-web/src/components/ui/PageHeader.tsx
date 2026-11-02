import React from "react"
import { Button } from "./Button"
import { useIsPhone } from "../../lib/useIsPhone"
import { usePhoneBar } from "../../lib/phoneBar"

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  onBack?: () => void
  actions?: React.ReactNode
  /**
   * มือถือ: ชื่อบนแถบด้านบน — ไม่ใส่ = ย้ายชื่อหน้าขึ้นไปบนแถบ (หน้านี้แสดงแค่ปุ่ม)
   * ใส่ = แถบแสดงข้อความนี้ และหน้านี้ยังแสดงชื่อเต็ม/คำอธิบาย (เช่น ชื่อโครงการยาว ๆ)
   */
  phoneBarTitle?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  onBack,
  actions,
  phoneBarTitle,
}: PageHeaderProps) {
  const isPhone = useIsPhone()
  usePhoneBar(isPhone ? { title: phoneBarTitle ?? title } : null)

  // มือถือ: ปุ่มย้อนกลับอยู่บนแถบด้านบนแล้ว และไม่แสดงคำอธิบายยาว ๆ ให้หน้าโล่ง
  if (isPhone) {
    const keepTitle = phoneBarTitle !== undefined
    if (!keepTitle && !actions) return null
    return (
      <div className="mb-4 space-y-3">
        {keepTitle && (
          <div>
            {eyebrow && <div className="text-xs font-semibold text-brand-2">{eyebrow}</div>}
            <h2 className="text-xl font-bold leading-snug text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        )}
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            icon="back"
            onClick={onBack}
            className="mb-2 -ml-2 text-muted hover:text-ink"
          >
            ย้อนกลับ
          </Button>
        )}
        {eyebrow && (
          <div className="text-[11px] font-bold tracking-wider text-brand-2 uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

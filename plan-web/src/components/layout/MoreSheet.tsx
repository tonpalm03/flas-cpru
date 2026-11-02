import { useEffect, useState } from "react"
import { PlanPage } from "../../types/plan"
import { SessionUser, roleLabels } from "../../lib/currentUser"
import { initials } from "../../lib/projectSearch"
import { getFiscalYears } from "../../services/fiscalYearService"
import { authService } from "../../services/authService"
import { BottomSheet, SheetRow } from "../ui/BottomSheet"
import { Icon } from "../ui/Icons"
import { PhoneTab } from "./phoneNav"
import { useInstallApp } from "./InstallApp"

interface MoreSheetProps {
  open: boolean
  onClose: () => void
  user: SessionUser
  items: PhoneTab[]
  badges: Partial<Record<PlanPage, number>>
  onNavigate: (page: PlanPage) => void
  onChangePassword: () => void
}

/** แผ่น "เพิ่มเติม" ของมือถือ: บัญชีผู้ใช้ หน้าที่ไม่อยู่ในแถบล่าง ติดตั้งแอป เปลี่ยนรหัสผ่าน ออกจากระบบ */
export function MoreSheet({ open, onClose, user, items, badges, onNavigate, onChangePassword }: MoreSheetProps) {
  const install = useInstallApp()
  const [fiscalYear, setFiscalYear] = useState<number | null>(null)
  useEffect(() => {
    getFiscalYears()
      .then((years) => setFiscalYear(years.length ? Math.max(...years) : null))
      .catch(() => setFiscalYear(null))
  }, [])

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="เพิ่มเติม" testId="more-sheet">
        <div className="flex items-center gap-3 px-5 pb-4 pt-2">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-base font-bold text-white">{initials(user.display_name)}</span>
          <div className="min-w-0">
            <div data-testid="current-user-name" className="truncate text-base font-bold text-ink">
              {user.display_name}
            </div>
            <div className="truncate text-xs text-muted">
              {roleLabels[user.role].label}
              {user.department ? ` · สาขาวิชา${user.department}` : ""}
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="border-t border-line py-1">
            {items.map((item) => (
              <SheetRow
                key={item.id}
                testId={`more-${item.id}`}
                icon={<Icon name={item.icon} size={18} />}
                label={item.label}
                badge={badges[item.id]}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </div>
        )}

        <div className="border-t border-line py-1">
          {!install.installed && (
            <SheetRow
              testId="more-install"
              icon={<Icon name="phone" size={18} />}
              label="ติดตั้งแอปลงมือถือ"
              detail="เปิดจากไอคอนบนหน้าจอโฮม ไม่ต้องพิมพ์ลิงก์"
              tone="brand"
              onClick={install.start}
            />
          )}
          <SheetRow icon={<Icon name="lock" size={18} />} label="เปลี่ยนรหัสผ่าน" onClick={onChangePassword} />
          <SheetRow
            icon={<Icon name="logout" size={18} />}
            label="ออกจากระบบ"
            tone="danger"
            chevron={false}
            onClick={() => authService.logout()}
          />
        </div>

        <div className="border-t border-line px-5 pt-3 text-center text-[11px] text-muted">
          ระบบแผนและงบประมาณ · คณะศิลปศาสตร์และวิทยาศาสตร์ มรภ.ชัยภูมิ
          {fiscalYear && <span data-testid="sidebar-fiscal-year"> · ปีงบประมาณ {fiscalYear}</span>}
        </div>
      </BottomSheet>
      {install.sheet}
    </>
  )
}

import { useEffect, useState } from "react"
import { ApiError } from "../../lib/api"
import { formatMoney, statusLabels } from "../../lib/formatters"
import { TrashItem, planService } from "../../services/planService"
import { ProjectStatus } from "../../types/plan"
import { Button } from "../../components/ui/Button"
import { Card } from "../../components/ui/Card"
import { PageHeader } from "../../components/ui/PageHeader"

/** ถังขยะของเจ้าหน้าที่แผน: โครงการที่ถูกลบ/ถอน พร้อมเหตุผล และกู้คืนได้ */
export function TrashPage({ onRestored }: { onRestored: () => void }) {
  const [items, setItems] = useState<TrashItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () =>
    planService
      .getTrash()
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.detail : "โหลดถังขยะไม่สำเร็จ"))

  useEffect(() => {
    load()
  }, [])

  const restore = async (item: TrashItem) => {
    setBusy(item.project_code)
    setError(null)
    try {
      await planService.restoreProject(item.project_code)
      await load()
      onRestored()
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "กู้คืนไม่สำเร็จ")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        eyebrow="ผู้ดูแลระบบ"
        title="ถังขยะ"
        description="โครงการที่อาจารย์ลบหรือถอน และที่เจ้าหน้าที่ลบ — กู้คืนแล้วกลับไปอยู่สถานะเดิม"
      />
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{error}</div>}
      <Card className="p-4 sm:p-6">
        {items === null ? (
          <div className="py-10 text-center text-sm text-muted">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">ถังขยะว่าง</div>
        ) : (
          <div className="divide-y divide-line">
            {items.map((item) => (
              <div key={item.project_code} data-testid="trash-row" className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-muted">
                    <span className="font-mono">{item.project_code}</span> · {statusLabels[item.status as ProjectStatus] ?? item.status} · ฿
                    {formatMoney(item.total_amount || 0)}
                  </div>
                  <div className="text-sm font-semibold text-ink">{item.title}</div>
                  <div className="text-xs text-muted">
                    {item.owner} · สาขาวิชา{item.department}
                  </div>
                  <div className="mt-1 text-xs text-rose-700">
                    ลบโดย {item.deleted_by} เมื่อ {item.deleted_at?.slice(0, 16)}
                    {item.delete_reason ? ` — ${item.delete_reason}` : ""}
                  </div>
                </div>
                <Button data-testid="restore-project" variant="outline" size="sm" icon="return" onClick={() => restore(item)} disabled={busy !== null}>
                  {busy === item.project_code ? "กำลังกู้คืน..." : "กู้คืน"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

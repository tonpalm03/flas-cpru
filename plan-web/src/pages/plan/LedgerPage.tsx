import { useEffect, useMemo, useState } from "react"
import { PlanPage, PlanProject } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { getFiscalYearConfig, getFiscalYears } from "../../services/fiscalYearService"
import { LedgerOverview, SourceLabel, baht, budgetService } from "../../services/budgetService"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { Button } from "../../components/ui/Button"
import { Card } from "../../components/ui/Card"
import { PageHeader } from "../../components/ui/PageHeader"
import { useIsPhone } from "../../lib/useIsPhone"

interface LedgerPageProps {
  projects: PlanProject[]
  onNavigate: (page: PlanPage) => void
  onSelectProject: (project: PlanProject) => void
}

const DEFAULT_YEAR = 2570
const selectClass = "mt-1.5 block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-brand"

/** แทนชีต "หน้าหลัก" ของไฟล์คุมรายการเงิน: ทุกโครงการที่อัปโหลดเอกสารลงนามครบแล้ว ขออนุมัติ / ดำเนินการ / คงเหลือ / % */
export function LedgerPage({ projects, onNavigate, onSelectProject }: LedgerPageProps) {
  const [years, setYears] = useState<number[]>([])
  const [year, setYear] = useState(DEFAULT_YEAR)
  const [sources, setSources] = useState<SourceLabel[]>([])
  const [source, setSource] = useState("")
  const [department, setDepartment] = useState("")
  const [overview, setOverview] = useState<LedgerOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getFiscalYears()
      .then((list) => {
        setYears(list)
        if (list.length && !list.includes(DEFAULT_YEAR)) setYear(list[list.length - 1])
      })
      .catch(() => setYears([DEFAULT_YEAR]))
  }, [])

  useEffect(() => {
    getFiscalYearConfig(year)
      .then((config) => setSources(config.budget_sources))
      .catch(() => setSources([]))
  }, [year])

  useEffect(() => {
    setOverview(null)
    setError(null)
    budgetService
      .getOverview(year, source || undefined, department || undefined)
      .then(setOverview)
      .catch((e) => setError(e instanceof ApiError ? e.detail : "โหลดข้อมูลคุมงบไม่สำเร็จ"))
  }, [year, source, department])

  // สาขาที่มีโครงการในปีงบนี้ (โครงการในระบบเท่านั้น ไม่รวมข้อมูลอ้างอิง)
  const departments = useMemo(
    () => [...new Set(projects.filter((p) => p.dbId !== undefined && p.fiscalYear === year).map((p) => p.unit))].sort(),
    [projects, year]
  )
  const selectedSource = sources.find((s) => s.code === source)

  const isPhone = useIsPhone()

  const openProject = (code: string) => {
    const project = projects.find((p) => p.id === code)
    if (project) onSelectProject(project)
  }

  const exportExcel = async () => {
    if (!selectedSource) return
    setExporting(true)
    setError(null)
    try {
      await budgetService.downloadOverview(year, selectedSource, department || undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "ส่งออก Excel ไม่สำเร็จ")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 lg:space-y-6">
      <PageHeader
        eyebrow="คุมงบประมาณ"
        title="คุมงบโครงการ"
        description="ยอดขออนุมัติ เบิกจ่ายแล้ว และคงเหลือของทุกโครงการที่อัปโหลดเอกสารลงนามครบแล้ว — คลิกโครงการเพื่อบันทึกการเบิกจ่าย"
        onBack={() => onNavigate("dashboard")}
        actions={
          // มือถือ: ปุ่มส่งออกแสดงเมื่อเลือกแหล่งงบแล้ว (ไม่ให้มีปุ่มที่กดไม่ได้ค้างอยู่ด้านบน)
          isPhone && !selectedSource ? undefined : (
          <Button
            data-testid="export-xlsx"
            variant="accent"
            size="sm"
            icon="download"
            disabled={!selectedSource || exporting}
            title={selectedSource ? undefined : "เลือกแหล่งงบก่อน (ไฟล์ Excel แยกตามแหล่งงบ)"}
            onClick={exportExcel}
          >
            {exporting ? "กำลังสร้างไฟล์..." : selectedSource ? `ส่งออก Excel (${selectedSource.label})` : "ส่งออก Excel"}
          </Button>
          )
        }
      />

      <Card className="p-4 lg:p-5">
        <div className="grid grid-cols-3 gap-2 lg:gap-4">
          <label className="text-xs font-semibold text-ink">
            ปีงบประมาณ
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
              {(years.length ? years : [year]).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            แหล่งงบ
            <select data-testid="filter-source" value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
              <option value="">ทุกแหล่งงบ</option>
              {sources.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            สาขา
            <select data-testid="filter-department" value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass}>
              <option value="">ทุกสาขา</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!selectedSource && <p className="mt-3 text-[11px] text-muted">ส่งออก Excel ได้ทีละแหล่งงบ (หน้าตาเดียวกับไฟล์คุมรายการเงินของคณะ)</p>}
      </Card>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{error}</div>}

      <Card className="p-4 lg:p-6">
        {!overview && !error ? (
          <div className="py-10 text-center text-xs text-muted">กำลังโหลด...</div>
        ) : overview && overview.rows.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted">ยังไม่มีโครงการที่อัปโหลดเอกสารลงนามครบในเงื่อนไขนี้</div>
        ) : overview && isPhone ? (
          // มือถือ: การ์ดต่อโครงการ แทนตาราง 6 คอลัมน์
          <div className="divide-y divide-line">
            {overview.rows.map((row) => (
              <button
                key={row.project_code}
                type="button"
                data-testid="overview-row"
                onClick={() => openProject(row.project_code)}
                className="block w-full py-3 text-left active:bg-surface"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{row.project_code}</span>
                  <StatusBadge status={row.status as PlanProject["status"]} />
                </div>
                <div className="mt-1 text-sm font-semibold leading-snug text-ink">{row.title}</div>
                <div className="text-xs text-muted">
                  {row.department} · {row.owner}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted">ขออนุมัติ</div>
                    <div className="font-mono font-semibold text-ink">{baht(row.approved)}</div>
                  </div>
                  <div>
                    <div className="text-muted">เบิกแล้ว</div>
                    <div className="font-mono font-semibold text-emerald-700">{baht(row.spent)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted">คงเหลือ</div>
                    <div className="font-mono font-bold text-brand">{baht(row.remaining)}</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(row.percent, 100)}%` }} />
                </div>
              </button>
            ))}
            <div data-testid="overview-total" className="flex items-center justify-between gap-2 pt-3 text-sm font-bold text-ink">
              <span>รวม {overview.rows.length} โครงการ</span>
              <span className="font-mono text-brand">คงเหลือ {baht(overview.totals.remaining)}</span>
            </div>
          </div>
        ) : overview ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold text-muted">
                  <th className="py-3 px-2 text-center">ที่</th>
                  <th className="py-3 px-2">โครงการ</th>
                  <th className="py-3 px-2 text-right">ขออนุมัติ</th>
                  <th className="py-3 px-2 text-right">ดำเนินการ</th>
                  <th className="py-3 px-2 text-right">คงเหลือ</th>
                  <th className="py-3 px-2 text-right">เปอร์เซ็นต์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {overview.rows.map((row) => (
                  <tr
                    key={row.project_code}
                    data-testid="overview-row"
                    onClick={() => openProject(row.project_code)}
                    className="cursor-pointer hover:bg-surface"
                  >
                    <td className="py-3 px-2 text-center text-xs text-muted">{row.no}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-ink">{row.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span className="font-mono">{row.project_code}</span>
                        <span>· {row.department}</span>
                        <span>· {row.owner}</span>
                        <StatusBadge status={row.status as PlanProject["status"]} />
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{baht(row.approved)}</td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-700">{baht(row.spent)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-brand">{baht(row.remaining)}</td>
                    <td className="py-3 px-2 text-right font-mono">{row.percent.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr data-testid="overview-total" className="border-t-2 border-brand/20 text-sm font-bold">
                  <td className="py-3 px-2" colSpan={2}>
                    รวมทั้งสิ้น {overview.rows.length} โครงการ
                  </td>
                  <td className="py-3 px-2 text-right font-mono">{baht(overview.totals.approved)}</td>
                  <td className="py-3 px-2 text-right font-mono">{baht(overview.totals.spent)}</td>
                  <td className="py-3 px-2 text-right font-mono">{baht(overview.totals.remaining)}</td>
                  <td className="py-3 px-2 text-right font-mono">{overview.totals.percent.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

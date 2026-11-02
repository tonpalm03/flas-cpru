import { useEffect, useMemo, useState } from "react"
import { PlanPage, Role } from "../../types/plan"
import { ApiError } from "../../lib/api"
import { getFiscalYears } from "../../services/fiscalYearService"
import { BranchBudgetRow, BranchSummary, baht, budgetService } from "../../services/budgetService"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { PageHeader } from "../../components/ui/PageHeader"

interface BudgetSetupProps {
  role: Role
  onNavigate: (page: PlanPage) => void
}

const DEFAULT_YEAR = 2570
const inputClass =
  "w-40 rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-right font-mono text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand/20"

function emptyRow(department: string, source: string): BranchBudgetRow {
  return { department, source_code: source, ceiling: 0, committed: 0, pending: 0, spent: 0, remaining: 0 }
}

/** วงเงินที่พิมพ์ (ว่าง/ไม่ใช่ตัวเลข/ติดลบ = null) */
function parseCeiling(text: string): number | null {
  if (text.trim() === "") return null
  const value = Number(text.replace(/,/g, ""))
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null
}

export function BudgetSetup({ role, onNavigate }: BudgetSetupProps) {
  const canEdit = role === "officer"
  const [years, setYears] = useState<number[]>([])
  const [year, setYear] = useState(DEFAULT_YEAR)
  const [source, setSource] = useState("national")
  const [summary, setSummary] = useState<BranchSummary | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [added, setAdded] = useState<string[]>([])
  const [newDepartment, setNewDepartment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getFiscalYears()
      .then((list) => {
        setYears(list)
        if (list.length && !list.includes(DEFAULT_YEAR)) setYear(list[list.length - 1])
      })
      .catch(() => setYears([DEFAULT_YEAR]))
  }, [])

  useEffect(() => {
    setSummary(null)
    setError(null)
    budgetService
      .getBranchSummary(year)
      .then(setSummary)
      .catch((e) => setError(e instanceof ApiError ? e.detail : "โหลดวงเงินสาขาไม่สำเร็จ"))
  }, [year])

  const dirty = Object.keys(drafts).length > 0 || added.length > 0
  const departments = useMemo(
    () => [...(summary?.departments ?? []), ...added.filter((d) => !summary?.departments.includes(d))],
    [summary, added]
  )
  const sourceLabel = summary?.sources.find((s) => s.code === source)?.label ?? ""

  const rows = departments.map((department) => {
    const row = summary?.rows.find((r) => r.department === department && r.source_code === source) ?? emptyRow(department, source)
    const draft = drafts[department]
    const ceiling = draft === undefined ? row.ceiling : parseCeiling(draft) ?? row.ceiling
    return { ...row, ceiling, remaining: ceiling - row.committed - row.pending, draft }
  })
  const totals = rows.reduce(
    (sum, r) => ({
      ceiling: sum.ceiling + r.ceiling,
      committed: sum.committed + r.committed,
      pending: sum.pending + r.pending,
      spent: sum.spent + r.spent,
      remaining: sum.remaining + r.remaining,
    }),
    { ceiling: 0, committed: 0, pending: 0, spent: 0, remaining: 0 }
  )
  const invalid = Object.entries(drafts).filter(([, text]) => parseCeiling(text) === null)

  const leaveDraft = (next: () => void) => {
    if (dirty && !confirm("วงเงินที่แก้ไว้ยังไม่ได้บันทึก ต้องการทิ้งการแก้ไขหรือไม่?")) return
    setDrafts({})
    setAdded([])
    setNotice(null)
    next()
  }

  const addDepartment = () => {
    const name = newDepartment.trim()
    if (!name) return
    if (!departments.includes(name)) setAdded([...added, name])
    setDrafts((prev) => ({ ...prev, [name]: prev[name] ?? "0" }))
    setNewDepartment("")
  }

  const save = async () => {
    if (invalid.length) {
      setError(`วงเงินของ ${invalid.map(([d]) => d).join(", ")} ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const ceilings = Object.entries(drafts).map(([department, text]) => ({ department, ceiling: parseCeiling(text) ?? 0 }))
      setSummary(await budgetService.saveCeilings(year, source, ceilings))
      setDrafts({})
      setAdded([])
      setNotice(`บันทึกวงเงิน${sourceLabel} ปีงบ ${year} แล้ว`)
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "บันทึกวงเงินไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  const amountCell = (value: number, testId: string, tone = "text-ink") => (
    <td data-testid={testId} className={`py-3 px-2 text-right font-mono text-sm ${value < 0 ? "font-bold text-rose-600" : tone}`}>
      {baht(value)}
    </td>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="คุมงบประมาณ"
        title="จัดสรรงบสาขา"
        description="วงเงินของแต่ละสาขาแยกตามแหล่งงบ — ระบบเตือนเมื่ออนุมัติโครงการเกินวงเงิน และคืนงบที่เหลือเมื่อปิดโครงการ"
        onBack={() => leaveDraft(() => onNavigate("dashboard"))}
      />

      <Card className="p-4 lg:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="text-xs font-semibold text-ink">
            ปีงบประมาณ
            <select
              value={year}
              onChange={(e) => {
                const next = Number(e.target.value)
                leaveDraft(() => setYear(next))
              }}
              className="mt-1.5 block w-40 rounded-xl border border-line-strong bg-white px-3 py-2 text-sm font-bold text-brand"
            >
              {(years.length ? years : [year]).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {(summary?.sources ?? []).map((s) => (
              <button
                key={s.code}
                data-testid={`source-tab-${s.code}`}
                onClick={() => s.code !== source && leaveDraft(() => setSource(s.code))}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  s.code === source ? "bg-brand text-white" : "bg-brand-soft text-brand hover:bg-brand-soft/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{error}</div>}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">{notice}</div>
      )}

      <Card className="p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink">วงเงิน{sourceLabel} ปีงบ {year}</h2>
            <p className="text-xs text-muted">
              ผูกพัน = อัปโหลดเอกสารลงนามครบแล้ว (ปิดโครงการแล้วนับเท่าที่เบิกจริง) · รอลงนาม = เจ้าหน้าที่อนุมัติแล้ว ยังไม่ได้สแกน · คงเหลือ = วงเงิน − ผูกพัน − รอลงนาม
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <input
                data-testid="new-department-input"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDepartment()}
                placeholder="ชื่อสาขาที่ยังไม่มีในรายการ"
                className="w-56 rounded-xl border border-line-strong px-3 py-2 text-xs"
              />
              <Button data-testid="add-department" variant="outline" size="sm" icon="plus" onClick={addDepartment}>
                เพิ่มสาขา
              </Button>
            </div>
          )}
        </div>

        {!summary && !error ? (
          <div className="py-10 text-center text-xs text-muted">กำลังโหลด...</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted">ยังไม่มีสาขาในปีงบนี้ — เพิ่มสาขาเพื่อตั้งวงเงิน</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            {/* มือถือ: เลื่อนตารางซ้ายขวา (ไม่บีบคอลัมน์จนอ่านไม่ออก) */}
            <table className="w-full min-w-150 text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold text-muted">
                  <th className="py-3 px-2">สาขา</th>
                  <th className="py-3 px-2 text-right">วงเงิน (บาท)</th>
                  <th className="py-3 px-2 text-right">ผูกพัน</th>
                  <th className="py-3 px-2 text-right">รอลงนาม</th>
                  <th className="py-3 px-2 text-right">เบิกจ่ายแล้ว</th>
                  <th className="py-3 px-2 text-right">คงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.department} data-testid="ceiling-row" data-department={row.department} className="hover:bg-surface">
                    <td className="py-3 px-2 font-semibold text-ink">{row.department}</td>
                    <td className="py-3 px-2 text-right">
                      {canEdit ? (
                        <input
                          data-testid="ceiling-input"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.draft ?? String(row.ceiling)}
                          onChange={(e) => {
                            const value = e.target.value
                            setNotice(null)
                            setDrafts((prev) => ({ ...prev, [row.department]: value }))
                          }}
                          className={`${inputClass} ${row.draft !== undefined && parseCeiling(row.draft) === null ? "border-rose-400" : ""}`}
                        />
                      ) : (
                        <span className="font-mono text-sm font-bold text-brand">{baht(row.ceiling)}</span>
                      )}
                    </td>
                    {amountCell(row.committed, "row-committed")}
                    {amountCell(row.pending, "row-pending", "text-muted")}
                    {amountCell(row.spent, "row-spent", "text-emerald-700")}
                    {amountCell(row.remaining, "row-remaining", "font-bold text-brand")}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand/20 text-sm font-bold">
                  <td className="py-3 px-2">รวมทุกสาขา</td>
                  <td className="py-3 px-2 text-right font-mono">{baht(totals.ceiling)}</td>
                  <td className="py-3 px-2 text-right font-mono">{baht(totals.committed)}</td>
                  <td className="py-3 px-2 text-right font-mono">{baht(totals.pending)}</td>
                  <td className="py-3 px-2 text-right font-mono">{baht(totals.spent)}</td>
                  <td className={`py-3 px-2 text-right font-mono ${totals.remaining < 0 ? "text-rose-600" : ""}`}>{baht(totals.remaining)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
            {dirty && <span className="text-xs font-semibold text-amber-700">มีวงเงินที่แก้แล้วยังไม่ได้บันทึก</span>}
            <Button data-testid="save-ceilings" variant="accent" disabled={!dirty || saving} onClick={save}>
              {saving ? "กำลังบันทึก..." : "บันทึกวงเงิน"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

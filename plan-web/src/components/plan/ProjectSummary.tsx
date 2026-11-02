import { FiscalYearConfig, PlanItem, PlanProject } from "../../types/plan"
import { formatMoney } from "../../lib/formatters"
import { activityPeriod } from "../../lib/fiscalPeriod"
import { Icon } from "../ui/Icons"

// ส่วนแสดงรายละเอียดโครงการที่ใช้ร่วมกันระหว่างหน้างานเจ้าหน้าที่และหน้ารายละเอียดโครงการ
// ชื่อหมวดรายจ่าย/แหล่งงบมาจาก config ของปีงบ (backend/fiscal_years/{ปี}/config.json)

export const projectYear = (project: PlanProject) => project.formData?.fiscalYear || project.fiscalYear || 2570

const SOURCE_KEYS: Record<string, "national" | "revenue" | "offBudget"> = {
  national: "national",
  revenue: "revenue",
  off_budget: "offBudget",
}

const DEFAULT_SOURCES = [
  { code: "national", label: "งบประมาณแผ่นดิน" },
  { code: "revenue", label: "งบประมาณเงินรายได้" },
  { code: "off_budget", label: "งบนอกแผน" },
]

interface SectionProps {
  project: PlanProject
  config: FiscalYearConfig | null
}

/** ยอดเงินตามแหล่งงบ + วัตถุประสงค์ + กลุ่มเป้าหมาย */
export function ProjectFacts({ project, config }: SectionProps) {
  const sources = project.formData?.budgetSources ?? project.budgetSources
  const rows = (config?.budget_sources.length ? config.budget_sources : DEFAULT_SOURCES).map((source) => {
    const key = SOURCE_KEYS[source.code]
    return { ...source, amount: key && sources ? sources[key] ?? 0 : source.code === "national" && !sources ? project.amount : 0 }
  })
  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-brand/20 bg-brand-soft p-3">
          <div className="text-[11px] text-muted">งบประมาณทั้งสิ้น</div>
          <div className="mt-0.5 font-mono text-base font-bold text-brand">฿{formatMoney(project.amount)}</div>
        </div>
        {rows.map((row) => (
          <div key={row.code} className="rounded-xl border border-line bg-white p-3">
            <div className="text-[11px] text-muted">{row.label}</div>
            <div className={`mt-0.5 font-mono text-sm font-bold ${row.amount > 0 ? "text-ink" : "text-muted"}`}>฿{formatMoney(row.amount)}</div>
          </div>
        ))}
      </div>

      <dl className="space-y-3 rounded-xl border border-line bg-white p-4">
        <div>
          <dt className="font-bold text-ink">วัตถุประสงค์</dt>
          <dd className="mt-0.5 whitespace-pre-line leading-relaxed text-muted">{project.objective || "-"}</dd>
        </div>
        {project.targetGroup && (
          <div>
            <dt className="font-bold text-ink">กลุ่มเป้าหมาย</dt>
            <dd className="mt-0.5 text-muted">{project.targetGroup}</dd>
          </div>
        )}
        {project.formData?.projectCategory && (
          <div>
            <dt className="font-bold text-ink">ประเภทโครงการ</dt>
            <dd className="mt-0.5 text-muted">{project.formData.projectCategory}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

/** ข้อ 9 รายการค่าใช้จ่าย (ตัวคูณ) */
export function ProjectItems({ project, config }: SectionProps) {
  const items = project.formData?.multiplierItems || []
  const categoryLabel = (code: string) => config?.expense_categories.find((c) => c.code === code)?.label ?? code
  const sourceLabel = (code: string) =>
    (config?.budget_sources.length ? config.budget_sources : DEFAULT_SOURCES).find((s) => s.code === code)?.label ?? code

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface py-8 text-center text-xs text-muted">
        ไม่มีรายการค่าใช้จ่ายแยกบรรทัด (ยอดรวม ฿{formatMoney(project.amount)})
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-140 text-left text-xs">
        <thead className="border-b border-line bg-surface font-semibold text-muted">
          <tr>
            <th className="px-3 py-2">รายการ</th>
            <th className="px-2 py-2">การคำนวณ</th>
            <th className="px-2 py-2">แหล่งงบ</th>
            <th className="px-3 py-2 text-right">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item, index) => (
            <tr key={item.id || index}>
              <td className="px-3 py-2 text-ink">
                <div className="font-medium">{item.name}</div>
                <div className="text-[10px] text-muted">
                  {categoryLabel(item.category)}
                  {item.activityName ? ` · ${item.activityName}` : ""}
                </div>
              </td>
              <td className="px-2 py-2 font-mono text-[11px] text-muted">
                {item.targetQty} {item.targetUnit} × {item.durationQty} {item.durationUnit} × ฿{formatMoney(item.unitRate)} × {item.frequencyQty}{" "}
                {item.frequencyUnit}
              </td>
              <td className="px-2 py-2 text-[11px] text-muted">{sourceLabel(item.fundSource)}</td>
              <td className="px-3 py-2 text-right font-mono font-bold text-brand">{formatMoney(item.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-line bg-surface">
          <tr>
            <td colSpan={3} className="px-3 py-2 text-right font-bold text-ink">
              รวม
            </td>
            <td className="px-3 py-2 text-right font-mono font-bold text-brand">
              {formatMoney(items.reduce((sum, item) => sum + (item.totalAmount || 0), 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function PlanList({ title, items, empty }: { title: string; items: PlanItem[]; empty: string }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-line bg-white p-3.5">
      <div className="font-bold text-ink">{title}</div>
      {items.length === 0 ? (
        <div className="text-muted">{empty}</div>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-1.5 text-[11px] text-ink">
              <Icon name="check" size={14} className="mt-0.5 shrink-0 text-brand-2" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** ข้อ 3–4 ความสอดคล้องยุทธศาสตร์ + ข้อ 7–8 กิจกรรม */
export function ProjectStrategy({ project, config }: SectionProps) {
  const form = project.formData
  const facultyName = form?.facultyName || "คณะศิลปศาสตร์และวิทยาศาสตร์"
  const faculty = config?.faculty_plans[facultyName]
  const pick = (all: PlanItem[] | undefined, ids: number[] | undefined) => (all || []).filter((item) => ids?.includes(item.id))
  const activities = form?.activityDefinitions || []
  return (
    <div className="space-y-3 text-xs">
      <div className="grid gap-3 md:grid-cols-2">
        <PlanList
          title="ยุทธศาสตร์มหาวิทยาลัย (ข้อ 3)"
          items={[...pick(config?.university_plan.missions, form?.universityMissionIds), ...pick(config?.university_plan.strategies, form?.universityStrategyIds)]}
          empty="ไม่ได้ระบุ"
        />
        <PlanList
          title={`ยุทธศาสตร์${facultyName} (ข้อ 4)`}
          items={[...pick(faculty?.missions, form?.facultyMissionIds), ...pick(faculty?.strategies, form?.facultyStrategyIds)]}
          empty="ไม่ได้ระบุ"
        />
      </div>
      {activities.length > 0 && (
        <div className="space-y-2 rounded-xl border border-line bg-white p-3.5">
          <div className="font-bold text-ink">กิจกรรมและวิธีดำเนินงาน (ข้อ 7–8)</div>
          {activities.map((act, i) => {
            const { period, quarters } = activityPeriod(act, projectYear(project))
            const groups = (act.targetGroups || []).filter((g) => g.name.trim())
            return (
              <div key={act.id || i} className="border-b border-line pb-2 last:border-b-0 last:pb-0">
                <div className="font-semibold text-ink">
                  {/^กิจกรรมที่\s*\d/.test(act.name.trim()) ? act.name : `กิจกรรมที่ ${i + 1}: ${act.name}`}
                </div>
                {(act.subItems || [])
                  .filter((x) => x.trim())
                  .map((item, j) => (
                    <div key={j} className="text-[11px] text-muted">
                      - {item}
                    </div>
                  ))}
                <div className="mt-0.5 text-[11px] text-muted">
                  สถานที่: {act.location || "-"} · เป้าหมาย:{" "}
                  {groups.length > 0 ? groups.map((g) => `${g.name} ${g.count} คน`).join(", ") : `${act.targetCount} คน`}
                  {period && ` · ${period}`}
                  {quarters && ` (ไตรมาส ${quarters})`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

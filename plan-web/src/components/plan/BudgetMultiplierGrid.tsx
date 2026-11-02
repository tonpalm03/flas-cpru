import React, { useMemo } from "react"
import { Icon } from "../ui/Icons"
import { Button } from "../ui/Button"
import { CodeLabel, ExpenseCategoryConfig, MultiplierBudgetItem } from "../../types/plan"
import { formatMoney, formatBahtText } from "../../lib/formatters"
import { exportMultiplierToExcel } from "../../lib/excelExporter"

interface BudgetMultiplierGridProps {
  items: MultiplierBudgetItem[]
  onChange: (items: MultiplierBudgetItem[]) => void
  projectName?: string
  fiscalYear?: number
  facultyOrUnit?: string
  readOnly?: boolean
  // หมวดรายจ่ายและแหล่งงบของปีงบที่เลือก (มาจาก config ประจำปี)
  expenseCategories: ExpenseCategoryConfig[]
  budgetSources: CodeLabel[]
  // กิจกรรมของโครงการ — ถ้ามีตั้งแต่ 2 กิจกรรม ทุกรายการต้องระบุว่าเป็นของกิจกรรมไหน (ตารางข้อ 9 แยกตามกิจกรรม)
  activities?: { id: string; name: string }[]
}

// Ministry of Finance standard rate limits (Guardrails)
const RATE_LIMIT_HINTS: Record<string, { max: number; label: string }> = {
  "ค่าอาหารว่าง": { max: 50, label: "เกณฑ์กระทรวงการคลังปกติไม่เกิน 35 - 50 บาท/มื้อ" },
  "ค่าอาหารกลางวัน": { max: 150, label: "เกณฑ์กระทรวงการคลังปกติไม่เกิน 100 - 150 บาท/มื้อ" },
  "ค่าตอบแทนวิทยากร": { max: 2000, label: "วิทยากรภายนอกปกติ 1,000 - 2,000 บาท/ชม." },
}

export function BudgetMultiplierGrid({
  items,
  onChange,
  projectName = "",
  fiscalYear = 2570,
  facultyOrUnit = "คณะศิลปศาสตร์และวิทยาศาสตร์",
  readOnly = false,
  expenseCategories,
  budgetSources,
  activities = [],
}: BudgetMultiplierGridProps) {
  const showActivity = activities.length > 1
  // Handle Row Field Update
  const updateItem = (id: string, updates: Partial<MultiplierBudgetItem>) => {
    const newItems = items.map((item) => {
      if (item.id !== id) return item
      const updated = { ...item, ...updates }

      // Auto-recalculate formula: targetQty * durationQty * unitRate * frequencyQty
      const tQty = Number(updated.targetQty) || 0
      const dQty = Number(updated.durationQty) || 1
      const rate = Number(updated.unitRate) || 0
      const fQty = Number(updated.frequencyQty) || 1

      updated.totalAmount = tQty * dQty * rate * fQty
      return updated
    })
    onChange(newItems)
  }

  // Remove Row
  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id))
  }

  // Add Item to a Category
  const addItem = (category: string, preset?: Partial<MultiplierBudgetItem>) => {
    const newItem: MultiplierBudgetItem = {
      id: `mul-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      category,
      name: preset?.name || "รายการค่าใช้จ่ายใหม่",
      targetQty: preset?.targetQty ?? 1,
      targetUnit: preset?.targetUnit || "คน",
      durationQty: preset?.durationQty ?? 1,
      durationUnit: preset?.durationUnit || "วัน",
      unitRate: preset?.unitRate ?? 0,
      rateUnit: "บาท",
      frequencyQty: preset?.frequencyQty ?? 1,
      frequencyUnit: "ครั้ง",
      totalAmount: (preset?.targetQty ?? 1) * (preset?.durationQty ?? 1) * (preset?.unitRate ?? 0) * (preset?.frequencyQty ?? 1),
      fundSource: preset?.fundSource || budgetSources[0]?.code || "national",
      note: preset?.note || "",
    }
    onChange([...items, newItem])
  }

  // Quick Preset Handlers
  const addPresetSpeaker = () => {
    addItem("compensation", {
      name: "ค่าตอบแทนวิทยากร",
      targetQty: 2,
      targetUnit: "คน",
      durationQty: 6,
      durationUnit: "ชม.",
      unitRate: 1000,
      frequencyQty: 1,
      fundSource: "national",
    })
  }

  const addPresetSnack = () => {
    addItem("operations", {
      name: "ค่าอาหารว่างและเครื่องดื่ม",
      targetQty: 50,
      targetUnit: "คน",
      durationQty: 2,
      durationUnit: "มื้อ",
      unitRate: 35,
      frequencyQty: 1,
      fundSource: "national",
    })
  }

  const addPresetLunch = () => {
    addItem("operations", {
      name: "ค่าอาหารกลางวัน",
      targetQty: 50,
      targetUnit: "คน",
      durationQty: 1,
      durationUnit: "มื้อ",
      unitRate: 120,
      frequencyQty: 1,
      fundSource: "national",
    })
  }

  const addPresetMaterials = () => {
    addItem("materials", {
      name: "ค่าวัสดุประกอบการจัดกิจกรรม",
      targetQty: 50,
      targetUnit: "ชุด",
      durationQty: 1,
      durationUnit: "วัน",
      unitRate: 50,
      frequencyQty: 1,
      fundSource: "national",
    })
  }

  // Sums (ตามหมวด/แหล่งงบใน config ของปีงบ)
  const sumOf = (list: MultiplierBudgetItem[]) => list.reduce((s, i) => s + (i.totalAmount || 0), 0)
  const categoryCodes = useMemo(() => new Set(expenseCategories.map((c) => c.code)), [expenseCategories])
  const unknownCategoryItems = useMemo(() => items.filter((i) => !categoryCodes.has(i.category)), [items, categoryCodes])
  const sourceTotals = useMemo(
    () => budgetSources.map((source) => ({ ...source, total: sumOf(items.filter((i) => i.fundSource === source.code)) })),
    [items, budgetSources]
  )
  const hasCategory = (code: string) => categoryCodes.has(code)

  const grandTotal = sumOf(items)
  const thaiBahtText = formatBahtText(grandTotal)

  // Handle Export Excel
  const handleExportExcel = () => {
    exportMultiplierToExcel({
      projectName: projectName || "ร่างโครงการเสนอของบประมาณ",
      fiscalYear,
      facultyOrUnit,
      multiplierItems: items,
      expenseCategories,
      budgetSources,
    })
  }

  // Render Table Section
  const renderCategorySection = (catKey: string, title: string, sectionNo: number | string, catItems: MultiplierBudgetItem[]) => {
    const categoryTotal = sumOf(catItems)

    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Category Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
              {sectionNo}
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">{title}</h3>
              <span className="text-[11px] text-muted">
                มี {catItems.length} รายการ (รวม {formatMoney(categoryTotal)} บาท)
              </span>
            </div>
          </div>

          {!readOnly && hasCategory(catKey) && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                icon="plus"
                type="button"
                onClick={() => addItem(catKey)}
                className="text-xs py-1"
              >
                เพิ่มรายการในหมวดนี้
              </Button>
            </div>
          )}
        </div>

        {/* Rows Table */}
        {catItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            ยังไม่มีรายการในหมวดนี้ คลิก "+ เพิ่มรายการ" ด้านบน
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600">
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 min-w-[200px]">รายการงบประมาณ</th>
                  <th className="p-2.5 min-w-[140px] text-center">กลุ่มเป้าหมาย (คน/ชุด)</th>
                  <th className="p-2.5 min-w-[140px] text-center">ระยะเวลา (ชม./มื้อ/วัน)</th>
                  <th className="p-2.5 min-w-[110px] text-right">อัตรา (บาท)</th>
                  <th className="p-2.5 min-w-[90px] text-center">จำนวนครั้ง</th>
                  <th className="p-2.5 min-w-[110px] text-center">แหล่งเงิน</th>
                  <th className="p-2.5 min-w-[120px] text-right font-bold text-emerald-800">รวมทั้งสิ้น (บาท)</th>
                  {!readOnly && <th className="p-2.5 w-10 text-center">ลบ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catItems.map((item, idx) => {
                  // Check Guardrail Limit
                  let hintText: string | null = null
                  for (const [keyPattern, rule] of Object.entries(RATE_LIMIT_HINTS)) {
                    if (item.name.includes(keyPattern) && item.unitRate > rule.max) {
                      hintText = `เกินอัตรามาตรฐาน: ${rule.label}`
                      break
                    }
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-2 text-center text-slate-400 font-medium">{idx + 1}</td>

                      {/* รายการ */}
                      <td className="p-2">
                        {readOnly ? (
                          <span className="font-semibold text-slate-800">{item.name}</span>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              placeholder="เช่น ค่าตอบแทนวิทยากร"
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold focus:border-brand focus:outline-none"
                            />
                            {hintText && (
                              <p className="text-[10px] text-amber-600 mt-0.5 font-medium">{hintText}</p>
                            )}
                            {showActivity && (
                              <select
                                data-testid="item-activity"
                                value={activities.some((a) => a.id === item.activityId) ? item.activityId : ""}
                                onChange={(e) => updateItem(item.id, { activityId: e.target.value || undefined })}
                                className={`mt-1 w-full rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                                  activities.some((a) => a.id === item.activityId)
                                    ? "border-slate-300 text-slate-700"
                                    : "border-rose-300 bg-rose-50 text-rose-700"
                                }`}
                              >
                                <option value="">— เลือกกิจกรรมของรายการนี้ —</option>
                                {activities.map((activity) => (
                                  <option key={activity.id} value={activity.id}>
                                    {activity.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </td>

                      {/* กลุ่มเป้าหมาย: Qty x Unit */}
                      <td className="p-2 text-center">
                        {readOnly ? (
                          <span>{item.targetQty} {item.targetUnit}</span>
                        ) : (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="1"
                              value={item.targetQty}
                              onChange={(e) => updateItem(item.id, { targetQty: Number(e.target.value) || 0 })}
                              className="w-14 rounded-lg border border-slate-300 px-1.5 py-1 text-center text-xs font-semibold"
                            />
                            <input
                              type="text"
                              value={item.targetUnit}
                              onChange={(e) => updateItem(item.id, { targetUnit: e.target.value })}
                              placeholder="คน"
                              className="w-12 rounded-lg border border-slate-300 px-1 py-1 text-center text-xs text-slate-600"
                            />
                          </div>
                        )}
                      </td>

                      {/* ระยะเวลา: Qty x Unit */}
                      <td className="p-2 text-center">
                        {readOnly ? (
                          <span>{item.durationQty} {item.durationUnit}</span>
                        ) : (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="1"
                              value={item.durationQty}
                              onChange={(e) => updateItem(item.id, { durationQty: Number(e.target.value) || 0 })}
                              className="w-14 rounded-lg border border-slate-300 px-1.5 py-1 text-center text-xs font-semibold"
                            />
                            <input
                              type="text"
                              value={item.durationUnit}
                              onChange={(e) => updateItem(item.id, { durationUnit: e.target.value })}
                              placeholder="ชม."
                              className="w-12 rounded-lg border border-slate-300 px-1 py-1 text-center text-xs text-slate-600"
                            />
                          </div>
                        )}
                      </td>

                      {/* อัตรา (บาท) */}
                      <td className="p-2 text-right">
                        {readOnly ? (
                          <span>{formatMoney(item.unitRate)}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={item.unitRate}
                            onChange={(e) => updateItem(item.id, { unitRate: Number(e.target.value) || 0 })}
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-xs font-semibold"
                          />
                        )}
                      </td>

                      {/* จำนวนครั้ง */}
                      <td className="p-2 text-center">
                        {readOnly ? (
                          <span>{item.frequencyQty} ครั้ง</span>
                        ) : (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="1"
                              value={item.frequencyQty}
                              onChange={(e) => updateItem(item.id, { frequencyQty: Number(e.target.value) || 1 })}
                              className="w-12 rounded-lg border border-slate-300 px-1 py-1 text-center text-xs font-semibold"
                            />
                            <span className="text-[11px] text-slate-500">ครั้ง</span>
                          </div>
                        )}
                      </td>

                      {/* แหล่งเงิน */}
                      <td className="p-2 text-center">
                        {readOnly ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {budgetSources.find((source) => source.code === item.fundSource)?.label || item.fundSource}
                          </span>
                        ) : (
                          <select
                            value={item.fundSource}
                            onChange={(e) => updateItem(item.id, { fundSource: e.target.value })}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                          >
                            {budgetSources.map((source) => (
                              <option key={source.code} value={source.code}>
                                {source.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* ยอดรวมรายการ (คำนวณสด) */}
                      <td className="p-2 text-right font-bold text-emerald-700 text-sm">
                        {formatMoney(item.totalAmount)}
                      </td>

                      {/* ลบ */}
                      {!readOnly && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            title="ลบรายการนี้"
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Quick Presets Bar */}
      {!readOnly && (
        <div className="rounded-2xl border border-line bg-brand-soft/50 p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-xs font-bold text-ink">เพิ่มรายการที่ใช้บ่อย</h4>
              <p className="text-[11px] text-muted">กดเพื่อเพิ่มรายการพร้อมจำนวนและอัตรามาตรฐาน แล้วแก้ตัวเลขให้ตรงกับโครงการ</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon="download"
              type="button"
              onClick={handleExportExcel}
            >
              ส่งออก Excel
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {hasCategory("compensation") && (<button
              type="button"
              onClick={addPresetSpeaker}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-brand-soft transition-colors cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>วิทยากร (2 คน × 6 ชม. × 1,000 บ.)</span>
            </button>)}

            {hasCategory("operations") && (<button
              type="button"
              onClick={addPresetSnack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-brand-soft transition-colors cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>อาหารว่าง (50 คน × 2 มื้อ × 35 บ.)</span>
            </button>)}

            {hasCategory("operations") && (<button
              type="button"
              onClick={addPresetLunch}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-brand-soft transition-colors cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>อาหารกลางวัน (50 คน × 1 มื้อ × 120 บ.)</span>
            </button>)}

            {hasCategory("materials") && (<button
              type="button"
              onClick={addPresetMaterials}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-brand-soft transition-colors cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>วัสดุอบรม (50 ชุด × 1 วัน × 50 บ.)</span>
            </button>)}

            {hasCategory("other") && (<button
              type="button"
              onClick={() => addItem("other", { name: "ค่าใช้จ่ายอื่น ๆ ที่จำเป็นสำหรับโครงการ", targetQty: 1, targetUnit: "รายการ", durationQty: 1, durationUnit: "ครั้ง", unitRate: 1000, frequencyQty: 1, fundSource: "national" })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-brand-soft transition-colors cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>ค่าใช้จ่ายอื่น ๆ</span>
            </button>)}
          </div>
        </div>
      )}

      {/* หมวดรายจ่ายตาม config ของปีงบ */}
      {expenseCategories.map((category, index) => (
        <div key={category.code}>
          {renderCategorySection(category.code, `${index + 1}. หมวด${category.label}`, index + 1, items.filter((i) => i.category === category.code))}
        </div>
      ))}
      {unknownCategoryItems.length > 0 && (
        <div className="space-y-2">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
            มี {unknownCategoryItems.length} รายการที่หมวดไม่มีในปีงบประมาณนี้ กรุณาลบแล้วเพิ่มใหม่ในหมวดที่ถูกต้อง (ระบบจะสร้างเอกสารไม่ได้)
          </div>
          {renderCategorySection("__unknown__", "หมวดที่ไม่มีในปีงบประมาณนี้", "!", unknownCategoryItems)}
        </div>
      )}

      {/* Grand Summary Dashboard */}
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-5 shadow-md space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-100 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              สรุปงบประมาณโครงการ (คำนวณให้อัตโนมัติ)
            </span>
            <h3 className="text-base font-bold text-slate-900">
              ยอดงบประมาณทั้งสิ้นทุกหมวด
            </h3>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">
              ฿{formatMoney(grandTotal)}
            </span>
            <p className="text-xs font-semibold text-emerald-700">
              (-{thaiBahtText}-)
            </p>
          </div>
        </div>

        {/* แหล่งงบตาม config ของปีงบ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sourceTotals.map((source, index) => (
            <div key={source.code} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500">{index + 1}. {source.label}</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900">฿{formatMoney(source.total)}</span>
                <span className="text-[10px] text-slate-400">
                  {grandTotal > 0 ? ((source.total / grandTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

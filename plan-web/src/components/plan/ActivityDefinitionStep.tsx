import React from "react"
import { Icon } from "../ui/Icons"
import { Button } from "../ui/Button"
import { ProjectActivityDefinition, TargetGroup } from "../../types/plan"
import { FISCAL_MONTHS, THAI_MONTHS, fiscalIndex, monthYear, quartersOf, withDerivedFields } from "../../lib/fiscalPeriod"

interface ActivityDefinitionStepProps {
  activities: ProjectActivityDefinition[]
  onChange: (activities: ProjectActivityDefinition[]) => void
  // ปีงบของโครงการ — ใช้แสดงปีของเดือน (ต.ค. 69 ... ก.ย. 70)
  fiscalYear: number
  readOnly?: boolean
}

export function ActivityDefinitionStep({
  activities,
  onChange,
  fiscalYear,
  readOnly = false,
}: ActivityDefinitionStepProps) {
  // Add new Activity
  const addActivity = () => {
    const nextIdx = activities.length + 1
    const newAct: ProjectActivityDefinition = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      index: nextIdx,
      name: `กิจกรรมที่ ${nextIdx} : `,
      subItems: [],
      location: "",
      committeeCount: 0,
      targetGroups: [{ name: "", count: 0 }],
      targetCount: 0,
      startMonth: 10,
      endMonth: 12,
      quarter: 1,
      monthRange: "",
      methods: [`${nextIdx}.1 `],
      kpi: "",
      multiplierItems: [],
    }
    onChange([...activities, withDerivedFields(newAct, fiscalYear)])
  }

  // Remove Activity
  const removeActivity = (id: string) => {
    if (activities.length <= 1) {
      alert("โครงการต้องมีอย่างน้อย 1 กิจกรรม")
      return
    }
    const filtered = activities.filter((a) => a.id !== id)
    // Reindex
    const reindexed = filtered.map((a, i) => ({
      ...a,
      index: i + 1,
      name: a.name.startsWith(`กิจกรรมที่`) ? a.name.replace(/^กิจกรรมที่ \d+/, `กิจกรรมที่ ${i + 1}`) : a.name,
    }))
    onChange(reindexed)
  }

  // Update Activity Field
  const updateActivity = (id: string, updates: Partial<ProjectActivityDefinition>) => {
    onChange(
      activities.map((a) => (a.id === id ? withDerivedFields({ ...a, ...updates }, fiscalYear) : a))
    )
  }

  // Add Method step (1.1, 1.2...)
  const addMethodStep = (actId: string) => {
    const act = activities.find((a) => a.id === actId)
    if (!act) return
    const nextStepNo = `${act.index}.${act.methods.length + 1}`
    const newMethods = [...act.methods, `${nextStepNo} `]
    updateActivity(actId, { methods: newMethods })
  }

  // Update Method step
  const updateMethodStep = (actId: string, mIdx: number, text: string) => {
    const act = activities.find((a) => a.id === actId)
    if (!act) return
    const newMethods = [...act.methods]
    newMethods[mIdx] = text
    updateActivity(actId, { methods: newMethods })
  }

  // Remove Method step
  const removeMethodStep = (actId: string, mIdx: number) => {
    const act = activities.find((a) => a.id === actId)
    if (!act || act.methods.length <= 1) return
    const newMethods = act.methods.filter((_, i) => i !== mIdx)
    updateActivity(actId, { methods: newMethods })
  }

  // รายการย่อยใต้ชื่อกิจกรรม
  const setSubItems = (act: ProjectActivityDefinition, subItems: string[]) => updateActivity(act.id, { subItems })

  // กลุ่มเป้าหมาย: ร่างรุ่นก่อนมีแค่จำนวนรวม → แสดงเป็น 1 แถวที่ไม่มีชื่อ
  const groupsOf = (act: ProjectActivityDefinition): TargetGroup[] =>
    act.targetGroups?.length ? act.targetGroups : [{ name: "", count: act.targetCount || 0 }]
  const setGroups = (act: ProjectActivityDefinition, targetGroups: TargetGroup[]) => updateActivity(act.id, { targetGroups })

  // เดือนเริ่มต้องไม่หลังเดือนสิ้นสุด (นับตามปีงบ ต.ค. → ก.ย.)
  const setMonths = (act: ProjectActivityDefinition, changed: "start" | "end", month: number) => {
    let start = changed === "start" ? month : act.startMonth ?? 10
    let end = changed === "end" ? month : act.endMonth ?? start
    if (fiscalIndex(start) > fiscalIndex(end)) {
      if (changed === "start") end = start
      else start = end
    }
    updateActivity(act.id, { startMonth: start, endMonth: end })
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
            ข้อ 7 และ 8: ขอบเขต กิจกรรม และวิธีดำเนินงาน
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            โครงสร้างกิจกรรมของโครงการ ({activities.length} กิจกรรม)
          </h3>
          <p className="text-xs text-slate-500">
            โครงการสามารถมี 1 กิจกรรม หรือหลายกิจกรรมย่อยได้ตามแผนงานที่กำหนด
          </p>
        </div>

        {!readOnly && (
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            type="button"
            onClick={addActivity}
            className="shadow-sm"
          >
            + เพิ่มกิจกรรมใหม่
          </Button>
        )}
      </div>

      {/* Activities List */}
      <div className="space-y-6">
        {activities.map((act) => (
          <div
            key={act.id}
            className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-5 transition-all"
          >
            {/* Activity Card Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-xs font-bold text-white shadow-2xs">
                  {act.index}
                </span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    กิจกรรมที่ {act.index}
                  </span>
                  {readOnly ? (
                    <h4 className="text-sm font-bold text-slate-900">{act.name}</h4>
                  ) : (
                    <input
                      type="text"
                      value={act.name}
                      onChange={(e) => updateActivity(act.id, { name: e.target.value })}
                      placeholder="เช่น กิจกรรมที่ 1 : การอบรมเชิงปฏิบัติการพัฒนาทักษะวิชาชีพ"
                      className="w-full sm:min-w-[420px] rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-900 focus:border-brand focus:outline-none"
                    />
                  )}
                  {!readOnly && (
                    <div className="mt-2 space-y-1" data-testid="sub-items">
                      {(act.subItems || []).map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-400">-</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => setSubItems(act, (act.subItems || []).map((x, j) => (j === i ? e.target.value : x)))}
                            placeholder="รายการย่อย เช่น ค่าใช้จ่ายเดินทางไปราชการ"
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs focus:outline-none focus:border-brand"
                          />
                          <button
                            type="button"
                            onClick={() => setSubItems(act, (act.subItems || []).filter((_, j) => j !== i))}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="ลบรายการย่อยนี้"
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSubItems(act, [...(act.subItems || []), ""])}
                        className="text-[11px] font-bold text-brand hover:underline"
                      >
                        + เพิ่มรายการย่อยของกิจกรรม (ถ้ามี)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!readOnly && activities.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeActivity(act.id)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  ลบกิจกรรมนี้
                </button>
              )}
            </div>

            {/* Section 7: Scope (สถานที่, กลุ่มเป้าหมาย, ไตรมาส, งบประมาณ) */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>ข้อ 7. ขอบเขตการจัดโครงการ (สถานที่ กลุ่มเป้าหมาย ระยะเวลา และงบประมาณ)</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    1. สถานที่จัดโครงการ
                  </label>
                  {/* หลายสถานที่พิมพ์แยกบรรทัดได้ เช่น (1) ในมหาวิทยาลัย (2) ภายนอกมหาวิทยาลัย */}
                  <textarea
                    rows={2}
                    value={act.location}
                    disabled={readOnly}
                    onChange={(e) => updateActivity(act.id, { location: e.target.value })}
                    placeholder="เช่น ห้องประชุม 1 มรภ.ชัยภูมิ"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    2. วิทยากร/คณะทำงาน (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    data-testid="committee-count"
                    value={act.committeeCount}
                    disabled={readOnly}
                    onChange={(e) => updateActivity(act.id, { committeeCount: Number(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-center focus:outline-none focus:border-brand"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    ใส่ 0 ถ้าไม่มี — เอกสารจะไม่พิมพ์บรรทัดนี้
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ระยะเวลา: เดือนเริ่ม
                  </label>
                  <select
                    data-testid="start-month"
                    value={act.startMonth ?? 10}
                    disabled={readOnly}
                    onChange={(e) => setMonths(act, "start", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand"
                  >
                    {FISCAL_MONTHS.map((m) => (
                      <option key={m} value={m}>{THAI_MONTHS[m]} {monthYear(m, fiscalYear)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ถึงเดือน
                  </label>
                  <select
                    data-testid="end-month"
                    value={act.endMonth ?? act.startMonth ?? 12}
                    disabled={readOnly}
                    onChange={(e) => setMonths(act, "end", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand"
                  >
                    {FISCAL_MONTHS.map((m) => (
                      <option key={m} value={m}>{THAI_MONTHS[m]} {monthYear(m, fiscalYear)}</option>
                    ))}
                  </select>
                  <span data-testid="quarters" className="text-[10px] text-slate-500 mt-1 block">
                    ไตรมาส {quartersOf(act.startMonth ?? 10, act.endMonth ?? act.startMonth ?? 12).join(",")} (คำนวณจากเดือน)
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                    งบประมาณกิจกรรม (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={act.budgetAmount ?? 0}
                    disabled={readOnly}
                    onChange={(e) => updateActivity(act.id, { budgetAmount: Number(e.target.value) || 0 })}
                    placeholder="ระบุยอดงบกิจกรรม"
                    className="w-full rounded-lg border border-emerald-300 bg-emerald-50/50 px-2.5 py-1.5 text-xs font-bold text-right text-emerald-900 focus:outline-none focus:border-brand"
                  />
                  <span className="text-[10px] text-emerald-700 mt-1 block">
                    {activities.length === 1 ? "* ซิงค์กับตารางแตกตัวคูณ (ข้อ 9) อัตโนมัติ" : "* ผลรวมต้องเท่ากับยอดรวมข้อ 9"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5" data-testid="target-groups">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-600">
                    3. กลุ่มเป้าหมาย (รวม {groupsOf(act).reduce((sum, g) => sum + (Number(g.count) || 0), 0)} คน)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    ใส่ชื่อกลุ่มเพื่อแยกเป็นบรรทัดในเอกสาร เช่น สายวิชาการ 83 คน — ไม่ใส่ชื่อจะแสดงเป็นจำนวนรวม ·
                    นับเป็นหน่วยอื่นให้พิมพ์ในชื่อแล้วเว้นจำนวนเป็น 0 เช่น ร้านจำหน่ายอาหาร 20 ร้าน
                  </span>
                </div>
                {groupsOf(act).map((group, i, groups) => (
                  <div key={i} className="flex items-center gap-1.5" data-testid="target-group-row">
                    <span className="text-xs font-bold text-slate-400">-</span>
                    <input
                      type="text"
                      value={group.name}
                      disabled={readOnly}
                      onChange={(e) => setGroups(act, groups.map((g, j) => (j === i ? { ...g, name: e.target.value } : g)))}
                      placeholder="ชื่อกลุ่ม เช่น สายวิชาการ"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs focus:outline-none focus:border-brand"
                    />
                    <input
                      type="number"
                      min="0"
                      value={group.count}
                      disabled={readOnly}
                      onChange={(e) => setGroups(act, groups.map((g, j) => (j === i ? { ...g, count: Number(e.target.value) || 0 } : g)))}
                      className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-center focus:outline-none focus:border-brand"
                    />
                    <span className="text-xs text-slate-500">คน</span>
                    {!readOnly && groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGroups(act, groups.filter((_, j) => j !== i))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="ลบกลุ่มนี้"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setGroups(act, [...groupsOf(act), { name: "", count: 0 }])}
                    className="text-[11px] font-bold text-brand hover:underline"
                  >
                    + เพิ่มกลุ่มเป้าหมาย
                  </button>
                )}
              </div>
            </div>

            {/* Section 8: Methods & Activity KPI */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>ข้อ 8. กิจกรรม วิธีการดำเนินงาน และตัวชี้วัด (KPI)</span>
                </h5>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => addMethodStep(act.id)}
                    className="text-[11px] font-bold text-brand hover:underline"
                  >
                    + เพิ่มขั้นตอนดำเนินงาน
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* วิธีการดำเนินงาน (1.1, 1.2...) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    วิธีการดำเนินงาน (ขั้นตอนย่อย — กด Enter เพื่อขึ้นบรรทัดรายละเอียด)
                  </label>
                  {act.methods.map((method, mIdx) => (
                    <div key={mIdx} className="flex items-start gap-1.5">
                      {/* ขั้นตอนหนึ่งมีรายละเอียดย่อยหลายบรรทัดได้ ("- ใช้แบบสอบถาม...") แบบที่อาจารย์เขียนในเอกสารจริง */}
                      <textarea
                        data-testid="method-step"
                        rows={Math.max(1, method.split("\n").length)}
                        value={method}
                        disabled={readOnly}
                        onChange={(e) => updateMethodStep(act.id, mIdx, e.target.value)}
                        placeholder="เช่น 1.1 การวางแผนเตรียมการ..."
                        className="flex-1 resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs focus:outline-none focus:border-brand"
                      />
                      {!readOnly && act.methods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMethodStep(act.id, mIdx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="ลบขั้นตอนนี้"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* ตัวชี้วัดกิจกรรม (KPI) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ตัวชี้วัดกิจกรรม (Target KPI เป้าหมายความสำเร็จที่กำหนดไว้ล่วงหน้า)
                  </label>
                  <textarea
                    rows={3}
                    value={act.kpi}
                    disabled={readOnly}
                    onChange={(e) => updateActivity(act.id, { kpi: e.target.value })}
                    placeholder="เช่น ผู้เข้าร่วมโครงการไม่น้อยกว่า 50 คน และมีความพึงพอใจในระดับดีขึ้นไปไม่น้อยกว่าร้อยละ 80"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-brand"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    * ระบุเกณฑ์ความสำเร็จเชิงปริมาณหรือคุณภาพล่วงหน้า (ผลจริงจะรายงานเมื่อโครงการเสร็จสิ้น)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

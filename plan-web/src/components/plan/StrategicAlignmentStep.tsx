import React from "react"
import { Icon } from "../ui/Icons"
import { FiscalYearConfig, StrategicPlan } from "../../types/plan"

interface StrategicAlignmentStepProps {
  // แผนยุทธศาสตร์ของปีงบที่เลือก (มาจาก config ประจำปี)
  config: FiscalYearConfig

  // University Level (Section 3)
  selectedUniMissions: number[]
  onChangeUniMissions: (ids: number[]) => void
  selectedUniStrategies: number[]
  onChangeUniStrategies: (ids: number[]) => void

  // Faculty Level (Section 4) — คณะมาจากข้อมูลผู้ใช้ ไม่ให้เลือกเอง
  facultyName: string
  selectedFacultyMissions: number[]
  onChangeFacultyMissions: (ids: number[]) => void
  selectedFacultyStrategies: number[]
  onChangeFacultyStrategies: (ids: number[]) => void
}

export function StrategicAlignmentStep({
  config,
  selectedUniMissions,
  onChangeUniMissions,
  selectedUniStrategies,
  onChangeUniStrategies,
  facultyName,
  selectedFacultyMissions,
  onChangeFacultyMissions,
  selectedFacultyStrategies,
  onChangeFacultyStrategies,
}: StrategicAlignmentStepProps) {
  // ไม่ fallback ไปคณะอื่น — แผนของคณะอื่นในเอกสารผิดกว่าการบอกว่ายังไม่มีข้อมูล
  const currentFacultyConfig: StrategicPlan | undefined = config.faculty_plans[facultyName]
  const universityPlan = config.university_plan

  // Toggle University Mission
  const toggleUniMission = (id: number) => {
    if (selectedUniMissions.includes(id)) {
      onChangeUniMissions(selectedUniMissions.filter((i) => i !== id))
    } else {
      onChangeUniMissions([...selectedUniMissions, id])
    }
  }

  // Toggle University Strategy
  const toggleUniStrategy = (id: number) => {
    if (selectedUniStrategies.includes(id)) {
      onChangeUniStrategies(selectedUniStrategies.filter((i) => i !== id))
    } else {
      onChangeUniStrategies([...selectedUniStrategies, id])
    }
  }

  // Toggle Faculty Mission
  const toggleFacultyMission = (id: number) => {
    if (selectedFacultyMissions.includes(id)) {
      onChangeFacultyMissions(selectedFacultyMissions.filter((i) => i !== id))
    } else {
      onChangeFacultyMissions([...selectedFacultyMissions, id])
    }
  }

  // Toggle Faculty Strategy
  const toggleFacultyStrategy = (id: number) => {
    if (selectedFacultyStrategies.includes(id)) {
      onChangeFacultyStrategies(selectedFacultyStrategies.filter((i) => i !== id))
    } else {
      onChangeFacultyStrategies([...selectedFacultyStrategies, id])
    }
  }

  // 1-Click Smart Auto-Fill for Education/Training Project
  const handleAutoFillTraining = () => {
    onChangeUniMissions([1, 5]) // ผลิตบัณฑิต, เสริมสร้างวิชาชีพครู/บุคลากร
    onChangeUniStrategies([2, 3]) // ผลิตและพัฒนาครู, ยกระดับคุณภาพการศึกษา
    if (!currentFacultyConfig) return
    onChangeFacultyMissions([1, 2]) // ผลิตบัณฑิต, พัฒนาหลักสูตร
    onChangeFacultyStrategies([3]) // ยกระดับคุณภาพการศึกษา
  }

  // 1-Click Smart Auto-Fill for Community Service Project
  const handleAutoFillService = () => {
    onChangeUniMissions([2, 3, 4]) // วิจัย, บริการวิชาการ, ศิลปวัฒนธรรม
    onChangeUniStrategies([1]) // พัฒนาชุมชนท้องถิ่น
    if (!currentFacultyConfig) return
    onChangeFacultyMissions([3, 4]) // วิจัยและพัฒนานวัตกรรม, บริการวิชาการ/ศิลปวัฒนธรรม
    onChangeFacultyStrategies([1]) // พัฒนาชุมชนท้องถิ่น
  }

  return (
    <div className="space-y-6">
      {/* Top Helper Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand to-brand-2 p-5 text-white shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-md bg-emerald-400/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
              ข้อ 3 และ ข้อ 4 (กรอกครั้งเดียว ไม่ต้องพิมพ์ใหม่)
            </span>
            <h3 className="mt-1 text-base font-bold text-white">
              ความสอดคล้องของแผนปฏิบัติราชการ ระยะ 5 ปี (พ.ศ. 2566 - 2570)
            </h3>
            <p className="mt-0.5 text-xs text-white/80">
              ระบบดึงข้อมูลยุทธศาสตร์ระดับมหาวิทยาลัยและระดับคณะมาแสดงอัตโนมัติ เพียงคลิกเลือกความสอดคล้อง
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAutoFillTraining}
              className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer border border-white/20"
            >
              เลือกชุดที่ใช้บ่อย: โครงการอบรม/วิชาการ
            </button>
            <button
              type="button"
              onClick={handleAutoFillService}
              className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer border border-white/20"
            >
              เลือกชุดที่ใช้บ่อย: โครงการบริการชุมชน
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: University Level                                           */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
              3
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                3. ความสอดคล้องของแผนปฏิบัติราชการ ระดับมหาวิทยาลัยราชภัฏชัยภูมิ
              </h4>
              <p className="text-[11px] text-slate-500">
                {universityPlan.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">
              เลือกพันธกิจ {selectedUniMissions.length}/{universityPlan.missions.length}
            </span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-700 border border-teal-200">
              เลือกยุทธศาสตร์ {selectedUniStrategies.length}/{universityPlan.strategies.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* พันธกิจมหาวิทยาลัย (6 ข้อ) */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>พันธกิจมหาวิทยาลัย (เลือกข้อที่สอดคล้อง)</span>
            </h5>
            <div className="space-y-2">
              {universityPlan.missions.map((m) => {
                const isSelected = selectedUniMissions.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand bg-brand/5 text-slate-900 shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUniMission(m.id)}
                      className="mt-0.5 h-4 w-4 rounded text-brand focus:ring-brand"
                    />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold text-brand mr-1.5">{m.id}.</span>
                      <span>{m.text}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* ประเด็นยุทธศาสตร์มหาวิทยาลัย (4 ข้อ) */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>ประเด็นยุทธศาสตร์มหาวิทยาลัย (เลือกข้อที่สอดคล้อง)</span>
            </h5>
            <div className="space-y-2">
              {universityPlan.strategies.map((s) => {
                const isSelected = selectedUniStrategies.includes(s.id)
                return (
                  <label
                    key={s.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/60 text-slate-900 shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUniStrategy(s.id)}
                      className="mt-0.5 h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold text-teal-700 mr-1.5">{s.id}.</span>
                      <span className="font-semibold">{s.text}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 4: Faculty Level                                              */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600/10 text-xs font-bold text-teal-700">
              4
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                4. ความสอดคล้องของแผนปฏิบัติราชการ ระดับคณะ / หน่วยงาน
              </h4>
              <p className="text-[11px] text-slate-500">
                {currentFacultyConfig?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" title="ดึงจากข้อมูลผู้ใช้">
            <span className="text-xs font-semibold text-slate-600">คณะ/หน่วยงาน:</span>
            <span data-testid="faculty-name" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-teal-900">
              {facultyName || "ไม่พบคณะของผู้ใช้"}
            </span>
          </div>
        </div>

        {!currentFacultyConfig ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            {missingFacultyPlanMessage(facultyName, config.fiscal_year)}
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* พันธกิจคณะ */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>พันธกิจ ({facultyName})</span>
            </h5>
            <div className="space-y-2">
              {currentFacultyConfig.missions.map((m) => {
                const isSelected = selectedFacultyMissions.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFacultyMission(m.id)}
                      className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold text-emerald-800 mr-1.5">{m.id}.</span>
                      <span>{m.text}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* ประเด็นยุทธศาสตร์คณะ */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>ประเด็นยุทธศาสตร์ ({facultyName})</span>
            </h5>
            <div className="space-y-2">
              {currentFacultyConfig.strategies.map((s) => {
                const isSelected = selectedFacultyStrategies.includes(s.id)
                return (
                  <label
                    key={s.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand bg-brand/10 text-slate-900 shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFacultyStrategy(s.id)}
                      className="mt-0.5 h-4 w-4 rounded text-brand focus:ring-brand"
                    />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold text-brand mr-1.5">{s.id}.</span>
                      <span className="font-semibold">{s.text}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export function missingFacultyPlanMessage(facultyName: string, fiscalYear: number): string {
  return `ยังไม่มีแผนปฏิบัติราชการของ${facultyName || "คณะของคุณ"}ในปีงบประมาณ ${fiscalYear} กรุณาแจ้งเจ้าหน้าที่แผนให้เพิ่มข้อมูล (บันทึกแบบร่างได้ แต่ยังส่งตรวจไม่ได้)`
}

"use client";

import React from "react";
import {
  activityTotal,
  budgetItemTotal,
  formatBaht,
  periodText,
  planTotal,
  quartersOf,
  targetCount,
  totalsBySource,
  OTHER_CATEGORY_CODE,
  OFF_BUDGET_SOURCE,
  type FiscalYearConfig,
  type PlanForm,
} from "@/lib/planModel";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="text-[11px] font-bold text-slate-500">{label}</div>
      <div className="text-xs text-slate-900 whitespace-pre-wrap break-words">{children || <span className="text-slate-400">-</span>}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
      {children}
    </section>
  );
}

const thaiDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "";

/** สรุปแบบเสนอโครงการทั้ง 14 ข้อ (อ่านอย่างเดียว) */
export default function PlanSummary({ form, config, fiscalYear }: { form: PlanForm; config: FiscalYearConfig | null; fiscalYear: number }) {
  const category = config?.project_categories.find(c => c.code === form.projectCategoryCode);
  const facultyPlan = config?.faculty_plans[form.facultyName];
  const pick = (items: { id: number; text: string }[] | undefined, ids: number[]) =>
    (items || []).filter(i => ids.includes(i.id)).map(i => `${i.id}. ${i.text}`).join("\n");
  const sourceLabel = (code: string) => config?.budget_sources.find(s => s.code === code)?.label || code;
  const categoryLabel = (code: string) => config?.expense_categories.find(c => c.code === code)?.label || code;
  const bySource = totalsBySource(form);
  const single = form.activities.length === 1;

  return (
    <div className="space-y-4">
      <Block title="ข้อมูลโครงการ (ข้อ 1, 2 และ 5)">
        <Row label="ปีงบประมาณ">{String(fiscalYear)}</Row>
        <Row label="ประเภทโครงการ">
          {category?.label}
          {form.projectCategoryCode === OTHER_CATEGORY_CODE && form.projectCategoryOther ? ` : ${form.projectCategoryOther}` : ""}
        </Row>
        <Row label="1. ชื่อโครงการ">{form.title}</Row>
        <Row label="2. หน่วยงานที่ดำเนินการ">{form.department}</Row>
        <Row label="ระยะเวลาดำเนินการ">
          {form.startDate && form.endDate ? `${thaiDate(form.startDate)} ถึง ${thaiDate(form.endDate)}` : ""}
        </Row>
        <Row label="กลุ่มเป้าหมาย">{form.targetGroup}</Row>
        <Row label="5. หลักการและเหตุผล">
          {[form.backgroundProblem, form.backgroundSolution, form.backgroundImpact].filter(Boolean).join("\n\n")}
        </Row>
      </Block>

      <Block title="ความสอดคล้องเชิงยุทธศาสตร์ (ข้อ 3 และ 4)">
        <Row label="3. พันธกิจมหาวิทยาลัย">{pick(config?.university_plan.missions, form.universityMissionIds)}</Row>
        <Row label="3. ยุทธศาสตร์มหาวิทยาลัย">{pick(config?.university_plan.strategies, form.universityStrategyIds)}</Row>
        <Row label={`4. พันธกิจ${form.facultyName}`}>{pick(facultyPlan?.missions, form.facultyMissionIds)}</Row>
        <Row label={`4. ยุทธศาสตร์${form.facultyName}`}>{pick(facultyPlan?.strategies, form.facultyStrategyIds)}</Row>
      </Block>

      <Block title="วัตถุประสงค์ กิจกรรม และวิธีดำเนินงาน (ข้อ 6-8)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border border-slate-200 p-2 text-left">6. วัตถุประสงค์</th>
                <th className="border border-slate-200 p-2 text-left">ผลลัพธ์หลัก (Key Result)</th>
                <th className="border border-slate-200 p-2 text-left">ค่าเป้าหมาย</th>
              </tr>
            </thead>
            <tbody>
              {form.okrs.map((o, i) => (
                <tr key={o.id}>
                  <td className="border border-slate-200 p-2">{i + 1}. {o.objective}</td>
                  <td className="border border-slate-200 p-2">{o.keyResult}</td>
                  <td className="border border-slate-200 p-2">{o.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-3">
          {form.activities.map((a, i) => (
            <div key={a.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">กิจกรรมที่ {i + 1} : {a.name}</div>
                <div className="text-[11px] font-semibold text-emerald-800">งบกิจกรรม {formatBaht(activityTotal(form, a.id))} บาท</div>
              </div>
              {a.subItems.filter(Boolean).length > 0 && (
                <ul className="mt-1 text-[11px] text-slate-600">
                  {a.subItems.filter(Boolean).map((s, j) => <li key={j}>- {s}</li>)}
                </ul>
              )}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-[11px] text-slate-700">
                <div>7. สถานที่: {a.location || "-"}</div>
                <div>ช่วงเวลา: {periodText(a.startMonth, a.endMonth, fiscalYear)} (ไตรมาส {quartersOf(a.startMonth, a.endMonth).join(",")})</div>
                <div>คณะกรรมการ: {a.committeeCount || 0} คน</div>
                <div>
                  กลุ่มเป้าหมาย: {targetCount(a)} คน
                  {a.targetGroups.some(g => g.name) && ` (${a.targetGroups.filter(g => g.name).map(g => `${g.name} ${g.count} คน`).join(", ")})`}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-700">
                <div className="font-bold">8. วิธีดำเนินงาน</div>
                {a.methods.filter(Boolean).map((m, j) => <div key={j}>{i + 1}.{j + 1} {m}</div>)}
                <div className="mt-1"><span className="font-bold">ตัวชี้วัด:</span> {a.kpi || "-"}</div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="งบประมาณ (ข้อ 9)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                {!single && <th className="border border-slate-200 p-2 text-left">กิจกรรม</th>}
                <th className="border border-slate-200 p-2 text-left">หมวด</th>
                <th className="border border-slate-200 p-2 text-left">รายการ</th>
                <th className="border border-slate-200 p-2 text-left">ตัวคูณ</th>
                <th className="border border-slate-200 p-2 text-left">แหล่งงบ</th>
                <th className="border border-slate-200 p-2 text-right">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {form.budgetItems.map(item => {
                const actIndex = form.activities.findIndex(a => a.id === item.activityId);
                return (
                  <tr key={item.id}>
                    {!single && <td className="border border-slate-200 p-2">{actIndex >= 0 ? `กิจกรรมที่ ${actIndex + 1}` : "-"}</td>}
                    <td className="border border-slate-200 p-2">{categoryLabel(item.category)}</td>
                    <td className="border border-slate-200 p-2">{item.name}</td>
                    <td className="border border-slate-200 p-2 text-slate-600">
                      {item.targetQty} {item.targetUnit} x {item.durationQty} {item.durationUnit} x {formatBaht(item.unitRate)} บาท x {item.frequencyQty} ครั้ง
                    </td>
                    <td className="border border-slate-200 p-2">{sourceLabel(item.fundSource)}</td>
                    <td className="border border-slate-200 p-2 text-right font-semibold">{formatBaht(budgetItemTotal(item))}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50 font-bold text-emerald-900">
                <td className="border border-slate-200 p-2" colSpan={single ? 4 : 5}>รวมทั้งสิ้น</td>
                <td className="border border-slate-200 p-2 text-right">{formatBaht(planTotal(form))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(config?.budget_sources || []).map(s => (
            <span key={s.code} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700">
              {s.label}: <strong>{formatBaht(bySource[s.code] || 0)}</strong> บาท
              {s.code === OFF_BUDGET_SOURCE && (bySource[s.code] || 0) > 0 && form.offBudgetDetail ? ` (${form.offBudgetDetail})` : ""}
            </span>
          ))}
        </div>
      </Block>

      <Block title="ผลประโยชน์ การประเมินผล และผู้รับผิดชอบ (ข้อ 10-14)">
        <Row label="10. ผลประโยชน์ที่คาดว่าจะได้รับ">{form.impacts.filter(Boolean).map((s, i) => `10.${i + 1} ${s}`).join("\n")}</Row>
        <Row label="11. การติดตามและประเมินผล">{form.evaluations.filter(Boolean).map((s, i) => `11.${i + 1} ${s}`).join("\n")}</Row>
        <Row label="12. ผู้รับผิดชอบโครงการ">
          {[form.leader.name, form.leader.position, form.leader.phone && `โทร ${form.leader.phone}`].filter(Boolean).join("  ")}
        </Row>
        <Row label="13. ผู้ร่วมรับผิดชอบ">
          {form.coLeaders.filter(p => p.name).map(p => [p.name, p.position, p.phone && `โทร ${p.phone}`].filter(Boolean).join("  ")).join("\n")}
        </Row>
        <Row label="14. ผู้กำกับติดตามโครงการ">{[form.supervisor.name, form.supervisor.position].filter(Boolean).join("  ")}</Row>
      </Block>
    </div>
  );
}

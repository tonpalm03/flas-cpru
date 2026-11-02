"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Save, Send } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import {
  activityTotal,
  availableFiscalYears,
  budgetItemTotal,
  emptyActivity,
  emptyBudgetItem,
  emptyOkr,
  emptyPerson,
  emptyPlanForm,
  FISCAL_MONTHS,
  fiscalYearOf,
  formatBaht,
  getFiscalYearConfig,
  monthYear,
  OFF_BUDGET_SOURCE,
  OTHER_CATEGORY_CODE,
  PLAN_STEPS,
  planTotal,
  quartersOf,
  THAI_MONTHS,
  totalsBySource,
  validatePlanForm,
  validatePlanStep,
  type PlanActivity,
  type PlanBudgetItem,
  type PlanForm,
  type PlanPerson,
  type PlanProject,
} from "@/lib/planModel";
import { runPlanAction, savePlanDraft } from "@/lib/planService";
import { AddButton, ErrorList, Field, inputClass, PlanStatusBadge, RemoveButton, SectionCard, StringList } from "./planUi";
import PlanSummary from "./PlanSummary";

const num = (v: string) => (v === "" ? 0 : Number(v));

function CheckList({ items, selected, onChange }: {
  items: { id: number; text: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      {items.map(item => {
        const on = selected.includes(item.id);
        return (
          <label
            key={item.id}
            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-xs transition-colors ${
              on ? "border-blue-900 bg-blue-50/60 text-slate-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5 accent-blue-900"
              checked={on}
              onChange={() => onChange(on ? selected.filter(id => id !== item.id) : [...selected, item.id].sort((a, b) => a - b))}
            />
            <span>{item.id}. {item.text}</span>
          </label>
        );
      })}
    </div>
  );
}

function PersonFields({ value, onChange, positionHint }: { value: PlanPerson; onChange: (p: PlanPerson) => void; positionHint?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <input className={inputClass} placeholder="ชื่อ-นามสกุล" value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} />
      <input className={inputClass} placeholder={positionHint || "ตำแหน่ง"} value={value.position} onChange={e => onChange({ ...value, position: e.target.value })} />
      <input className={inputClass} placeholder="เบอร์โทร" value={value.phone} onChange={e => onChange({ ...value, phone: e.target.value })} />
    </div>
  );
}

export default function PlanWizard({ project, onCreated }: { project: PlanProject | null; onCreated?: (id: string) => void }) {
  const router = useRouter();
  const { currentUser } = useRole();
  const years = availableFiscalYears();
  const [fiscalYear, setFiscalYear] = useState<number>(() => {
    if (project) return project.fiscalYear;
    const current = fiscalYearOf();
    return years.includes(current) ? current : years[0];
  });
  const config = getFiscalYearConfig(fiscalYear);
  const [form, setForm] = useState<PlanForm>(() => project?.form || emptyPlanForm(currentUser, config));
  const [projectId, setProjectId] = useState<string | undefined>(project?.id);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "save" | "submit">("");
  const [notice, setNotice] = useState("");

  const update = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setNotice("");
  };
  const updateActivity = (id: string, patch: Partial<PlanActivity>) =>
    update("activities", form.activities.map(a => (a.id === id ? { ...a, ...patch } : a)));
  const updateItem = (id: string, patch: Partial<PlanBudgetItem>) =>
    update("budgetItems", form.budgetItems.map(i => (i.id === id ? { ...i, ...patch } : i)));

  const facultyPlan = config?.faculty_plans[form.facultyName];
  const total = useMemo(() => planTotal(form), [form]);
  const bySource = useMemo(() => totalsBySource(form), [form]);
  const isOwnerEdit = !project || project.ownerId === currentUser?.id;
  const canSubmit = isOwnerEdit && (!project || project.status === "DRAFT" || project.status === "REVISION_REQUESTED");

  const goTo = (target: number) => {
    // ย้อนกลับได้เสมอ; ไปข้างหน้าต้องผ่านขั้นที่ข้ามไปทุกขั้น
    for (let s = step; s < target; s++) {
      const stepErrors = validatePlanStep(s, form, config);
      if (stepErrors.length) {
        setStep(s);
        setErrors(stepErrors);
        return;
      }
    }
    setErrors([]);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (): Promise<PlanProject | null> => {
    if (!currentUser) return null;
    if (!form.title.trim()) {
      setErrors(["กรุณากรอกชื่อโครงการก่อนบันทึกร่าง"]);
      setStep(1);
      return null;
    }
    const saved = await savePlanDraft({ id: projectId, fiscalYear, form }, currentUser);
    if (!projectId) onCreated?.(saved.id);
    setProjectId(saved.id);
    return saved;
  };

  const handleSave = async (): Promise<boolean> => {
    setBusy("save");
    setErrors([]);
    try {
      const saved = await save();
      if (!saved) return false;
      setNotice("บันทึกแล้ว");
      return true;
    } catch (e: any) {
      setErrors([e?.message || "บันทึกไม่สำเร็จ"]);
      return false;
    } finally {
      setBusy("");
    }
  };

  const handleSubmit = async () => {
    const problem = validatePlanForm(form, config);
    if (problem) {
      setStep(problem.step);
      setErrors(problem.errors);
      return;
    }
    if (!window.confirm("ยืนยันส่งโครงการให้เจ้าหน้าที่แผนตรวจ? ระหว่างรอตรวจจะแก้ไขเองไม่ได้")) return;
    setBusy("submit");
    setErrors([]);
    try {
      const saved = await save();
      if (!saved || !currentUser) return;
      await runPlanAction(saved.id, "submit", currentUser);
      router.push(`/projects/view/?id=${saved.id}`);
    } catch (e: any) {
      setErrors([e?.message || "ส่งตรวจไม่สำเร็จ"]);
    } finally {
      setBusy("");
    }
  };

  const changeYear = (year: number) => {
    // ปีงบเปลี่ยน แผนยุทธศาสตร์และรหัสงบเปลี่ยนตาม จึงล้างข้อที่ผูกกับปีนั้น
    setFiscalYear(year);
    setForm(prev => ({ ...prev, universityMissionIds: [], universityStrategyIds: [], facultyMissionIds: [], facultyStrategyIds: [] }));
  };

  const removeActivity = (id: string) => {
    setForm(prev => {
      const activities = prev.activities.filter(a => a.id !== id);
      return {
        ...prev,
        activities,
        budgetItems: prev.budgetItems.map(i => (i.activityId === id ? { ...i, activityId: activities.length === 1 ? activities[0].id : "" } : i)),
      };
    });
  };

  return (
    <div className="space-y-5 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={project ? `/projects/view/?id=${project.id}` : "/projects/"} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {project ? "แก้ไขแบบเสนอโครงการ" : "เสนอโครงการใหม่"}
              {project && <PlanStatusBadge status={project.status} />}
            </h1>
            <p className="text-[11px] text-slate-500">
              {project?.code ? `${project.code} · ` : ""}แบบเสนอโครงการ มหาวิทยาลัยราชภัฏชัยภูมิ ปีงบประมาณ {fiscalYear}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
        >
          {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>บันทึกร่าง</span>
        </button>
      </div>

      {project?.status === "REVISION_REQUESTED" && project.lastReason && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
          <strong>เจ้าหน้าที่แผนตีกลับให้แก้ไข:</strong> {project.lastReason}
        </div>
      )}
      {!isOwnerEdit && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          คุณกำลังแก้ไขแทนผู้เสนอ ({project?.ownerName}) ในฐานะเจ้าหน้าที่แผน การแก้ไขจะบันทึกโดยไม่เปลี่ยนสถานะ
        </div>
      )}

      <ol className="grid grid-cols-5 gap-1.5">
        {PLAN_STEPS.map(s => {
          const state = s.id === step ? "current" : s.id < step ? "done" : "todo";
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => goTo(s.id)}
                className={`w-full rounded-xl border px-2 py-2 text-left transition-colors ${
                  state === "current" ? "border-blue-900 bg-blue-900 text-white" : state === "done" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-1 text-[10px] font-bold">
                  {state === "done" ? <Check className="w-3 h-3" /> : <span>{s.id}.</span>}
                  <span className="truncate">{s.title}</span>
                </span>
                <span className="hidden sm:block text-[10px] opacity-80">{s.sections}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <ErrorList errors={errors} />
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</div>}

      {step === 1 && (
        <div className="space-y-4">
          <SectionCard title="ข้อมูลทั่วไป (ข้อ 1 และ 2)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="ปีงบประมาณ" required>
                <select className={inputClass} value={fiscalYear} disabled={!!project?.code} onChange={e => changeYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="ประเภทโครงการ (ตามแบบฟอร์ม มรภ.ชัยภูมิ)" required className="sm:col-span-2">
                <select className={inputClass} value={form.projectCategoryCode} onChange={e => update("projectCategoryCode", e.target.value)}>
                  <option value="">เลือกประเภทโครงการ</option>
                  {config?.project_categories.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </Field>
            </div>
            {form.projectCategoryCode === OTHER_CATEGORY_CODE && (
              <Field label="ระบุรายละเอียดประเภทโครงการ / แหล่งงบประมาณภายนอก" required>
                <input className={inputClass} value={form.projectCategoryOther} placeholder="เช่น ทุนสนับสนุนวิจัย บพท." onChange={e => update("projectCategoryOther", e.target.value)} />
              </Field>
            )}
            <Field label="1. ชื่อโครงการ" required>
              <input className={inputClass} value={form.title} placeholder="ชื่อโครงการตามแผนปฏิบัติราชการ" onChange={e => update("title", e.target.value)} />
            </Field>
            <Field label="2. หน่วยงานที่ดำเนินการ" required hint="ใส่ให้จากสังกัดของผู้เสนอ แก้เป็นศูนย์หรือกลุ่มวิจัยได้">
              <input className={inputClass} value={form.department} placeholder="เช่น สาขาวิชาเทคโนโลยีสารสนเทศ" onChange={e => update("department", e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="วันที่เริ่มกิจกรรม" required>
                <input type="date" className={inputClass} value={form.startDate} onChange={e => update("startDate", e.target.value)} />
              </Field>
              <Field label="วันที่สิ้นสุดกิจกรรม" required>
                <input type="date" className={inputClass} value={form.endDate} onChange={e => update("endDate", e.target.value)} />
              </Field>
              <Field label="กลุ่มเป้าหมายผู้เข้าร่วม" required>
                <input className={inputClass} value={form.targetGroup} placeholder="เช่น นักศึกษาสาขาวิชา" onChange={e => update("targetGroup", e.target.value)} />
              </Field>
            </div>
          </SectionCard>
          <SectionCard title="5. หลักการและเหตุผล" description="เขียน 3 ย่อหน้าตามแบบฟอร์มของมหาวิทยาลัย">
            <Field label="ย่อหน้าที่ 1: ที่มา สาเหตุของปัญหา หรือเหตุผลที่ต้องดำเนินโครงการ" required>
              <textarea rows={4} className={inputClass} value={form.backgroundProblem} onChange={e => update("backgroundProblem", e.target.value)} />
            </Field>
            <Field label="ย่อหน้าที่ 2: จากปัญหาในย่อหน้าแรก หน่วยงานจำเป็นต้องลดหรือแก้ปัญหานั้นอย่างไร" required>
              <textarea rows={4} className={inputClass} value={form.backgroundSolution} onChange={e => update("backgroundSolution", e.target.value)} />
            </Field>
            <Field label="ย่อหน้าที่ 3: กลุ่มเป้าหมาย วัตถุประสงค์ และสิ่งที่จะเกิดขึ้นหรือเปลี่ยนแปลง" required>
              <textarea rows={4} className={inputClass} value={form.backgroundImpact} onChange={e => update("backgroundImpact", e.target.value)} />
            </Field>
          </SectionCard>
        </div>
      )}

      {step === 2 && config && (
        <div className="space-y-4">
          <SectionCard title="3. ความสอดคล้องกับแผนของมหาวิทยาลัย" description={config.university_plan.title}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-700">พันธกิจ <span className="text-rose-600">*</span></div>
                <CheckList items={config.university_plan.missions} selected={form.universityMissionIds} onChange={ids => update("universityMissionIds", ids)} />
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-700">ประเด็นยุทธศาสตร์ <span className="text-rose-600">*</span></div>
                <CheckList items={config.university_plan.strategies} selected={form.universityStrategyIds} onChange={ids => update("universityStrategyIds", ids)} />
              </div>
            </div>
          </SectionCard>
          <SectionCard title={`4. ความสอดคล้องกับแผนของ${form.facultyName}`} description={facultyPlan?.title}>
            {facultyPlan ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">พันธกิจ <span className="text-rose-600">*</span></div>
                  <CheckList items={facultyPlan.missions} selected={form.facultyMissionIds} onChange={ids => update("facultyMissionIds", ids)} />
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">ประเด็นยุทธศาสตร์ <span className="text-rose-600">*</span></div>
                  <CheckList items={facultyPlan.strategies} selected={form.facultyStrategyIds} onChange={ids => update("facultyStrategyIds", ids)} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-800">ยังไม่มีแผนปฏิบัติราชการของคณะในปีงบประมาณนี้ บันทึกร่างได้แต่ส่งตรวจไม่ได้</p>
            )}
          </SectionCard>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <SectionCard
            title="6. วัตถุประสงค์ ผลลัพธ์หลัก และค่าเป้าหมาย (OKR)"
            action={<AddButton onClick={() => update("okrs", [...form.okrs, emptyOkr()])}>เพิ่มวัตถุประสงค์</AddButton>}
          >
            <div className="space-y-2">
              {form.okrs.map((o, i) => (
                <div key={o.id} className="grid grid-cols-1 sm:grid-cols-[28px_1fr_1fr_160px_32px] items-start gap-2">
                  <span className="pt-2 text-[11px] font-semibold text-slate-500">{i + 1}.</span>
                  <textarea rows={2} className={inputClass} placeholder="วัตถุประสงค์" value={o.objective}
                    onChange={e => update("okrs", form.okrs.map(x => (x.id === o.id ? { ...x, objective: e.target.value } : x)))} />
                  <textarea rows={2} className={inputClass} placeholder="ผลลัพธ์หลัก (Key Result)" value={o.keyResult}
                    onChange={e => update("okrs", form.okrs.map(x => (x.id === o.id ? { ...x, keyResult: e.target.value } : x)))} />
                  <input className={inputClass} placeholder="ค่าเป้าหมาย เช่น ร้อยละ 80" value={o.target}
                    onChange={e => update("okrs", form.okrs.map(x => (x.id === o.id ? { ...x, target: e.target.value } : x)))} />
                  {form.okrs.length > 1 ? <RemoveButton onClick={() => update("okrs", form.okrs.filter(x => x.id !== o.id))} /> : <span />}
                </div>
              ))}
            </div>
          </SectionCard>

          {form.activities.map((a, i) => (
            <SectionCard
              key={a.id}
              title={`กิจกรรมที่ ${i + 1}`}
              description="ข้อ 7 ขอบเขตกิจกรรม และข้อ 8 วิธีดำเนินงานและตัวชี้วัด"
              action={form.activities.length > 1 ? <RemoveButton label="ลบกิจกรรม" onClick={() => removeActivity(a.id)} /> : undefined}
            >
              <Field label="ชื่อกิจกรรม" required>
                <input className={inputClass} value={a.name} placeholder="เช่น การอบรมเชิงปฏิบัติการพัฒนาทักษะวิชาชีพ" onChange={e => updateActivity(a.id, { name: e.target.value })} />
              </Field>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-700">รายการย่อยใต้ชื่อกิจกรรม</div>
                {a.subItems.map((s, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">-</span>
                    <input className={inputClass} value={s} placeholder="รายการย่อย" onChange={e => updateActivity(a.id, { subItems: a.subItems.map((x, k) => (k === j ? e.target.value : x)) })} />
                    <RemoveButton onClick={() => updateActivity(a.id, { subItems: a.subItems.filter((_, k) => k !== j) })} />
                  </div>
                ))}
                <AddButton onClick={() => updateActivity(a.id, { subItems: [...a.subItems, ""] })}>เพิ่มรายการย่อย</AddButton>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Field label="สถานที่" required className="sm:col-span-2">
                  <input className={inputClass} value={a.location} placeholder="เช่น ห้องประชุม คณะศิลปศาสตร์และวิทยาศาสตร์" onChange={e => updateActivity(a.id, { location: e.target.value })} />
                </Field>
                <Field label="เดือนเริ่ม">
                  <select className={inputClass} value={a.startMonth} onChange={e => updateActivity(a.id, { startMonth: Number(e.target.value) })}>
                    {FISCAL_MONTHS.map(m => <option key={m} value={m}>{THAI_MONTHS[m]} {monthYear(m, fiscalYear)}</option>)}
                  </select>
                </Field>
                <Field label="เดือนสิ้นสุด" hint={`ไตรมาส ${quartersOf(a.startMonth, a.endMonth).join(",")} (คำนวณจากเดือน)`}>
                  <select className={inputClass} value={a.endMonth} onChange={e => updateActivity(a.id, { endMonth: Number(e.target.value) })}>
                    {FISCAL_MONTHS.map(m => <option key={m} value={m}>{THAI_MONTHS[m]} {monthYear(m, fiscalYear)}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
                <Field label="คณะกรรมการ (คน)">
                  <input type="number" min={0} className={inputClass} value={a.committeeCount || ""} onChange={e => updateActivity(a.id, { committeeCount: num(e.target.value) })} />
                </Field>
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-700">กลุ่มเป้าหมาย</div>
                  {a.targetGroups.map((g, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <input className={inputClass} value={g.name} placeholder="ชื่อกลุ่ม เช่น นักศึกษา" onChange={e => updateActivity(a.id, { targetGroups: a.targetGroups.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)) })} />
                      <input type="number" min={0} className={`${inputClass} w-28`} value={g.count || ""} placeholder="คน" onChange={e => updateActivity(a.id, { targetGroups: a.targetGroups.map((x, k) => (k === j ? { ...x, count: num(e.target.value) } : x)) })} />
                      {a.targetGroups.length > 1 && <RemoveButton onClick={() => updateActivity(a.id, { targetGroups: a.targetGroups.filter((_, k) => k !== j) })} />}
                    </div>
                  ))}
                  <AddButton onClick={() => updateActivity(a.id, { targetGroups: [...a.targetGroups, { name: "", count: 0 }] })}>เพิ่มกลุ่มเป้าหมาย</AddButton>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-700">8. วิธีดำเนินงาน <span className="text-rose-600">*</span></div>
                <StringList
                  values={a.methods}
                  onChange={methods => updateActivity(a.id, { methods })}
                  prefix={j => `${i + 1}.${j + 1}`}
                  placeholder="เช่น ประชุมวางแผนเตรียมการ"
                  addLabel="เพิ่มขั้นตอน"
                />
              </div>
              <Field label="ตัวชี้วัดของกิจกรรม" required>
                <input className={inputClass} value={a.kpi} placeholder="เช่น ผู้เข้าร่วมไม่น้อยกว่า 50 คน และพึงพอใจระดับดีขึ้นไปร้อยละ 80" onChange={e => updateActivity(a.id, { kpi: e.target.value })} />
              </Field>
            </SectionCard>
          ))}
          <AddButton onClick={() => update("activities", [...form.activities, emptyActivity()])}>เพิ่มกิจกรรม</AddButton>
        </div>
      )}

      {step === 4 && config && (
        <SectionCard
          title="9. ตารางแตกตัวคูณงบประมาณ"
          description="กลุ่มเป้าหมาย x ระยะเวลา x อัตรา (บาท) x จำนวนครั้ง = ยอดรวม"
          action={
            <AddButton onClick={() => update("budgetItems", [...form.budgetItems, emptyBudgetItem(form.activities.length === 1 ? form.activities[0].id : "", config)])}>
              เพิ่มรายการ
            </AddButton>
          }
        >
          {form.budgetItems.length === 0 && <p className="text-xs text-slate-500">ยังไม่มีรายการ กด "เพิ่มรายการ" เพื่อเริ่ม</p>}
          <div className="space-y-3">
            {form.budgetItems.map((item, idx) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">รายการที่ {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800">{formatBaht(budgetItemTotal(item))} บาท</span>
                    <RemoveButton onClick={() => update("budgetItems", form.budgetItems.filter(x => x.id !== item.id))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {form.activities.length > 1 && (
                    <Field label="กิจกรรม" required>
                      <select className={inputClass} value={item.activityId} onChange={e => updateItem(item.id, { activityId: e.target.value })}>
                        <option value="">เลือกกิจกรรม</option>
                        {form.activities.map((a, i) => <option key={a.id} value={a.id}>กิจกรรมที่ {i + 1} {a.name}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label="หมวดรายจ่าย">
                    <select className={inputClass} value={item.category} onChange={e => updateItem(item.id, { category: e.target.value })}>
                      {config.expense_categories.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="รายการ" required className={form.activities.length > 1 ? "" : "sm:col-span-2"}>
                    <input className={inputClass} value={item.name} placeholder={config.expense_categories.find(c => c.code === item.category)?.hint} onChange={e => updateItem(item.id, { name: e.target.value })} />
                  </Field>
                  <Field label="แหล่งงบประมาณ">
                    <select className={inputClass} value={item.fundSource} onChange={e => updateItem(item.id, { fundSource: e.target.value })}>
                      {config.budget_sources.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Field label="กลุ่มเป้าหมาย">
                    <div className="flex gap-1">
                      <input type="number" min={0} className={inputClass} value={item.targetQty || ""} onChange={e => updateItem(item.id, { targetQty: num(e.target.value) })} />
                      <input className={`${inputClass} w-16`} value={item.targetUnit} placeholder="คน" onChange={e => updateItem(item.id, { targetUnit: e.target.value })} />
                    </div>
                  </Field>
                  <Field label="ระยะเวลา">
                    <div className="flex gap-1">
                      <input type="number" min={0} className={inputClass} value={item.durationQty || ""} onChange={e => updateItem(item.id, { durationQty: num(e.target.value) })} />
                      <input className={`${inputClass} w-16`} value={item.durationUnit} placeholder="มื้อ" onChange={e => updateItem(item.id, { durationUnit: e.target.value })} />
                    </div>
                  </Field>
                  <Field label="อัตรา (บาท)">
                    <input type="number" min={0} step="0.01" className={inputClass} value={item.unitRate || ""} onChange={e => updateItem(item.id, { unitRate: num(e.target.value) })} />
                  </Field>
                  <Field label="จำนวนครั้ง">
                    <input type="number" min={0} className={inputClass} value={item.frequencyQty || ""} onChange={e => updateItem(item.id, { frequencyQty: num(e.target.value) })} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-900">
              <span>รวมงบประมาณทั้งสิ้น</span>
              <span>{formatBaht(total)} บาท</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-emerald-900">
              {config.budget_sources.map(s => <span key={s.code}>{s.label} {formatBaht(bySource[s.code] || 0)}</span>)}
            </div>
            {form.activities.length > 1 && (
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                {form.activities.map((a, i) => <span key={a.id}>กิจกรรมที่ {i + 1}: {formatBaht(activityTotal(form, a.id))}</span>)}
              </div>
            )}
          </div>
          {(bySource[OFF_BUDGET_SOURCE] || 0) > 0 && (
            <Field label="ระบุที่มาของแหล่งงบประมาณ อื่น ๆ" required hint="พิมพ์ต่อท้ายบรรทัดงบประมาณอื่น ๆ ในเอกสาร">
              <input className={inputClass} value={form.offBudgetDetail} placeholder={form.projectCategoryOther || "เช่น เงินอุดหนุน อบจ."} onChange={e => update("offBudgetDetail", e.target.value)} />
            </Field>
          )}
        </SectionCard>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <SectionCard title="10. ผลประโยชน์ที่คาดว่าจะได้รับ">
            <StringList values={form.impacts} onChange={v => update("impacts", v)} prefix={i => `10.${i + 1}`}
              placeholder="เช่น ผู้เข้าร่วมนำความรู้ไปใช้ในการเรียนและการปฏิบัติงานได้" addLabel="เพิ่มผลประโยชน์" />
          </SectionCard>
          <SectionCard title="11. การติดตามและประเมินผล">
            <StringList values={form.evaluations} onChange={v => update("evaluations", v)} prefix={i => `11.${i + 1}`}
              placeholder="เช่น ประเมินความพึงพอใจด้วยแบบประเมิน" addLabel="เพิ่มวิธีประเมิน" />
          </SectionCard>
          <SectionCard title="12-14. ผู้รับผิดชอบและผู้กำกับติดตามโครงการ">
            <Field label="12. ผู้รับผิดชอบโครงการ" required>
              <PersonFields value={form.leader} onChange={p => update("leader", p)} positionHint="ตำแหน่ง เช่น อาจารย์ประจำสาขาวิชา" />
            </Field>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">13. ผู้ร่วมรับผิดชอบโครงการ</span>
                <AddButton onClick={() => update("coLeaders", [...form.coLeaders, emptyPerson()])}>เพิ่มผู้ร่วมรับผิดชอบ</AddButton>
              </div>
              {form.coLeaders.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1"><PersonFields value={p} onChange={next => update("coLeaders", form.coLeaders.map((x, j) => (j === i ? next : x)))} /></div>
                  <RemoveButton onClick={() => update("coLeaders", form.coLeaders.filter((_, j) => j !== i))} />
                </div>
              ))}
            </div>
            <Field label="14. ผู้กำกับติดตามโครงการ" required hint="ค่าเริ่มต้นคือคณบดีตามแผนของคณะ">
              <PersonFields value={form.supervisor} onChange={p => update("supervisor", p)} />
            </Field>
          </SectionCard>
          <div className="pt-2">
            <h2 className="text-sm font-bold text-slate-900 mb-2">ตรวจทานก่อนส่ง</h2>
            <PlanSummary form={form} config={config} fiscalYear={fiscalYear} />
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          disabled={step === 1}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>ย้อนกลับ</span>
        </button>
        {step < PLAN_STEPS.length ? (
          <button
            type="button"
            onClick={() => goTo(step + 1)}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <span>ถัดไป: {PLAN_STEPS[step].title}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : canSubmit ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {busy === "submit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>ส่งตรวจ</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => { if ((await handleSave()) && project) router.push(`/projects/view/?id=${project.id}`); }}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการแก้ไข</span>
          </button>
        )}
      </div>
    </div>
  );
}

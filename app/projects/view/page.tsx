"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, History, Loader2, Pencil, Send, Trash2, Undo2, XCircle } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import PlanSummary from "@/components/plan/PlanSummary";
import { PlanStatusBadge } from "@/components/plan/planUi";
import { deletePlanProject, getPlanProject, runPlanAction } from "@/lib/planService";
import {
  availablePlanActions,
  canDeletePlan,
  canEditPlan,
  formatBaht,
  getFiscalYearConfig,
  PLAN_ACTION_LABELS,
  PLAN_STATUS_LABELS,
  planActionNeedsReason,
  type PlanAction,
  type PlanProject,
} from "@/lib/planModel";

const ACTION_STYLE: Record<PlanAction, { icon: React.ElementType; className: string }> = {
  submit: { icon: Send, className: "bg-blue-900 text-white hover:bg-blue-800" },
  approve: { icon: CheckCircle2, className: "bg-emerald-700 text-white hover:bg-emerald-800" },
  request_revision: { icon: Undo2, className: "border border-orange-300 bg-white text-orange-800 hover:bg-orange-50" },
  reject: { icon: XCircle, className: "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50" },
};

const CONFIRM_TEXT: Record<PlanAction, string> = {
  submit: "ยืนยันส่งโครงการให้เจ้าหน้าที่แผนตรวจ?",
  approve: "ยืนยันอนุมัติโครงการนี้? ขั้นถัดไปคือพิมพ์เอกสารและเดินเซ็น",
  request_revision: "ตีกลับให้ผู้เสนอแก้ไข",
  reject: "ไม่อนุมัติโครงการนี้ (สิ้นสุด ผู้เสนอส่งใหม่ไม่ได้)",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

function ViewInner() {
  const id = useSearchParams().get("id") || "";
  const router = useRouter();
  const { currentUser } = useRole();
  const [project, setProject] = useState<PlanProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<PlanAction | "delete" | "">("");
  const [error, setError] = useState("");
  const [reasonFor, setReasonFor] = useState<PlanAction | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPlanProject(id, currentUser)
      .then(p => alive && setProject(p))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>กำลังโหลดโครงการ...</span>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <p className="text-sm text-slate-700">ไม่พบโครงการนี้ หรือคุณไม่มีสิทธิ์เปิด</p>
        <Link href="/projects/" className="text-xs font-semibold text-blue-900 hover:underline">กลับไปหน้าโครงการ</Link>
      </div>
    );
  }

  const config = getFiscalYearConfig(project.fiscalYear);
  const actions = availablePlanActions(project, currentUser);

  const run = async (action: PlanAction, why?: string) => {
    if (!currentUser) return;
    setBusy(action);
    setError("");
    try {
      setProject(await runPlanAction(project.id, action, currentUser, why));
      setReasonFor(null);
      setReason("");
    } catch (e: any) {
      setError(e?.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusy("");
    }
  };

  const start = (action: PlanAction) => {
    if (planActionNeedsReason(action)) {
      setReasonFor(action);
      setReason("");
      return;
    }
    if (window.confirm(CONFIRM_TEXT[action])) void run(action);
  };

  const remove = async () => {
    if (!currentUser || !window.confirm("ลบโครงการนี้ถาวร?")) return;
    setBusy("delete");
    try {
      await deletePlanProject(project, currentUser);
      router.push("/projects/");
    } catch (e: any) {
      setError(e?.message || "ลบไม่สำเร็จ");
      setBusy("");
    }
  };

  return (
    <div className="space-y-5 pb-16 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/projects/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{project.form.title || "(ยังไม่มีชื่อโครงการ)"}</h1>
              <PlanStatusBadge status={project.status} />
            </div>
            <p className="text-[11px] text-slate-500">
              {project.code ? `${project.code} · ` : ""}ปีงบประมาณ {project.fiscalYear} · เสนอโดย {project.ownerName} · งบประมาณ {formatBaht(project.totalAmount || 0)} บาท
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditPlan(currentUser, project) && (
            <Link
              href={`/projects/edit/?id=${project.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{project.ownerId === currentUser?.id ? "แก้ไข" : "แก้ไขแทนผู้เสนอ"}</span>
            </Link>
          )}
          {actions.map(action => {
            const { icon: Icon, className } = ACTION_STYLE[action];
            return (
              <button
                key={action}
                type="button"
                disabled={!!busy}
                onClick={() => start(action)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60 ${className}`}
              >
                {busy === action ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                <span>{PLAN_ACTION_LABELS[action]}</span>
              </button>
            );
          })}
          {canDeletePlan(currentUser, project) && (
            <button
              type="button"
              disabled={!!busy}
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบ</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      {project.lastReason && (project.status === "REVISION_REQUESTED" || project.status === "REJECTED") && (
        <div className={`rounded-xl border p-3 text-xs ${project.status === "REJECTED" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-orange-200 bg-orange-50 text-orange-900"}`}>
          <strong>{project.status === "REJECTED" ? "เหตุผลที่ไม่อนุมัติ:" : "เจ้าหน้าที่แผนตีกลับให้แก้ไข:"}</strong> {project.lastReason}
        </div>
      )}
      {project.status === "APPROVED_FOR_PRINT" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          อนุมัติแล้ว ขั้นถัดไปคือออกไฟล์ Word ตามแบบฟอร์มปีงบประมาณ เพื่อพิมพ์และเดินเซ็น (จะเปิดใช้ในรอบถัดไป)
        </div>
      )}

      {reasonFor && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="text-sm font-bold text-slate-900">{CONFIRM_TEXT[reasonFor]}</div>
          <textarea
            rows={3}
            autoFocus
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="ระบุเหตุผลหรือสิ่งที่ต้องแก้ไข (ผู้เสนอจะเห็นข้อความนี้)"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/20"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReasonFor(null)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!reason.trim() || !!busy}
              onClick={() => void run(reasonFor, reason)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50 ${ACTION_STYLE[reasonFor].className}`}
            >
              {busy === reasonFor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>ยืนยัน{PLAN_ACTION_LABELS[reasonFor]}</span>
            </button>
          </div>
        </div>
      )}

      <PlanSummary form={project.form} config={config} fiscalYear={project.fiscalYear} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <span>ประวัติการดำเนินการ</span>
        </h3>
        <ol className="space-y-2">
          {[...(project.history || [])].reverse().map((h, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="text-[11px] text-slate-500 w-32 shrink-0">{when(h.at)}</span>
              <span className="font-semibold text-slate-900">{h.action === "create" ? "สร้างร่าง" : PLAN_ACTION_LABELS[h.action]}</span>
              <span className="text-slate-600">โดย {h.byName}</span>
              <span className="text-slate-500">-&gt; {PLAN_STATUS_LABELS[h.toStatus]}</span>
              {h.reason && <span className="basis-full pl-0 sm:pl-[8.5rem] text-slate-700">เหตุผล: {h.reason}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function PlanViewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลด...</div>}>
      <ViewInner />
    </Suspense>
  );
}

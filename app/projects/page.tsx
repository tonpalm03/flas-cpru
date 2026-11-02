"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FolderKanban, Loader2, Plus, Search } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { PlanStatusBadge } from "@/components/plan/planUi";
import { listPlanProjects } from "@/lib/planService";
import { canViewAllPlans, formatBaht, isPlanOfficer, type PlanProject, type PlanStatus } from "@/lib/planModel";

type TabId = "mine" | "review" | "returned" | "approved" | "all";

const TABS: { id: TabId; label: string; statuses?: PlanStatus[]; officerOnly?: boolean }[] = [
  { id: "mine", label: "โครงการของฉัน" },
  { id: "review", label: "รอตรวจ", statuses: ["PENDING_REVIEW"], officerOnly: true },
  { id: "returned", label: "ตีกลับ / ไม่อนุมัติ", statuses: ["REVISION_REQUESTED", "REJECTED"], officerOnly: true },
  { id: "approved", label: "อนุมัติแล้ว", statuses: ["APPROVED_FOR_PRINT"], officerOnly: true },
  { id: "all", label: "ทั้งหมด", officerOnly: true },
];

export default function ProjectsModulePage() {
  const { currentUser } = useRole();
  const [projects, setProjects] = useState<PlanProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const viewAll = canViewAllPlans(currentUser);
  const officer = isPlanOfficer(currentUser);
  const [tab, setTab] = useState<TabId>("mine");

  useEffect(() => {
    if (officer) setTab("review");
  }, [officer]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listPlanProjects(currentUser)
      .then(list => alive && setProjects(list))
      .catch(e => alive && setError(e?.message || "โหลดโครงการไม่สำเร็จ"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [currentUser]);

  const tabs = TABS.filter(t => !t.officerOnly || viewAll);
  const count = (t: (typeof TABS)[number]) =>
    projects.filter(p => (t.id === "mine" ? p.ownerId === currentUser?.id : !t.statuses || t.statuses.includes(p.status))).length;

  const shown = useMemo(() => {
    const active = TABS.find(t => t.id === tab)!;
    const q = search.trim().toLowerCase();
    return projects
      .filter(p => (tab === "mine" ? p.ownerId === currentUser?.id : !active.statuses || active.statuses.includes(p.status)))
      .filter(p => !q || [p.form.title, p.code, p.ownerName, p.department].some(v => String(v || "").toLowerCase().includes(q)));
  }, [projects, tab, search, currentUser]);

  return (
    <div className="space-y-5 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-blue-900" />
              <span>งานแผนและโครงการ</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">เสนอโครงการตามแบบฟอร์ม มรภ.ชัยภูมิ ส่งเจ้าหน้าที่แผนตรวจ และติดตามสถานะ</p>
          </div>
        </div>
        <Link
          href="/projects/edit/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" />
          <span>เสนอโครงการใหม่</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id ? "bg-blue-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t.label} <span className="opacity-70">({count(t)})</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อโครงการ เลขโครงการ ผู้เสนอ"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/20"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>กำลังโหลดโครงการ...</span>
          </div>
        ) : shown.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            {tab === "mine" ? "ยังไม่มีโครงการ กด \"เสนอโครงการใหม่\" เพื่อเริ่ม" : "ไม่มีโครงการในหมวดนี้"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[760px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 text-left font-semibold">เลขโครงการ</th>
                  <th className="p-3 text-left font-semibold">ชื่อโครงการ</th>
                  <th className="p-3 text-left font-semibold">ผู้เสนอ / หน่วยงาน</th>
                  <th className="p-3 text-right font-semibold">งบประมาณ (บาท)</th>
                  <th className="p-3 text-left font-semibold">สถานะ</th>
                  <th className="p-3 text-left font-semibold">ปรับปรุงล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-[11px] text-slate-600">{p.code || "-"}</td>
                    <td className="p-3">
                      <Link href={`/projects/view/?id=${p.id}`} className="font-semibold text-blue-900 hover:underline">
                        {p.form.title || "(ยังไม่มีชื่อโครงการ)"}
                      </Link>
                      <div className="text-[10px] text-slate-500">ปีงบประมาณ {p.fiscalYear}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800">{p.ownerName}</div>
                      <div className="text-[10px] text-slate-500">{p.department}</div>
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-900">{formatBaht(p.totalAmount || 0)}</td>
                    <td className="p-3"><PlanStatusBadge status={p.status} /></td>
                    <td className="p-3 text-slate-500">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

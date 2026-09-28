"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Search, Download, FileText, CheckCircle2, TrendingUp, Sparkles, Filter } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { ProjectProposal } from "@/lib/types";
import { exportTableToExcel, exportProjectToWord } from "@/lib/documentGenerator";

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectProposal[]>(MOCK_PROJECTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.leader.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportExcel = () => {
    const data = projects.map((p) => ({
      "รหัสโครงการ": p.code,
      "ปีงบประมาณ": p.fiscalYear,
      "ชื่อโครงการ": p.title,
      "ประเด็นยุทธศาสตร์": p.strategicGoal,
      "สาขาวิชา": p.department,
      "หัวหน้าโครงการ": p.leader,
      "งบประมาณจัดสรร (บาท)": p.budgetApproved,
      "งบประมาณใช้ไป (บาท)": p.budgetUsed,
      "ยอดคงเหลือ (บาท)": p.budgetApproved - p.budgetUsed,
      "สถานะ": p.status
    }));
    exportTableToExcel(data, "ทะเบียนโครงการตามแผน_คณะศิลปศาสตร์ฯ_2569", "โครงการ 2569");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ระบบงานโครงการและกิจกรรม (Faculty Projects)
          </h1>
          <p className="text-xs text-slate-500">
            บริหารโครงการตามแผนปฏิบัติการ 2569, โครงการยุทธศาสตร์ศาสตร์พระราชา และติดตามงบประมาณ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>เสนอโครงการใหม่ (Word)</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <p className="text-xs text-slate-500">งบประมาณโครงการทั้งหมด (2569)</p>
          <p className="text-xl font-bold text-slate-900 mt-1">550,000 บาท</p>
          <p className="text-[11px] text-blue-800 mt-0.5 font-medium">3 โครงการที่ได้รับอนุมัติ</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <p className="text-xs text-slate-500">เบิกจ่ายไปแล้ว</p>
          <p className="text-xl font-bold text-slate-900 mt-1">260,000 บาท</p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">คิดเป็น 47.2% ของงบรวม</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <p className="text-xs text-slate-500">งบคงเหลือสำหรับดำเนินกิจกรรม</p>
          <p className="text-xl font-bold text-slate-900 mt-1">290,000 บาท</p>
          <p className="text-[11px] text-slate-400 mt-0.5">พร้อมจัดกิจกรรมในไตรมาส 1-2</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-subtle flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อโครงการ, รหัส, สาขาวิชา, หัวหน้าโครงการ..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-card transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                  {proj.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  proj.status === "in_progress"
                    ? "bg-blue-100 text-blue-900"
                    : proj.status === "reported"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {proj.status === "in_progress" ? "กำลังดำเนินการ" : proj.status === "reported" ? "รายงานผลแล้ว" : "อนุมัติแล้ว"}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 mt-3 leading-snug">
                {proj.title}
              </h3>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>• <strong>ยุทธศาสตร์:</strong> {proj.strategicGoal}</p>
                <p>• <strong>สาขาวิชา:</strong> {proj.department}</p>
                <p>• <strong>หัวหน้าโครงการ:</strong> {proj.leader}</p>
              </div>

              <div className="mt-3 bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">งบประมาณจัดสรร:</span>
                  <span className="font-bold text-slate-900">{proj.budgetApproved.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>ใช้ไปแล้ว: {proj.budgetUsed.toLocaleString()} บาท</span>
                  <span>คงเหลือ: {(proj.budgetApproved - proj.budgetUsed).toLocaleString()} บาท</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-blue-900 h-full rounded-full"
                    style={{ width: `${(proj.budgetUsed / proj.budgetApproved) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* SDG Badges */}
              <div className="mt-3 flex items-center gap-1">
                <span className="text-[10px] text-slate-400">SDGs:</span>
                {proj.sdgGoals.map((sdg) => (
                  <span key={sdg} className="text-[9px] bg-blue-50 text-blue-900 font-bold px-1.5 py-0.2 rounded border border-blue-100">
                    Goal {sdg}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => exportProjectToWord(proj)}
                className="flex items-center gap-1 text-xs text-blue-900 font-semibold hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> ส่งออก Word (.docx)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

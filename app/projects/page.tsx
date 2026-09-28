"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Filter, 
  Eye, 
  Calendar, 
  Clock, 
  Building, 
  User, 
  Layers, 
  AlertCircle,
  X,
  FileCheck,
  Check,
  Award
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { getProjects, updateProject } from "@/lib/firebaseService";
import { ProjectProposal } from "@/lib/types";
import { exportTableToExcel, exportProjectToWord } from "@/lib/documentGenerator";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  faculty_strategy: "ยุทธศาสตร์คณะ",
  kings_philosophy: "ศาสตร์พระราชา",
  department_focus: "จุดเน้นสาขา",
  academic_service: "บริการวิชาการ"
};

export default function ProjectsListPage() {
  const { currentUser, isAdmin, isDean, isPlan } = useRole();
  const [projects, setProjects] = useState<ProjectProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number>(2569);

  const [selectedProject, setSelectedProject] = useState<ProjectProposal | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
    } catch (err: any) {
      console.error("Error loading projects:", err);
      setError("ไม่สามารถโหลดทะเบียนโครงการได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.leader.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || p.projectType === filterType;
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesYear = p.fiscalYear === filterYear;

    return matchesSearch && matchesType && matchesStatus && matchesYear;
  });

  const totalAllocated = filteredProjects.reduce((sum, p) => sum + (p.budgetApproved || 0), 0);
  const totalUsed = filteredProjects.reduce((sum, p) => sum + (p.budgetUsed || 0), 0);
  const totalRemaining = totalAllocated - totalUsed;
  const approvedCount = filteredProjects.filter(p => p.status === "approved" || p.status === "in_progress" || p.status === "reported").length;

  const handleUpdateStatus = async (projectId: string, newStatus: ProjectProposal["status"]) => {
    try {
      setUpdatingStatus(true);
      await updateProject(projectId, { status: newStatus }, currentUser);
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, status: newStatus });
      }
    } catch (err: any) {
      alert("ไม่สามารถเปลี่ยนสถานะโครงการได้: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredProjects.map((p) => ({
      "รหัสโครงการ": p.code,
      "ปีงบประมาณ": p.fiscalYear,
      "ชื่อโครงการ": p.title,
      "ประเภทโครงการ": PROJECT_TYPE_LABELS[p.projectType] || p.projectType || "โครงการคณะ",
      "ประเด็นยุทธศาสตร์": p.strategicGoal,
      "สาขาวิชา": p.department,
      "หัวหน้าโครงการ": p.leader,
      "งบประมาณจัดสรร (บาท)": p.budgetApproved,
      "งบประมาณใช้ไป (บาท)": p.budgetUsed,
      "ยอดคงเหลือ (บาท)": p.budgetApproved - p.budgetUsed,
      "จำนวนกิจกรรม": p.activities?.length || 0,
      "สถานะ": 
        p.status === "approved" ? "อนุมัติแล้ว" :
        p.status === "in_progress" ? "กำลังดำเนินงาน" :
        p.status === "reported" ? "รายงานผลแล้ว" :
        p.status === "submitted" ? "เสนอตรวจ" :
        p.status === "closed" ? "ปิดโครงการ" : "ร่างข้อเสนอ"
    }));
    exportTableToExcel(data, `ทะเบียนโครงการ_${filterYear}_คณะศิลปศาสตร์`, `โครงการ ${filterYear}`);
  };

  const getStatusBadge = (status: ProjectProposal["status"]) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">อนุมัติแล้ว</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">กำลังดำเนินงาน</span>;
      case "reported":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">รายงานผลแล้ว</span>;
      case "submitted":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">รอตรวจ/อนุมัติ</span>;
      case "closed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">ปิดโครงการ</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">ร่างโครงการ</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
              งานนโยบายและแผน
            </span>
            <span className="text-xs text-slate-400">• ทะเบียนโครงการและยุทธศาสตร์</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ระบบงานโครงการและกิจกรรม (Strategic Projects Hub)
          </h1>
          <p className="text-xs text-slate-500">
            บริหารโครงการยุทธศาสตร์คณะ โครงการศาสตร์พระราชา ติดตามงบประมาณ และระบบรายงานผลตาม KPI & SDG
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/projects/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <FileCheck className="w-4 h-4 text-purple-700" />
            <span>รายงานผลโครงการ / SDG</span>
          </Link>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel ({filteredProjects.length})</span>
          </button>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เสนอโครงการใหม่ (แบบฟอร์ม 2569)</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Financial & Projects Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">งบประมาณจัดสรรทั้งหมด ({filterYear})</span>
            <FolderKanban className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {loading ? "..." : `${totalAllocated.toLocaleString()} บาท`}
          </p>
          <p className="text-[11px] text-blue-800 mt-0.5 font-medium">
            {filteredProjects.length} โครงการในระบบ (อนุมัติ {approvedCount})
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">เบิกจ่ายไปแล้ว</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {loading ? "..." : `${totalUsed.toLocaleString()} บาท`}
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            คิดเป็น {totalAllocated > 0 ? ((totalUsed / totalAllocated) * 100).toFixed(1) : 0}% ของงบรวม
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">งบคงเหลือสำหรับดำเนินงาน</span>
            <Award className="w-4 h-4 text-indigo-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {loading ? "..." : `${totalRemaining.toLocaleString()} บาท`}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            พร้อมจัดกิจกรรมในไตรมาส 1-4
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">โครงการตามศาสตร์พระราชา</span>
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {loading ? "..." : projects.filter(p => p.projectType === "kings_philosophy" || p.strategicGoal?.includes("ศาสตร์พระราชา")).length} โครงการ
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
            ยกระดับเศรษฐกิจฐานรากชุมชน
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อโครงการ, รหัส, สาขาวิชา, หัวหน้าโครงการ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900/20 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Year Filter */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
          >
            <option value={2569}>ปีงบประมาณ 2569</option>
            <option value={2568}>ปีงบประมาณ 2568</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
          >
            <option value="all">ประเภทโครงการ: ทั้งหมด</option>
            <option value="faculty_strategy">ยุทธศาสตร์คณะ</option>
            <option value="kings_philosophy">ศาสตร์พระราชา</option>
            <option value="department_focus">จุดเน้นสาขา</option>
            <option value="academic_service">บริการวิชาการ</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="draft">ร่างโครงการ</option>
            <option value="submitted">รอตรวจ/อนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="in_progress">กำลังดำเนินงาน</option>
            <option value="reported">รายงานผลแล้ว</option>
            <option value="closed">ปิดโครงการ</option>
          </select>
        </div>
      </div>

      {/* Main Projects Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <Clock className="w-6 h-6 animate-spin text-blue-900" />
            <span>กำลังโหลดทะเบียนโครงการจากฐานข้อมูล...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">ไม่พบรายการโครงการตามเงื่อนไขที่เลือก</p>
            <p className="text-slate-400 mt-0.5">กดปุ่ม "เสนอโครงการใหม่" เพื่อเริ่มต้นกรอกแบบฟอร์ม</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">รหัสโครงการ</th>
                  <th className="py-3 px-4">ชื่อโครงการ / ยุทธศาสตร์</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4">สาขาวิชา / ผู้รับผิดชอบ</th>
                  <th className="py-3 px-4 text-right">งบจัดสรร</th>
                  <th className="py-3 px-4 text-right">ใช้จ่ายจริง</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {p.code}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900 line-clamp-2">{p.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{p.strategicGoal}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {PROJECT_TYPE_LABELS[p.projectType] || p.projectType || "โครงการคณะ"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{p.department}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-2.5 h-2.5" /> {p.leader}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {p.budgetApproved.toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-700 whitespace-nowrap">
                      {p.budgetUsed.toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูรายละเอียด</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportProjectToWord(p)}
                          className="p-1 text-slate-500 hover:text-blue-900 rounded-lg transition-colors"
                          title="ส่งออก Word (.docx)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Project Detail Drilldown */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedProject.title}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">รหัสโครงการ {selectedProject.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs text-slate-700">
              {/* Info Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400">งบจัดสรร</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedProject.budgetApproved.toLocaleString()} ฿</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400">ใช้จ่ายไปแล้ว</p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">{selectedProject.budgetUsed.toLocaleString()} ฿</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400">ผู้รับผิดชอบ</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedProject.leader}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400">สถานะ</p>
                  <div className="mt-0.5">{getStatusBadge(selectedProject.status)}</div>
                </div>
              </div>

              {/* Rationale & Objectives */}
              {selectedProject.rationale && (
                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-1">หลักการและเหตุผล:</h4>
                  <p className="text-slate-700 leading-relaxed">{selectedProject.rationale}</p>
                </div>
              )}

              {/* Activities Table */}
              {selectedProject.activities && selectedProject.activities.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">กิจกรรมย่อยในโครงการ ({selectedProject.activities.length} กิจกรรม):</h4>
                  <table className="w-full border-collapse border border-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-left">
                        <th className="p-2 border-b border-r border-slate-200 w-10 text-center">#</th>
                        <th className="p-2 border-b border-r border-slate-200">ชื่อกิจกรรม</th>
                        <th className="p-2 border-b border-r border-slate-200 w-24">ไตรมาส</th>
                        <th className="p-2 border-b border-r border-slate-200">กลุ่มเป้าหมาย</th>
                        <th className="p-2 border-b border-slate-200 text-right">งบประมาณ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProject.activities.map((act, i) => (
                        <tr key={act.id || i} className="border-b border-slate-100">
                          <td className="p-2 text-center border-r border-slate-100">{i + 1}</td>
                          <td className="p-2 border-r border-slate-100 font-medium">{act.name}</td>
                          <td className="p-2 border-r border-slate-100">ไตรมาส {act.quarter}</td>
                          <td className="p-2 border-r border-slate-100">{act.targetGroup || "-"}</td>
                          <td className="p-2 text-right font-mono font-semibold">{act.budget.toLocaleString()} ฿</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Status Action Buttons for Admins & Dean */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportProjectToWord(selectedProject)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด Word (.docx)</span>
                  </button>
                  <Link
                    href={`/projects/reports?projectId=${selectedProject.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-xl"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>เขียนรายงานผลโครงการ</span>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  {(isAdmin || isDean || isPlan) && selectedProject.status === "submitted" && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedProject.id, "approved")}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>อนุมัติโครงการ</span>
                    </button>
                  )}
                  {selectedProject.status === "approved" && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedProject.id, "in_progress")}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs"
                    >
                      เริ่มดำเนินกิจกรรม
                    </button>
                  )}
                  {selectedProject.status === "reported" && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedProject.id, "closed")}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs"
                    >
                      ปิดโครงการสมบูรณ์
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

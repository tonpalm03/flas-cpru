"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  LineChart, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Filter, 
  Search, 
  Download, 
  Printer, 
  ExternalLink, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Award,
  Layers,
  Sparkles,
  Calendar,
  Building,
  Info,
  FolderKanban,
  Edit,
  Save,
  X
} from "lucide-react";
import { 
  StrategicPlan, 
  StrategicPillar, 
  StrategicKPI, 
  ProjectProposal 
} from "@/lib/types";
import { 
  getStrategicPlan, 
  saveStrategicPlan, 
  getProjects 
} from "@/lib/firebaseService";
import { 
  exportStrategicPlanToWord, 
  exportTableToExcel, 
  printDocumentView 
} from "@/lib/documentGenerator";
import { useRole } from "@/components/RoleContext";

export default function StrategicPlanPage() {
  const { currentUser } = useRole();
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState<number>(2569);
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [projects, setProjects] = useState<ProjectProposal[]>([]);

  // Filters
  const [selectedPillarId, setSelectedPillarId] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Edit KPI Modal
  const [editingKPI, setEditingKPI] = useState<StrategicKPI | null>(null);
  const [editActualValue, setEditActualValue] = useState<number>(0);
  const [editHasData, setEditHasData] = useState<boolean>(true);
  const [editEvidenceUrl, setEditEvidenceUrl] = useState<string>("");
  const [savingKPI, setSavingKPI] = useState<boolean>(false);

  // Load plan and projects
  const loadPlanData = async (year: number) => {
    setLoading(true);
    try {
      const [fetchedPlan, fetchedProjects] = await Promise.all([
        getStrategicPlan(year),
        getProjects()
      ]);
      setPlan(fetchedPlan);
      setProjects(fetchedProjects);
    } catch (err) {
      console.error("Failed to load strategic plan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanData(fiscalYear);
  }, [fiscalYear]);

  // Unique departments for filter
  const departments = useMemo(() => {
    if (!plan) return [];
    const depts = new Set<string>();
    plan.pillars.forEach(p => {
      p.kpis.forEach(k => {
        if (k.responsibleDepartment) depts.add(k.responsibleDepartment);
      });
    });
    return Array.from(depts);
  }, [plan]);

  // Real Mathematical Calculations for Pillars & Overall
  const computedPillars = useMemo(() => {
    if (!plan) return [];

    return plan.pillars.map(pillar => {
      let filteredKPIs = pillar.kpis;

      // Filter by Department
      if (selectedDept !== "all") {
        filteredKPIs = filteredKPIs.filter(k => k.responsibleDepartment === selectedDept);
      }

      // Filter by Search Term
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        filteredKPIs = filteredKPIs.filter(k => 
          k.name.toLowerCase().includes(term) ||
          k.code.toLowerCase().includes(term) ||
          k.responsiblePerson.toLowerCase().includes(term)
        );
      }

      // Calculate weighted progress
      let totalWeight = 0;
      let weightedSum = 0;

      filteredKPIs.forEach(kpi => {
        if (kpi.hasData) {
          const kpiProgress = kpi.targetValue > 0 
            ? Math.min(100, Math.round((kpi.actualValue / kpi.targetValue) * 100 * 10) / 10)
            : 0;
          weightedSum += (kpiProgress * (kpi.weight || 1));
          totalWeight += (kpi.weight || 1);
        }
      });

      const calculatedProgress = totalWeight > 0 
        ? Math.round((weightedSum / totalWeight) * 10) / 10 
        : 0;

      return {
        ...pillar,
        kpis: filteredKPIs,
        calculatedProgress
      };
    });
  }, [plan, selectedDept, searchTerm]);

  // Overall Plan Progress (Total Weighted Progress across all pillars)
  const overallProgress = useMemo(() => {
    if (!computedPillars || computedPillars.length === 0) return 0;

    let totalPillarWeight = 0;
    let totalWeightedScore = 0;

    computedPillars.forEach(p => {
      const pWeight = p.weight || 25;
      totalWeightedScore += ((p.calculatedProgress || 0) * pWeight);
      totalPillarWeight += pWeight;
    });

    return totalPillarWeight > 0 
      ? Math.round((totalWeightedScore / totalPillarWeight) * 10) / 10 
      : 0;
  }, [computedPillars]);

  // Filter by selected pillar tab
  const displayedPillars = useMemo(() => {
    if (selectedPillarId === "all") return computedPillars;
    return computedPillars.filter(p => p.id === selectedPillarId);
  }, [computedPillars, selectedPillarId]);

  // Handle Save KPI Updates
  const handleSaveKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !editingKPI) return;

    setSavingKPI(true);
    try {
      const updatedPillars = plan.pillars.map(pillar => {
        if (pillar.id !== editingKPI.pillarId) return pillar;

        const updatedKPIs = pillar.kpis.map(kpi => {
          if (kpi.id !== editingKPI.id) return kpi;

          const progressPercent = kpi.targetValue > 0 && editHasData
            ? Math.min(100, Math.round((editActualValue / kpi.targetValue) * 100 * 10) / 10)
            : 0;

          let status: StrategicKPI["status"] = "in_progress";
          if (!editHasData) status = "not_started";
          else if (progressPercent >= 100) status = editActualValue > kpi.targetValue ? "exceeded" : "achieved";

          return {
            ...kpi,
            actualValue: editActualValue,
            hasData: editHasData,
            progressPercent,
            evidenceUrl: editEvidenceUrl,
            status
          };
        });

        return { ...pillar, kpis: updatedKPIs };
      });

      const updatedPlan: StrategicPlan = {
        ...plan,
        pillars: updatedPillars,
        updatedAt: new Date().toISOString()
      };

      await saveStrategicPlan(updatedPlan, currentUser);
      setPlan(updatedPlan);
      setEditingKPI(null);
      alert("บันทึกผลการดำเนินงานตัวชี้วัดเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Save KPI error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลตัวชี้วัด");
    } finally {
      setSavingKPI(false);
    }
  };

  // Helper Export Excel
  const handleExportExcel = () => {
    if (!plan) return;

    const rows: Record<string, any>[] = [];
    computedPillars.forEach(p => {
      p.kpis.forEach(k => {
        rows.push({
          "ยุทธศาสตร์": `ยุทธศาสตร์ที่ ${p.pillarNumber} : ${p.name}`,
          "รหัสตัวชี้วัด": k.code,
          "ชื่อตัวชี้วัด (KPI)": k.name,
          "หน่วยนับ": k.unit,
          "เป้าหมาย": k.targetValue,
          "ผลงานจริง": k.hasData ? k.actualValue : "ยังไม่มีข้อมูล",
          "ร้อยละความสำเร็จ": k.hasData ? `${k.progressPercent}%` : "-",
          "ค่าน้ำหนัก (%)": k.weight,
          "รอบรายงาน": k.reportingPeriod,
          "ผู้รับผิดชอบ": k.responsiblePerson,
          "หน่วยงาน": k.responsibleDepartment,
          "สถานะ": k.status === "achieved" ? "บรรลุเป้าหมาย" : k.status === "exceeded" ? "เกินเป้าหมาย" : k.status === "in_progress" ? "กำลังดำเนินการ" : "ยังไม่เริ่ม"
        });
      });
    });

    exportTableToExcel(rows, `แผนยุทธศาสตร์และตัวชี้วัด_${fiscalYear}`, "ตัวชี้วัดยุทธศาสตร์");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
              แผนปฏิบัติราชการประจำปี {fiscalYear}
            </span>
            <span className="text-xs text-slate-400">• คณะศิลปศาสตร์และวิทยาศาสตร์</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            แผนยุทธศาสตร์ ตัวชี้วัด และความก้าวหน้า (Strategic Plan & KPIs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามผลลัพธ์ตามเป้าประสงค์ 4 ยุทธศาสตร์หลักและศาสตร์พระราชา คำนวณความก้าวหน้าตามค่าน้ำหนักจริง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fiscal Year Selector */}
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 shadow-subtle"
          >
            <option value={2569}>ปีงบประมาณ 2569</option>
            <option value={2568}>ปีงบประมาณ 2568</option>
          </select>

          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>ส่งออก Excel</span>
          </button>

          {plan && (
            <button
              type="button"
              onClick={() => exportStrategicPlanToWord(plan)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Word แผนยุทธศาสตร์</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Progress & Vision Banner */}
      <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 items-center">
          <div className="lg:col-span-2 space-y-2">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              วิสัยทัศน์คณะศิลปศาสตร์และวิทยาศาสตร์
            </span>
            <p className="text-sm md:text-base font-medium leading-relaxed text-slate-100">
              "{plan?.vision || 'คณะชั้นนำในการจัดการศึกษาและบูรณาการศาสตร์ เพื่อการพัฒนาท้องถิ่นอย่างยั่งยืนด้วยนวัตกรรมและเทคโนโลยีดิจิทัล'}"
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-blue-200">
              <span>• 4 ประเด็นยุทธศาสตร์</span>
              <span>• 8 ตัวชี้วัดหลัก (KPIs)</span>
              <span>• {projects.length} โครงการยุทธศาสตร์เชื่อมโยง</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center">
            <span className="text-xs font-medium text-blue-100 block">
              ร้อยละความก้าวหน้าถ่วงน้ำหนักรวมทั้งคณะ
            </span>
            <div className="text-4xl font-bold text-white mt-1 tracking-tight font-mono">
              {overallProgress}%
            </div>
            <p className="text-[11px] text-blue-200 mt-1">
              คำนวณจากตัวชี้วัด 8 รายการที่มีผลดำเนินงานจริง
            </p>
            <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Summary Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {computedPillars.map((pillar) => (
          <div
            key={pillar.id}
            onClick={() => setSelectedPillarId(selectedPillarId === pillar.id ? "all" : pillar.id)}
            className={`bg-white border rounded-2xl p-4 shadow-subtle cursor-pointer transition-all ${
              selectedPillarId === pillar.id 
                ? "border-blue-900 ring-2 ring-blue-900/10" 
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                {pillar.code} (น้ำหนัก {pillar.weight}%)
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {pillar.calculatedProgress}%
              </span>
            </div>

            <h3 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2 leading-snug">
              {pillar.name}
            </h3>

            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-900 h-full rounded-full transition-all"
                style={{ width: `${pillar.calculatedProgress}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-400 mt-2">
              {pillar.kpis.length} ตัวชี้วัด • {pillar.kpis.filter(k => k.progressPercent >= 100).length} บรรลุเป้า
            </p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหารหัส KPI, ชื่อตัวชี้วัด, ผู้รับผิดชอบ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">ประเด็นยุทธศาสตร์:</span>
            <select
              value={selectedPillarId}
              onChange={(e) => setSelectedPillarId(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 font-medium"
            >
              <option value="all">ทั้งหมด (4 ยุทธศาสตร์)</option>
              {plan?.pillars.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} : {p.name.substring(0, 35)}...
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">หน่วยงาน:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">ทุกสาขาวิชา/หน่วยงาน</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Strategic Pillars & Detailed KPI Tables */}
      <div className="space-y-6">
        {displayedPillars.map((pillar) => (
          <div
            key={pillar.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden"
          >
            {/* Pillar Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded-lg">
                    {pillar.code}
                  </span>
                  <h2 className="font-bold text-sm text-slate-900">
                    ประเด็นยุทธศาสตร์ที่ {pillar.pillarNumber} : {pillar.name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {pillar.description} (ค่าน้ำหนักรวม {pillar.weight}%)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">ความก้าวหน้ายุทธศาสตร์</span>
                  <span className="font-mono text-sm font-bold text-blue-900">
                    {pillar.calculatedProgress}%
                  </span>
                </div>
                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-900 h-full rounded-full transition-all"
                    style={{ width: `${pillar.calculatedProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold w-24">รหัส</th>
                    <th className="py-3 px-4 font-semibold">ชื่อตัวชี้วัด (KPI / OKR)</th>
                    <th className="py-3 px-4 font-semibold text-center w-20">หน่วยนับ</th>
                    <th className="py-3 px-4 font-semibold text-right w-24">เป้าหมาย</th>
                    <th className="py-3 px-4 font-semibold text-right w-24">ผลงานจริง</th>
                    <th className="py-3 px-4 font-semibold text-center w-28">ความก้าวหน้า</th>
                    <th className="py-3 px-4 font-semibold">ผู้รับผิดชอบ / หน่วยงาน</th>
                    <th className="py-3 px-4 font-semibold text-center w-24">สถานะ</th>
                    {(currentUser?.role === "admin" || currentUser?.role === "dean" || currentUser?.role === "staff_plan") && (
                      <th className="py-3 px-4 font-semibold text-right w-20">จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pillar.kpis.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        ไม่พบตัวชี้วัดตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    pillar.kpis.map((kpi) => (
                      <tr key={kpi.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">
                          {kpi.code}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{kpi.name}</div>
                          {kpi.linkedProjectIds && kpi.linkedProjectIds.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-400">โครงการเชื่อมโยง:</span>
                              {kpi.linkedProjectIds.map(pid => (
                                <Link 
                                  key={pid}
                                  href={`/projects?search=${pid}`}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-blue-900 px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-0.5"
                                >
                                  <span>{pid}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600">
                          {kpi.unit}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {kpi.targetValue.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {kpi.hasData ? (
                            <span className="text-slate-900">{kpi.actualValue.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">ไม่มีข้อมูล</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {kpi.hasData ? (
                            <div className="space-y-1">
                              <span className={`font-mono font-bold text-xs ${
                                kpi.progressPercent >= 100 ? "text-emerald-800" : "text-blue-900"
                              }`}>
                                {kpi.progressPercent}%
                              </span>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    kpi.progressPercent >= 100 ? "bg-emerald-600" : "bg-blue-800"
                                  }`}
                                  style={{ width: `${kpi.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{kpi.responsiblePerson}</div>
                          <div className="text-[10px] text-slate-400">{kpi.responsibleDepartment}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            kpi.status === "achieved" ? "bg-emerald-100 text-emerald-900" :
                            kpi.status === "exceeded" ? "bg-indigo-100 text-indigo-900" :
                            kpi.status === "in_progress" ? "bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-500"
                          }`}>
                            {kpi.status === "achieved" ? "บรรลุเป้า" :
                             kpi.status === "exceeded" ? "เกินเป้า" :
                             kpi.status === "in_progress" ? "กำลังดำเนินการ" : "ยังไม่เริ่ม"}
                          </span>
                        </td>

                        {(currentUser?.role === "admin" || currentUser?.role === "dean" || currentUser?.role === "staff_plan") && (
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKPI(kpi);
                                setEditActualValue(kpi.actualValue);
                                setEditHasData(kpi.hasData);
                                setEditEvidenceUrl(kpi.evidenceUrl || "");
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="อัปเดตผลการดำเนินงาน"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: EDIT KPI VALUE */}
      {editingKPI && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-lg p-6 animate-in fade-in space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  {editingKPI.code}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">
                  อัปเดตผลการดำเนินงานตัวชี้วัด
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingKPI(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-800">{editingKPI.name}</span>
              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
                <span>เป้าหมายที่กำหนด: <strong>{editingKPI.targetValue} {editingKPI.unit}</strong></span>
                <span>ค่าน้ำหนัก: <strong>{editingKPI.weight}%</strong></span>
              </div>
            </div>

            <form onSubmit={handleSaveKPI} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={editHasData}
                    onChange={(e) => setEditHasData(e.target.checked)}
                    className="rounded text-blue-900"
                  />
                  <span className="font-semibold text-slate-800">มีข้อมูลผลการดำเนินงานในรอบนี้แล้ว</span>
                </label>
              </div>

              {editHasData && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ผลการดำเนินงานจริง (หน่วย: {editingKPI.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editActualValue}
                    onChange={(e) => setEditActualValue(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-900"
                  />
                  <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                    <span>ร้อยละความสำเร็จที่คำนวณได้:</span>
                    <span className="font-bold text-blue-900 font-mono">
                      {editingKPI.targetValue > 0 
                        ? Math.min(100, Math.round((editActualValue / editingKPI.targetValue) * 100 * 10) / 10) 
                        : 0}%
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ลิงก์เอกสารหลักฐานอ้างอิง / SAR (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://... (URL แฟ้มหลักฐาน หรือรายงาน SAR)"
                  value={editEvidenceUrl}
                  onChange={(e) => setEditEvidenceUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingKPI(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingKPI}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingKPI ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

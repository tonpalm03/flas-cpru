"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft, 
  Save, 
  Calendar, 
  Building, 
  User, 
  Layers, 
  DollarSign, 
  Target, 
  FileText,
  Sparkles,
  AlertCircle,
  FileCheck,
  Eye,
  Image as ImageIcon,
  Link2,
  PieChart,
  Award
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { getProjects, getProjectReports, createProjectReport } from "@/lib/firebaseService";
import { ProjectProposal, ProjectReport } from "@/lib/types";
import { exportProjectReportToWord, printDocumentView } from "@/lib/documentGenerator";

const SDG_LIST = [
  { id: 1, name: "SDG 1: ขจัดความยากจน" },
  { id: 2, name: "SDG 2: ขจัดความหิวโหย" },
  { id: 3, name: "SDG 3: สุขภาพและความเป็นอยู่ที่ดี" },
  { id: 4, name: "SDG 4: การศึกษาที่มีคุณภาพ" },
  { id: 5, name: "SDG 5: ความเท่าเทียมทางเพศ" },
  { id: 6, name: "SDG 6: น้ำสะอาดและสุขอนามัย" },
  { id: 7, name: "SDG 7: พลังงานสะอาดที่เข้าถึงได้" },
  { id: 8, name: "SDG 8: งานที่มีคุณค่าและการเติบโตทางเศรษฐกิจ" },
  { id: 9, name: "SDG 9: อุตสาหกรรม นวัตกรรม และโครงสร้างพื้นฐาน" },
  { id: 10, name: "SDG 10: ลดความเหลื่อมล้ำ" },
  { id: 11, name: "SDG 11: เมืองและชุมชนที่ยั่งยืน" },
  { id: 12, name: "SDG 12: การบริโภคและการผลิตที่ยั่งยืน" },
  { id: 13, name: "SDG 13: การรับมือการเปลี่ยนแปลงสภาพภูมิอากาศ" },
  { id: 14, name: "SDG 14: ทรัพยากรทางทะเลและมหาสมุทร" },
  { id: 15, name: "SDG 15: ทรัพยากรบนบกและระบบนิเวศ" },
  { id: 16, name: "SDG 16: สังคมสงบสุข ยุติธรรม และสถาบันเข้มแข็ง" },
  { id: 17, name: "SDG 17: ความร่วมมือเพื่อการพัฒนาที่ยั่งยืน" },
];

const REPORT_TYPE_CONFIG: Record<string, { label: string; desc: string }> = {
  faculty_standard: {
    label: "1. แบบรายงานโครงการตามแผน-นอกแผน 2569",
    desc: "แบบรายงานผลสัมฤทธิ์ตามแบบฟอร์มมาตรฐานคณะศิลปศาสตร์และวิทยาศาสตร์"
  },
  kings_philosophy: {
    label: "2. แบบรายงานโครงการศาสตร์พระราชา (4 มิติ)",
    desc: "สรุปผลสัมฤทธิ์ 4 ด้าน: เศรษฐกิจ, สังคม, สิ่งแวดล้อม และการศึกษาเพื่อการพัฒนาท้องถิ่น"
  },
  sdg_summary: {
    label: "3. แบบรายงานสรุปเป้าหมาย SDG (1-17)",
    desc: "รายงานผลการดำเนินงานที่ตอบสนองเป้าหมายการพัฒนาที่ยั่งยืนแห่งสหประชาชาติ"
  },
  one_page: {
    label: "4. One Page Executive Summary (สรุป 1 หน้า)",
    desc: "สรุปภาพรวม 1 หน้าสำหรับผู้บริหาร คณบดี และสภามหาวิทยาลัย"
  }
};

export default function ProjectReportsPage() {
  const { currentUser } = useRole();
  const [projects, setProjects] = useState<ProjectProposal[]>([]);
  const [reportsList, setReportsList] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savedReport, setSavedReport] = useState<ProjectReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [reportType, setReportType] = useState<ProjectReport["reportType"]>("kings_philosophy");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectCode, setProjectCode] = useState("69-KING-001");
  const [projectTitle, setProjectTitle] = useState("โครงการเพิ่มมูลค่าสับปะรดด้วยนวัตกรรมการอบแห้งเพื่อพัฒนาเศรษฐกิจฐานราก");
  const [department, setDepartment] = useState("สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ");
  const [leader, setLeader] = useState("ดร.สุรชัย นวัตกร");
  const [fiscalYear, setFiscalYear] = useState(2569);
  const [budgetApproved, setBudgetApproved] = useState(250000);
  const [budgetUsed, setBudgetUsed] = useState(195000);
  const [participantCount, setParticipantCount] = useState(65);
  const [targetAchieved, setTargetAchieved] = useState(true);

  // KPI Results
  const [kpiResults, setKpiResults] = useState<Array<{ kpi: string; target: string; actual: string; status: "passed" | "failed" | "in_progress" }>>([
    { kpi: "ร้อยละของกลุ่มเกษตรกรมีความรู้การแปรรูปสับปะรด", target: "ร้อยละ 80", actual: "ร้อยละ 92", status: "passed" },
    { kpi: "จำนวนผลิตภัณฑ์แปรรูปที่ได้มาตรฐานความปลอดภัย", target: "2 รายการ", actual: "3 รายการ", status: "passed" },
    { kpi: "ระดับความพึงพอใจของผู้เข้าร่วมโครงการ", target: "ไม่น้อยกว่า 4.50", actual: "4.78", status: "passed" }
  ]);
  const [newKpiText, setNewKpiText] = useState("");
  const [newKpiTarget, setNewKpiTarget] = useState("");
  const [newKpiActual, setNewKpiActual] = useState("");
  const [newKpiStatus, setNewKpiStatus] = useState<"passed" | "failed" | "in_progress">("passed");

  // Activity Results
  const [activityResults, setActivityResults] = useState<Array<{ activityName: string; actualDate: string; actualParticipants: number; outcomeSummary: string }>>([
    {
      activityName: "กิจกรรมที่ 1: การถ่ายทอดเทคโนโลยีเตาอบแห้งพลังงานแสงอาทิตย์ร่วมกับลมร้อน",
      actualDate: "15-16 พ.ย. 2568",
      actualParticipants: 35,
      outcomeSummary: "เกษตรกรสามารถควบคุมอุณหภูมิและความชื้นในการอบแห้งได้ตามมาตรฐาน"
    },
    {
      activityName: "กิจกรรมที่ 2: การพัฒนาบรรจุภัณฑ์และการทดสอบอายุการเก็บรักษา",
      actualDate: "20-22 ม.ค. 2569",
      actualParticipants: 30,
      outcomeSummary: "ได้ต้นแบบบรรจุภัณฑ์สุญญากาศยืดอายุสินค้าได้นาน 6 เดือน"
    }
  ]);

  // King's Philosophy 4 Dimensions
  const [impactEconomy, setImpactEconomy] = useState(
    "กลุ่มวิสาหกิจชุมชนสามารถจำหน่ายสับปะรดอบแห้งเกรดพรีเมียม สร้างรายได้เฉลี่ยเพิ่มขึ้นร้อยละ 18.5 ต่อครัวเรือนในพื้นที่ตำบลท่าหินโงม อำเภอเมืองชัยภูมิ"
  );
  const [impactSociety, setImpactSociety] = useState(
    "เกิดการรวมกลุ่มเกษตรกรผู้ปลูกสับปะรดเป็นวิสาหกิจชุมชนแปรรูปผลผลิตอย่างเข้มแข็ง มีการถ่ายทอดองค์ความรู้ระหว่างรุ่นสู่รุ่น"
  );
  const [impactEnvironment, setImpactEnvironment] = useState(
    "ลดปริมาณผลผลิตสับปะรดตกเกรดที่ต้องทิ้งโดยเปล่าประโยชน์ (Zero Waste) และใช้พลังงานแสงอาทิตย์ในการอบแห้งเพื่อลดการปล่อยคาร์บอน"
  );
  const [impactEducation, setImpactEducation] = useState(
    "เป็นแหล่งเรียนรู้ชุมชนและพื้นที่ฝึกทักษะสหกิจศึกษาแก่นักศึกษาคณะศิลปศาสตร์และวิทยาศาสตร์ในสภาพแวดล้อมการทำงานจริง"
  );

  // SDGs
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([1, 8, 12]);

  // General Outcomes & Suggestions
  const [outcomesSummary, setOutcomesSummary] = useState(
    "โครงการสามารถบรรลุเป้าหมายตามตัวชี้วัดทุกประการ ยกระดับรายได้เกษตรกรและสร้างมูลค่าเพิ่มให้กับผลผลิตการเกษตรประจำถิ่นจังหวัดชัยภูมิอย่างเป็นรูปธรรม"
  );
  const [problemsAndSuggestions, setProblemsAndSuggestions] = useState(
    "ข้อเสนอแนะ: ควรขยายช่องทางการตลาดออนไลน์ผ่านแพลตฟอร์ม E-Commerce และประสานงานกับกระทรวงพาณิชย์เพื่อขอรับรองมาตรฐานสินค้า GI"
  );

  // Photos
  const [photos, setPhotos] = useState<Array<{ url: string; caption: string }>>([
    { url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80", caption: "การอบรมเชิงปฏิบัติการการแปรรูปผลผลิต ณ วิสาหกิจชุมชน" },
    { url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80", caption: "ตัวอย่างผลิตภัณฑ์สับปะรดอบแห้งและบรรจุภัณฑ์มาตรฐาน" }
  ]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [evidenceQrUrl, setEvidenceQrUrl] = useState("https://flas-cpru.web.app/evidence/king-001");

  // Load projects & reports
  const fetchData = async () => {
    try {
      setLoading(true);
      const [projData, repData] = await Promise.all([
        getProjects(),
        getProjectReports()
      ]);
      setProjects(projData);
      setReportsList(repData);
    } catch (err: any) {
      console.error("Error fetching project reports:", err);
      setErrorMsg("ไม่สามารถโหลดข้อมูลโครงการและรายงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Project Selection Auto-population
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;

    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setProjectCode(proj.code);
      setProjectTitle(proj.title);
      setDepartment(proj.department);
      setLeader(proj.leader);
      setFiscalYear(proj.fiscalYear || 2569);
      setBudgetApproved(proj.budgetApproved || 0);
      setBudgetUsed(proj.budgetUsed || Math.round(proj.budgetApproved * 0.85));
      if (proj.sdgGoals && proj.sdgGoals.length > 0) {
        setSelectedSdgs(proj.sdgGoals);
      }
      if (proj.kpis && proj.kpis.length > 0) {
        setKpiResults(proj.kpis.map(k => ({
          kpi: k,
          target: "ตามแผน",
          actual: "บรรลุตามเป้าหมาย 100%",
          status: "passed"
        })));
      }
      if (proj.projectType === "kings_philosophy") {
        setReportType("kings_philosophy");
      }
    }
  };

  const handleAddKpi = () => {
    if (!newKpiText.trim()) return;
    setKpiResults([
      ...kpiResults,
      {
        kpi: newKpiText.trim(),
        target: newKpiTarget.trim() || "100%",
        actual: newKpiActual.trim() || "100%",
        status: newKpiStatus
      }
    ]);
    setNewKpiText("");
    setNewKpiTarget("");
    setNewKpiActual("");
  };

  const handleRemoveKpi = (index: number) => {
    setKpiResults(kpiResults.filter((_, i) => i !== index));
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setPhotos([
      ...photos,
      { url: newPhotoUrl.trim(), caption: newPhotoCaption.trim() || "ภาพกิจกรรมโครงการ" }
    ]);
    setNewPhotoUrl("");
    setNewPhotoCaption("");
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleSdg = (id: number) => {
    if (selectedSdgs.includes(id)) {
      setSelectedSdgs(selectedSdgs.filter(s => s !== id));
    } else {
      setSelectedSdgs([...selectedSdgs, id].sort((a, b) => a - b));
    }
  };

  const constructPayload = (): Omit<ProjectReport, "id" | "createdAt"> => {
    return {
      reportType,
      projectId: selectedProjectId || "proj-custom",
      projectCode,
      projectTitle,
      department,
      leader,
      fiscalYear,
      budgetApproved,
      budgetUsed,
      participantCount,
      targetAchieved,
      kpiResults,
      activityResults,
      impactEconomy: reportType === "kings_philosophy" || reportType === "one_page" ? impactEconomy : undefined,
      impactSociety: reportType === "kings_philosophy" || reportType === "one_page" ? impactSociety : undefined,
      impactEnvironment: reportType === "kings_philosophy" || reportType === "one_page" ? impactEnvironment : undefined,
      impactEducation: reportType === "kings_philosophy" || reportType === "one_page" ? impactEducation : undefined,
      sdgGoals: selectedSdgs,
      problemsAndSuggestions,
      photos,
      evidenceQrUrl,
      status: "approved"
    };
  };

  const handleExportWord = async () => {
    await exportProjectReportToWord({
      reportType,
      projectCode,
      projectTitle,
      department,
      leader,
      fiscalYear,
      budgetApproved,
      budgetUsed,
      participantCount,
      outcomesSummary,
      impactEconomy,
      impactSociety,
      impactEnvironment,
      impactEducation,
      sdgGoals: selectedSdgs,
      problemsAndSuggestions,
      kpiResults
    });
  };

  const handleSaveReport = async () => {
    if (!projectTitle.trim() || !leader.trim()) {
      setErrorMsg("กรุณากรอกชื่อโครงการและหัวหน้าโครงการให้ครบถ้วน");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const payload = constructPayload();
      const created = await createProjectReport(payload, currentUser);
      setSavedReport(created);
      setReportsList([created, ...reportsList]);
    } catch (err: any) {
      console.error("Save project report error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกรายงาน: " + (err.message || "โปรดลองใหม่อีกครั้ง"));
    } finally {
      setSubmitting(false);
    }
  };

  const remainingBudget = budgetApproved - budgetUsed;
  const budgetUtilizationRate = budgetApproved > 0 ? ((budgetUsed / budgetApproved) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/projects" className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมโครงการ
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              รายงานสรุปผลการดำเนินโครงการและ SDG (Project Reports)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
              ปีงบประมาณ {fiscalYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกผลสัมฤทธิ์โครงการ เทียบเป้าหมายตัวชี้วัด ประเมิน 4 มิติศาสตร์พระราชา และส่งออกเล่มรายงาน Word (.docx)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word เล่มรายงาน</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveReport}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "กำลังบันทึก..." : "บันทึกรายงานเข้าระบบ"}</span>
          </button>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {savedReport && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                บันทึกรายงานผลโครงการสำเร็จเรียบร้อย!
              </p>
              <p className="text-xs text-emerald-700">
                โครงการ: <span className="font-semibold">{savedReport.projectTitle}</span> ({savedReport.projectCode}) — อัปเดตสถานะโครงการเป็น &quot;รายงานผลแล้ว&quot; เรียบร้อย
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportWord}
              className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-lg hover:bg-emerald-100/50"
            >
              ดาวน์โหลด Word เล่มสมบูรณ์
            </button>
            <Link
              href="/projects"
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg"
            >
              ดูรายการโครงการ
            </Link>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Report Modes Selector Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
        <label className="block text-xs font-bold text-slate-700 mb-2">
          เลือกรูปแบบรายงาน (Report Mode):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => {
            const isSelected = reportType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setReportType(key as any)}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                    : "bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div>
                  <p className="font-bold text-xs">{config.label}</p>
                  <p className={`text-[11px] mt-1 leading-snug ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                    {config.desc}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 text-[11px] text-blue-200 font-semibold mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>โหมดปัจจุบัน</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Report Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-8 text-xs text-slate-800">
        
        {/* Section 1: Project Auto-Select & Overview */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" />
              1. เชื่อมโยงโครงการและข้อมูลทั่วไป (Project Selection & Financials)
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 1 จาก 5</span>
          </div>

          {/* Project Selector */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
            <label className="block font-bold text-blue-950">
              เลือกโครงการจากฐานข้อมูลกลาง (Auto-populate)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="w-full border border-blue-200 rounded-lg p-2.5 bg-white text-slate-900 font-medium focus:border-blue-900 focus:outline-none"
            >
              <option value="">-- เลือกโครงการเพื่อดึงข้อมูลอัตโนมัติ หรือกรอกข้อมูลด้วยตนเอง --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  [{proj.code}] {proj.title} ({proj.department} - {proj.budgetApproved?.toLocaleString()} บาท)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">รหัสโครงการ</label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono font-bold focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">ชื่อโครงการ</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา / หน่วยงาน</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">หัวหน้าโครงการ / ผู้รายงาน</label>
              <input
                type="text"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ปีงบประมาณ</label>
              <input
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-center font-bold focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Financial Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">งบประมาณจัดสรร</span>
              <input
                type="number"
                value={budgetApproved}
                onChange={(e) => setBudgetApproved(Number(e.target.value))}
                className="w-full font-bold text-sm text-slate-900 bg-transparent border-b border-slate-300 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">งบประมาณใช้จริง</span>
              <input
                type="number"
                value={budgetUsed}
                onChange={(e) => setBudgetUsed(Number(e.target.value))}
                className="w-full font-bold text-sm text-emerald-700 bg-transparent border-b border-slate-300 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">งบประมาณคงเหลือ</span>
              <p className="font-bold text-sm text-slate-700 font-mono mt-0.5">
                {remainingBudget.toLocaleString()} บาท
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">% การเบิกจ่าย</span>
              <p className="font-bold text-sm text-blue-900 font-mono mt-0.5">
                {budgetUtilizationRate}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">จำนวนผู้เข้าร่วมโครงการจริง (คน)</label>
              <input
                type="number"
                value={participantCount}
                onChange={(e) => setParticipantCount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-bold text-blue-900 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="targetAchieved"
                checked={targetAchieved}
                onChange={(e) => setTargetAchieved(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
              />
              <label htmlFor="targetAchieved" className="font-bold text-slate-800 cursor-pointer">
                การดำเนินงานบรรลุเป้าหมายและตัวชี้วัดตามแผนงาน
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: KPI Results Target vs Actual */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-900" />
              2. สรุปผลการดำเนินงานตามตัวชี้วัดความสำเร็จ (KPI Target vs Actual)
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 2 จาก 5</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-2.5 text-center w-12">ลำดับ</th>
                  <th className="p-2.5">ตัวชี้วัดความสำเร็จ (KPI)</th>
                  <th className="p-2.5 text-center w-28">เป้าหมายตามแผน</th>
                  <th className="p-2.5 text-center w-28">ผลที่ทำได้จริง</th>
                  <th className="p-2.5 text-center w-28">สถานะ</th>
                  <th className="p-2.5 text-center w-12">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpiResults.map((kpi, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-slate-900">{kpi.kpi}</td>
                    <td className="p-2.5 text-center text-slate-600">{kpi.target}</td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{kpi.actual}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        kpi.status === "passed"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : kpi.status === "failed"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {kpi.status === "passed" ? "ผ่านเป้าหมาย" : kpi.status === "failed" ? "ไม่ผ่าน" : "กำลังดำเนินงาน"}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveKpi(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add KPI Controls */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
            <p className="font-bold text-slate-800 text-[11px]">+ เพิ่มตัวชี้วัดความสำเร็จ</p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="รายละเอียดตัวชี้วัด..."
                  value={newKpiText}
                  onChange={(e) => setNewKpiText(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="เป้าหมาย"
                  value={newKpiTarget}
                  onChange={(e) => setNewKpiTarget(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-center focus:border-blue-900 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="ผลจริง"
                  value={newKpiActual}
                  onChange={(e) => setNewKpiActual(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-center font-bold focus:border-blue-900 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <select
                  value={newKpiStatus}
                  onChange={(e) => setNewKpiStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                >
                  <option value="passed">ผ่านเป้าหมาย</option>
                  <option value="in_progress">กำลังดำเนินงาน</option>
                  <option value="failed">ไม่ผ่าน</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddKpi}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-subtle"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มลงตาราง KPI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: King's Philosophy 4 Dimensions (When applicable) */}
        {(reportType === "kings_philosophy" || reportType === "one_page") && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-900" />
                3. ผลกระทบและการพัฒนาเชิงพื้นที่ 4 มิติ (ศาสตร์พระราชา)
              </h2>
              <span className="text-[11px] text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded">โหมดศาสตร์พระราชา</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-slate-900">
                  1. มิติด้านเศรษฐกิจ (Economic Impact)
                </label>
                <p className="text-[11px] text-slate-500">การสร้างงาน สร้างรายได้ การลดต้นทุน หรือการเพิ่มมูลค่าผลผลิต</p>
                <textarea
                  rows={3}
                  value={impactEconomy}
                  onChange={(e) => setImpactEconomy(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-slate-900">
                  2. มิติด้านสังคมและชุมชน (Social Impact)
                </label>
                <p className="text-[11px] text-slate-500">ความเข้มแข็งของชุมชน การรวมกลุ่ม คุณภาพชีวิต หรือการลดความเหลื่อมล้ำ</p>
                <textarea
                  rows={3}
                  value={impactSociety}
                  onChange={(e) => setImpactSociety(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-slate-900">
                  3. มิติด้านสิ่งแวดล้อม (Environmental Impact)
                </label>
                <p className="text-[11px] text-slate-500">การอนุรักษ์ทรัพยากร พลังงานทดแทน การจัดการขยะ Zero Waste</p>
                <textarea
                  rows={3}
                  value={impactEnvironment}
                  onChange={(e) => setImpactEnvironment(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-slate-900">
                  4. มิติด้านการศึกษาและการเรียนรู้ (Educational Impact)
                </label>
                <p className="text-[11px] text-slate-500">การบูรณาการกับการเรียนการสอน การวิจัย หรือการฝึกทักษะนักศึกษา</p>
                <textarea
                  rows={3}
                  value={impactEducation}
                  onChange={(e) => setImpactEducation(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 4: SDGs & Outcomes */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-900" />
              4. เป้าหมายการพัฒนาที่ยั่งยืน (SDG) และผลสัมฤทธิ์เด่น
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 4 จาก 5</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              เป้าหมาย SDG ที่โครงการตอบสนอง (คลิกเพื่อเลือก/ยกเลิก)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SDG_LIST.map((sdg) => {
                const isSelected = selectedSdgs.includes(sdg.id);
                return (
                  <button
                    key={sdg.id}
                    type="button"
                    onClick={() => toggleSdg(sdg.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{sdg.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">สรุปผลสัมฤทธิ์และประโยชน์ที่ได้รับ (Outcomes)</label>
              <textarea
                rows={3}
                value={outcomesSummary}
                onChange={(e) => setOutcomesSummary(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ปัญหา อุปสรรค และข้อเสนอแนะเพื่อการพัฒนา</label>
              <textarea
                rows={3}
                value={problemsAndSuggestions}
                onChange={(e) => setProblemsAndSuggestions(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Photos & Evidence */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-900" />
              5. รูปภาพประกอบกิจกรรมและหลักฐานเชิงประจักษ์ (Photos & E-Evidence)
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 5 จาก 5</span>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                <div className="h-40 bg-slate-200 overflow-hidden relative">
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800 text-xs">{photo.caption}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Photo Controls */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
            <p className="font-bold text-slate-800 text-[11px]">+ เพิ่มรูปภาพกิจกรรม</p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <input
                  type="text"
                  placeholder="URL รูปภาพ (https://...)..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none font-mono text-[11px]"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="คำบรรยายใต้ภาพ..."
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1.5 border border-slate-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรูปภาพ</span>
              </button>
            </div>
          </div>

          {/* QR Code / Link */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-900" />
              ลิงก์คลังหลักฐานเชิงประจักษ์ / E-Evidence (สร้าง QR Code ท้ายเล่ม)
            </label>
            <input
              type="text"
              value={evidenceQrUrl}
              onChange={(e) => setEvidenceQrUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/projects"
            className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-600 text-xs w-full sm:w-auto text-center"
          >
            ยกเลิกและย้อนกลับ
          </Link>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportWord}
              className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Word (.docx)</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSaveReport}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? "กำลังบันทึก..." : "บันทึกรายงานเข้าระบบ"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submitted Reports Drawer / History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              ประวัติเล่มรายงานที่บันทึกแล้วในระบบ ({reportsList.length} เล่ม)
            </h3>
            <p className="text-[11px] text-slate-500">
              รายงานผลโครงการที่บันทึกเข้าระบบคลาวด์ สามารถดาวน์โหลดเป็น Word หรือนำไปใช้อ้างอิงได้
            </p>
          </div>
        </div>

        {reportsList.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีประวัติการบันทึกรายงานในระบบ</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reportsList.map((rep) => (
              <div key={rep.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-xl transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {rep.projectCode}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{rep.projectTitle}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ผู้รายงาน: {rep.leader} | สาขา: {rep.department} | งบใช้จริง: {rep.budgetUsed?.toLocaleString()} บาท (จาก {rep.budgetApproved?.toLocaleString()} บาท)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      exportProjectReportToWord({
                        reportType: rep.reportType,
                        projectCode: rep.projectCode,
                        projectTitle: rep.projectTitle,
                        department: rep.department,
                        leader: rep.leader,
                        fiscalYear: rep.fiscalYear,
                        budgetApproved: rep.budgetApproved,
                        budgetUsed: rep.budgetUsed,
                        participantCount: rep.participantCount,
                        impactEconomy: rep.impactEconomy,
                        impactSociety: rep.impactSociety,
                        impactEnvironment: rep.impactEnvironment,
                        impactEducation: rep.impactEducation,
                        sdgGoals: rep.sdgGoals,
                        problemsAndSuggestions: rep.problemsAndSuggestions,
                        kpiResults: rep.kpiResults
                      });
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด Word</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

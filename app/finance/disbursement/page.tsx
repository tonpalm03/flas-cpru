"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Wallet, 
  Plus, 
  Download, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft, 
  FileSpreadsheet,
  GraduationCap,
  Save,
  Clock,
  User,
  Building,
  Calendar,
  Layers,
  FileCheck,
  Sparkles,
  AlertCircle,
  Eye,
  Check
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getFinanceDisbursements, 
  createFinanceDisbursement, 
  updateFinanceDisbursementStatus 
} from "@/lib/firebaseService";
import { TeachingDisbursement } from "@/lib/types";
import { exportTableToExcel, printDocumentView, exportTeachingDisbursementToWord } from "@/lib/documentGenerator";

interface TeachingRow {
  id: string;
  teacherName: string;
  courseCode: string;
  courseName: string;
  hours: number;
  ratePerHour: number;
  total: number;
  taxDeduction: number;
  netAmount: number;
  dates?: string;
  room?: string;
}

interface SupervisionRow {
  id: string;
  supervisorName: string;
  department: string;
  studentName: string;
  organization: string;
  visitDate: string;
  visitMethod: "onsite" | "online";
  supervisionFee: number;
  travelAllowance: number;
  total: number;
  taxDeduction: number;
  netAmount: number;
}

export default function TeachingDisbursementPage() {
  const { currentUser, isAdmin, isDean, isFinance } = useRole();
  const [batches, setBatches] = useState<TeachingDisbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savedBatch, setSavedBatch] = useState<TeachingDisbursement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mode: Teaching Fee or Supervision Fee
  const [disburseMode, setDisburseMode] = useState<"teaching" | "supervision">("teaching");

  // Common Header State
  const [periodMonth, setPeriodMonth] = useState("กันยายน 2569");
  const [academicYear, setAcademicYear] = useState<number>(2568);
  const [term, setTerm] = useState("1/2568");
  const [program, setProgram] = useState<TeachingDisbursement["program"]>("bachelor_gspch");
  const [taxRate, setTaxRate] = useState<number>(1); // 0%, 1%, 3%

  // Mode 1: Teaching Fee Items
  const [teachingItems, setTeachingItems] = useState<TeachingRow[]>([
    {
      id: "t-1",
      teacherName: "ผศ.ดร. นฤมล อนันตโชค",
      courseCode: "BUS3201",
      courseName: "การบริหารธุรกิจสร้างสรรค์และสตาร์ทอัพ",
      hours: 16,
      ratePerHour: 600,
      total: 9600,
      taxDeduction: 96,
      netAmount: 9504,
      dates: "ส. 6, อา. 7, ส. 13, อา. 14 ก.ย. 69",
      room: "ห้อง 421 อาคาร 4"
    },
    {
      id: "t-2",
      teacherName: "อ.ฤทธิชัย ภาระวิเศษ",
      courseCode: "POL2104",
      courseName: "การเมืองการปกครองและนโยบายสาธารณะ",
      hours: 16,
      ratePerHour: 500,
      total: 8000,
      taxDeduction: 80,
      netAmount: 7920,
      dates: "ส. 6, อา. 7, ส. 13, อา. 14 ก.ย. 69",
      room: "ห้อง 422 อาคาร 4"
    },
    {
      id: "t-3",
      teacherName: "ดร.สุรชัย นวัตกร",
      courseCode: "ENG1102",
      courseName: "ระบบอัตโนมัติและนวัตกรรมชุมชน",
      hours: 12,
      ratePerHour: 500,
      total: 6000,
      taxDeduction: 60,
      netAmount: 5940,
      dates: "ส. 20, อา. 21, ส. 27 ก.ย. 69",
      room: "Lab 3"
    }
  ]);

  // Mode 2: Supervision Fee Items
  const [supervisionItems, setSupervisionItems] = useState<SupervisionRow[]>([
    {
      id: "s-1",
      supervisorName: "ผศ.ดร. นฤมล อนันตโชค",
      department: "สาขาวิชาบริหารธุรกิจ",
      studentName: "น.ส.กมลทิพย์ ชัยภูมิ",
      organization: "หอการค้าจังหวัดชัยภูมิ",
      visitDate: "2026-09-18",
      visitMethod: "onsite",
      supervisionFee: 1500,
      travelAllowance: 800,
      total: 2300,
      taxDeduction: 23,
      netAmount: 2277
    },
    {
      id: "s-2",
      supervisorName: "อ.ฤทธิชัย ภาระวิเศษ",
      department: "สาขาวิชารัฐศาสตร์",
      studentName: "นายธนพล ศรีวิชัย",
      organization: "ที่ว่าการอำเภอเมืองชัยภูมิ",
      visitDate: "2026-09-19",
      visitMethod: "onsite",
      supervisionFee: 1500,
      travelAllowance: 600,
      total: 2100,
      taxDeduction: 21,
      netAmount: 2079
    }
  ]);

  // Add Teaching Item State
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newHours, setNewHours] = useState(16);
  const [newRate, setNewRate] = useState(500);
  const [newDates, setNewDates] = useState("");
  const [newRoom, setNewRoom] = useState("");

  // Add Supervision Item State
  const [newSupName, setNewSupName] = useState("");
  const [newSupDept, setNewSupDept] = useState("สาขาวิชารัฐศาสตร์");
  const [newStudent, setNewStudent] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [newVisitMethod, setNewVisitMethod] = useState<"onsite" | "online">("onsite");
  const [newSupFee, setNewSupFee] = useState<number>(1500);
  const [newTravel, setNewTravel] = useState<number>(600);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getFinanceDisbursements();
      setBatches(data.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
    } catch (err: any) {
      console.error("Error loading disbursements:", err);
      setErrorMsg("ไม่สามารถโหลดประวัติการเบิกจ่ายได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Teaching Calculations
  const grandTotalTeaching = teachingItems.reduce((sum, i) => sum + i.total, 0);
  const grandTaxTeaching = teachingItems.reduce((sum, i) => sum + i.taxDeduction, 0);
  const grandNetTeaching = teachingItems.reduce((sum, i) => sum + i.netAmount, 0);
  const uniqueTeachersCountTeaching = new Set(teachingItems.map(i => i.teacherName)).size;

  // Supervision Calculations
  const grandTotalSup = supervisionItems.reduce((sum, i) => sum + i.total, 0);
  const grandTaxSup = supervisionItems.reduce((sum, i) => sum + i.taxDeduction, 0);
  const grandNetSup = supervisionItems.reduce((sum, i) => sum + i.netAmount, 0);
  const uniqueSupervisorsCount = new Set(supervisionItems.map(i => i.supervisorName)).size;

  const handleAddTeachingItem = () => {
    if (!newName.trim() || newHours <= 0) {
      alert("กรุณากรอกชื่ออาจารย์และจำนวนชั่วโมงสอน");
      return;
    }
    const total = newHours * newRate;
    const tax = Math.round(total * (taxRate / 100));
    const net = total - tax;

    const newItem: TeachingRow = {
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teacherName: newName.trim(),
      courseCode: newCode.trim() || "GEN1001",
      courseName: newCourse.trim() || "วิชาศึกษาทั่วไป",
      hours: Number(newHours),
      ratePerHour: Number(newRate),
      total,
      taxDeduction: tax,
      netAmount: net,
      dates: newDates.trim() || undefined,
      room: newRoom.trim() || undefined
    };

    setTeachingItems([...teachingItems, newItem]);
    setNewName("");
    setNewCode("");
    setNewCourse("");
    setNewDates("");
    setNewRoom("");
  };

  const handleRemoveTeachingItem = (id: string) => {
    setTeachingItems(teachingItems.filter(i => i.id !== id));
  };

  const handleAddSupervisionItem = () => {
    if (!newSupName.trim() || !newStudent.trim() || !newOrg.trim()) {
      alert("กรุณากรอกชื่ออาจารย์ผู้นิเทศ นักศึกษา และสถานประกอบการให้ครบถ้วน");
      return;
    }
    const total = Number(newSupFee) + Number(newTravel);
    const tax = Math.round(total * (taxRate / 100));
    const net = total - tax;

    const newItem: SupervisionRow = {
      id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      supervisorName: newSupName.trim(),
      department: newSupDept.trim(),
      studentName: newStudent.trim(),
      organization: newOrg.trim(),
      visitDate: newVisitDate,
      visitMethod: newVisitMethod,
      supervisionFee: Number(newSupFee),
      travelAllowance: Number(newTravel),
      total,
      taxDeduction: tax,
      netAmount: net
    };

    setSupervisionItems([...supervisionItems, newItem]);
    setNewStudent("");
    setNewOrg("");
  };

  const handleRemoveSupervisionItem = (id: string) => {
    setSupervisionItems(supervisionItems.filter(i => i.id !== id));
  };

  const handleSaveBatch = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const isTeach = disburseMode === "teaching";
      const totalAmount = isTeach ? grandTotalTeaching : grandTotalSup;
      const taxDeductionTotal = isTeach ? grandTaxTeaching : grandTaxSup;
      const netAmountTotal = isTeach ? grandNetTeaching : grandNetSup;
      const teachersCount = isTeach ? uniqueTeachersCountTeaching : uniqueSupervisorsCount;

      const created = await createFinanceDisbursement({
        periodMonth,
        academicYear,
        term,
        program: isTeach ? program : "supervision",
        totalAmount,
        taxDeductionTotal,
        netAmountTotal,
        teachersCount,
        taxRate,
        status: "verified",
        items: isTeach ? teachingItems : [],
        supervisionItems: !isTeach ? supervisionItems : undefined
      }, currentUser);

      setSavedBatch(created);
      setBatches([created, ...batches]);
    } catch (err: any) {
      console.error("Save disbursement batch error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกชุดเบิกจ่าย: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportWord = async () => {
    if (disburseMode === "teaching") {
      await exportTeachingDisbursementToWord({
        periodMonth,
        program: program === "bachelor_gspch" ? "ระดับปริญญาตรี ภาค กศ.ปช." : "ระดับปริญญาตรี ภาคปกติ",
        academicYear,
        term,
        totalAmount: grandTotalTeaching,
        taxDeductionTotal: grandTaxTeaching,
        netAmountTotal: grandNetTeaching,
        teachersCount: uniqueTeachersCountTeaching,
        items: teachingItems
      });
    } else {
      await exportTeachingDisbursementToWord({
        periodMonth,
        program: "ค่านิเทศการฝึกประสบการณ์วิชาชีพและสหกิจศึกษา",
        academicYear,
        term,
        totalAmount: grandTotalSup,
        taxDeductionTotal: grandTaxSup,
        netAmountTotal: grandNetSup,
        teachersCount: uniqueSupervisorsCount,
        items: supervisionItems.map(s => ({
          teacherName: s.supervisorName,
          courseCode: "สหกิจศึกษา",
          courseName: `นิเทศ ${s.studentName} ณ ${s.organization}`,
          hours: 1,
          ratePerHour: s.total,
          total: s.total,
          taxDeduction: s.taxDeduction,
          netAmount: s.netAmount
        }))
      });
    }
  };

  const handleExportExcel = () => {
    if (disburseMode === "teaching") {
      const data = teachingItems.map((i, idx) => ({
        "ลำดับ": idx + 1,
        "ชื่อ-สกุล อาจารย์ผู้สอน": i.teacherName,
        "รหัสวิชา": i.courseCode,
        "ชื่อรายวิชา": i.courseName,
        "วันเวลาสอน": i.dates || "-",
        "ห้องเรียน": i.room || "-",
        "จำนวนชั่วโมง": i.hours,
        "อัตรา/ชม. (บาท)": i.ratePerHour,
        "ยอดรวม (บาท)": i.total,
        "หักภาษี ณ ที่จ่าย (บาท)": i.taxDeduction,
        "ยอดสุทธิ (บาท)": i.netAmount
      }));
      exportTableToExcel(data, `ใบเบิกค่าสอนพิเศษ_${periodMonth.replace(' ', '_')}`, "ค่าสอนพิเศษ");
    } else {
      const data = supervisionItems.map((s, idx) => ({
        "ลำดับ": idx + 1,
        "อาจารย์ผู้นิเทศ": s.supervisorName,
        "สาขาวิชา": s.department,
        "ชื่อนักศึกษา": s.studentName,
        "หน่วยงาน/สถานประกอบการ": s.organization,
        "วันที่นิเทศ": s.visitDate,
        "รูปแบบ": s.visitMethod === "onsite" ? "ลงพื้นที่จริง (On-site)" : "ออนไลน์ (Online)",
        "ค่านิเทศ (บาท)": s.supervisionFee,
        "ค่าพาหนะ/เดินทาง (บาท)": s.travelAllowance,
        "ยอดรวม (บาท)": s.total,
        "หักภาษี (บาท)": s.taxDeduction,
        "ยอดสุทธิ (บาท)": s.netAmount
      }));
      exportTableToExcel(data, `ใบเบิกค่านิเทศ_${periodMonth.replace(' ', '_')}`, "ค่านิเทศนักศึกษา");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/finance" className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมการเงิน
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              เบิกจ่ายค่าสอนพิเศษและค่านิเทศ (Teaching & Supervision Fees)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
              ปีการศึกษา {academicYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            คำนวณชั่วโมงสอน ค่านิเทศสหกิจศึกษา หักภาษี ณ ที่จ่ายตามระเบียบ และออกบันทึกข้อความขออนุมัติเบิกจ่าย Word
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
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word บันทึกข้อความ</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveBatch}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "กำลังบันทึก..." : "บันทึกชุดเบิกจ่าย"}</span>
          </button>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {savedBatch && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                บันทึกชุดเบิกจ่ายเข้าระบบสำเร็จเรียบร้อย!
              </p>
              <p className="text-xs text-emerald-700">
                เลขที่ชุดเบิก: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">{savedBatch.batchNumber}</span> — ยอดจ่ายสุทธิ {savedBatch.netAmountTotal.toLocaleString()} บาท ({savedBatch.teachersCount} ท่าน)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportWord}
              className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-lg hover:bg-emerald-100/50"
            >
              ดาวน์โหลด Word
            </button>
            <button
              type="button"
              onClick={() => setSavedBatch(null)}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDisburseMode("teaching")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              disburseMode === "teaching"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>1. ค่าตอบแทนการสอนพิเศษ (Teaching Fees)</span>
          </button>

          <button
            type="button"
            onClick={() => setDisburseMode("supervision")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              disburseMode === "supervision"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>2. ค่านิเทศนักศึกษา / สหกิจศึกษา (Supervision Fees)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">อัตราภาษีหัก ณ ที่จ่าย:</span>
          <select
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800 focus:border-blue-900 focus:outline-none"
          >
            <option value={1}>1% (ตามระเบียบอาจารย์ประจำ)</option>
            <option value={3}>3% (วิทยากรภายนอก/นิติบุคคล)</option>
            <option value={0}>0% (ได้รับยกเว้นภาษี)</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs font-bold text-slate-500">จำนวนอาจารย์ผู้เบิก ({periodMonth})</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {disburseMode === "teaching" ? uniqueTeachersCountTeaching : uniqueSupervisorsCount} ท่าน
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {disburseMode === "teaching" ? `${teachingItems.length} รายวิชาที่สอน` : `${supervisionItems.length} ครั้งที่นิเทศ`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs font-bold text-slate-500">ยอดเงินรวมก่อนหักภาษี</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {(disburseMode === "teaching" ? grandTotalTeaching : grandTotalSup).toLocaleString()} ฿
          </p>
          <p className="text-[11px] text-slate-400 mt-1">อัตราตามเกณฑ์ระเบียบ CPRU</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs font-bold text-slate-500">ภาษีหัก ณ ที่จ่าย ({taxRate}%)</p>
          <p className="text-2xl font-bold text-amber-700 mt-2 font-mono">
            {(disburseMode === "teaching" ? grandTaxTeaching : grandTaxSup).toLocaleString()} ฿
          </p>
          <p className="text-[11px] text-amber-700 mt-1 font-semibold">นำส่งสรรพากรตามรอบเดือน</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle">
          <p className="text-xs font-bold text-slate-500">ยอดเงินจ่ายสุทธิ (Net Total)</p>
          <p className="text-2xl font-bold text-blue-900 mt-2 font-mono">
            {(disburseMode === "teaching" ? grandNetTeaching : grandNetSup).toLocaleString()} ฿
          </p>
          <p className="text-[11px] text-blue-800 mt-1 font-semibold">โอนเข้าบัญชีเงินเดือนอาจารย์</p>
        </div>
      </div>

      {/* Main Table Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-6 text-xs text-slate-800">
        
        {/* Term & Period Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ประจำเดือนที่เบิกจ่าย</label>
            <input
              type="text"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              placeholder="เช่น กันยายน 2569"
              className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ภาคการศึกษา / ปีการศึกษา</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="เทอม เช่น 1/2568"
                className="w-full border border-slate-200 rounded-lg p-2 text-center font-bold focus:border-blue-900 focus:outline-none"
              />
              <input
                type="number"
                value={academicYear}
                onChange={(e) => setAcademicYear(Number(e.target.value))}
                placeholder="ปีการศึกษา"
                className="w-full border border-slate-200 rounded-lg p-2 text-center font-bold focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">หลักสูตร / โครงการที่เบิก</label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value as any)}
              className="w-full border border-slate-200 rounded-lg p-2 font-medium focus:border-blue-900 focus:outline-none"
            >
              <option value="bachelor_gspch">ระดับปริญญาตรี ภาค กศ.ปช. (เสาร์-อาทิตย์)</option>
              <option value="bachelor_regular">ระดับปริญญาตรี ภาคปกติ (จันทร์-ศุกร์)</option>
              <option value="supervision">การฝึกประสบการณ์วิชาชีพและสหกิจศึกษา</option>
            </select>
          </div>
        </div>

        {/* Mode 1 Table: Teaching Fees */}
        {disburseMode === "teaching" && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3 w-12 text-center">ลำดับ</th>
                    <th className="p-3">ชื่อ-สกุล อาจารย์ผู้สอน</th>
                    <th className="p-3">รหัสวิชา / รายวิชา</th>
                    <th className="p-3">วันเวลาสอน / ห้องเรียน</th>
                    <th className="p-3 text-center w-20">ชั่วโมง</th>
                    <th className="p-3 text-right w-24">อัตรา (บาท)</th>
                    <th className="p-3 text-right w-24">รวมเงิน</th>
                    <th className="p-3 text-right w-24 text-amber-700">หักภาษี</th>
                    <th className="p-3 text-right w-28 text-blue-900 font-extrabold">ยอดสุทธิ</th>
                    <th className="p-3 text-center w-12">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachingItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{item.teacherName}</td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-blue-900 block">{item.courseCode}</span>
                        <span className="text-slate-600 text-[11px]">{item.courseName}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-800 block">{item.dates || "-"}</span>
                        <span className="text-slate-400 text-[11px]">{item.room || "-"}</span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono">{item.hours}</td>
                      <td className="p-3 text-right font-mono">{item.ratePerHour.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">{item.total.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-amber-700">{item.taxDeduction.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-900">{item.netAmount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTeachingItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <td colSpan={4} className="p-3 text-right">
                      รวมทั้งสิ้น ({uniqueTeachersCountTeaching} ท่าน / {teachingItems.length} วิชา):
                    </td>
                    <td className="p-3 text-center font-mono">{teachingItems.reduce((s, i) => s + i.hours, 0)}</td>
                    <td></td>
                    <td className="p-3 text-right font-mono">{grandTotalTeaching.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-amber-700">{grandTaxTeaching.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-blue-900 text-sm">{grandNetTeaching.toLocaleString()} บาท</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add Teaching Item Controls */}
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <p className="font-bold text-slate-800 text-[11px]">+ เพิ่มรายการสอนของอาจารย์</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="ชื่อ-สกุล อาจารย์..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="รหัสวิชา (BUS3201)..."
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="ชื่อรายวิชา..."
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    placeholder="ชั่วโมงสอน"
                    value={newHours || ""}
                    onChange={(e) => setNewHours(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-center font-bold focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:border-blue-900 focus:outline-none"
                  >
                    <option value={600}>600 ฿/ชม. (ผศ./ดร.)</option>
                    <option value={500}>500 ฿/ชม. (อ./ป.โท)</option>
                    <option value={800}>800 ฿/ชม. (รศ./พิเศษ)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddTeachingItem}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-subtle"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการลงตาราง</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2 Table: Supervision Fees */}
        {disburseMode === "supervision" && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3 w-12 text-center">ลำดับ</th>
                    <th className="p-3">อาจารย์ผู้นิเทศ / สาขาวิชา</th>
                    <th className="p-3">ชื่อนักศึกษา / หน่วยงานฝึกงาน</th>
                    <th className="p-3 text-center">วันที่ / รูปแบบ</th>
                    <th className="p-3 text-right w-24">ค่านิเทศ (บาท)</th>
                    <th className="p-3 text-right w-24">ค่าพาหนะ (บาท)</th>
                    <th className="p-3 text-right w-24">รวมเงิน</th>
                    <th className="p-3 text-right w-24 text-amber-700">หักภาษี</th>
                    <th className="p-3 text-right w-28 text-blue-900 font-extrabold">ยอดสุทธิ</th>
                    <th className="p-3 text-center w-12">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supervisionItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.supervisorName}</span>
                        <span className="text-[11px] text-slate-500">{item.department}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.studentName}</span>
                        <span className="text-[11px] text-slate-600">{item.organization}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-slate-800 block">{item.visitDate}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${item.visitMethod === "onsite" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-blue-50 text-blue-900 border border-blue-200"}`}>
                          {item.visitMethod === "onsite" ? "On-site" : "Online"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">{item.supervisionFee.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">{item.travelAllowance.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">{item.total.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-amber-700">{item.taxDeduction.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-900">{item.netAmount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSupervisionItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <td colSpan={4} className="p-3 text-right">
                      รวมทั้งสิ้น ({uniqueSupervisorsCount} ท่าน / {supervisionItems.length} คน):
                    </td>
                    <td className="p-3 text-right font-mono">{supervisionItems.reduce((s, i) => s + i.supervisionFee, 0).toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{supervisionItems.reduce((s, i) => s + i.travelAllowance, 0).toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{grandTotalSup.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-amber-700">{grandTaxSup.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-blue-900 text-sm">{grandNetSup.toLocaleString()} บาท</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add Supervision Item Controls */}
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <p className="font-bold text-slate-800 text-[11px]">+ เพิ่มรายการนิเทศนักศึกษา</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="ชื่ออาจารย์ผู้นิเทศ..."
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="ชื่อนักศึกษา..."
                    value={newStudent}
                    onChange={(e) => setNewStudent(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="หน่วยงาน/สถานที่ฝึก..."
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={newVisitMethod}
                    onChange={(e) => setNewVisitMethod(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  >
                    <option value="onsite">ลงพื้นที่จริง (On-site)</option>
                    <option value="online">นิเทศออนไลน์ (Online)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddSupervisionItem}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-subtle"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการลงตาราง</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Drawer of Submitted Batches */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              ประวัติชุดเบิกจ่ายที่บันทึกแล้วในระบบ ({batches.length} ชุด)
            </h3>
            <p className="text-[11px] text-slate-500">
              ชุดเบิกจ่ายค่าสอนและค่านิเทศที่ผ่านการตรวจสอบ สามารถดาวน์โหลดเป็น Word หรือตรวจสถานะการจ่ายเงิน
            </p>
          </div>
        </div>

        {batches.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีประวัติการบันทึกชุดเบิกจ่ายในระบบ</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {batches.map((b) => (
              <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-xl transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {b.batchNumber || "บจ 69/001"}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      ค่าตอบแทนประจำเดือน {b.periodMonth} ({b.program === "supervision" ? "ค่านิเทศสหกิจศึกษา" : "ค่าสอนพิเศษ กศ.ปช."})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    อาจารย์ผู้เบิก: {b.teachersCount} ท่าน | รวมเงินสุทธิ: {b.netAmountTotal?.toLocaleString()} บาท (ภาษี {b.taxDeductionTotal?.toLocaleString()} บาท)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      exportTeachingDisbursementToWord({
                        batchNumber: b.batchNumber,
                        periodMonth: b.periodMonth,
                        program: b.program === "supervision" ? "ค่านิเทศสหกิจศึกษา" : "ระดับปริญญาตรี ภาค กศ.ปช.",
                        academicYear: b.academicYear || 2568,
                        term: b.term || "1/2568",
                        totalAmount: b.totalAmount,
                        taxDeductionTotal: b.taxDeductionTotal,
                        netAmountTotal: b.netAmountTotal,
                        teachersCount: b.teachersCount,
                        items: b.items || []
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

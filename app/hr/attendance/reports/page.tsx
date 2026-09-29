"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  CalendarDays, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Building2,
  Users,
  Clock,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { MonthlyAttendanceReport, AttendancePeriodLock } from "@/lib/types";
import { 
  getMonthlyAttendanceReports, 
  getAttendancePeriodLock, 
  lockAttendancePeriod, 
  reopenAttendancePeriod 
} from "@/lib/firebaseService";
import GarudaEmblem from "@/components/GarudaEmblem";

export default function MonthlyAttendanceReportsPage() {
  const { currentUser } = useRole();
  const [selectedPeriod, setSelectedPeriod] = useState("2569-10");
  const [selectedDept, setSelectedDept] = useState("all");
  const [reports, setReports] = useState<MonthlyAttendanceReport[]>([]);
  const [lockStatus, setLockStatus] = useState<AttendancePeriodLock | null>(null);
  const [loading, setLoading] = useState(true);

  // Reopen Modal
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [submittingLock, setSubmittingLock] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Print Ref
  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reps, lock] = await Promise.all([
        getMonthlyAttendanceReports(selectedPeriod, selectedDept),
        getAttendancePeriodLock(selectedPeriod)
      ]);
      setReports(reps);
      setLockStatus(lock);
    } catch (e) {
      console.error("Error loading monthly report:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedDept]);

  const handleLockPeriod = async () => {
    if (!confirm(`ยืนยันการปิดงวดลงเวลาประจำเดือน ${selectedPeriod} หรือไม่?\nเมื่อปิดงวดแล้วบุคลากรจะไม่สามารถแก้ไขหรือลงเวลาย้อนหลังได้`)) {
      return;
    }
    setSubmittingLock(true);
    setErrorMessage(null);
    try {
      const updatedLock = await lockAttendancePeriod(selectedPeriod, currentUser);
      setLockStatus(updatedLock);
      setSuccessMessage(`ปิดงวดลงเวลาประจำเดือน ${selectedPeriod} เรียบร้อยแล้ว`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการปิดงวด");
    } finally {
      setSubmittingLock(false);
    }
  };

  const handleReopenPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      setErrorMessage("กรุณาระบุเหตุผลความจำเป็นในการปลดล็อกงวด");
      return;
    }

    setSubmittingLock(true);
    setErrorMessage(null);
    try {
      const updatedLock = await reopenAttendancePeriod(selectedPeriod, reopenReason, currentUser);
      setLockStatus(updatedLock);
      setShowReopenModal(false);
      setReopenReason("");
      setSuccessMessage(`ปลดล็อกงวดประจำเดือน ${selectedPeriod} เรียบร้อยแล้ว พร้อมบันทึกประวัติการตรวจสอบ`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการปลดล็อกงวด");
    } finally {
      setSubmittingLock(false);
    }
  };

  // Export to Excel (CSV with UTF-8 BOM)
  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = [
      "รหัสบุคลากร",
      "ชื่อ-นามสกุล",
      "หน่วยงาน",
      "ตำแหน่ง",
      "วันทำการตามเกณฑ์",
      "วันมาทำงานจริง",
      "มาสาย(ครั้ง)",
      "มาสาย(นาที)",
      "ออกก่อน(ครั้ง)",
      "วันลาที่อนุมัติ",
      "ขาด/ไม่สมบูรณ์",
      "สถานะการตรวจ"
    ];

    const rows = reports.map(r => [
      r.employeeId,
      `"${r.staffName}"`,
      `"${r.department}"`,
      `"${r.position}"`,
      r.expectedWorkDays,
      r.actualWorkDays,
      r.lateDaysCount,
      r.lateTotalMinutes,
      r.earlyLeaveDaysCount,
      r.leaveDaysCount,
      r.absentDaysCount,
      r.status === "locked" ? "ปิดงวดแล้ว" : "ตรวจรับรองแล้ว"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานลงเวลา_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Official Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Summary Metrics
  const totalStaff = reports.length;
  const totalActualDays = reports.reduce((acc, r) => acc + r.actualWorkDays, 0);
  const totalExpectedDays = reports.reduce((acc, r) => acc + r.expectedWorkDays, 0);
  const attendanceRate = totalExpectedDays > 0 ? ((totalActualDays / totalExpectedDays) * 100).toFixed(1) : "0";
  const totalLateIncidents = reports.reduce((acc, r) => acc + r.lateDaysCount, 0);
  const totalLateMinutes = reports.reduce((acc, r) => acc + r.lateTotalMinutes, 0);
  const totalLeaveDays = reports.reduce((acc, r) => acc + r.leaveDaysCount, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Printable Area Specific Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          aside, header, button, .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
              Flow 7 : Monthly Review & Period Closing
            </span>
            <span className="text-xs text-slate-400">ระบบบริหารงานบุคคล คณะศิลปศาสตร์และวิทยาศาสตร์</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            สรุปเวลาปฏิบัติงานรายเดือนและปิดงวด (Monthly Attendance Consolidation)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ประมวลผลเวลารายเดือน เชื่อมโยงระบบการลาอิเล็กทรอนิกส์ (e-Leave) ปิดงวด และส่งออกรายงาน
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-blue-900" />
            <span>พิมพ์รายงาน / PDF</span>
          </button>

          {lockStatus?.isLocked ? (
            <button
              type="button"
              onClick={() => setShowReopenModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>ปลดล็อกงวด (Reopen)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLockPeriod}
              disabled={submittingLock}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white hover:bg-blue-800 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>ปิดงวดประจำเดือน (Lock)</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs animate-in fade-in no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs animate-in fade-in no-print">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Period Lock Status Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs no-print ${
        lockStatus?.isLocked 
          ? "bg-slate-900 border-slate-800 text-white" 
          : "bg-blue-50/70 border-blue-200 text-blue-900"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${lockStatus?.isLocked ? "bg-slate-800 text-amber-400" : "bg-blue-100 text-blue-900"}`}>
            {lockStatus?.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-bold text-sm">
              {lockStatus?.isLocked 
                ? `งวดประจำเดือน ${selectedPeriod} ถูกปิดงวดแล้ว (Period Locked)` 
                : `งวดประจำเดือน ${selectedPeriod} เปิดให้บันทึกและแก้ไขข้อมูลตามปกติ`}
            </p>
            <p className={`text-[11px] mt-0.5 ${lockStatus?.isLocked ? "text-slate-400" : "text-blue-700"}`}>
              {lockStatus?.isLocked
                ? `ล็อกโดย: ${lockStatus.lockedByName} เมื่อ ${new Date(lockStatus.lockedAt).toLocaleString("th-TH")}`
                : "เมื่อปิดงวดแล้ว บุคลากรจะไม่สามารถยื่นขอแก้ไขเวลาย้อนหลังในงวดนี้ได้"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            lockStatus?.isLocked ? "bg-amber-400 text-slate-950" : "bg-emerald-100 text-emerald-900"
          }`}>
            {lockStatus?.isLocked ? "งวดถูกล็อก (Locked)" : "เปิดใช้งาน (Open)"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs no-print">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">บุคลากรที่ประมวลผล</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {totalStaff} <span className="text-xs font-normal text-slate-500">คน</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">อัตราการมาปฏิบัติงาน</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {attendanceRate}% <span className="text-xs font-normal text-slate-500">({totalActualDays}/{totalExpectedDays} วัน)</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">การมาสายรวมทั้งคณะ</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">
            {totalLateIncidents} <span className="text-xs font-normal text-slate-500">ครั้ง ({totalLateMinutes} นาที)</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">วันลาที่อนุมัติ (e-Leave)</span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">
            {totalLeaveDays} <span className="text-xs font-normal text-slate-500">วันทำการ</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-2xl text-xs no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">รอบเดือน/ปี:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="2569-10">ตุลาคม 2569</option>
              <option value="2569-09">กันยายน 2569</option>
              <option value="2569-08">สิงหาคม 2569</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">หน่วยงาน:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">ทุกหน่วยงานในคณะ</option>
              <option value="สำนักงานคณบดี">สำนักงานคณบดี</option>
              <option value="สาขาวิชารัฐประศาสนศาสตร์">สาขาวิชารัฐประศาสนศาสตร์</option>
              <option value="สาขาวิชาวิทยาการคอมพิวเตอร์">สาขาวิชาวิทยาการคอมพิวเตอร์</option>
              <option value="สาขาวิชาภาษาอังกฤษเพื่อการสื่อสาร">สาขาวิชาภาษาอังกฤษฯ</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
          <span>เชื่อมโยงระบบทะเบียนบุคลากรและ e-Leave</span>
        </div>
      </div>

      {/* Report Container (Rendered on Screen & Printable) */}
      <div id="printable-report" ref={printRef} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Official Header with Garuda Emblem for Print */}
        <div className="text-center space-y-2 pb-4 border-b border-slate-200">
          <div className="flex justify-center mb-2">
            <GarudaEmblem size={60} />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            รายงานสรุปการลงเวลาปฏิบัติราชการและวันลาประจำเดือน
          </h2>
          <p className="text-xs text-slate-700">
            คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ
          </p>
          <p className="text-xs text-slate-500 font-medium">
            ประจำเดือน {selectedPeriod === "2569-10" ? "ตุลาคม พ.ศ. 2569" : selectedPeriod} (ปีงบประมาณ 2569)
          </p>
        </div>

        {/* Master Consolidation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">ลำดับ</th>
                <th className="py-2.5 px-3">รหัสบุคลากร</th>
                <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                <th className="py-2.5 px-3">หน่วยงาน/สังกัด</th>
                <th className="py-2.5 px-3 text-center">วันเกณฑ์</th>
                <th className="py-2.5 px-3 text-center">มาจริง</th>
                <th className="py-2.5 px-3 text-center">สาย(ครั้ง)</th>
                <th className="py-2.5 px-3 text-center">สาย(นาที)</th>
                <th className="py-2.5 px-3 text-center">ออกก่อน</th>
                <th className="py-2.5 px-3 text-center">ลาที่อนุมัติ</th>
                <th className="py-2.5 px-3 text-center">ขาดงาน</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลบุคลากรในงวดที่เลือก
                  </td>
                </tr>
              ) : (
                reports.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{r.employeeId}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.staffName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.department}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{r.expectedWorkDays}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{r.actualWorkDays}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-600">{r.lateDaysCount || "-"}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-600">{r.lateTotalMinutes || "-"}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-700">{r.earlyLeaveDaysCount || "-"}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-blue-900 font-semibold">{r.leaveDaysCount || "-"}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">{r.absentDaysCount || "-"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {lockStatus?.isLocked ? "ปิดงวดแล้ว" : "รับรองแล้ว"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Block for Print */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
          <div className="space-y-6">
            <p className="font-semibold">ลงชื่อ ........................................................... ผู้สรุปข้อมูล</p>
            <div>
              <p className="font-bold">({currentUser?.name || "เจ้าหน้าที่บริหารงานบุคคล"})</p>
              <p className="text-[11px] text-slate-500">เจ้าหน้าที่บริหารงานบุคคล</p>
              <p className="text-[10px] text-slate-400 mt-1">วันที่ ...... เดือน ..................... พ.ศ. ..........</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="font-semibold">ลงชื่อ ........................................................... ผู้ตรวจรับรอง</p>
            <div>
              <p className="font-bold">(ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี)</p>
              <p className="text-[11px] text-slate-500">คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์</p>
              <p className="text-[10px] text-slate-400 mt-1">วันที่ ...... เดือน ..................... พ.ศ. ..........</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">ปลดล็อกงวดลงเวลา (Reopen Period)</h3>
              <span className="text-[11px] font-mono text-slate-400">{selectedPeriod}</span>
            </div>

            <form onSubmit={handleReopenPeriod} className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <p className="font-bold">ข้อควรระวัง:</p>
                <p className="text-[11px] mt-0.5">
                  การปลดล็อกงวดจะเปิดให้บุคลากรและเจ้าหน้าที่สามารถแก้ไขเวลาได้ ประวัติการปลดล็อกจะถูกบันทึกใน Audit Log
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  เหตุผลความจำเป็นในการปลดล็อกงวด <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ระบุเหตุผล เช่น ได้รับคำสั่งแก้ไขเวลาเพิ่มเติม / ปรับปรุงข้อมูลคำขอตกหล่น..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingLock}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700"
                >
                  {submittingLock ? "กำลังปลดล็อก..." : "ยืนยันการปลดล็อก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

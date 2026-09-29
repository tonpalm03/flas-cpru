"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  History, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  FileEdit, 
  ShieldAlert, 
  Search,
  Filter,
  AlertTriangle,
  Send,
  Building2,
  FileCheck
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { AttendanceSession, AttendanceCorrection } from "@/lib/types";
import { 
  getMyAttendanceSessions, 
  getAttendanceCorrections, 
  requestAttendanceCorrection 
} from "@/lib/firebaseService";

export default function AttendanceHistoryPage() {
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<"history" | "corrections">("history");
  const [selectedMonth, setSelectedMonth] = useState("2569-10");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);

  // Correction Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalTargetDate, setModalTargetDate] = useState("");
  const [modalOriginalIn, setModalOriginalIn] = useState("");
  const [modalOriginalOut, setModalOriginalOut] = useState("");
  const [modalRequestedIn, setModalRequestedIn] = useState("08:30");
  const [modalRequestedOut, setModalRequestedOut] = useState("16:30");
  const [modalReason, setModalReason] = useState("");
  const [modalEvidenceUrl, setModalEvidenceUrl] = useState("");
  const [submittingModal, setSubmittingModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const empId = currentUser.employeeId || currentUser.id;
      const [sessionList, allCorrections] = await Promise.all([
        getMyAttendanceSessions(empId),
        getAttendanceCorrections()
      ]);
      setSessions(sessionList);
      setCorrections(allCorrections.filter(c => c.employeeId === empId));
    } catch (e) {
      console.error("Error loading attendance history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Open modal prefilled with session details
  const handleOpenCorrectionModal = (sess?: AttendanceSession) => {
    if (sess) {
      setModalTargetDate(sess.workDate);
      setModalOriginalIn(sess.checkInTime || "-");
      setModalOriginalOut(sess.checkOutTime || "-");
      setModalRequestedIn(sess.checkInTime || "08:30");
      setModalRequestedOut(sess.checkOutTime || "16:30");
    } else {
      setModalTargetDate(new Date().toISOString().split("T")[0]);
      setModalOriginalIn("-");
      setModalOriginalOut("-");
      setModalRequestedIn("08:30");
      setModalRequestedOut("16:30");
    }
    setModalReason("");
    setModalEvidenceUrl("");
    setShowModal(true);
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!modalReason.trim()) {
      setErrorMessage("กรุณาระบุเหตุผลและความจำเป็นในการขอแก้ไขเวลา");
      return;
    }

    setSubmittingModal(true);
    setErrorMessage(null);
    try {
      const empId = currentUser.employeeId || currentUser.id;
      await requestAttendanceCorrection({
        employeeId: empId,
        userId: currentUser.id,
        staffName: currentUser.name,
        department: currentUser.department,
        workDate: modalTargetDate,
        originalCheckIn: modalOriginalIn !== "-" ? modalOriginalIn : undefined,
        originalCheckOut: modalOriginalOut !== "-" ? modalOriginalOut : undefined,
        requestedCheckIn: modalRequestedIn,
        requestedCheckOut: modalRequestedOut,
        reason: modalReason,
        evidenceUrl: modalEvidenceUrl || undefined,
        initiatedBy: "employee"
      }, currentUser);

      setSuccessMessage("ยื่นคำขอแก้ไขเวลาทำงานเรียบร้อยแล้ว รอผู้บังคับบัญชาหรือเจ้าหน้าที่บุคคลตรวจรับรอง");
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการยื่นคำขอ");
    } finally {
      setSubmittingModal(false);
    }
  };

  // Filter sessions by selected period
  const filteredSessions = sessions.filter(s => {
    if (selectedMonth === "all") return true;
    const yearMonth = s.workDate.substring(0, 7);
    // Convert 2569-10 to 2026-10 or match raw
    return s.workDate.startsWith(selectedMonth) || s.workDate.startsWith("2026-10");
  });

  // KPI calculations
  const totalPunches = filteredSessions.length;
  const lateCount = filteredSessions.filter(s => s.checkInStatus === "late").length;
  const lateMinutes = filteredSessions.reduce((acc, s) => acc + (s.lateMinutes || 0), 0);
  const earlyCount = filteredSessions.filter(s => s.checkOutStatus === "early_leave").length;
  const incompleteCount = filteredSessions.filter(s => s.sessionStatus === "incomplete").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1 text-xs text-blue-900 font-semibold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าลงเวลา</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
              Flow 6 : History & Corrections
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ประวัติการลงเวลาและคำขอแก้ไข (Attendance History)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจสอบรายการลงเวลาเข้า-ออกงานย้อนหลัง และยื่นคำขอแก้ไขเวลาพร้อมระบุเหตุผล
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCorrectionModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>ยื่นขอแก้ไขเวลาย้อนหลัง</span>
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">วันทำงานที่บันทึก</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {totalPunches} <span className="text-xs font-normal text-slate-500">วัน</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">มาสายสะสม</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">
            {lateCount} <span className="text-xs font-normal text-slate-500">ครั้ง ({lateMinutes} นาที)</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">ออกก่อนเวลา</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {earlyCount} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">คำขอแก้ไขที่รอตรวจ</span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">
            {corrections.filter(c => c.status === "pending").length} <span className="text-xs font-normal text-slate-500">รายการ</span>
          </span>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "history"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ประวัติลงเวลาประจำเดือน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("corrections")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "corrections"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>คำขอแก้ไขเวลาย้อนหลัง ({corrections.length})</span>
          </button>
        </div>

        {activeTab === "history" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">งวดประจำเดือน:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="2569-10">ตุลาคม 2569</option>
              <option value="2569-09">กันยายน 2569</option>
              <option value="2569-08">สิงหาคม 2569</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Attendance Sessions Table */}
      {activeTab === "history" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">วันที่ปฏิบัติงาน</th>
                <th className="py-3 px-4">กะเวลา</th>
                <th className="py-3 px-4">เวลาเข้างาน</th>
                <th className="py-3 px-4">เวลาออกงาน</th>
                <th className="py-3 px-4">ชม. รวม</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">คำขอแก้ไข</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลการลงเวลาในงวดเดือนที่เลือก
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {sess.workDate}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sess.shiftName}
                    </td>
                    <td className="py-3 px-4">
                      {sess.checkInTime ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900">{sess.checkInTime} น.</span>
                          {sess.checkInStatus === "late" && (
                            <span className="text-[10px] font-bold text-rose-600 px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200">
                              สาย {sess.lateMinutes} น.
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {sess.checkOutTime ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900">{sess.checkOutTime} น.</span>
                          {sess.checkOutStatus === "early_leave" && (
                            <span className="text-[10px] font-bold text-amber-700 px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200">
                              ออกก่อน {sess.earlyMinutes} น.
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {sess.totalWorkMinutes > 0 ? `${(sess.totalWorkMinutes / 60).toFixed(1)} ชม.` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sess.sessionStatus === "closed"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : sess.sessionStatus === "open"
                          ? "bg-blue-50 text-blue-900 border border-blue-200"
                          : "bg-amber-50 text-amber-900 border border-amber-200"
                      }`}>
                        {sess.sessionStatus === "closed" ? "เสร็จสิ้น" :
                         sess.sessionStatus === "open" ? "กำลังปฏิบัติงาน" : "ไม่สมบูรณ์"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sess.hasCorrection ? (
                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          ยื่นขอแก้ไขแล้ว
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCorrectionModal(sess)}
                          className="text-slate-600 hover:text-blue-900 font-semibold text-xs hover:underline"
                        >
                          ขอแก้ไข
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Corrections History Table */}
      {activeTab === "corrections" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">วันที่ปฏิบัติงาน</th>
                <th className="py-3 px-4">เวลาเดิม</th>
                <th className="py-3 px-4">เวลาที่ขอแก้ไข</th>
                <th className="py-3 px-4">เหตุผลความจำเป็น</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">ผลการตรวจรับรอง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corrections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ยังไม่มีรายการคำขอแก้ไขเวลาทำงาน
                  </td>
                </tr>
              ) : (
                corrections.map((corr) => (
                  <tr key={corr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {corr.workDate}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {corr.originalCheckIn || "-"} – {corr.originalCheckOut || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {corr.requestedCheckIn} – {corr.requestedCheckOut}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-700">
                      <p className="truncate">{corr.reason}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        corr.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : corr.status === "rejected"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-amber-50 text-amber-900 border border-amber-200"
                      }`}>
                        {corr.status === "approved" ? "อนุมัติแล้ว" :
                         corr.status === "rejected" ? "ไม่อนุมัติ" : "รอการตรวจ"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {corr.reviewerName ? (
                        <div>
                          <p className="font-semibold text-slate-800">{corr.reviewerName}</p>
                          <p className="text-[10px] text-slate-400">{corr.reviewerComment || "-"}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">รอผู้บังคับบัญชา</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Correction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">ยื่นคำขอแก้ไขเวลาทำงานย้อนหลัง</h3>
              <span className="text-[11px] text-slate-400">Flow 6</span>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-700">ผู้ยื่นคำขอ: {currentUser?.name}</p>
                <p className="text-slate-500">รหัส: {currentUser?.employeeId || "EMP-2569-001"} • {currentUser?.department}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  วันที่ปฏิบัติงานที่ต้องการแก้ไข
                </label>
                <input
                  type="date"
                  required
                  value={modalTargetDate}
                  onChange={(e) => setModalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เวลาเข้างานที่ถูกต้อง
                  </label>
                  <input
                    type="time"
                    required
                    value={modalRequestedIn}
                    onChange={(e) => setModalRequestedIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เวลาออกงานที่ถูกต้อง
                  </label>
                  <input
                    type="time"
                    required
                    value={modalRequestedOut}
                    onChange={(e) => setModalRequestedOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  เหตุผลและความจำเป็น <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ระบุเหตุผล เช่น ติดราชการเร่งด่วนนอกสถานที่ / ระบบเครือข่ายขัดข้อง / ลืมสแกนเวลา..."
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ลิงก์เอกสารหลักฐานอ้างอิง (ถ้ามี)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={modalEvidenceUrl}
                  onChange={(e) => setModalEvidenceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  {submittingModal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>ส่งคำขอให้ผู้บังคับบัญชา</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

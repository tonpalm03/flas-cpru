"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  ShieldCheck, 
  FileEdit, 
  UserCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { AttendanceSession, AttendanceCorrection, EmployeeRecord, LeaveRequest } from "@/lib/types";
import { 
  getAllAttendanceSessions, 
  getAttendanceCorrections, 
  reviewAttendanceCorrection, 
  getEmployees,
  getHRLeaves 
} from "@/lib/firebaseService";

export default function HRAttendanceReviewPage() {
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<"daily" | "corrections">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrection | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSessions, allCorrections, allEmps, allLeaves] = await Promise.all([
        getAllAttendanceSessions(selectedDate, selectedDept),
        getAttendanceCorrections("all", selectedDept),
        getEmployees(),
        getHRLeaves()
      ]);
      setSessions(allSessions);
      setCorrections(allCorrections);
      setEmployees(allEmps);
      setLeaves(allLeaves);
    } catch (e) {
      console.error("Error loading HR attendance:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedDept]);

  const handleOpenReview = (corr: AttendanceCorrection, decision: "approved" | "rejected") => {
    // Self-approval guard check
    if (currentUser && currentUser.id === corr.userId) {
      setErrorMessage("ไม่อนุญาตให้อนุมัติหรือตรวจรับรองคำขอแก้ไขเวลาของตนเอง");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setSelectedCorrection(corr);
    setReviewDecision(decision);
    setReviewComment(decision === "approved" ? "อนุมัติการแก้ไขเวลาตามเหตุผลที่แจ้ง" : "ไม่อนุมัติเนื่องจากข้อมูลไม่ครบถ้วน");
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCorrection || !currentUser) return;

    setSubmittingReview(true);
    setErrorMessage(null);
    try {
      await reviewAttendanceCorrection(
        selectedCorrection.id,
        reviewDecision,
        reviewComment,
        currentUser
      );
      setSuccessMessage(`ดำเนินการ${reviewDecision === "approved" ? "อนุมัติ" : "ไม่อนุมัติ"}คำขอแก้ไขเวลาเรียบร้อยแล้ว`);
      setSelectedCorrection(null);
      loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการตรวจรับรอง");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Compile daily staff monitoring list
  const eligibleStaff = employees.filter(e => e.attendanceEligible && e.status === "active");
  const filteredStaff = selectedDept === "all" ? eligibleStaff : eligibleStaff.filter(e => e.department === selectedDept);

  const dailyRoster = filteredStaff.map(emp => {
    const sess = sessions.find(s => s.employeeId === emp.id && s.workDate === selectedDate);
    const leave = leaves.find(l => 
      l.staffName === emp.officialName && 
      l.status === "approved" &&
      l.startDate <= selectedDate && 
      l.endDate >= selectedDate
    );

    let calculatedStatus: "on_time" | "late" | "leave" | "incomplete" | "absent" | "working" = "absent";
    if (leave) {
      calculatedStatus = "leave";
    } else if (sess) {
      if (sess.sessionStatus === "closed") {
        calculatedStatus = sess.checkInStatus === "late" ? "late" : "on_time";
      } else if (sess.sessionStatus === "open") {
        calculatedStatus = "working";
      } else {
        calculatedStatus = "incomplete";
      }
    }

    return {
      employee: emp,
      session: sess,
      leave,
      status: calculatedStatus
    };
  });

  const pendingCorrections = corrections.filter(c => c.status === "pending");

  // Summary counts
  const presentCount = dailyRoster.filter(r => r.session?.checkInTime).length;
  const lateCount = dailyRoster.filter(r => r.session?.checkInStatus === "late").length;
  const leaveCount = dailyRoster.filter(r => r.status === "leave").length;
  const absentCount = dailyRoster.filter(r => r.status === "absent").length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
              Flow 6 : HR Attendance Review
            </span>
            <span className="text-xs text-slate-400">งานบริหารงานบุคคล คณะศิลปศาสตร์และวิทยาศาสตร์</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ตรวจรับรองเวลาปฏิบัติงานและคำขอแก้ไข (HR & Supervisor Review)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามสถานะการลงเวลารายวันของบุคลากรทั้งคณะ และตรวจอนุมัติคำขอแก้ไขเวลาย้อนหลัง
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/hr/attendance/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 shadow-sm"
          >
            <CalendarDays className="w-4 h-4" />
            <span>สรุปรายเดือน & ปิดงวด</span>
          </Link>
        </div>
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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">บุคลากรที่ต้องลงเวลา</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {filteredStaff.length} <span className="text-xs font-normal text-slate-500">คน</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">มาปฏิบัติงานแล้ว</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {presentCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">มาสาย</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">
            {lateCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">ลาที่อนุมัติ (e-Leave)</span>
          <span className="text-2xl font-bold text-blue-800 mt-1 block">
            {leaveCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-semibold block">คำขอแก้ไขที่รอตรวจ</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {pendingCorrections.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
          </span>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "daily"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>สถานะรายวันทั้งคณะ</span>
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
            <span>คิวตรวจคำขอแก้ไข ({pendingCorrections.length})</span>
          </button>
        </div>

        {activeTab === "daily" && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">วันที่:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">สาขา/หน่วยงาน:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900 max-w-[180px] truncate"
              >
                <option value="all">ทุกหน่วยงาน</option>
                <option value="สำนักงานคณบดี">สำนักงานคณบดี</option>
                <option value="สาขาวิชารัฐประศาสนศาสตร์">สาขาวิชารัฐประศาสนศาสตร์</option>
                <option value="สาขาวิชาวิทยาการคอมพิวเตอร์">สาขาวิชาวิทยาการคอมพิวเตอร์</option>
                <option value="สาขาวิชาภาษาอังกฤษเพื่อการสื่อสาร">สาขาวิชาภาษาอังกฤษฯ</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Daily Attendance Table */}
      {activeTab === "daily" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">รหัส / ชื่อบุคลากร</th>
                <th className="py-3 px-4">หน่วยงาน / ตำแหน่ง</th>
                <th className="py-3 px-4">เวลาเข้า</th>
                <th className="py-3 px-4">เวลาออก</th>
                <th className="py-3 px-4">ชม. ทำงาน</th>
                <th className="py-3 px-4">สถานะการลงเวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลบุคลากรในหน่วยงานที่เลือก
                  </td>
                </tr>
              ) : (
                dailyRoster.map((item) => (
                  <tr key={item.employee.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.employee.officialName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{item.employee.id}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="truncate max-w-[200px]">{item.employee.department}</p>
                      <p className="text-[10px] text-slate-400">{item.employee.position}</p>
                    </td>
                    <td className="py-3 px-4">
                      {item.session?.checkInTime ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900">{item.session.checkInTime} น.</span>
                          {item.session.checkInStatus === "late" && (
                            <span className="text-[10px] font-bold text-rose-600 px-1 py-0.2 rounded bg-rose-50 border border-rose-200">
                              สาย {item.session.lateMinutes} น.
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.session?.checkOutTime ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900">{item.session.checkOutTime} น.</span>
                          {item.session.checkOutStatus === "early_leave" && (
                            <span className="text-[10px] font-bold text-amber-700 px-1 py-0.2 rounded bg-amber-50 border border-amber-200">
                              ออกก่อน {item.session.earlyMinutes} น.
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {item.session?.totalWorkMinutes ? `${(item.session.totalWorkMinutes / 60).toFixed(1)} ชม.` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "leave" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          ลาที่อนุมัติ ({item.leave?.leaveType === "vacation" ? "พักผ่อน" : item.leave?.leaveType === "sick" ? "ป่วย" : "กิจ"})
                        </span>
                      )}
                      {item.status === "on_time" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ตรงเวลา
                        </span>
                      )}
                      {item.status === "late" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          มาสาย
                        </span>
                      )}
                      {item.status === "working" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          กำลังปฏิบัติงาน
                        </span>
                      )}
                      {item.status === "incomplete" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          ไม่สมบูรณ์ (ค้างออก)
                        </span>
                      )}
                      {item.status === "absent" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          ยังไม่ลงเวลา
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Corrections Review Queue Table */}
      {activeTab === "corrections" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">บุคลากร / หน่วยงาน</th>
                <th className="py-3 px-4">วันที่ปฏิบัติงาน</th>
                <th className="py-3 px-4">เวลาเดิม</th>
                <th className="py-3 px-4">เวลาที่ขอแก้ไข</th>
                <th className="py-3 px-4">เหตุผลความจำเป็น</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การตรวจรับรอง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corrections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่มีรายการคำขอแก้ไขเวลาย้อนหลัง
                  </td>
                </tr>
              ) : (
                corrections.map((corr) => {
                  const isSelf = currentUser && currentUser.id === corr.userId;
                  return (
                    <tr key={corr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{corr.staffName}</p>
                        <p className="text-[10px] text-slate-500">{corr.department} • <span className="font-mono">{corr.employeeId}</span></p>
                      </td>
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
                        <p className="line-clamp-2">{corr.reason}</p>
                        {corr.evidenceUrl && (
                          <a
                            href={corr.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-900 font-semibold hover:underline mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>ดูหลักฐานแนบ</span>
                          </a>
                        )}
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
                      <td className="py-3 px-4 text-right">
                        {corr.status === "pending" ? (
                          isSelf ? (
                            <span className="text-[10px] text-slate-400 italic">
                              คำขอของตนเอง
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenReview(corr, "approved")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] border border-emerald-200"
                              >
                                อนุมัติ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(corr, "rejected")}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 font-semibold text-[11px] border border-rose-200"
                              >
                                ไม่อนุมัติ
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            ตรวจโดย: {corr.reviewerName || "ผู้บังคับบัญชา"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Decision Modal */}
      {selectedCorrection && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {reviewDecision === "approved" ? "อนุมัติการแก้ไขเวลา" : "ปฏิเสธ / ไม่อนุมัติคำขอ"}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedCorrection.workDate}
              </span>
            </div>

            <form onSubmit={handleConfirmReview} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-900">{selectedCorrection.staffName}</p>
                <p className="text-slate-600">เวลาเดิม: {selectedCorrection.originalCheckIn || "-"} – {selectedCorrection.originalCheckOut || "-"}</p>
                <p className="text-blue-900 font-bold">เวลาที่ขอแก้ไข: {selectedCorrection.requestedCheckIn} – {selectedCorrection.requestedCheckOut}</p>
                <p className="text-slate-500 text-[11px] mt-1">เหตุผล: {selectedCorrection.reason}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ข้อคิดเห็น / บันทึกการตรวจรับรอง
                </label>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCorrection(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-4 py-2 rounded-lg text-white font-semibold shadow-sm ${
                    reviewDecision === "approved"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-rose-700 hover:bg-rose-800"
                  }`}
                >
                  {submittingReview ? "กำลังบันทึก..." : reviewDecision === "approved" ? "ยืนยันอนุมัติ" : "ยืนยันไม่อนุมัติ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

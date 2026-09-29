"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  History, 
  ShieldCheck, 
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Fingerprint,
  Building2,
  RefreshCw
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { AttendanceSession, WorkPolicy } from "@/lib/types";
import { 
  getTodayAttendanceSession, 
  recordAttendanceCheckIn, 
  recordAttendanceCheckOut, 
  getWorkPolicy,
  getMyAttendanceSessions
} from "@/lib/firebaseService";

export default function AttendancePage() {
  const { currentUser } = useRole();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [policy, setPolicy] = useState<WorkPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [hasIncompleteYesterday, setHasIncompleteYesterday] = useState(false);

  // Live Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Session & Policy
  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const empId = currentUser.employeeId || currentUser.id;
      const [todaySession, activePolicy, allMySessions] = await Promise.all([
        getTodayAttendanceSession(empId),
        getWorkPolicy(),
        getMyAttendanceSessions(empId)
      ]);
      setSession(todaySession);
      setPolicy(activePolicy);

      // Check if yesterday or previous session was incomplete
      const incomplete = allMySessions.some(s => s.sessionStatus === "incomplete");
      setHasIncompleteYesterday(incomplete);
    } catch (err) {
      console.error("Error loading attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Fetch Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          console.warn("Geolocation warning:", err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handleCheckIn = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const empId = currentUser.employeeId || currentUser.id;
      const res = await recordAttendanceCheckIn({
        employeeId: empId,
        userId: currentUser.id,
        staffName: currentUser.name,
        department: currentUser.department,
        source: coords ? "gps" : "web",
        locationCoords: coords ? { latitude: coords.lat, longitude: coords.lng, accuracy: coords.accuracy } : undefined,
        locationName: "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ",
        requestId: `req-in-${empId}-${Date.now()}`
      }, currentUser);

      setSession(res);
      setFeedback({
        type: res.checkInStatus === "late" ? "warning" : "success",
        message: res.checkInStatus === "late" 
          ? `บันทึกเวลาเข้างานสำเร็จ (${res.checkInTime} น.) - มีบันทึกสาย ${res.lateMinutes} นาที`
          : `บันทึกเวลาเข้างานสำเร็จ (${res.checkInTime} น.) - ตรงเวลา`
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "ไม่สามารถลงเวลาเข้างานได้" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser || !session) return;

    // Check early leave warning
    if (currentTime && policy) {
      const defaultShift = policy.shifts[0];
      const [endH, endM] = defaultShift.endTime.split(":").map(Number);
      const currentH = currentTime.getHours();
      const currentM = currentTime.getMinutes();
      if (currentH < endH || (currentH === endH && currentM < endM)) {
        if (!confirm(`ขณะนี้ยังไม่ถึงเวลาเลิกงาน (${defaultShift.endTime} น.)\nยืนยันลงเวลาออกก่อนกำหนด (Early Leave) หรือไม่?`)) {
          return;
        }
      }
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const empId = currentUser.employeeId || currentUser.id;
      const res = await recordAttendanceCheckOut({
        employeeId: empId,
        userId: currentUser.id,
        source: coords ? "gps" : "web",
        locationCoords: coords ? { latitude: coords.lat, longitude: coords.lng, accuracy: coords.accuracy } : undefined,
        locationName: "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ",
        requestId: `req-out-${empId}-${Date.now()}`
      }, currentUser);

      setSession(res);
      setFeedback({
        type: res.checkOutStatus === "early_leave" ? "warning" : "success",
        message: res.checkOutStatus === "early_leave"
          ? `บันทึกเวลาออกงานสำเร็จ (${res.checkOutTime} น.) - ออกก่อนเวลา ${res.earlyMinutes} นาที รวมปฏิบัติงาน ${(res.totalWorkMinutes / 60).toFixed(1)} ชม.`
          : `บันทึกเวลาออกงานสำเร็จ (${res.checkOutTime} น.) รวมปฏิบัติงาน ${(res.totalWorkMinutes / 60).toFixed(1)} ชม.`
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "ไม่สามารถลงเวลาออกงานได้" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatThaiDate = (date: Date) => {
    const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const d = days[date.getDay()];
    const m = months[date.getMonth()];
    const y = date.getFullYear() + 543;
    return `${d}ที่ ${date.getDate()} ${m} พ.ศ. ${y}`;
  };

  const formatTimeString = (date: Date) => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const shiftInfo = policy?.shifts[0] || {
    name: "กะปกติ (Normal Shift)",
    startTime: "08:30",
    endTime: "16:30",
    lateGraceMinutes: 15
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
              Flow 5 : Attendance Console
            </span>
            <span className="text-xs text-slate-400">ระบบบันทึกเวลาปฏิบัติงานออนไลน์</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ลงเวลาปฏิบัติงาน (Time Attendance)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกเวลาเข้า-ออกงานประจำวัน อ้างอิงเวลาเซิร์ฟเวอร์มาตรฐานคณะศิลปศาสตร์และวิทยาศาสตร์
          </p>
        </div>

        <Link
          href="/attendance/history"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
        >
          <History className="w-4 h-4 text-blue-900" />
          <span>ประวัติการลงเวลาและขอแก้ไข</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Incomplete Warning Alert */}
      {hasIncompleteYesterday && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">แจ้งเตือน: มีรายการลงเวลาที่ยังไม่สมบูรณ์ (ลืมลงเวลาออกงาน)</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              คุณมีรายการวันที่ผ่านมาที่ไม่ได้ลงเวลาออกงาน กรุณายื่นคำขอแก้ไขเวลาย้อนหลังเพื่อให้เจ้าหน้าที่ตรวจสอบ
            </p>
          </div>
          <Link
            href="/attendance/history"
            className="px-3 py-1.5 rounded-lg bg-amber-200 text-amber-900 font-semibold text-[11px] hover:bg-amber-300"
          >
            ยื่นขอแก้ไข
          </Link>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs animate-in fade-in ${
          feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
          feedback.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
          "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> :
           feedback.type === "warning" ? <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /> :
           <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Console Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        {/* Live Clock Section */}
        <div className="text-center space-y-2 py-4 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-900" />
            <span>{currentTime ? formatThaiDate(currentTime) : "กำลังโหลดปฏิทิน..."}</span>
          </div>

          <div className="font-mono text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            {currentTime ? formatTimeString(currentTime) : "--:--:--"}
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            เวลามาตรฐานประเทศไทย (Asia/Bangkok • GMT+7)
          </p>
        </div>

        {/* User & Shift Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>ข้อมูลบุคลากรผู้ปฏิบัติงาน</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{currentUser?.name}</p>
              <p className="text-slate-600">รหัสบุคลากร: <span className="font-mono font-semibold">{currentUser?.employeeId || "EMP-2569-001"}</span></p>
              <p className="text-slate-500">{currentUser?.department} • {currentUser?.roleTitle}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <Clock className="w-4 h-4 text-blue-900" />
              <span>กะปฏิบัติงานวันนี้ ({shiftInfo.name})</span>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-950">
                {shiftInfo.startTime} น. – {shiftInfo.endTime} น.
              </p>
              <p className="text-blue-800 text-[11px]">
                ผ่อนผันเวลาสาย: {shiftInfo.lateGraceMinutes} นาที (ถือว่าสายหลัง 08:45 น.)
              </p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                เกณฑ์เวลาเลิกงานปกติ: 16:30 น.
              </p>
            </div>
          </div>
        </div>

        {/* Status & Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Check-In Button */}
            <button
              type="button"
              disabled={submitting || (session !== null && !!session.checkInTime)}
              onClick={handleCheckIn}
              className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${
                session?.checkInTime
                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-900 border-blue-950 text-white hover:bg-blue-800 hover:shadow-md cursor-pointer active:scale-98"
              }`}
            >
              <Fingerprint className="w-8 h-8" />
              <div className="text-center">
                <span className="font-bold text-base block">
                  {session?.checkInTime ? "บันทึกเข้างานแล้ว" : "ลงเวลาเข้างาน (Check In)"}
                </span>
                <span className="text-[11px] opacity-80">
                  {session?.checkInTime ? `เวลา ${session.checkInTime} น.` : "เริ่มปฏิบัติงานประจำวัน"}
                </span>
              </div>
            </button>

            {/* Check-Out Button */}
            <button
              type="button"
              disabled={submitting || !session?.checkInTime || (session !== null && !!session.checkOutTime)}
              onClick={handleCheckOut}
              className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${
                !session?.checkInTime
                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : session?.checkOutTime
                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 border-slate-950 text-white hover:bg-slate-800 hover:shadow-md cursor-pointer active:scale-98"
              }`}
            >
              <CheckCircle2 className="w-8 h-8" />
              <div className="text-center">
                <span className="font-bold text-base block">
                  {session?.checkOutTime ? "บันทึกออกงานแล้ว" : "ลงเวลาออกงาน (Check Out)"}
                </span>
                <span className="text-[11px] opacity-80">
                  {session?.checkOutTime ? `เวลา ${session.checkOutTime} น.` : "สิ้นสุดการปฏิบัติงาน"}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Today's Timeline / Status Card */}
        {session && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>สรุปสถานะการลงเวลาวันนี้</span>
              <span className="font-mono text-[11px] text-slate-400">{session.workDate}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">เวลาเข้างาน</span>
                <span className="text-sm font-bold text-slate-900">
                  {session.checkInTime ? `${session.checkInTime} น.` : "-"}
                </span>
                {session.checkInStatus === "late" && (
                  <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                    สาย {session.lateMinutes} นาที
                  </span>
                )}
                {session.checkInStatus === "on_time" && (
                  <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                    ตรงเวลา
                  </span>
                )}
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">เวลาออกงาน</span>
                <span className="text-sm font-bold text-slate-900">
                  {session.checkOutTime ? `${session.checkOutTime} น.` : "-"}
                </span>
                {session.checkOutStatus === "early_leave" && (
                  <span className="text-[10px] font-bold text-amber-600 block mt-0.5">
                    ออกก่อน {session.earlyMinutes} นาที
                  </span>
                )}
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">ชั่วโมงปฏิบัติงาน</span>
                <span className="text-sm font-bold text-slate-900">
                  {session.totalWorkMinutes > 0 ? `${(session.totalWorkMinutes / 60).toFixed(1)} ชม.` : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">สถานะเซสชัน</span>
                <span className={`text-xs font-bold ${
                  session.sessionStatus === "closed" ? "text-emerald-700" :
                  session.sessionStatus === "open" ? "text-blue-800" : "text-amber-700"
                }`}>
                  {session.sessionStatus === "closed" ? "เสร็จสิ้น" :
                   session.sessionStatus === "open" ? "กำลังปฏิบัติงาน" : "ไม่สมบูรณ์"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* GPS Location & Security Badge */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-900" />
            <span>
              {coords
                ? `พิกัด GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (ความแม่นยำ ~${Math.round(coords.accuracy || 0)} ม.)`
                : "ระบุตำแหน่งผ่านเครือข่ายอินทราเน็ตคณะ (Web Mode)"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ระบบตรวจสอบความถูกต้องและป้องกันกดซ้ำ (Idempotency Safe)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

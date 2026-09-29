"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  MapPin, 
  CalendarDays, 
  ShieldCheck, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Settings2,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { WorkPolicy, WorkShift, PublicHoliday } from "@/lib/types";
import { 
  getWorkPolicy, 
  saveWorkPolicy, 
  getPublicHolidays, 
  createPublicHoliday, 
  deletePublicHoliday 
} from "@/lib/firebaseService";

export default function WorkSchedulesPage() {
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<"shifts" | "gps" | "holidays">("shifts");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Policy State
  const [policy, setPolicy] = useState<WorkPolicy | null>(null);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);

  // Holiday Modal State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        getWorkPolicy(),
        getPublicHolidays(2569)
      ]);
      setPolicy(p);
      setHolidays(h);
    } catch (e) {
      console.error("Error fetching work schedule policy:", e);
      setErrorMessage("ไม่สามารถโหลดข้อมูลตารางงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShiftChange = (index: number, field: keyof WorkShift, value: any) => {
    if (!policy) return;
    const updatedShifts = [...policy.shifts];
    updatedShifts[index] = { ...updatedShifts[index], [field]: value };
    setPolicy({ ...policy, shifts: updatedShifts });
  };

  const handleAddShift = () => {
    if (!policy) return;
    const newShift: WorkShift = {
      id: `SHIFT-EXTRA-${Date.now()}`,
      name: "กะปฏิบัติงานเพิ่มเติม",
      code: "SHIFT-CUSTOM",
      startTime: "08:30",
      endTime: "16:30",
      lateGraceMinutes: 15,
      earlyLeaveThreshold: "16:00",
      halfDayThreshold: "12:00",
      isOvernight: false,
      isDefault: false
    };
    setPolicy({ ...policy, shifts: [...policy.shifts, newShift] });
  };

  const handleRemoveShift = (index: number) => {
    if (!policy || policy.shifts.length <= 1) {
      setErrorMessage("ต้องมีกะปฏิบัติงานอย่างน้อย 1 กะ");
      return;
    }
    const updatedShifts = policy.shifts.filter((_, i) => i !== index);
    setPolicy({ ...policy, shifts: updatedShifts });
  };

  const handleSavePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await saveWorkPolicy(policy, currentUser);
      setSuccessMessage("บันทึกนโยบายและตารางเวลาปฏิบัติงานเรียบร้อยแล้ว");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;

    try {
      const created = await createPublicHoliday({
        date: newHolidayDate,
        name: newHolidayName,
        year: 2569,
        isOfficial: true
      }, currentUser);
      setHolidays(prev => [...prev, created]);
      setNewHolidayDate("");
      setNewHolidayName("");
      setShowHolidayModal(false);
      setSuccessMessage("เพิ่มวันหยุดนักขัตฤกษ์เรียบร้อยแล้ว");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage("ไม่สามารถเพิ่มวันหยุดได้");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("ยืนยันการลบวันหยุดนี้ออกจากปฏิทินคณะ?")) return;
    try {
      await deletePublicHoliday(id, currentUser);
      setHolidays(prev => prev.filter(h => h.id !== id));
      setSuccessMessage("ลบวันหยุดเรียบร้อยแล้ว");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage("เกิดข้อผิดพลาดในการลบวันหยุด");
    }
  };

  if (loading || !policy) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">กำลังโหลดข้อมูลตารางงานและนโยบาย...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
              Flow 4 : Work Shifts & Policy
            </span>
            <span className="text-xs text-slate-400">ปีงบประมาณ พ.ศ. 2569</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ตั้งค่าตารางงานและนโยบายลงเวลา (Work Schedules & Policy)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดกะเวลาปฏิบัติงาน เวลาผ่อนผันสาย รัศมีพิกัด GPS ประจำคณะ และปฏิทินวันหยุดราชการ 2569
          </p>
        </div>

        <button
          type="button"
          onClick={handleSavePolicy}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>บันทึกการเปลี่ยนแปลง</span>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("shifts")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "shifts"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>กะและเวลาทำงาน ({policy.shifts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gps")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "gps"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>พิกัด GPS & ช่องทางลงเวลา</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("holidays")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "holidays"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>วันหยุดราชการ 2569 ({holidays.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "shifts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">กำหนดกะเวลาปฏิบัติงาน (Work Shifts)</h2>
              <p className="text-xs text-slate-500">
                เวลาราชการปกติ 08.30 - 16.30 น. (ผ่อนผันสายได้ 15 นาที หากเกินถือว่าสาย)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddShift}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-blue-900" />
              <span>เพิ่มกะเวลา</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policy.shifts.map((shift, idx) => (
              <div
                key={shift.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-900" />
                    <input
                      type="text"
                      value={shift.name}
                      onChange={(e) => handleShiftChange(idx, "name", e.target.value)}
                      className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-900 focus:outline-none px-1 py-0.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {shift.isDefault ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                        กะหลัก
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveShift(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="ลบกะ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      เวลาเริ่มงาน (เข้างาน)
                    </label>
                    <input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) => handleShiftChange(idx, "startTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      เวลาเลิกงาน (ออกงาน)
                    </label>
                    <input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) => handleShiftChange(idx, "endTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      เวลาผ่อนผัน (นาที)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={shift.lateGraceMinutes}
                      onChange={(e) => handleShiftChange(idx, "lateGraceMinutes", parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      เกณฑ์ออกก่อนเวลา
                    </label>
                    <input
                      type="time"
                      value={shift.earlyLeaveThreshold}
                      onChange={(e) => handleShiftChange(idx, "earlyLeaveThreshold", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      เกณฑ์ครึ่งวัน
                    </label>
                    <input
                      type="time"
                      value={shift.halfDayThreshold}
                      onChange={(e) => handleShiftChange(idx, "halfDayThreshold", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px]">{shift.code}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shift.isOvernight}
                      onChange={(e) => handleShiftChange(idx, "isOvernight", e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <span className="text-[11px]">กะข้ามคืน</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "gps" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">กำหนดพิกัด GPS ประจำคณะ (CPRU Campus Boundary)</h2>
              <p className="text-xs text-slate-500">
                ระบบจะตรวจสอบพิกัดตำแหน่งของบุคลากรขณะกดลงเวลาเพื่อป้องกันการลงเวลานอกพื้นที่
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ละติจูด (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={policy.gpsCenterLat || 15.8083}
                  onChange={(e) => setPolicy({ ...policy, gpsCenterLat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ลองจิจูด (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={policy.gpsCenterLng || 102.0315}
                  onChange={(e) => setPolicy({ ...policy, gpsCenterLng: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  รัศมีที่อนุญาต (เมตร)
                </label>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  value={policy.gpsRadiusMeters || 500}
                  onChange={(e) => setPolicy({ ...policy, gpsRadiusMeters: parseInt(e.target.value) || 500 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-900" />
                <span>พิกัดปัจจุบัน: มหาวิทยาลัยราชภัฏชัยภูมิ (CPRU) คณะศิลปศาสตร์และวิทยาศาสตร์</span>
              </div>
              <span className="font-semibold text-blue-900">รัศมี 500 เมตร</span>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-2">ช่องทางที่อนุญาตให้ลงเวลา</h3>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.locationModes?.includes("web")}
                    onChange={(e) => {
                      const modes = policy.locationModes || ["web"];
                      const updated = e.target.checked ? [...modes, "web"] : modes.filter(m => m !== "web");
                      setPolicy({ ...policy, locationModes: updated as any });
                    }}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span>เว็บเบราว์เซอร์ภายในคณะ (Web)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.locationModes?.includes("gps")}
                    onChange={(e) => {
                      const modes = policy.locationModes || ["web"];
                      const updated = e.target.checked ? [...modes, "gps"] : modes.filter(m => m !== "gps");
                      setPolicy({ ...policy, locationModes: updated as any });
                    }}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span>ตรวจสอบพิกัด GPS อัตโนมัติ (Mobile / Onsite)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.locationModes?.includes("qr")}
                    onChange={(e) => {
                      const modes = policy.locationModes || ["web"];
                      const updated = e.target.checked ? [...modes, "qr"] : modes.filter(m => m !== "qr");
                      setPolicy({ ...policy, locationModes: updated as any });
                    }}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span>สแกน QR Code ประจำจุดอาคารคณะ (Dynamic QR)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "holidays" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">ปฏิทินวันหยุดราชการและวันหยุดคณะ (พ.ศ. 2569)</h2>
              <p className="text-xs text-slate-500">
                วันหยุดเหล่านี้จะไม่ถูกนับเป็นวันขาดงานในการประมวลผลเวลารายเดือน
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHolidayModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มวันหยุด</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">ชื่อวันหยุด / เทศกาล</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      ยังไม่มีรายการวันหยุดสำหรับปี 2569
                    </td>
                  </tr>
                ) : (
                  holidays.sort((a, b) => a.date.localeCompare(b.date)).map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {h.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {h.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          วันหยุดราชการ
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900">เพิ่มวันหยุดราชการ / วันหยุดคณะ</h3>
            <form onSubmit={handleAddHoliday} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  วันที่ (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ชื่อวันหยุด
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วันนวมินทรมหาราช, วันสงกรานต์"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800"
                >
                  บันทึกวันหยุด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

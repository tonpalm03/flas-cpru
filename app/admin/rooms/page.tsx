"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Users, 
  Building, 
  CheckCircle2, 
  X, 
  Car, 
  MapPin, 
  UserCheck, 
  AlertCircle,
  FileText,
  Ban,
  Check,
  ArrowLeft,
  Calendar
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getRoomBookings, 
  createRoomBooking, 
  updateRoomBookingStatus 
} from "@/lib/firebaseService";
import { RoomBooking } from "@/lib/types";

const FACILITY_OPTIONS = [
  { id: "room_siri", name: "ห้องประชุมสิริวิชาญ (อาคาร 4 ชั้น 2)", type: "room", capacity: 40, features: "Smart Screen, ไมค์ประชุม, ระบบเสียง" },
  { id: "room_smart421", name: "ห้อง Smart Classroom 421 (อาคาร 4 ชั้น 2)", type: "room", capacity: 60, features: "Smart Board, จอโปรเจกเตอร์คู่, Wi-Fi 6" },
  { id: "room_lab432", name: "ห้องปฏิบัติการคอมพิวเตอร์ 432 (อาคาร 4 ชั้น 3)", type: "room", capacity: 50, features: "PC 50 เครื่อง, เครื่องปรับอากาศ" },
  { id: "veh_van", name: "รถตู้คณะ (นข 1234 ชัยภูมิ)", type: "vehicle", capacity: 12, features: "พนักงานขับรถประจำคณะ, กล้องหน้ารถ" },
  { id: "veh_pickup", name: "รถกระบะสี่ประตูคณะ (กข 5678 ชัยภูมิ)", type: "vehicle", capacity: 5, features: "สำหรับขนส่งอุปกรณ์/บริการวิชาการ" }
];

export default function RoomBookingPage() {
  const { currentUser, isAdmin, isDean } = useRole();
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<"all" | "room" | "vehicle">("all");
  const [filterDate, setFilterDate] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Form states for reservation
  const [formData, setFormData] = useState({
    roomName: FACILITY_OPTIONS[0].name,
    capacity: FACILITY_OPTIONS[0].capacity,
    vehicleType: "none" as "none" | "van" | "pickup",
    bookedBy: currentUser?.name || "อาจารย์ประจำคณะ",
    department: currentUser?.department || "สาขาวิชารัฐศาสตร์",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "12:00",
    purpose: "",
    driverName: "นายสมเกียรติ สารพัดช่าง (พนักงานขับรถ)",
    destination: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    passengerCount: 10,
    travelMemoNumber: ""
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRoomBookings();
      setBookings(data.sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()));
    } catch (err: any) {
      console.error("Error loading bookings:", err);
      setError("ไม่สามารถโหลดรายการจองห้องและยานพาหนะได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleFacilityChange = (facilityName: string) => {
    const selected = FACILITY_OPTIONS.find(f => f.name === facilityName);
    if (selected) {
      setFormData({
        ...formData,
        roomName: selected.name,
        capacity: selected.capacity,
        vehicleType: selected.type === "vehicle" ? (selected.id === "veh_van" ? "van" : "pickup") : "none"
      });
    }
  };

  const checkConflict = (date: string, startTime: string, endTime: string, facilityName: string, excludeId?: string) => {
    return bookings.some(b => {
      if (excludeId && b.id === excludeId) return false;
      if (b.status === "rejected" || b.status === "cancelled") return false;
      if (b.date !== date) return false;
      if (b.roomName !== facilityName) return false;

      // Check overlap: (StartA < EndB) and (EndA > StartB)
      return startTime < b.endTime && endTime > b.startTime;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    if (formData.startTime >= formData.endTime) {
      alert("เวลาเริ่มต้นต้องเกิดขึ้นก่อนเวลาสิ้นสุด");
      return;
    }

    if (!formData.purpose) {
      alert("กรุณาระบุวัตถุประสงค์การใช้งาน");
      return;
    }

    // Check conflict
    const hasConflict = checkConflict(formData.date, formData.startTime, formData.endTime, formData.roomName);
    if (hasConflict) {
      setConflictWarning(`มีรายการจอง ${formData.roomName} ในช่วงเวลาดังกล่าวอยู่แล้ว โปรดเลือกช่วงเวลาหรือห้องอื่น`);
      return;
    }

    try {
      setSubmitting(true);
      const created = await createRoomBooking({
        roomName: formData.roomName,
        capacity: formData.capacity,
        vehicleType: formData.vehicleType,
        bookedBy: formData.bookedBy,
        bookedById: currentUser?.id,
        department: formData.department,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        driverName: formData.vehicleType !== "none" ? formData.driverName : undefined,
        destination: formData.vehicleType !== "none" ? formData.destination : undefined,
        passengerCount: formData.vehicleType !== "none" ? formData.passengerCount : undefined,
        travelMemoNumber: formData.travelMemoNumber || undefined,
        status: "approved"
      }, currentUser);

      setBookings([created, ...bookings]);
      setShowAddModal(false);

      // Reset form
      setFormData({
        roomName: FACILITY_OPTIONS[0].name,
        capacity: FACILITY_OPTIONS[0].capacity,
        vehicleType: "none",
        bookedBy: currentUser?.name || "อาจารย์ประจำคณะ",
        department: currentUser?.department || "สาขาวิชารัฐศาสตร์",
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "12:00",
        purpose: "",
        driverName: "นายสมเกียรติ สารพัดช่าง (พนักงานขับรถ)",
        destination: "คณะศิลปศาสตร์และวิทยาศาสตร์",
        passengerCount: 10,
        travelMemoNumber: ""
      });
    } catch (err: any) {
      console.error("Failed to create booking:", err);
      alert("เกิดข้อผิดพลาดในการจอง: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: RoomBooking["status"]) => {
    try {
      await updateRoomBookingStatus(id, status, currentUser);
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    } catch (err: any) {
      alert("ไม่สามารถเปลี่ยนสถานะการจองได้: " + err.message);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const isVehicle = b.roomName.includes("รถ");
    const matchesType = 
      filterType === "all" ? true :
      filterType === "room" ? !isVehicle : isVehicle;
    
    const matchesDate = !filterDate || b.date === filterDate;

    return matchesType && matchesDate;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            จองห้องประชุมและยานพาหนะคณะ (Facilities Reservation)
          </h1>
          <p className="text-xs text-slate-500">
            ระบบจองห้องประชุมสิริวิชาญ, Smart Classroom และรถตู้คณะ พร้อมระบบตรวจเวลาทับซ้อนอัตโนมัติ
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setConflictWarning(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>จองห้อง / ขอใช้รถใหม่</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Facilities Resource Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> ห้องประชุมหลัก
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              พร้อมใช้งาน
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-2">ห้องประชุมสิริวิชาญ</h3>
          <p className="text-xs text-slate-500">อาคาร 4 ชั้น 2 • ความจุ 40 ที่นั่ง</p>
          <p className="text-[11px] text-slate-400 mt-1">Smart Screen, ไมค์ประชุม, ไมค์ลอย, ระบบเสียง</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> ห้องอบรมเชิงปฏิบัติการ
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              พร้อมใช้งาน
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-2">Smart Classroom 421</h3>
          <p className="text-xs text-slate-500">อาคาร 4 ชั้น 2 • ความจุ 60 ที่นั่ง</p>
          <p className="text-[11px] text-slate-400 mt-1">Smart Board, โปรเจกเตอร์คู่, ปลั๊กไฟประจำโต๊ะ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> ยานพาหนะส่วนกลาง
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              พร้อมเดินทาง
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-2">รถตู้คณะ (นข 1234 ชัยภูมิ)</h3>
          <p className="text-xs text-slate-500">ความจุ 12 ที่นั่ง • พนักงานขับรถประจำ</p>
          <p className="text-[11px] text-slate-400 mt-1">สำหรับเดินทางไปราชการ / บริการวิชาการชุมชน</p>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === "all" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ทั้งหมด ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("room")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === "room" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ห้องประชุม ({bookings.filter(b => !b.roomName.includes("รถ")).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("vehicle")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === "vehicle" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ยานพาหนะ ({bookings.filter(b => b.roomName.includes("รถ")).length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">กรองตามวันที่:</span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-blue-900"
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate("")}
              className="text-xs text-rose-600 hover:underline"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Main Reservation Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <Clock className="w-6 h-6 animate-spin text-blue-900" />
            <span>กำลังโหลดรายการจองห้องและรถจากฐานข้อมูล...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">ไม่มีรายการจองในช่วงที่เลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">เวลา</th>
                  <th className="py-3 px-4">ห้องประชุม / ยานพาหนะ</th>
                  <th className="py-3 px-4">วัตถุประสงค์ / เส้นทาง</th>
                  <th className="py-3 px-4">ผู้จอง / สังกัด</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {b.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-blue-900 font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{b.startTime} - {b.endTime}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{b.roomName}</div>
                      {b.driverName && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3 text-emerald-700" />
                          <span>คนขับ: {b.driverName}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800">{b.purpose}</div>
                      {b.destination && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-900" />
                          <span>จุดหมาย: {b.destination} ({b.passengerCount || 1} คน)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{b.bookedBy}</div>
                      <div className="text-[11px] text-slate-400">{b.department}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {b.status === "approved" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          อนุมัติแล้ว
                        </span>
                      )}
                      {b.status === "pending" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          รออนุมัติ
                        </span>
                      )}
                      {b.status === "cancelled" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          ยกเลิกการจอง
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {b.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, "cancelled")}
                            className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
                          >
                            ยกเลิก
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Reservation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">จองห้องประชุม / ยานพาหนะคณะ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictWarning && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลือกห้องประชุม หรือ ยานพาหนะ</label>
                <select
                  value={formData.roomName}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white font-medium text-slate-900"
                >
                  {FACILITY_OPTIONS.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name} ({f.features})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่ใช้งาน</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลาเริ่ม</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ผู้ขอจอง / ผู้รับผิดชอบ</label>
                  <input
                    type="text"
                    value={formData.bookedBy}
                    onChange={(e) => setFormData({ ...formData, bookedBy: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สังกัด / สาขาวิชา</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">วัตถุประสงค์การใช้งาน</label>
                <textarea
                  rows={2}
                  placeholder="เช่น จัดการประชุมโครงการ, จัดอบรมเชิงปฏิบัติการ, เดินทางไปบริการวิชาการ..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  required
                />
              </div>

              {/* Extra fields if Vehicle */}
              {formData.vehicleType !== "none" && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                  <p className="font-bold text-blue-900 text-xs flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" /> รายละเอียดการขอใช้ยานพาหนะ
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สถานที่ปลายทาง / เส้นทาง</label>
                      <input
                        type="text"
                        placeholder="เช่น ชุมชนบ้านเสี้ยวน้อย ต.ท่าหินโงม"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">จำนวนผู้โดยสาร (คน)</label>
                      <input
                        type="number"
                        value={formData.passengerCount}
                        onChange={(e) => setFormData({ ...formData, passengerCount: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">พนักงานขับรถประจำการ</label>
                      <input
                        type="text"
                        value={formData.driverName}
                        onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">เลขที่บันทึกขอไปราชการ (ถ้ามี)</label>
                      <input
                        type="text"
                        placeholder="เช่น อว 0643.04/ว 045"
                        value={formData.travelMemoNumber}
                        onChange={(e) => setFormData({ ...formData, travelMemoNumber: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "กำลังตรวจสอบและจอง..." : "ยืนยันการจอง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

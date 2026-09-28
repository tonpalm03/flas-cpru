"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Clock, Users, Building, CheckCircle2, X } from "lucide-react";
import { MOCK_ROOMS } from "@/lib/mockData";
import { RoomBooking } from "@/lib/types";

export default function RoomBookingPage() {
  const [bookings, setBookings] = useState<RoomBooking[]>(MOCK_ROOMS);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    roomName: "ห้องประชุมสิริวิชาญ (อาคาร 4 ชั้น 2)",
    capacity: 40,
    bookedBy: "นายสมเกียรติ วงศ์สารบรรณ",
    department: "งานธุรการและสารบรรณ",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "12:00",
    purpose: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setBookings([
      {
        id: `rm-${Date.now()}`,
        ...formData,
        status: "approved",
        createdAt: new Date().toISOString()
      },
      ...bookings
    ]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-800 hover:underline">
            ← กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            จองห้องประชุมและยานพาหนะ (Facilities Reservation)
          </h1>
          <p className="text-xs text-slate-500">
            ตรวจสอบตารางการใช้งานห้องประชุมคณะ และยานพาหนะสำหรับไปราชการ
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>จองห้องประชุมใหม่</span>
        </button>
      </div>

      {/* Available Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">ห้องประชุม 1</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              พร้อมใช้งาน
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-2">ห้องประชุมสิริวิชาญ</h3>
          <p className="text-xs text-slate-500">อาคาร 4 ชั้น 2 • ความจุ 40 ที่นั่ง</p>
          <p className="text-[11px] text-slate-400 mt-2">ระบบ Smart Screen, เครื่องเสียง, ไมค์ประชุม</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">ห้องประชุม 2</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              พร้อมใช้งาน
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-2">Smart Classroom 421</h3>
          <p className="text-xs text-slate-500">อาคาร 4 ชั้น 2 • ความจุ 60 ที่นั่ง</p>
          <p className="text-[11px] text-slate-400 mt-2">คอมพิวเตอร์พร้อมใช้งาน, โปรเจกเตอร์ 2 จอ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">ยานพาหนะคณะ</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              พร้อมเดินทาง
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-2">รถตู้คณะ (นข 1234 ชัยภูมิ)</h3>
          <p className="text-xs text-slate-500">ความจุ 12 ที่นั่ง • พนักงานขับรถประจำ</p>
          <p className="text-[11px] text-slate-400 mt-2">สำหรับเดินทางไปราชการ/บริการวิชาการ</p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
          รายการจองใช้งานล่าสุด
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="py-3 px-4 font-semibold">ห้อง / ทรัพยากร</th>
              <th className="py-3 px-4 font-semibold">วันที่ใช้งาน</th>
              <th className="py-3 px-4 font-semibold">ช่วงเวลา</th>
              <th className="py-3 px-4 font-semibold">วัตถุประสงค์</th>
              <th className="py-3 px-4 font-semibold">ผู้จอง / หน่วยงาน</th>
              <th className="py-3 px-4 font-semibold">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-900">{b.roomName}</td>
                <td className="py-3 px-4 text-slate-600">{b.date}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{b.startTime} - {b.endTime} น.</td>
                <td className="py-3 px-4 max-w-sm">{b.purpose}</td>
                <td className="py-3 px-4">
                  <div>{b.bookedBy}</div>
                  <div className="text-[10px] text-slate-400">{b.department}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    อนุมัติแล้ว
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-float w-full max-w-md p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">จองห้องประชุม / ยานพาหนะ</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">เลือกห้อง / ยานพาหนะ</label>
                <select
                  value={formData.roomName}
                  onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  <option value="ห้องประชุมสิริวิชาญ (อาคาร 4 ชั้น 2)">ห้องประชุมสิริวิชาญ (อาคาร 4 ชั้น 2)</option>
                  <option value="ห้อง Smart Classroom 421">ห้อง Smart Classroom 421</option>
                  <option value="รถตู้คณะ (นข 1234 ชัยภูมิ)">รถตู้คณะ (นข 1234 ชัยภูมิ)</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เริ่ม</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ถึง</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border rounded-lg p-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">วัตถุประสงค์ / หัวข้อการประชุม</label>
                <textarea
                  required
                  rows={2}
                  placeholder="ระบุวัตถุประสงค์..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full border rounded-lg p-2 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold">
                  บันทึกการจอง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

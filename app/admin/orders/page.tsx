"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookmarkCheck, Plus, Search, Download, FileText, CheckCircle2, X } from "lucide-react";
import { exportTableToExcel } from "@/lib/documentGenerator";

const MOCK_ORDERS = [
  {
    id: "ord-01",
    orderNumber: "คำสั่งคณะที่ 015/2569",
    date: "2026-09-10",
    title: "แต่งตั้งคณะกรรมการดำเนินงานโครงการบูรณาการธุรกิจการค้าสมัยใหม่ ดิจิทัล และสตาร์ทอัพ",
    signedBy: "ผศ.ดร. นฤมล อนันตโชค (คณบดี)",
    category: "แต่งตั้งคณะกรรมการ",
    status: "active"
  },
  {
    id: "ord-02",
    orderNumber: "คำสั่งคณะที่ 016/2569",
    date: "2026-09-18",
    title: "แต่งตั้งคณะกรรมการตรวจรับพัสดุ โครงการพัฒนาทักษะทางวิชาชีพ",
    signedBy: "ผศ.ดร. นฤมล อนันตโชค (คณบดี)",
    category: "ตรวจรับพัสดุ",
    status: "active"
  },
  {
    id: "ord-03",
    orderNumber: "ประกาศคณะที่ 004/2569",
    date: "2026-09-22",
    title: "ประกาศแนวปฏิบัติการจัดการเรียนการสอนและการส่งหลักฐานเบิกค่าสอน กศ.ปช.",
    signedBy: "ผศ.ดร. นฤมล อนันตโชค (คณบดี)",
    category: "ประกาศแนวปฏิบัติ",
    status: "active"
  }
];

export default function FacultyOrdersPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    orderNumber: `คำสั่งคณะที่ 01${orders.length + 7}/2569`,
    date: new Date().toISOString().split("T")[0],
    title: "",
    category: "แต่งตั้งคณะกรรมการ",
    signedBy: "ผศ.ดร. นฤมล อนันตโชค (คณบดี)"
  });

  const filtered = orders.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setOrders([
      {
        id: `ord-${Date.now()}`,
        orderNumber: formData.orderNumber,
        date: formData.date,
        title: formData.title,
        category: formData.category,
        signedBy: formData.signedBy,
        status: "active"
      },
      ...orders
    ]);
    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const data = orders.map((o) => ({
      "เลขที่คำสั่ง/ประกาศ": o.orderNumber,
      "วันที่": o.date,
      "เรื่อง": o.title,
      "หมวดหมู่": o.category,
      "ผู้ลงนาม": o.signedBy,
    }));
    exportTableToExcel(data, "ทะเบียนคำสั่ง_คณะศิลปศาสตร์ฯ_2569", "คำสั่งและประกาศ");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-800 hover:underline">
            ← กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ทะเบียนคำสั่งและประกาศคณะ (Faculty Orders & Announcements)
          </h1>
          <p className="text-xs text-slate-500">
            คลังคำสั่งแต่งตั้งคณะกรรมการดำเนินงาน ประกาศคณะ และคำสั่งมอบหมายงาน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ออกเลขคำสั่งใหม่</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-subtle">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเลขที่คำสั่ง, เรื่อง..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="py-3 px-4 font-semibold">เลขที่คำสั่ง / ประกาศ</th>
              <th className="py-3 px-4 font-semibold">วันที่</th>
              <th className="py-3 px-4 font-semibold">เรื่อง</th>
              <th className="py-3 px-4 font-semibold">ประเภท</th>
              <th className="py-3 px-4 font-semibold">ผู้ลงนาม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                <td className="py-3 px-4 text-slate-500">{order.date}</td>
                <td className="py-3 px-4 font-semibold text-slate-900 max-w-md">{order.title}</td>
                <td className="py-3 px-4">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                    {order.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">{order.signedBy}</td>
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
              <h3 className="font-bold text-base text-slate-900">ออกเลขคำสั่งคณะใหม่</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">เลขที่คำสั่ง / ประกาศ</label>
                <input
                  type="text"
                  required
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">วันที่</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">เรื่อง</label>
                <input
                  type="text"
                  required
                  placeholder="ระบุเรื่องของคำสั่ง..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookmarkCheck, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Clock,
  Ban,
  Users,
  ExternalLink,
  Upload,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getOrders, 
  createOrder, 
  updateOrderStatus, 
  uploadDocumentFile 
} from "@/lib/firebaseService";
import { OfficialOrder } from "@/lib/types";
import { exportTableToExcel } from "@/lib/documentGenerator";

interface CommitteeMember {
  name: string;
  position: string;
  role: string;
}

const CATEGORY_OPTIONS = [
  "แต่งตั้งคณะกรรมการดำเนินงานโครงการ",
  "แต่งตั้งคณะกรรมการตรวจรับพัสดุ",
  "ประกาศคณะ / แนวปฏิบัติราชการ",
  "คำสั่งมอบหมายหน้าที่ราชการ"
];

export default function FacultyOrdersPage() {
  const { currentUser, isAdmin } = useRole();
  const [orders, setOrders] = useState<OfficialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for new order
  const [formData, setFormData] = useState({
    orderNumber: "คำสั่งคณะที่ 017/2569",
    orderType: "committee_appointment" as OfficialOrder["orderType"],
    date: new Date().toISOString().split("T")[0],
    title: "",
    category: CATEGORY_OPTIONS[0],
    signedBy: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
    signatoryPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
  });

  const [members, setMembers] = useState<CommitteeMember[]>([
    { name: "ผู้ช่วยศาสตราจารย์ ดร.สมชาย ทรงคุณ", position: "อาจารย์ประจำสาขาวิชา", role: "ประธานกรรมการ" },
    { name: "อาจารย์กิตติยา นาวาการ", position: "อาจารย์ประจำสาขาวิชา", role: "กรรมการ" },
    { name: "นางสาวศิริพร บุญมั่น", position: "เจ้าหน้าที่ธุรการ", role: "กรรมการและเลขานุการ" }
  ]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Revoke modal state
  const [selectedOrderForRevoke, setSelectedOrderForRevoke] = useState<OfficialOrder | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokedByOrderNum, setRevokedByOrderNum] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders();
      setOrders(data.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
    } catch (err: any) {
      console.error("Error loading orders:", err);
      setError("ไม่สามารถโหลดทะเบียนคำสั่ง/ประกาศคณะได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.signedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = filterCategory === "all" || o.category === filterCategory;
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleAddMember = () => {
    setMembers([...members, { name: "", position: "", role: "กรรมการ" }]);
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert("กรุณาระบุชื่อเรื่องคำสั่ง/ประกาศ");
      return;
    }

    try {
      setSubmitting(true);
      let fileUrl: string | undefined = undefined;

      if (selectedFile) {
        setUploadingFile(true);
        fileUrl = await uploadDocumentFile(selectedFile, "orders_signed_attachments", currentUser);
        setUploadingFile(false);
      }

      const created = await createOrder({
        orderNumber: formData.orderNumber,
        orderType: formData.orderType,
        date: formData.date,
        title: formData.title,
        category: formData.category,
        signedBy: formData.signedBy,
        signatoryPosition: formData.signatoryPosition,
        status: "active",
        committeeMembers: members.filter(m => m.name.trim() !== ""),
        fileUrl
      }, currentUser);

      setOrders([created, ...orders]);
      setShowAddModal(false);
      setSelectedFile(null);

      // Reset form
      setFormData({
        orderNumber: `คำสั่งคณะที่ 0${orders.length + 18}/2569`,
        orderType: "committee_appointment",
        date: new Date().toISOString().split("T")[0],
        title: "",
        category: CATEGORY_OPTIONS[0],
        signedBy: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
        signatoryPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
      });
    } catch (err: any) {
      console.error("Failed to create order:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกคำสั่ง: " + err.message);
    } finally {
      setSubmitting(false);
      setUploadingFile(false);
    }
  };

  const handleRevokeOrder = async () => {
    if (!selectedOrderForRevoke || !revokeReason) return;
    try {
      setSubmitting(true);
      await updateOrderStatus(
        selectedOrderForRevoke.id, 
        "revoked", 
        revokeReason, 
        revokedByOrderNum || undefined, 
        currentUser
      );
      setOrders(orders.map(o => o.id === selectedOrderForRevoke.id ? { 
        ...o, 
        status: "revoked", 
        revokedReason: revokeReason, 
        revokedByOrderNumber: revokedByOrderNum 
      } : o));
      setSelectedOrderForRevoke(null);
      setRevokeReason("");
      setRevokedByOrderNum("");
    } catch (err: any) {
      alert("ไม่สามารถเพิกถอนคำสั่งได้: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredOrders.map((o) => ({
      "เลขที่คำสั่ง/ประกาศ": o.orderNumber,
      "วันที่": o.date,
      "เรื่อง": o.title,
      "หมวดหมู่": o.category,
      "ผู้ลงนาม": o.signedBy,
      "จำนวนกรรมการ": o.committeeMembers?.length || 0,
      "สถานะ": o.status === "active" ? "มีผลบังคับใช้" : "เพิกถอน/ยกเลิกแล้ว",
      "เหตุผลยกเลิก (ถ้ามี)": o.revokedReason || "-"
    }));
    exportTableToExcel(data, `ทะเบียนคำสั่ง_คณะศิลปศาสตร์_${new Date().toISOString().split("T")[0]}`, "คำสั่งและประกาศ");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ทะเบียนคำสั่งและประกาศคณะ (Faculty Orders & Announcements)
          </h1>
          <p className="text-xs text-slate-500">
            คลังคำสั่งแต่งตั้งคณะกรรมการดำเนินงาน ตรวจรับพัสดุ ประกาศคณะ และระบบเพิกถอนคำสั่ง
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel ({filteredOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ออกคำสั่ง / ประกาศใหม่</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่คำสั่ง, เรื่อง, ผู้ลงนาม..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900/20 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="active">มีผลบังคับใช้ (Active)</option>
            <option value="revoked">เพิกถอน/ยกเลิกแล้ว (Revoked)</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900 max-w-[200px]"
          >
            <option value="all">หมวดหมู่: ทั้งหมด</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <Clock className="w-6 h-6 animate-spin text-blue-900" />
            <span>กำลังโหลดทะเบียนคำสั่งจากฐานข้อมูล...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <BookmarkCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">ไม่พบคลังคำสั่งตามเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">เลขที่คำสั่ง/ประกาศ</th>
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">เรื่อง</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4">ผู้ลงนาม</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {o.date}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900">{o.title}</div>
                      {o.committeeMembers && o.committeeMembers.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-900" />
                          <span>กรรมการ {o.committeeMembers.length} ท่าน (ประธาน: {o.committeeMembers[0].name})</span>
                        </div>
                      )}
                      {o.revokedReason && (
                        <div className="text-[11px] text-rose-700 font-medium italic mt-0.5">
                          เพิกถอนเนื่องจาก: {o.revokedReason} {o.revokedByOrderNumber && `(แทนที่ด้วย ${o.revokedByOrderNumber})`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                      {o.category}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-700 whitespace-nowrap">
                      {o.signedBy}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {o.status === "active" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          มีผลบังคับใช้
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          เพิกถอนแล้ว
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {o.fileUrl && (
                          <a
                            href={o.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors title='เปิดไฟล์คำสั่งฉบับเต็ม'"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {o.status === "active" && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForRevoke(o)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="เพิกถอน/ยกเลิกคำสั่งนี้"
                          >
                            <Ban className="w-3.5 h-3.5" />
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

      {/* Modal: Add Order */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">ออกคำสั่งและประกาศคณะใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขที่คำสั่ง/ประกาศ</label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่ออกคำสั่ง</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมวดหมู่คำสั่ง</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อเรื่องคำสั่ง/ประกาศ</label>
                <textarea
                  rows={2}
                  placeholder="เช่น แต่งตั้งคณะกรรมการดำเนินงานโครงการ..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  required
                />
              </div>

              {/* Committee Members Block */}
              <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">รายชื่อคณะกรรมการ / ผู้รับผิดชอบ (ถ้ามี)</label>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-2 py-1 bg-blue-900 text-white text-[10px] font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> เพิ่มกรรมการ
                  </button>
                </div>

                {members.map((m, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="ชื่อ-สกุล..."
                      value={m.name}
                      onChange={(e) => {
                        const next = [...members];
                        next[idx].name = e.target.value;
                        setMembers(next);
                      }}
                      className="border border-slate-200 rounded p-1.5"
                    />
                    <input
                      type="text"
                      placeholder="ตำแหน่งทางวิชาการ..."
                      value={m.position}
                      onChange={(e) => {
                        const next = [...members];
                        next[idx].position = e.target.value;
                        setMembers(next);
                      }}
                      className="border border-slate-200 rounded p-1.5"
                    />
                    <div className="flex items-center gap-1">
                      <select
                        value={m.role}
                        onChange={(e) => {
                          const next = [...members];
                          next[idx].role = e.target.value;
                          setMembers(next);
                        }}
                        className="border border-slate-200 rounded p-1.5 w-full bg-white"
                      >
                        <option value="ประธานกรรมการ">ประธานกรรมการ</option>
                        <option value="รองประธานกรรมการ">รองประธานกรรมการ</option>
                        <option value="กรรมการ">กรรมการ</option>
                        <option value="กรรมการและเลขานุการ">กรรมการและเลขานุการ</option>
                        <option value="กรรมการและผู้ช่วยเลขานุการ">กรรมการและผู้ช่วยเลขานุการ</option>
                      </select>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PDF Attachment */}
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <label className="block font-semibold text-slate-700 mb-1">แนบไฟล์สแกนคำสั่งฉบับลงนาม (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800"
                />
                {selectedFile && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    เลือกไฟล์: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

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
                  {submitting ? "กำลังบันทึกคำสั่ง..." : "บันทึกคำสั่งลงระบบ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revoke Order */}
      {selectedOrderForRevoke && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-rose-800">เพิกถอน / ยกเลิกคำสั่งคณะ</h3>
              <button
                type="button"
                onClick={() => setSelectedOrderForRevoke(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-mono font-bold text-blue-900 text-xs">{selectedOrderForRevoke.orderNumber}</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">{selectedOrderForRevoke.title}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เหตุผลในการเพิกถอน/ยกเลิกคำสั่ง</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ยกเลิกการจัดโครงการ, มีคำสั่งฉบับใหม่มาแทนที่..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full border border-rose-300 rounded-lg p-2 focus:border-rose-500 focus:outline-none bg-rose-50/20"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">แทนที่ด้วยคำสั่งเลขที่ (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น คำสั่งคณะที่ 020/2569"
                  value={revokedByOrderNum}
                  onChange={(e) => setRevokedByOrderNum(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForRevoke(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={handleRevokeOrder}
                  disabled={submitting || !revokeReason}
                  className="px-5 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "กำลังเพิกถอน..." : "ยืนยันการเพิกถอนคำสั่ง"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

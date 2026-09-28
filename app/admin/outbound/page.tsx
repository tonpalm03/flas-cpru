"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Send, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  X,
  FileCheck,
  AlertCircle,
  Clock,
  Upload,
  ExternalLink,
  Ban,
  Building,
  UserCheck
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { 
  getOutboundDocs, 
  createOutboundDoc, 
  updateOutboundDocStatus, 
  uploadDocumentFile,
  getMasterSettings
} from "@/lib/firebaseService";
import { OutboundDocument, DocumentUrgency, DocumentStatus } from "@/lib/types";
import { exportTableToExcel } from "@/lib/documentGenerator";

const SIGNATORY_OPTIONS = [
  "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี (คณบดี)",
  "รองคณบดีฝ่ายวิชาการและวิจัย",
  "รองคณบดีฝ่ายบริหารและแผนงาน",
  "รองคณบดีฝ่ายพัฒนานักศึกษาและบริการวิชาการ"
];

const CATEGORY_OPTIONS = [
  "หนังสือภายนอก (ถึงหน่วยงานภายนอก)",
  "หนังสือภายนอก (ถึงมหาวิทยาลัย/คณะอื่น)",
  "บันทึกข้อความส่งภายใน",
  "หนังสือเชิญวิทยากร",
  "หนังสือขอความอนุเคราะห์"
];

export default function OutboundDocsPage() {
  const { currentUser } = useRole();
  const [docs, setDocs] = useState<OutboundDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Status Modal State
  const [selectedDocForAction, setSelectedDocForAction] = useState<OutboundDocument | null>(null);
  const [actionType, setActionType] = useState<"sign" | "send" | "cancel" | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSignedFile, setUploadingSignedFile] = useState(false);

  const [formData, setFormData] = useState({
    sendDate: new Date().toISOString().split("T")[0],
    title: "",
    recipient: "",
    category: "หนังสือภายนอก (ถึงหน่วยงานภายนอก)",
    signatory: SIGNATORY_OPTIONS[0],
    urgency: "normal" as DocumentUrgency,
    status: "draft" as DocumentStatus
  });

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOutboundDocs();
      setDocs(data.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
    } catch (err: any) {
      console.error("Error loading outbound docs:", err);
      setError("ไม่สามารถโหลดทะเบียนหนังสือส่งได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = docs.filter((d) => {
    const matchesSearch = 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.signatory.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || d.status === filterStatus;
    const matchesCat = filterCategory === "all" || d.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.recipient) {
      alert("กรุณากรอกเรื่องและผู้รับหนังสือ (เรียน) ให้ครบถ้วน");
      return;
    }

    try {
      setSubmitting(true);
      const created = await createOutboundDoc({
        sendDate: formData.sendDate,
        title: formData.title,
        recipient: formData.recipient,
        category: formData.category,
        signatory: formData.signatory,
        urgency: formData.urgency,
        status: formData.status
      }, currentUser);

      setDocs([created, ...docs]);
      setShowAddModal(false);

      // Reset form
      setFormData({
        sendDate: new Date().toISOString().split("T")[0],
        title: "",
        recipient: "",
        category: "หนังสือภายนอก (ถึงหน่วยงานภายนอก)",
        signatory: SIGNATORY_OPTIONS[0],
        urgency: "normal",
        status: "draft"
      });
    } catch (err: any) {
      console.error("Failed to create outbound doc:", err);
      alert("เกิดข้อผิดพลาดในการออกเลขหนังสือส่ง: " + (err.message || "โปรดลองอีกครั้ง"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedDocForAction || !actionType) return;

    try {
      setSubmitting(true);
      let signedUrl = selectedDocForAction.signedFileUrl;

      if (actionType === "sign") {
        if (signedFile) {
          setUploadingSignedFile(true);
          signedUrl = await uploadDocumentFile(signedFile, "outbound_signed_attachments", currentUser);
          setUploadingSignedFile(false);
        }
        await updateOutboundDocStatus(selectedDocForAction.id, "signed", signedUrl, currentUser);
        setDocs(docs.map(d => d.id === selectedDocForAction.id ? { ...d, status: "signed", signedFileUrl: signedUrl } : d));
      } else if (actionType === "send") {
        await updateOutboundDocStatus(selectedDocForAction.id, "completed", signedUrl, currentUser);
        setDocs(docs.map(d => d.id === selectedDocForAction.id ? { ...d, status: "completed" } : d));
      } else if (actionType === "cancel") {
        await updateOutboundDocStatus(selectedDocForAction.id, "cancelled", undefined, currentUser);
        setDocs(docs.map(d => d.id === selectedDocForAction.id ? { ...d, status: "cancelled" } : d));
      }

      setSelectedDocForAction(null);
      setActionType(null);
      setSignedFile(null);
    } catch (err: any) {
      alert("ไม่สามารถบันทึกสถานะได้: " + err.message);
    } finally {
      setSubmitting(false);
      setUploadingSignedFile(false);
    }
  };

  const handleExportExcel = () => {
    const excelData = filteredDocs.map((d) => ({
      "เลขที่หนังสือส่ง": d.docNumber,
      "วันที่ส่ง": d.sendDate,
      "เรื่อง": d.title,
      "เรียน (ผู้รับ)": d.recipient,
      "ประเภท": d.category,
      "ผู้ลงนาม": d.signatory,
      "สถานะ": 
        d.status === "completed" ? "จัดส่งเรียบร้อย" :
        d.status === "signed" ? "ลงนามแล้ว" :
        d.status === "pending_review" ? "รอเสนอลงนาม" :
        d.status === "draft" ? "ร่างเอกสาร" :
        d.status === "cancelled" ? "ยกเลิกเลข" : d.status
    }));
    exportTableToExcel(excelData, `ทะเบียนหนังสือส่ง_คณะศิลปศาสตร์_${new Date().toISOString().split("T")[0]}`, "ทะเบียนหนังสือส่ง");
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ส่งแล้ว</span>;
      case "signed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">ลงนามแล้ว</span>;
      case "pending_review":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">รอเสนอลงนาม</span>;
      case "draft":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">ร่างเอกสาร</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">ยกเลิก</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-blue-900 hover:underline">
              ← กลับไปศูนย์ธุรการ
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ทะเบียนหนังสือส่ง (Outbound Documents Registry)
          </h1>
          <p className="text-xs text-slate-500">
            ออกเลขที่หนังสือส่งภายนอกและภายในคณะ (อว 0643.04/xxx) พร้อมระบบตรวจร่าง แนบฉบับลงนาม และจัดส่ง
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>ส่งออก Excel ({filteredDocs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ออกเลขหนังสือส่งใหม่</span>
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
            placeholder="ค้นหาเลขที่หนังสือส่ง, เรื่อง, เรียน (ผู้รับ)..."
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
            <option value="draft">ร่างเอกสาร</option>
            <option value="pending_review">รอเสนอลงนาม</option>
            <option value="signed">ลงนามแล้ว</option>
            <option value="completed">ส่งแล้ว</option>
            <option value="cancelled">ยกเลิกเลข</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-900 max-w-[180px]"
          >
            <option value="all">ประเภท: ทั้งหมด</option>
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
            <span>กำลังโหลดทะเบียนหนังสือส่งจากฐานข้อมูล...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">ไม่พบรายการหนังสือส่งตามเงื่อนไข</p>
            <p className="text-slate-400 mt-0.5">กดปุ่ม "ออกเลขหนังสือส่งใหม่" เพื่อเริ่มต้นร่างหนังสือ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">เลขที่หนังสือส่ง</th>
                  <th className="py-3 px-4">วันที่ส่ง</th>
                  <th className="py-3 px-4">เรื่อง</th>
                  <th className="py-3 px-4">เรียน (ผู้รับ)</th>
                  <th className="py-3 px-4">ผู้ลงนาม</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {doc.sendDate}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-2">{doc.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{doc.category}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {doc.recipient}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                      {doc.signatory}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {doc.signedFileUrl && (
                          <a
                            href={doc.signedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors title='เปิดฉบับลงนาม'"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {doc.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocForAction(doc);
                              setActionType("sign");
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg transition-colors"
                          >
                            บันทึกลงนาม
                          </button>
                        )}

                        {doc.status === "signed" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocForAction(doc);
                              setActionType("send");
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors"
                          >
                            ส่งหนังสือ
                          </button>
                        )}

                        {doc.status !== "cancelled" && doc.status !== "completed" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocForAction(doc);
                              setActionType("cancel");
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="ยกเลิกเลขหนังสือนี้"
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

      {/* Modal: New Outbound Document */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">ออกเลขที่หนังสือส่งราชการ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900">
                <p className="font-semibold text-xs">ระบบออกเลขที่หนังสืออัตโนมัติ (Atomic Counter)</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  ระบบจะรันเลขที่ตามรูปแบบทางการ เช่น อว 0643.04/xxx ประจำปีงบประมาณ 2569 ป้องกันเลขซ้ำ 100%
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่ส่งหนังสือ</label>
                  <input
                    type="date"
                    value={formData.sendDate}
                    onChange={(e) => setFormData({ ...formData, sendDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทหนังสือ</label>
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
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เรียน (ผู้รับหนังสือ)</label>
                <input
                  type="text"
                  placeholder="เช่น อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ, ผู้อำนวยการโรงพยาบาลชัยภูมิ..."
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อเรื่องหนังสือส่ง</label>
                <textarea
                  rows={2}
                  placeholder="กรอกชื่อเรื่องหนังสือ..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ผู้ลงนามหนังสือ</label>
                  <select
                    value={formData.signatory}
                    onChange={(e) => setFormData({ ...formData, signatory: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white"
                  >
                    {SIGNATORY_OPTIONS.map((sig) => (
                      <option key={sig} value={sig}>{sig}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สถานะเริ่มต้น</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as DocumentStatus })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none bg-white"
                  >
                    <option value="draft">ร่างเอกสาร (Draft)</option>
                    <option value="pending_review">รอเสนอลงนาม (Pending Review)</option>
                    <option value="signed">ลงนามแล้ว (Signed)</option>
                  </select>
                </div>
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
                  {submitting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังออกเลขที่ส่ง...</span>
                    </>
                  ) : (
                    <span>ออกเลขหนังสือส่ง</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (Sign / Send / Cancel) */}
      {selectedDocForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {actionType === "sign" ? "บันทึกการลงนามหนังสือ" :
                 actionType === "send" ? "ยืนยันการจัดส่งหนังสือ" :
                 actionType === "cancel" ? "ยกเลิกเลขที่หนังสือส่ง" : "จัดการเอกสาร"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedDocForAction(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-mono font-bold text-blue-900 text-xs">{selectedDocForAction.docNumber}</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">{selectedDocForAction.title}</p>
                <p className="text-[11px] text-slate-500 mt-1">เรียน: {selectedDocForAction.recipient}</p>
              </div>

              {actionType === "sign" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">แนบไฟล์สแกนฉบับลงนาม (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800"
                  />
                  {signedFile && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      เลือกไฟล์: {signedFile.name} ({(signedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}

              {actionType === "send" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                  <p className="font-bold">ยืนยันการจัดส่งหนังสือ</p>
                  <p className="text-[11px] mt-0.5">
                    เมื่อบันทึกแล้ว สถานะจะเปลี่ยนเป็น "ส่งแล้ว" และบันทึกประวัติการส่งลงใน Audit Log ของคณะ
                  </p>
                </div>
              )}

              {actionType === "cancel" && (
                <div>
                  <label className="block font-semibold text-rose-800 mb-1">ระบุเหตุผลการยกเลิกเลขหนังสือ</label>
                  <textarea
                    rows={2}
                    placeholder="เช่น พิมพ์ข้อความผิดพลาด, ยกเลิกโครงการ..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-rose-200 rounded-lg p-2 focus:border-rose-500 focus:outline-none bg-rose-50/30"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocForAction(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={submitting || (actionType === "cancel" && !cancelReason)}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 ${
                    actionType === "cancel" ? "bg-rose-700 hover:bg-rose-800" : "bg-blue-900 hover:bg-blue-800"
                  }`}
                >
                  {submitting ? "กำลังดำเนินการ..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

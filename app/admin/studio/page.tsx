"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  PenLine,
  Sliders,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Layers,
  ExternalLink,
  ShieldAlert,
  Info,
  Check
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { canManageAdmin } from "@/lib/adminRegistryModel";
import {
  getAdminCategories,
  saveAdminCategoryConfig,
  resetAdminCategoryToDefault,
  BUILTIN_CATEGORIES
} from "@/lib/adminCategoryService";
import {
  getSignatoryPresets,
  saveSignatoryPresets,
  resetSignatoryPresetsToDefault,
  DEFAULT_SIGNATORY_PRESETS
} from "@/lib/adminSignatoryService";
import type {
  AdminDocCategoryConfig,
  SignatoryPreset,
  AdminDocRegistryPreset
} from "@/lib/types";

export default function AdminStudioPage() {
  const { currentUser, isAdmin } = useRole();

  // Active Tab: 'categories' | 'signatories'
  const [activeTab, setActiveTab] = useState<"categories" | "signatories">("categories");

  // Category State
  const [categories, setCategories] = useState<AdminDocCategoryConfig[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("memo");
  const [currentCatConfig, setCurrentCatConfig] = useState<AdminDocCategoryConfig | null>(null);

  // Signatory State
  const [signatories, setSignatories] = useState<SignatoryPreset[]>([]);
  const [editingSignerIndex, setEditingSignerIndex] = useState<number | null>(null);
  const [signerForm, setSignerForm] = useState<Partial<SignatoryPreset>>({
    label: "",
    name: "",
    position: "",
    isActive: true
  });
  const [showSignerModal, setShowSignerModal] = useState(false);

  // New Category Modal
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newCatLayout, setNewCatLayout] = useState<"memo" | "external" | "order" | "custom">("memo");

  // Status & Notifications
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasPermission = canManageAdmin(currentUser) || isAdmin;

  // Auto-dismiss notice
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Load Categories and Signatories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catList, signerList] = await Promise.all([
          getAdminCategories(),
          getSignatoryPresets()
        ]);

        setCategories(catList);
        setSignatories(signerList);

        const found = catList.find(c => c.id === "memo") || catList[0];
        if (found) {
          setSelectedCatId(found.id);
          setCurrentCatConfig(JSON.parse(JSON.stringify(found)));
        }
      } catch (err: any) {
        setNotice({ type: "error", text: "โหลดข้อมูลไม่สำเร็จ: " + (err.message || String(err)) });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // When switching selected category
  const handleSelectCategory = (catId: string) => {
    setSelectedCatId(catId);
    const found = categories.find(c => c.id === catId);
    if (found) {
      setCurrentCatConfig(JSON.parse(JSON.stringify(found)));
    }
  };

  // Update field in current category config
  const updateCatField = <K extends keyof AdminDocCategoryConfig>(field: K, value: AdminDocCategoryConfig[K]) => {
    if (!currentCatConfig) return;
    setCurrentCatConfig({
      ...currentCatConfig,
      [field]: value
    });
  };

  // Update preset field
  const updatePresetField = <K extends keyof AdminDocRegistryPreset>(field: K, value: AdminDocRegistryPreset[K]) => {
    if (!currentCatConfig) return;
    setCurrentCatConfig({
      ...currentCatConfig,
      preset: {
        ...currentCatConfig.preset,
        [field]: value
      }
    });
  };

  // Save Category Config
  const handleSaveCategory = async () => {
    if (!currentCatConfig || !currentUser) return;
    try {
      setSaving(true);
      const saved = await saveAdminCategoryConfig(currentCatConfig, currentUser);

      // Update in categories list
      setCategories(prev => {
        const idx = prev.findIndex(c => c.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      setCurrentCatConfig(JSON.parse(JSON.stringify(saved)));
      setNotice({ type: "success", text: `บันทึกการตั้งค่าหมวด "${saved.title}" เรียบร้อยแล้ว` });
    } catch (err: any) {
      setNotice({ type: "error", text: "บันทึกไม่สำเร็จ: " + (err.message || String(err)) });
    } finally {
      setSaving(false);
    }
  };

  // Reset Category Config to Default
  const handleResetCategory = async () => {
    if (!currentCatConfig || !currentUser) return;
    if (!confirm(`ต้องการรีเซ็ตหมวด "${currentCatConfig.title}" กลับเป็นค่ามาตรฐานของระเบียบสารบรรณหรือไม่?`)) return;

    try {
      setSaving(true);
      const reset = await resetAdminCategoryToDefault(currentCatConfig.id, currentUser);
      setCategories(prev => prev.map(c => c.id === reset.id ? reset : c));
      setCurrentCatConfig(JSON.parse(JSON.stringify(reset)));
      setNotice({ type: "success", text: `รีเซ็ตหมวด "${reset.title}" เป็นค่ามาตรฐานเรียบร้อยแล้ว` });
    } catch (err: any) {
      setNotice({ type: "error", text: "รีเซ็ตไม่สำเร็จ: " + (err.message || String(err)) });
    } finally {
      setSaving(false);
    }
  };

  // Create New Category
  const handleCreateNewCategory = async () => {
    if (!currentUser) return;
    const cleanId = newCatSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (!cleanId) {
      alert("กรุณาระบุรหัสประเภทเอกสารภาษาอังกฤษ");
      return;
    }
    if (!newCatTitle.trim()) {
      alert("กรุณาระบุชื่อประเภทเอกสาร");
      return;
    }
    if (categories.some(c => c.id === cleanId)) {
      alert("รหัสประเภทเอกสารนี้มีอยู่แล้วในระบบ");
      return;
    }

    try {
      setSaving(true);
      const newConfig: AdminDocCategoryConfig = {
        id: cleanId,
        title: newCatTitle.trim(),
        subtitle: `เอกสารประเภท ${newCatTitle.trim()}`,
        layoutType: newCatLayout,
        garudaPosition: newCatLayout === "memo" ? "left" : "center",
        prefix: newCatLayout === "order" ? "ที่ " : "อว 0646.02/",
        numberingPattern: newCatLayout === "order" ? "ที่ {seq}/{year}" : "อว 0646.02/{seq}",
        defaultDigitType: "thai",
        paperSize: newCatLayout === "memo" ? "letter" : "a4",
        headerLineStyle: newCatLayout === "memo" ? "dot_leader" : "none",
        lineVisibility: { govOrg: true, docDate: true, subject: true },
        orderIndex: categories.length + 1,
        isBuiltIn: false,
        isActive: true,
        preset: {
          from: "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ",
          to: "",
          subject: "",
          action: "รอตรวจ",
          remarks: "",
          referenceDoc: "",
          attachmentsText: "",
          bodyText: "ข้อความเริ่มต้นของเอกสาร...",
          signatoryName: signatories[0]?.name || "ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย",
          signatoryPosition: signatories[0]?.position || "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
          coordinatorInfo: "",
          recipients: [],
          officeAddress: "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ"
        }
      };

      const saved = await saveAdminCategoryConfig(newConfig, currentUser);
      setCategories(prev => [...prev, saved]);
      setSelectedCatId(saved.id);
      setCurrentCatConfig(JSON.parse(JSON.stringify(saved)));
      setShowNewCatModal(false);
      setNewCatSlug("");
      setNewCatTitle("");
      setNotice({ type: "success", text: `สร้างประเภทเอกสาร "${saved.title}" เรียบร้อยแล้ว` });
    } catch (err: any) {
      setNotice({ type: "error", text: "สร้างไม่สำเร็จ: " + (err.message || String(err)) });
    } finally {
      setSaving(false);
    }
  };

  // Signatory Handlers
  const handleOpenAddSigner = () => {
    setEditingSignerIndex(null);
    setSignerForm({
      label: "",
      name: "",
      position: "",
      isActive: true
    });
    setShowSignerModal(true);
  };

  const handleOpenEditSigner = (index: number) => {
    setEditingSignerIndex(index);
    setSignerForm({ ...signatories[index] });
    setShowSignerModal(true);
  };

  const handleSaveSignerModal = () => {
    if (!signerForm.label?.trim() || !signerForm.name?.trim() || !signerForm.position?.trim()) {
      alert("กรุณากรอกข้อมูลผู้ลงนามให้ครบถ้วนทุกช่อง");
      return;
    }

    const updated = [...signatories];
    if (editingSignerIndex !== null && editingSignerIndex >= 0) {
      updated[editingSignerIndex] = {
        ...updated[editingSignerIndex],
        label: signerForm.label.trim(),
        name: signerForm.name.trim(),
        position: signerForm.position.trim(),
        isActive: signerForm.isActive !== false
      };
    } else {
      updated.push({
        id: `signer_${Date.now()}`,
        label: signerForm.label.trim(),
        name: signerForm.name.trim(),
        position: signerForm.position.trim(),
        orderIndex: updated.length + 1,
        isActive: true
      });
    }

    setSignatories(updated);
    setShowSignerModal(false);
  };

  const handleMoveSigner = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === signatories.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...signatories];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    updated.forEach((item, idx) => {
      item.orderIndex = idx + 1;
    });

    setSignatories(updated);
  };

  const handleDeleteSigner = (index: number) => {
    if (!confirm(`ต้องการลบผู้ลงนาม "${signatories[index].label}" ออกจากระบบหรือไม่?`)) return;
    const updated = signatories.filter((_, idx) => idx !== index);
    updated.forEach((item, idx) => {
      item.orderIndex = idx + 1;
    });
    setSignatories(updated);
  };

  const handleSaveAllSignatories = async () => {
    if (!currentUser) return;
    try {
      setSaving(true);
      const saved = await saveSignatoryPresets(signatories, currentUser);
      setSignatories(saved);
      setNotice({ type: "success", text: `บันทึกรายชื่อผู้ลงนามทั้งหมด (${saved.length} รายการ) เรียบร้อยแล้ว` });
    } catch (err: any) {
      setNotice({ type: "error", text: "บันทึกไม่สำเร็จ: " + (err.message || String(err)) });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSignatories = async () => {
    if (!currentUser) return;
    if (!confirm("ต้องการรีเซ็ตรายชื่อผู้ลงนามกลับเป็นรายชื่อเริ่มต้นของคณะศิลปศาสตร์ฯ หรือไม่?")) return;
    try {
      setSaving(true);
      const reset = await resetSignatoryPresetsToDefault(currentUser);
      setSignatories(reset);
      setNotice({ type: "success", text: "รีเซ็ตรายชื่อผู้ลงนามเป็นค่าเริ่มต้นของคณะเรียบร้อยแล้ว" });
    } catch (err: any) {
      setNotice({ type: "error", text: "รีเซ็ตไม่สำเร็จ: " + (err.message || String(err)) });
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
            <p className="text-xs text-slate-500 mt-1">
              เฉพาะผู้ดูแลระบบ ผู้บริหาร หรือเจ้าหน้าที่ธุรการเท่านั้นที่สามารถปรับแต่งแม่แบบและต้นแบบเอกสารได้
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่ศูนย์งานธุรการ</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold animate-fade-in transition-all bg-white text-slate-800 border-slate-200">
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/memo"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="กลับสู่ทะเบียนหนังสือ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-900" />
                <h1 className="text-base font-bold text-slate-900">จัดการแม่แบบและต้นฉบับเอกสาร (Template Studio)</h1>
              </div>
              <p className="text-[11px] text-slate-500">
                ปรับแต่งโครงสร้างเลขที่หนังสือ เส้น รูปแบบกระดาษ ข้อความเริ่มต้น และรายชื่อผู้ลงนาม
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "categories"
                  ? "bg-white text-blue-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ต้นแบบเอกสาร ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("signatories")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "signatories"
                  ? "bg-white text-blue-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>ผู้ลงนามมาตรฐาน ({signatories.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs font-medium">
            กำลังโหลดข้อมูลการตั้งค่าแม่แบบ...
          </div>
        ) : activeTab === "categories" ? (
          /* ==============================================
             TAB 1: Categories & Document Presets
             ============================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Category Selector Column */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-900" />
                  หมวดหมู่เอกสาร
                </span>
                <button
                  onClick={() => setShowNewCatModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-bold border border-blue-200 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>เพิ่มหมวด</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {categories.map(cat => {
                  const isSelected = cat.id === selectedCatId;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-300 shadow-xs"
                          : "bg-white border-slate-200/80 hover:bg-slate-50/80 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-blue-950" : "text-slate-900"}`}>
                          {cat.title}
                        </span>
                        <div className="flex items-center gap-1">
                          {cat.isBuiltIn && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              มาตรฐาน
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100/60 text-blue-900">
                            {cat.paperSize?.toUpperCase() || "A4"}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                        Prefix: {cat.prefix || "ไม่ระบุ"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Category Editor Panel */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {currentCatConfig ? (
                <>
                  {/* Top Bar for Selected Category */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{currentCatConfig.title}</h2>
                        <span className="text-[11px] font-mono text-slate-400">({currentCatConfig.id})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        แก้ไขโครงสร้างและข้อความตั้งต้นที่จะแสดงเมื่อผู้ใช้เปิดสร้างเอกสารหมวดนี้
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {currentCatConfig.isBuiltIn && (
                        <button
                          onClick={handleResetCategory}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>รีเซ็ตค่ามาตรฐาน</span>
                        </button>
                      )}

                      <button
                        onClick={handleSaveCategory}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Document Structure & Styling */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                      <Sliders className="w-3.5 h-3.5" />
                      ๑. โครงสร้างและคุณสมบัติกระดาษ
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ชื่อประเภทเอกสาร
                        </label>
                        <input
                          type="text"
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          value={currentCatConfig.title}
                          onChange={e => updateCatField("title", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          คำอธิบาย / วัตถุประสงค์
                        </label>
                        <input
                          type="text"
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          value={currentCatConfig.subtitle || ""}
                          onChange={e => updateCatField("subtitle", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          คำนำหน้าเลขที่หนังสือ (Prefix)
                        </label>
                        <input
                          type="text"
                          className="w-full text-xs font-mono font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          placeholder="เช่น อว 0646.02/"
                          value={currentCatConfig.prefix}
                          onChange={e => updateCatField("prefix", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          รูปแบบเลขฉบับเต็ม (Numbering Pattern)
                        </label>
                        <input
                          type="text"
                          className="w-full text-xs font-mono font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          placeholder="เช่น อว 0646.02/{seq}"
                          value={currentCatConfig.numberingPattern}
                          onChange={e => updateCatField("numberingPattern", e.target.value)}
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          ใช้ {"{seq}"} แทนเลขรันลำดับที่ และ {"{year}"} แทนปี พ.ศ.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ขนาดกระดาษมาตรฐาน
                        </label>
                        <select
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          value={currentCatConfig.paperSize}
                          onChange={e => updateCatField("paperSize", e.target.value as any)}
                        >
                          <option value="letter">Letter (๒๑๖ × ๒๗๙ มม. — บันทึกข้อความ)</option>
                          <option value="a4">A4 (๒๑๐ × ๒๙๗ มม. — หนังสือภายนอก/คำสั่ง)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          รูปแบบตัวเลขเริ่มต้น
                        </label>
                        <select
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          value={currentCatConfig.defaultDigitType}
                          onChange={e => updateCatField("defaultDigitType", e.target.value as any)}
                        >
                          <option value="thai">ตัวเลขไทย (๑, ๒, ๓... — มาตรฐานหนังสือภายใน)</option>
                          <option value="arabic">เลขอารบิก (1, 2, 3... — หนังสือภายนอก)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          รูปแบบเส้นส่วนหัวบันทึกข้อความ
                        </label>
                        <select
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          value={currentCatConfig.headerLineStyle || "dot_leader"}
                          onChange={e => updateCatField("headerLineStyle", e.target.value as any)}
                        >
                          <option value="dot_leader">เส้นประระเบียบสารบรรณ (Dot Leader)</option>
                          <option value="dotted">เส้นจุดสั้น (Dotted)</option>
                          <option value="solid">เส้นทึบ (Solid Line)</option>
                          <option value="none">ไม่แสดงเส้น (None)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          สถานะการใช้งาน
                        </label>
                        <select
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          value={currentCatConfig.isActive ? "active" : "inactive"}
                          onChange={e => updateCatField("isActive", e.target.value === "active")}
                        >
                          <option value="active">เปิดใช้งาน (แสดงในเมนูสร้างเอกสาร)</option>
                          <option value="inactive">ปิดใช้งานชั่วคราว (ซ่อนจากเมนู)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Default Preset Body & Headers */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                      <FileText className="w-3.5 h-3.5" />
                      ๒. ข้อความเนื้อหาตั้งต้น (Default Starter Template)
                    </h3>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ส่วนราชการ / หน่วยงานผู้ออกหนังสือ (from)
                        </label>
                        <input
                          type="text"
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          placeholder="เช่น มหาวิทยาลัยราชภัฏชัยภูมิ คณะศิลปศาสตร์และวิทยาศาสตร์ โทร ๔๑๐๐"
                          value={currentCatConfig.preset?.from || ""}
                          onChange={e => updatePresetField("from", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            เรียน / ถึง (to)
                          </label>
                          <input
                            type="text"
                            className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                            placeholder="เช่น คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
                            value={currentCatConfig.preset?.to || ""}
                            onChange={e => updatePresetField("to", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            เรื่อง (subject)
                          </label>
                          <input
                            type="text"
                            className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                            placeholder="หัวเรื่องเอกสารตั้งต้น..."
                            value={currentCatConfig.preset?.subject || ""}
                            onChange={e => updatePresetField("subject", e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          เนื้อหาข้อความตั้งต้น (bodyText)
                        </label>
                        <textarea
                          rows={8}
                          className="w-full text-xs font-medium leading-relaxed border border-slate-200 rounded-xl p-3 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono"
                          placeholder="พิมพ์ย่อหน้าเนื้อหาต้นแบบ โดยเว้นวรรค 2 บรรทัดสำหรับการขึ้นย่อหน้าใหม่..."
                          value={currentCatConfig.preset?.bodyText || ""}
                          onChange={e => updatePresetField("bodyText", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            อ้างถึง (referenceDoc — ทางเลือก)
                          </label>
                          <input
                            type="text"
                            className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                            placeholder="เช่น หนังสือสำนักงานคณบดี ที่ อว..."
                            value={currentCatConfig.preset?.referenceDoc || ""}
                            onChange={e => updatePresetField("referenceDoc", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            สิ่งที่ส่งมาด้วย (attachmentsText — ทางเลือก)
                          </label>
                          <input
                            type="text"
                            className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                            placeholder="เช่น ๑. กำหนดการ จำนวน ๑ ฉบับ"
                            value={currentCatConfig.preset?.attachmentsText || ""}
                            onChange={e => updatePresetField("attachmentsText", e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ข้อมูลผู้ประสานงานท้ายหนังสือ (coordinatorInfo)
                        </label>
                        <textarea
                          rows={2}
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                          placeholder="สำนักงานคณบดี โทร 044 815 111 ต่อ 4100..."
                          value={currentCatConfig.preset?.coordinatorInfo || ""}
                          onChange={e => updatePresetField("coordinatorInfo", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  กรุณาเลือกหมวดหมู่เอกสารจากรายการทางซ้าย
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==============================================
             TAB 2: Official Signatories Management
             ============================================== */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">รายชื่อผู้ลงนามมาตรฐานของคณะ (Official Signatories)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  รายชื่อที่ปรากฏในเมนูเลือกผู้ลงนามของแบบฟอร์มสร้างเอกสารทุกประเภท (บันทึกลงฐานข้อมูล ไม่ต้องแก้โค้ด)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleResetSignatories}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>รีเซ็ตเป็นค่าเริ่มต้น</span>
                </button>

                <button
                  onClick={handleOpenAddSigner}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มผู้ลงนาม</span>
                </button>

                <button
                  onClick={handleSaveAllSignatories}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</span>
                </button>
              </div>
            </div>

            {/* Signatories Table / List */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3 w-16 text-center">ลำดับ</th>
                    <th className="py-3 px-4">ป้ายกำกับ / สายงาน</th>
                    <th className="py-3 px-4">ชื่อ-นามสกุล (พร้อมยศ/ตำแหน่งทางวิชาการ)</th>
                    <th className="py-3 px-4">ตำแหน่งทางการในการลงนาม</th>
                    <th className="py-3 px-3 text-center w-24">สถานะ</th>
                    <th className="py-3 px-4 text-center w-36">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {signatories.map((signer, index) => (
                    <tr key={signer.id || index} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {signer.label}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {signer.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-pre-line leading-relaxed">
                        {signer.position}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            signer.isActive !== false
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {signer.isActive !== false ? "เปิดใช้" : "ปิด"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleMoveSigner(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            title="เลื่อนขึ้น"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSigner(index, "down")}
                            disabled={index === signatories.length - 1}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            title="เลื่อนลง"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditSigner(index)}
                            className="p-1 rounded-md text-blue-900 hover:bg-blue-50"
                            title="แก้ไข"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSigner(index)}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {signatories.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        ยังไม่มีรายชื่อผู้ลงนามในระบบ กดปุ่ม "เพิ่มผู้ลงนาม" หรือ "รีเซ็ตเป็นค่าเริ่มต้น" เพื่อเริ่มต้น
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-950 space-y-1">
                <p className="font-bold">หมายเหตุการใช้งาน:</p>
                <p>
                  - รายชื่อผู้ลงนามที่บันทึกไว้ในหน้านี้ จะแสดงเป็นตัวเลือกแรกในหน้าสร้างเอกสารสารบรรณทั้งหมดโดยอัตโนมัติ
                </p>
                <p>
                  - หากมีผู้บริหารหรือคณบดีท่านใหม่ สามารถกดแก้ไขชื่อและตำแหน่งในหน้านี้ได้ทันทีโดยไม่ต้องแก้ไขซอร์สโค้ดของระบบ
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add/Edit Signatory */}
      {showSignerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-900">
              {editingSignerIndex !== null ? "แก้ไขข้อมูลผู้ลงนาม" : "เพิ่มผู้ลงนามใหม่"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ป้ายกำกับ / สายงาน (สำหรับเลือกในเมนู)
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  placeholder="เช่น คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
                  value={signerForm.label || ""}
                  onChange={e => setSignerForm({ ...signerForm, label: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล (พร้อมยศ หรือตำแหน่งทางวิชาการ)
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  placeholder="เช่น ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย"
                  value={signerForm.name || ""}
                  onChange={e => setSignerForm({ ...signerForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่งทางการในการลงนาม (รองรับขึ้นบรรทัดใหม่)
                </label>
                <textarea
                  rows={3}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  placeholder="เช่น คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน&#10;อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ"
                  value={signerForm.position || ""}
                  onChange={e => setSignerForm({ ...signerForm, position: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="signer_is_active"
                  checked={signerForm.isActive !== false}
                  onChange={e => setSignerForm({ ...signerForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <label htmlFor="signer_is_active" className="text-xs font-medium text-slate-700">
                  เปิดให้เลือกใช้งานในแบบฟอร์มเอกสาร
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignerModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveSignerModal}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-colors"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Category */}
      {showNewCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-900">เพิ่มประเภทเอกสารใหม่</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสเอกสาร (Slug ภาษาอังกฤษตัวพิมพ์เล็ก)
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-mono font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  placeholder="เช่น announcement, certificate, memo_custom"
                  value={newCatSlug}
                  onChange={e => setNewCatSlug(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อประเภทเอกสารภาษาไทย
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  placeholder="เช่น ประกาศคณะ, หนังสือรับรอง"
                  value={newCatTitle}
                  onChange={e => setNewCatTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เค้าโครงพื้นฐาน (Layout Type)
                </label>
                <select
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  value={newCatLayout}
                  onChange={e => setNewCatLayout(e.target.value as any)}
                >
                  <option value="memo">บันทึกข้อความ (ครุฑซ้าย กระดาษ Letter มีเส้นประ)</option>
                  <option value="external">หนังสือภายนอก (ครุฑกลาง กระดาษ A4 รูปแบบทางการ)</option>
                  <option value="order">คำสั่ง/ประกาศ (ครุฑกลาง กระดาษ A4)</option>
                  <option value="custom">กำหนดเอง (Custom Layout)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewCatModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreateNewCategory}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {saving ? "กำลังสร้าง..." : "สร้างประเภทเอกสาร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

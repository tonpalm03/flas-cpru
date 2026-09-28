"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CheckSquare, 
  Printer, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Layers, 
  Save, 
  FolderOpen, 
  AlertCircle,
  HelpCircle,
  Clock,
  User,
  Building,
  Check,
  X
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { printDocumentView } from "@/lib/documentGenerator";
import { getChecklists, createChecklist } from "@/lib/firebaseService";
import { ChecklistSubmission } from "@/lib/types";

interface ChecklistItemDef {
  id: string;
  label: string;
  required: boolean;
  hint?: string;
}

const CHECKLIST_CATEGORIES: Record<
  "loan" | "reimbursement" | "travel" | "teaching_fee",
  { title: string; items: ChecklistItemDef[] }
> = {
  loan: {
    title: "ใบรายการเรียงลำดับเอกสารโครงการ (กรณีขอยืมเงินทดรองราชการ - 12 รายการ)",
    items: [
      { id: "loan_1", label: "1. สัญญายืมเงิน (แบบ 8500) ฉบับจริง 2 ฉบับ", required: true, hint: "ระบุตัวเลขและตัวอักษรตรงกัน" },
      { id: "loan_2", label: "2. บันทึกข้อความขอยืมเงินทดรองราชการ ผ่านความเห็นชอบคณบดี", required: true },
      { id: "loan_3", label: "3. สำเนาโครงการที่ได้รับอนุมัติจากมหาวิทยาลัย/คณะ", required: true },
      { id: "loan_4", label: "4. ตารางประมาณการค่าใช้จ่ายแจกแจงตามหมวดเงิน (ตอบแทน/ใช้สอย/วัสดุ)", required: true },
      { id: "loan_5", label: "5. กำหนดการดำเนินงานโครงการฉบับละเอียด", required: true },
      { id: "loan_6", label: "6. คำสั่งแต่งตั้งคณะกรรมการดำเนินงานโครงการ", required: true },
      { id: "loan_7", label: "7. หนังสือเชิญวิทยากร และแบบตอบรับการเป็นวิทยากร", required: false, hint: "กรณีมีวิทยากร" },
      { id: "loan_8", label: "8. ตารางแผนการใช้จ่ายเงินรายงวด / แผนกิจกรรม", required: true },
      { id: "loan_9", label: "9. ใบขออนุมัติใช้ยานพาหนะส่วนกลางของคณะ", required: false, hint: "กรณีเดินทางนอกสถานที่" },
      { id: "loan_10", label: "10. รายชื่อกลุ่มเป้าหมาย / จำนวนผู้เข้าร่วมโครงการ", required: true },
      { id: "loan_11", label: "11. หลักฐานการตรวจสอบยอดเงินงบประมาณคงเหลือจากฝ่ายการเงิน", required: true },
      { id: "loan_12", label: "12. เอกสารประวัติวิทยากรและหนังสือขออนุมัติเบิกจ่ายค่าตอบแทน", required: false }
    ]
  },
  reimbursement: {
    title: "ใบรายการเรียงลำดับเอกสารโครงการ (กรณีเบิกจ่ายเงิน / ส่งใช้คืนเงินยืม - 12 รายการ)",
    items: [
      { id: "reimb_1", label: "1. หนังสือนำส่งหลักฐานการเบิกจ่าย / ส่งใช้คืนเงินยืม", required: true },
      { id: "reimb_2", label: "2. ใบเสร็จรับเงิน / ใบสำคัญรับเงิน (ฉบับจริงทุกรายการ พร้อมลงนามผู้รับเงิน)", required: true },
      { id: "reimb_3", label: "3. ใบสำคัญรับเงินสำหรับวิทยากร พร้อมสำเนาบัตรประชาชนรับรองสำเนาถูกต้อง", required: false },
      { id: "reimb_4", label: "4. ตารางสรุปค่าใช้จ่ายจริงเปรียบเทียบงบประมาณที่ได้รับอนุมัติ", required: true },
      { id: "reimb_5", label: "5. ใบลงทะเบียนผู้เข้าร่วมโครงการ (มีลายมือชื่อตัวจริงทุกหน้า)", required: true },
      { id: "reimb_6", label: "6. ภาพถ่ายประกอบการดำเนินโครงการ (ไม่น้อยกว่า 6 ภาพ พร้อมคำบรรยายใต้ภาพ)", required: true },
      { id: "reimb_7", label: "7. รายงานผลการดำเนินโครงการฉบับสมบูรณ์ (สรุปผลตาม KPI และแบบประเมิน)", required: true },
      { id: "reimb_8", label: "8. ตัวอย่างผลงาน / เอกสารประกอบการอบรม (Handout/เอกสารแจก)", required: false },
      { id: "reimb_9", label: "9. แบบประเมินความพึงพอใจและสรุปผลการวิเคราะห์ความพึงพอใจ", required: true },
      { id: "reimb_10", label: "10. สัญญายืมเงินฉบับเดิม (กรณีส่งใช้เงินยืมทดรองราชการ)", required: false },
      { id: "reimb_11", label: "11. ใบนำฝากเงินสดคงเหลือคืนกองคลัง มหาวิทยาลัย (กรณีมีเงินเหลือจ่าย)", required: false },
      { id: "reimb_12", label: "12. สำเนาคำสั่งแต่งตั้งคณะกรรมการตรวจรับพัสดุ / กรรมการดำเนินงาน", required: true }
    ]
  },
  travel: {
    title: "ใบรายการเรียงลำดับเอกสารการเดินทางไปปฏิบัติราชการ (8 รายการ)",
    items: [
      { id: "travel_1", label: "1. บันทึกข้อความขออนุมัติเดินทางไปปฏิบัติราชการ ผ่านคณบดี", required: true },
      { id: "travel_2", label: "2. หนังสือเชิญประชุม / คำสั่งแต่งตั้งให้ไปปฏิบัติราชการ", required: true },
      { id: "travel_3", label: "3. ตารางประมาณการค่าใช้จ่ายเดินทาง (ค่าเบี้ยเลี้ยง, ที่พัก, พาหนะ)", required: true },
      { id: "travel_4", label: "4. ใบขออนุมัติใช้ยานพาหนะส่วนกลาง / ขออนุมัติใช้รถยนต์ส่วนบุคคล", required: true },
      { id: "travel_5", label: "5. หนังสือยินยอมการใช้รถยนต์ส่วนบุคคล (กรณีใช้รถยนต์ส่วนบุคคล)", required: false },
      { id: "travel_6", label: "6. แบบ บก.4231 (ใบเบิกเงินค่าใช้จ่ายในการเดินทางไปราชการ)", required: true },
      { id: "travel_7", label: "7. ใบเสร็จค่าน้ำมันเชื้อเพลิง / ค่าผ่านทาง / ตั๋วโดยสาร / ใบเสร็จค่าที่พัก", required: true },
      { id: "travel_8", label: "8. รายงานผลการเดินทางไปปฏิบัติราชการ (ส่งภายใน 15 วันทำการ)", required: true }
    ]
  },
  teaching_fee: {
    title: "ใบรายการเรียงลำดับเอกสารเบิกค่าตอบแทนการสอนและค่านิเทศ (8 รายการ)",
    items: [
      { id: "teach_1", label: "1. หนังสือขออนุมัติเบิกจ่ายค่าสอน / ค่านิเทศ ผ่านคณบดี", required: true },
      { id: "teach_2", label: "2. ตารางรายละเอียดการเบิกค่าสอนรายบุคคล (Excel แยกตามรายวิชา/กลุ่มเรียน)", required: true },
      { id: "teach_3", label: "3. ตารางสอนและบัญชีลงเวลาปฏิบัติการสอนจริง (Sign-in Sheet)", required: true },
      { id: "teach_4", label: "4. คำสั่งแต่งตั้งอาจารย์ผู้สอนประจำภาคการศึกษา / อาจารย์นิเทศก์", required: true },
      { id: "teach_5", label: "5. ตารางแผนการสอน (Course Syllabus) ที่ผ่านความเห็นชอบของสาขาวิชา", required: true },
      { id: "teach_6", label: "6. หลักฐานรายงานผลการส่งผลการเรียน (เกรด) ของนักศึกษาในระบบ", required: true },
      { id: "teach_7", label: "7. สมุดบันทึกการนิเทศและแบบประเมินผลการฝึกประสบการณ์ (กรณีค่านิเทศ)", required: false },
      { id: "teach_8", label: "8. หลักฐานการคำนวณภาษีหัก ณ ที่จ่าย 1%", required: true }
    ]
  }
};

export default function DocumentChecklistPage() {
  const { currentUser } = useRole();
  const [selectedType, setSelectedType] = useState<keyof typeof CHECKLIST_CATEGORIES>("loan");
  
  const [applicantName, setApplicantName] = useState("อาจารย์ ดร.ฤทธิชัย ภาระวิเศษ");
  const [department, setDepartment] = useState("สาขาวิชารัฐศาสตร์ คณะศิลปศาสตร์และวิทยาศาสตร์");
  const [projectName, setProjectName] = useState("โครงการพัฒนาศักยภาพและเสริมสร้างประสบการณ์เรียนรู้เชิงนวัตกรรม");
  const [amount, setAmount] = useState(35000);
  const [reviewerName, setReviewerName] = useState("นางสาวพรทิพย์ สารบรรณ (เจ้าหน้าที่ธุรการ/การเงิน)");

  // State: item states start completely EMPTY / FALSE (Fixing bug where items were defaulted to true)
  const [itemStates, setItemStates] = useState<Record<string, { status: "yes" | "no" | "na"; remark: string }>>({});

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedChecklists, setSavedChecklists] = useState<ChecklistSubmission[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await getChecklists();
        setSavedChecklists(list);
      } catch (err) {
        console.warn("Load checklists error:", err);
      }
    }
    loadData();
  }, []);

  const currentCategory = CHECKLIST_CATEGORIES[selectedType];

  const handleSetItemStatus = (itemId: string, status: "yes" | "no" | "na") => {
    setItemStates(prev => ({
      ...prev,
      [itemId]: {
        status,
        remark: prev[itemId]?.remark || ""
      }
    }));
  };

  const handleSetItemRemark = (itemId: string, remark: string) => {
    setItemStates(prev => ({
      ...prev,
      [itemId]: {
        status: prev[itemId]?.status || "no",
        remark
      }
    }));
  };

  const handleSaveChecklist = async () => {
    try {
      setSaving(true);
      const isComplete = currentCategory.items.every(item => {
        if (!item.required) return true;
        return itemStates[item.id]?.status === "yes" || itemStates[item.id]?.status === "na";
      });

      const created = await createChecklist({
        checklistType: selectedType,
        title: currentCategory.title,
        applicantName,
        department,
        projectName,
        amount,
        checkedItems: itemStates,
        isComplete,
        reviewerName,
        reviewDate: new Date().toISOString().split("T")[0],
        status: isComplete ? "verified" : "draft"
      }, currentUser);

      setSavedChecklists([created, ...savedChecklists]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("ไม่สามารถบันทึกเช็คลิสต์ได้: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalItemsCount = currentCategory.items.length;
  const passedCount = currentCategory.items.filter(item => itemStates[item.id]?.status === "yes").length;
  const naCount = currentCategory.items.filter(item => itemStates[item.id]?.status === "na").length;
  const missingCount = currentCategory.items.filter(item => itemStates[item.id]?.status === "no" || !itemStates[item.id]).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปศูนย์ธุรการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            ใบตรวจสอบรายการเรียงลำดับเอกสาร (Document Checklist Slip)
          </h1>
          <p className="text-xs text-slate-500">
            ตรวจเอกสาร 12 รายการตามแบบมาตรฐานของคณะ ก่อนส่งฝ่ายการเงินหรือเสนอคณบดีอนุมัติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <FolderOpen className="w-4 h-4 text-blue-900" />
            <span>ประวัติการตรวจ ({savedChecklists.length})</span>
          </button>
          <button
            type="button"
            onClick={handleSaveChecklist}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all"
          >
            <Save className="w-4 h-4 text-slate-700" />
            <span>{saving ? "กำลังบันทึก..." : "บันทึกผลตรวจ"}</span>
          </button>
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบนำส่งตรวจ (Print Slip)</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>บันทึกผลการตรวจสอบเอกสารลงในฐานข้อมูลเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Category Selection Pills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
          <Layers className="w-3.5 h-3.5 text-blue-900" /> เลือกแบบเช็คลิสต์:
        </span>
        <button
          type="button"
          onClick={() => setSelectedType("loan")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "loan" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          1. ยืมเงินทดรองราชการ (12 ข้อ)
        </button>
        <button
          type="button"
          onClick={() => setSelectedType("reimbursement")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "reimbursement" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          2. เบิกจ่ายเงิน / ส่งใช้เงินยืม (12 ข้อ)
        </button>
        <button
          type="button"
          onClick={() => setSelectedType("travel")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "travel" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          3. เดินทางไปปฏิบัติราชการ (8 ข้อ)
        </button>
        <button
          type="button"
          onClick={() => setSelectedType("teaching_fee")}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            selectedType === "teaching_fee" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          4. ค่าตอบแทนการสอน / ค่านิเทศ (8 ข้อ)
        </button>
      </div>

      {/* Progress Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-slate-700">ผลการตรวจสอบปัจจุบัน:</span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">ครบถ้วน ({passedCount})</span>
          <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">ไม่เกี่ยวข้อง ({naCount})</span>
          <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">ยังไม่แนบ/ขาด ({missingCount})</span>
        </div>
        <span className="text-xs text-slate-500">
          ความสมบูรณ์ {Math.round(((passedCount + naCount) / totalItemsCount) * 100)}%
        </span>
      </div>

      {/* Main Grid: Form on Left, Printable Slip on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-800">
        {/* Interactive Checklist Controller */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-4">
          <div className="pb-3 border-b border-slate-100 font-bold text-slate-900 flex items-center justify-between">
            <span>ข้อมูลโครงการและผู้ยื่นเอกสาร</span>
            <span className="text-[11px] text-blue-900 font-medium">เริ่มต้นไม่มีเครื่องหมายติ๊กถูก</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้ยื่นเอกสาร</label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">สังกัด / สาขาวิชา</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อโครงการ / เรื่อง</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">จำนวนเงิน (บาท)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ผู้ตรวจสอบเอกสาร (เจ้าหน้าที่)</label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          {/* Checklist Items Table */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-900 mb-2">รายการเอกสารที่ต้องตรวจสอบ:</h4>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {currentCategory.items.map((item) => {
                const currentStatus = itemStates[item.id]?.status;
                return (
                  <div 
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-slate-900 text-xs leading-snug">{item.label}</span>
                        {item.hint && <span className="block text-[10px] text-slate-400 mt-0.5">({item.hint})</span>}
                      </div>
                      {item.required && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold flex-shrink-0">
                          จำเป็น
                        </span>
                      )}
                    </div>

                    {/* Action Choice Pills */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSetItemStatus(item.id, "yes")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                          currentStatus === "yes" ? "bg-emerald-700 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Check className="w-3 h-3" /> มีเอกสาร
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetItemStatus(item.id, "no")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                          currentStatus === "no" ? "bg-rose-700 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <X className="w-3 h-3" /> ไม่มี / ขาด
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetItemStatus(item.id, "na")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          currentStatus === "na" ? "bg-slate-700 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        ไม่เกี่ยวข้อง (N/A)
                      </button>
                    </div>

                    {/* Optional Remark */}
                    <input
                      type="text"
                      placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)..."
                      value={itemStates[item.id]?.remark || ""}
                      onChange={(e) => handleSetItemRemark(item.id, e.target.value)}
                      className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white focus:outline-none focus:border-blue-900"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Printable Official Slip Container */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-bold text-slate-600">
            <span>ตัวอย่างใบปะหน้าตรวจเอกสาร (Printable Slip)</span>
            <span className="text-[11px] text-slate-400">ขนาด A4 มาตรฐาน</span>
          </div>

          <div
            id="printable-document-area"
            className="bg-white shadow-xl rounded-lg p-8 sm:p-10 w-full max-w-[210mm] min-h-[297mm] text-slate-900 font-sans leading-relaxed text-xs flex flex-col justify-between"
            style={{ fontFamily: "'TH Sarabun PSK', 'Sarabun', sans-serif" }}
          >
            <div>
              {/* Slip Header */}
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <h2 className="text-lg font-bold text-slate-900">
                  ใบตรวจสอบรายการเรียงลำดับเอกสารโครงการ
                </h2>
                <p className="text-sm font-semibold text-slate-800">
                  คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ
                </p>
                <p className="text-xs text-blue-900 font-medium mt-0.5">
                  ({currentCategory.title})
                </p>
              </div>

              {/* Info Header */}
              <div className="py-2.5 space-y-1 text-xs border-b border-slate-300">
                <div className="flex justify-between">
                  <div><strong>ชื่อผู้ยื่น:</strong> {applicantName}</div>
                  <div><strong>สังกัด:</strong> {department}</div>
                </div>
                <div><strong>ชื่อโครงการ:</strong> {projectName}</div>
                <div className="flex justify-between">
                  <div><strong>จำนวนเงิน:</strong> {amount.toLocaleString()} บาท</div>
                  <div><strong>วันที่ตรวจ:</strong> {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
              </div>

              {/* Items List Table */}
              <div className="pt-3">
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-center">
                      <th className="p-1.5 border-r border-slate-400 w-8">ลำดับ</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">รายการเอกสาร</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">มี</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">ไม่มี</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">N/A</th>
                      <th className="p-1.5 w-32">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategory.items.map((item, idx) => {
                      const state = itemStates[item.id]?.status;
                      return (
                        <tr key={item.id} className="border-b border-slate-300">
                          <td className="p-1.5 text-center border-r border-slate-300">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 font-medium">{item.label}</td>
                          <td className="p-1.5 text-center border-r border-slate-300 font-bold text-emerald-800">
                            {state === "yes" ? "✓" : ""}
                          </td>
                          <td className="p-1.5 text-center border-r border-slate-300 font-bold text-rose-800">
                            {state === "no" ? "✗" : ""}
                          </td>
                          <td className="p-1.5 text-center border-r border-slate-300 text-slate-500 font-medium">
                            {state === "na" ? "-" : ""}
                          </td>
                          <td className="p-1.5 text-[11px] text-slate-600">
                            {itemStates[item.id]?.remark || ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Block for Reviewer & Dean */}
            <div className="pt-8 pb-4 grid grid-cols-2 gap-6 text-center text-xs">
              <div className="border border-slate-300 p-3 rounded-lg">
                <p className="font-bold mb-6">ความเห็นเจ้าหน้าที่ผู้ตรวจสอบ</p>
                <p className="mb-6">(ลงชื่อ)........................................................</p>
                <p>({reviewerName})</p>
                <p className="text-slate-500 text-[10px] mt-0.5">เจ้าหน้าที่ผู้ตรวจรับเอกสาร</p>
              </div>

              <div className="border border-slate-300 p-3 rounded-lg">
                <p className="font-bold mb-6">ความเห็น / คำสั่งคณบดี</p>
                <p className="mb-6">(ลงชื่อ)........................................................</p>
                <p>(ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี)</p>
                <p className="text-slate-500 text-[10px] mt-0.5">คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">ประวัติการตรวจเช็คลิสต์เอกสาร</h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 mt-3 text-xs">
              {savedChecklists.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  ยังไม่มีประวัติการบันทึกเช็คลิสต์
                </div>
              ) : (
                savedChecklists.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{c.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.isComplete ? "เอกสารครบ" : "รอเอกสารเพิ่มเติม"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        ผู้ยื่น: {c.applicantName} ({c.department}) • งบ: {c.amount?.toLocaleString()} บาท
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileEdit, 
  Download, 
  Printer, 
  Sparkles, 
  FileText, 
  Check, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  FolderOpen, 
  X,
  AlertCircle,
  Clock,
  Building
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { exportMemoToWord, printDocumentView } from "@/lib/documentGenerator";
import { fetchSystemTemplatesConfig } from "@/lib/templateConfig";
import { getMemos, createMemo, updateMemo } from "@/lib/firebaseService";
import { OfficialMemo } from "@/lib/types";
import GarudaEmblem from "@/components/GarudaEmblem";

interface SpeakerItem {
  name: string;
  position: string;
  topic: string;
}

export default function MemoGeneratorPage() {
  const { currentUser } = useRole();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<
    "speaker_single" | "speaker_multiple" | "class_exemption" | "travel_duty" | "propose_dean"
  >("speaker_single");

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedMemos, setSavedMemos] = useState<OfficialMemo[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [activeMemoId, setActiveMemoId] = useState<string | null>(null);

  // Memo Form State
  const [facultyName, setFacultyName] = useState("คณะศิลปศาสตร์และวิทยาศาสตร์");
  const [department, setDepartment] = useState("สาขาวิชารัฐศาสตร์ คณะศิลปศาสตร์และวิทยาศาสตร์");
  const [docNumber, setDocNumber] = useState("อว 0643.04/ว ");
  const [date, setDate] = useState(new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }));
  const [to, setTo] = useState("คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์");
  const [subject, setSubject] = useState("ขอเรียนเชิญเป็นวิทยากรโครงการพัฒนาศักยภาพนักศึกษา");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("จึงเรียนมาเพื่อโปรดพิจารณาและให้ความอนุเคราะห์");
  const [signatoryName, setSignatoryName] = useState("อาจารย์ ดร.ฤทธิชัย ภาระวิเศษ");
  const [signatoryPosition, setSignatoryPosition] = useState("หัวหน้าโครงการ / อาจารย์ประจำสาขาวิชา");

  // Multi-speakers table state
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([
    { name: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี", position: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์", topic: "การประยุกต์ใช้ AI ในการบริหารภาครัฐ" },
    { name: "นายธีรเดช เจริญสุข", position: "ผู้เชี่ยวชาญด้านระบบสารสนเทศ", topic: "การพัฒนาเว็บแอปพลิเคชัน ERP ยุคใหม่" }
  ]);

  // Load system master settings & memos
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const config = await fetchSystemTemplatesConfig();
        if (config) {
          setFacultyName(config.facultyName);
          setDocNumber(`${config.defaultDocPrefix}ว `);
        }
        const memos = await getMemos();
        setSavedMemos(memos);
        loadDefaultTemplateContent("speaker_single", config);
      } catch (err) {
        console.warn("Init memo config error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadDefaultTemplateContent = (key: string, config?: any) => {
    switch (key) {
      case "speaker_single":
        setSubject("ขอเรียนเชิญเป็นวิทยากรโครงการพัฒนาศักยภาพนักศึกษา");
        setTo("คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ / อาจารย์ประจำสาขาวิชา");
        setP1("ด้วย สาขาวิชารัฐศาสตร์ คณะศิลปศาสตร์และวิทยาศาสตร์ มีกำหนดจัดโครงการพัฒนาศักยภาพและเสริมสร้างประสบการณ์เรียนรู้เชิงนวัตกรรม ประจำปีงบประมาณ พ.ศ. 2569 ในวันที่ 15 ตุลาคม 2569 เวลา 09.00 - 16.30 น. ณ ห้อง Smart Classroom 421");
        setP2("ในการนี้ สาขาวิชาพิจารณาเห็นว่าท่านเป็นผู้มีความรู้ ความเชี่ยวชาญ และประสบการณ์สูงในหัวข้อดังกล่าว จึงใคร่ขอเรียนเชิญท่านเป็นวิทยากรบรรยายตามวัน เวลา และสถานที่ดังกล่าวข้างต้น");
        setP3("จึงเรียนมาเพื่อโปรดพิจารณาและให้ความอนุเคราะห์");
        break;

      case "speaker_multiple":
        setSubject("ขอเรียนเชิญเป็นวิทยากรโครงการบริการวิชาการแก่ชุมชน (คณะวิทยากร)");
        setTo("ผู้อำนวยการหน่วยงาน / อาจารย์ประจำสาขาวิชา");
        setP1("ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มีกำหนดดำเนินโครงการยกระดับเศรษฐกิจฐานรากและพัฒนาทักษะวิชาชีพชุมชน ในวันที่ 22-24 ตุลาคม 2569 ณ ศาลาประชาคมบ้านเสี้ยวน้อย ตำบลท่าหินโงม อำเภอเมือง จังหวัดชัยภูมิ");
        setP2("เพื่อให้การดำเนินโครงการบรรลุตามวัตถุประสงค์และเกิดประโยชน์สูงสุด จึงใคร่ขอเรียนเชิญบุคลากรในสังกัดของท่าน จำนวน 2 ท่าน ตามรายชื่อและหัวข้อบรรยายแนบท้าย เพื่อเป็นวิทยากรในการจัดอบรมเชิงปฏิบัติการ");
        setP3("จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์");
        break;

      case "class_exemption":
        setSubject("ขอความอนุเคราะห์เวลาเรียนของนักศึกษาเข้าร่วมโครงการ");
        setTo("อาจารย์ผู้สอนประจำรายวิชาทุกท่าน");
        setP1("ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ ได้จัดโครงการอบรมเชิงปฏิบัติการ Startup Creator สร้างนวัตกรท่องเที่ยวรุ่นใหม่ ในวันพุธที่ 8 ตุลาคม 2569 เวลา 08.30 - 16.30 น. ณ อาคาร 4 ห้อง 421");
        setP2("เพื่อให้การดำเนินโครงการบรรลุตามวัตถุประสงค์ จึงใคร่ขอความอนุเคราะห์เวลาเรียนของนักศึกษาชั้นปีที่ 3 และ 4 สาขาวิชาบริหารธุรกิจ จำนวน 45 คน ตามรายชื่อแนบท้าย เพื่อเข้าร่วมกิจกรรมดังกล่าว");
        setP3("จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์");
        break;

      case "travel_duty":
        setSubject("ขออนุมัติเดินทางไปปฏิบัติราชการและขอใช้ยานพาหนะคณะ");
        setTo("คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์");
        setP1("ด้วย ข้าพเจ้าและคณะรวม 3 คน มีความจำเป็นต้องเดินทางไปดำเนินงานโครงการยกระดับเศรษฐกิจฐานราก ณ ชุมชนบ้านเสี้ยวน้อย ตำบลท่าหินโงม อำเภอเมือง จังหวัดชัยภูมิ ในวันที่ 20 ตุลาคม 2569");
        setP2("ในการนี้ จึงขออนุมัติเดินทางไปปฏิบัติราชการ พร้อมขออนุมัติใช้รถยนต์ส่วนกลางของคณะ หมายเลขทะเบียน นข 1234 ชัยภูมิ และขออนุมัติเบิกจ่ายค่าใช้จ่ายในการเดินทางตามระเบียบของทางราชการ");
        setP3("จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ");
        break;

      case "propose_dean":
        setSubject("ขอความอนุเคราะห์เสนออธิการบดีลงนามในหนังสือราชการ");
        setTo("คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์");
        setP1("ด้วย สาขาวิชารัฐศาสตร์ ได้จัดทำหนังสือราชการภายนอก เพื่อประสานความร่วมมือทางวิชาการและจัดหาสถานที่ฝึกประสบการณ์วิชาชีพแก่นักศึกษา ณ องค์การบริหารส่วนจังหวัดชัยภูมิ เรียบร้อยแล้ว");
        setP2("ในการนี้ จึงใคร่ขอความอนุเคราะห์จากท่าน เพื่อโปรดพิจารณาและนำกราบเรียนเสนอท่านอธิการบดีลงนามในหนังสือราชการดังกล่าว ตามเอกสารที่แนบมาพร้อมนี้");
        setP3("จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์");
        break;
    }
  };

  const handleSelectTemplate = (key: typeof selectedTemplateKey) => {
    setSelectedTemplateKey(key);
    loadDefaultTemplateContent(key);
  };

  const handleAddSpeaker = () => {
    setSpeakers([...speakers, { name: "", position: "", topic: "" }]);
  };

  const handleRemoveSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, idx) => idx !== index));
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const memoPayload: Omit<OfficialMemo, "id" | "createdAt"> = {
        title: subject,
        docNumber,
        department,
        date,
        to,
        subject,
        bodyParagraphs: [p1, p2, p3].filter(Boolean),
        signatoryName,
        signatoryPosition,
        templateType: 
          selectedTemplateKey === "speaker_single" ? "invite_speaker_internal" :
          selectedTemplateKey === "speaker_multiple" ? "invite_speaker_multiple" :
          selectedTemplateKey === "class_exemption" ? "class_exemption" :
          selectedTemplateKey === "travel_duty" ? "official_travel" : "general_memo",
        status: "draft"
      };

      if (activeMemoId) {
        await updateMemo(activeMemoId, memoPayload, currentUser);
      } else {
        const created = await createMemo(memoPayload, currentUser);
        setActiveMemoId(created.id);
        setSavedMemos([created, ...savedMemos]);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("บันทึกร่างไม่สำเร็จ: " + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleLoadMemo = (m: OfficialMemo) => {
    setActiveMemoId(m.id);
    setSubject(m.subject || m.title);
    setDocNumber(m.docNumber);
    setDepartment(m.department);
    setDate(m.date);
    setTo(m.to);
    setP1(m.bodyParagraphs[0] || "");
    setP2(m.bodyParagraphs[1] || "");
    setP3(m.bodyParagraphs[2] || "");
    setSignatoryName(m.signatoryName);
    setSignatoryPosition(m.signatoryPosition);
    setShowDraftsModal(false);
  };

  const handleExportWord = async () => {
    const tableData = selectedTemplateKey === "speaker_multiple" ? {
      tableHeaders: ["ลำดับ", "ชื่อ-สกุล วิทยากร", "ตำแหน่ง / สังกัด", "หัวข้อการบรรยาย"],
      tableRows: speakers.map((s, idx) => [(idx + 1).toString(), s.name, s.position, s.topic])
    } : {};

    await exportMemoToWord({
      department,
      docNumber,
      date,
      to,
      subject,
      paragraphs: [p1, p2, p3].filter(Boolean),
      signatoryName,
      signatoryPosition,
      ...tableData
    });
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
            สร้างบันทึกข้อความราชการ (Official Memo Generator)
          </h1>
          <p className="text-xs text-slate-500">
            สร้างบันทึกข้อความราชการตราครุฑมาตรฐาน บันทึกร่างในระบบ และส่งออก Word (.docx) และ PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDraftsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <FolderOpen className="w-4 h-4 text-blue-900" />
            <span>คลังร่าง ({savedMemos.length})</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all"
          >
            <Save className="w-4 h-4 text-slate-700" />
            <span>{savingDraft ? "กำลังบันทึก..." : activeMemoId ? "บันทึกการแก้ไข" : "บันทึกร่าง"}</span>
          </button>
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word (.docx)</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>บันทึกร่างบันทึกข้อความลงในฐานข้อมูลเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Template Selection Pills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-900" /> เลือกแม่แบบมาตรฐาน:
        </span>
        <button
          type="button"
          onClick={() => handleSelectTemplate("speaker_single")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            selectedTemplateKey === "speaker_single" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          1. เชิญวิทยากรเดี่ยว
        </button>
        <button
          type="button"
          onClick={() => handleSelectTemplate("speaker_multiple")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            selectedTemplateKey === "speaker_multiple" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          2. เชิญวิทยากรหลายท่าน
        </button>
        <button
          type="button"
          onClick={() => handleSelectTemplate("class_exemption")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            selectedTemplateKey === "class_exemption" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          3. ขอเวลาเรียนนักศึกษา
        </button>
        <button
          type="button"
          onClick={() => handleSelectTemplate("travel_duty")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            selectedTemplateKey === "travel_duty" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          4. ขอไปปฏิบัติราชการ
        </button>
        <button
          type="button"
          onClick={() => handleSelectTemplate("propose_dean")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            selectedTemplateKey === "propose_dean" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          5. เสนอคณบดี/อธิการบดี
        </button>
      </div>

      {/* Main Grid: Editor on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-bold text-slate-900">
            <span className="flex items-center gap-1.5">
              <FileEdit className="w-4 h-4 text-blue-900" /> กรอกข้อมูลบันทึกข้อความ
            </span>
            {activeMemoId && (
              <span className="text-[11px] font-normal text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                กำลังแก้ไขบันทึกข้อความร่าง
              </span>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ส่วนราชการ (หน่วยงานเจ้าของเรื่อง)</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ที่ (เลขที่หนังสือ)</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">วันที่</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">เรื่อง</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">เรียน</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ย่อหน้าที่ 1 (ข้อความเปิด/ความเดิม)</label>
            <textarea
              rows={3}
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ย่อหน้าที่ 2 (เนื้อหา/ความประสงค์)</label>
            <textarea
              rows={3}
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          {selectedTemplateKey === "speaker_multiple" && (
            <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-blue-900">ตารางรายชื่อวิทยากรและหัวข้อ</label>
                <button
                  type="button"
                  onClick={handleAddSpeaker}
                  className="px-2 py-1 bg-blue-900 text-white text-[10px] font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> เพิ่มวิทยากร
                </button>
              </div>

              {speakers.map((s, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>วิทยากรท่านที่ {idx + 1}</span>
                    {speakers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSpeaker(idx)}
                        className="text-rose-600 hover:text-rose-800 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล..."
                      value={s.name}
                      onChange={(e) => {
                        const next = [...speakers];
                        next[idx].name = e.target.value;
                        setSpeakers(next);
                      }}
                      className="border border-slate-200 rounded p-1.5"
                    />
                    <input
                      type="text"
                      placeholder="ตำแหน่ง / สังกัด..."
                      value={s.position}
                      onChange={(e) => {
                        const next = [...speakers];
                        next[idx].position = e.target.value;
                        setSpeakers(next);
                      }}
                      className="border border-slate-200 rounded p-1.5"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="หัวข้อการบรรยาย..."
                    value={s.topic}
                    onChange={(e) => {
                      const next = [...speakers];
                      next[idx].topic = e.target.value;
                      setSpeakers(next);
                    }}
                    className="w-full border border-slate-200 rounded p-1.5"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ย่อหน้าที่ 3 (ข้อความลงท้าย)</label>
            <input
              type="text"
              value={p3}
              onChange={(e) => setP3(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้ลงนาม</label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งผู้ลงนาม</label>
              <input
                type="text"
                value={signatoryPosition}
                onChange={(e) => setSignatoryPosition(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Printable Garuda Preview */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-bold text-slate-600">
            <span>ตัวอย่างเอกสารฉบับทางการ (Garuda Memo Preview)</span>
            <span className="text-[11px] text-slate-400">ขนาด A4 มาตรฐาน</span>
          </div>

          {/* Paper Container for print */}
          <div 
            id="printable-document-area"
            className="bg-white shadow-xl rounded-lg p-8 sm:p-12 w-full max-w-[210mm] min-h-[297mm] text-slate-900 font-sans leading-relaxed text-sm flex flex-col justify-between"
            style={{ fontFamily: "'TH Sarabun PSK', 'Sarabun', sans-serif" }}
          >
            <div>
              {/* Header with Center Garuda */}
              <div className="text-center pb-4">
                <GarudaEmblem size={72} className="mx-auto mb-2" />
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  บันทึกข้อความ
                </h2>
              </div>

              {/* Memo Info Table */}
              <div className="border-b-2 border-slate-900 pb-3 space-y-1.5 text-sm">
                <div className="flex">
                  <span className="font-bold w-24 flex-shrink-0">ส่วนราชการ:</span>
                  <span className="flex-1">{department}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex">
                    <span className="font-bold w-10 flex-shrink-0">ที่:</span>
                    <span className="font-mono">{docNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-12 flex-shrink-0">วันที่:</span>
                    <span>{date}</span>
                  </div>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 flex-shrink-0">เรื่อง:</span>
                  <span className="font-semibold flex-1">{subject}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 flex-shrink-0">เรียน:</span>
                  <span className="flex-1">{to}</span>
                </div>
              </div>

              {/* Body Content */}
              <div className="pt-6 space-y-4 text-sm text-justify">
                {p1 && <p className="indent-12 leading-relaxed">{p1}</p>}
                {p2 && <p className="indent-12 leading-relaxed">{p2}</p>}

                {selectedTemplateKey === "speaker_multiple" && speakers.length > 0 && (
                  <div className="py-2">
                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400 font-bold text-center">
                          <th className="p-1.5 border-r border-slate-400 w-10">ลำดับ</th>
                          <th className="p-1.5 border-r border-slate-400">ชื่อ-สกุล วิทยากร</th>
                          <th className="p-1.5 border-r border-slate-400">ตำแหน่ง / สังกัด</th>
                          <th className="p-1.5">หัวข้อการบรรยาย</th>
                        </tr>
                      </thead>
                      <tbody>
                        {speakers.map((s, idx) => (
                          <tr key={idx} className="border-b border-slate-400">
                            <td className="p-1.5 text-center border-r border-slate-400">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-400 font-medium">{s.name}</td>
                            <td className="p-1.5 border-r border-slate-400">{s.position}</td>
                            <td className="p-1.5">{s.topic}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {p3 && <p className="indent-12 leading-relaxed">{p3}</p>}
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-16 pb-6 text-right">
              <div className="inline-block text-center pr-4">
                <p className="mb-8">(ลงชื่อ)........................................................</p>
                <p className="font-bold">({signatoryName})</p>
                <p className="text-xs text-slate-600 mt-0.5">{signatoryPosition}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Drafts Vault */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">คลังบันทึกข้อความร่าง (Saved Memos)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 mt-3 text-xs">
              {savedMemos.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  ยังไม่มีร่างบันทึกข้อความที่บันทึกไว้
                </div>
              ) : (
                savedMemos.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                    <div className="max-w-md">
                      <p className="font-bold text-slate-900 text-xs">{m.subject || m.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        เลขที่: {m.docNumber || "-"} • วันที่: {m.date} • ผู้เสนอ: {m.proposerName || "อาจารย์"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadMemo(m)}
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold"
                    >
                      เปิดแก้ไข
                    </button>
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

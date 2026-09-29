"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileCheck, 
  Download, 
  Printer, 
  Plus, 
  Sparkles, 
  ArrowLeft, 
  Trash2, 
  Save, 
  FolderOpen, 
  Check, 
  X,
  Phone,
  Building,
  User,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Clock
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { printDocumentView, exportMemoToWord } from "@/lib/documentGenerator";
import { getResponses, createResponse } from "@/lib/firebaseService";
import { OfficialResponse } from "@/lib/types";
import GarudaEmblem from "@/components/GarudaEmblem";

interface ParticipantItem {
  name: string;
  position: string;
  telephone: string;
}

export default function ResponsesGeneratorPage() {
  const { currentUser } = useRole();
  const [templateKey, setTemplateKey] = useState<"speaker" | "activity" | "facility">("speaker");
  const [decision, setDecision] = useState<"accept" | "decline">("accept");
  const [declineReason, setDeclineReason] = useState("");

  const [responseNumber, setResponseNumber] = useState("ตบ 01/2569");
  const [responderName, setResponderName] = useState("นายธีรเดช วิทยากรเกียรติคุณ");
  const [responderPosition, setResponderPosition] = useState("ผู้เชี่ยวชาญด้านปัญญาประดิษฐ์และนวัตกรรมดิจิทัล");
  const [organization, setOrganization] = useState("สำนักงานส่งเสริมเศรษฐกิจดิจิทัล");
  const [telephone, setTelephone] = useState("089-123-4567");
  const [projectName, setProjectName] = useState("โครงการพัฒนาทักษะ AI Coding และการวิเคราะห์เชิงนโยบาย");
  const [eventDate, setEventDate] = useState("15 ตุลาคม 2569 เวลา 09.00 - 16.30 น.");
  const [location, setLocation] = useState("ห้อง Smart Classroom 421 คณะศิลปศาสตร์และวิทยาศาสตร์");
  const [feeOption, setFeeOption] = useState("ขอรับค่าตอบแทนวิทยากรตามระเบียบทางราชการ");

  // Participants list for activity response
  const [participants, setParticipants] = useState<ParticipantItem[]>([
    { name: "นางสาวชุติมา เจริญพร", position: "นักวิชาการศึกษา", telephone: "081-234-5678" },
    { name: "นายสมชาย ยิ่งยวด", position: "เจ้าหน้าที่ปฏิบัติการ", telephone: "089-876-5432" }
  ]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedResponses, setSavedResponses] = useState<OfficialResponse[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await getResponses();
        setSavedResponses(list);
      } catch (err) {
        console.warn("Load responses error:", err);
      }
    }
    loadData();
  }, []);

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: "", position: "", telephone: "" }]);
  };

  const handleRemoveParticipant = (idx: number) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const handleSaveToFirestore = async () => {
    try {
      setSaving(true);
      const created = await createResponse({
        responseNumber,
        responseType: templateKey,
        decision,
        declineReason: decision === "decline" ? declineReason : undefined,
        responderName,
        responderPosition,
        organization,
        telephone,
        projectName,
        eventDate,
        location,
        feeOption,
        participantsCount: templateKey === "activity" ? participants.length : 1,
        participantsList: templateKey === "activity" ? participants : undefined,
        status: "confirmed"
      }, currentUser);

      setSavedResponses([created, ...savedResponses]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("ไม่สามารถบันทึกแบบตอบรับได้: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportWord = async () => {
    const decisionText = decision === "accept"
      ? `ข้าพเจ้า ${responderName} ตำแหน่ง ${responderPosition} สังกัด ${organization} ขอแจ้งผลการพิจารณาว่า: มีความยินดีตอบรับเข้าร่วมกิจกรรมดังกล่าว โดย${feeOption}`
      : `ข้าพเจ้า ${responderName} ตำแหน่ง ${responderPosition} สังกัด ${organization} ขอแจ้งผลการพิจารณาว่า: มีความจำเป็นต้องขอปฏิเสธการเข้าร่วมกิจกรรมดังกล่าว เนื่องจาก "${declineReason || "ติดภารกิจราชการสำคัญอื่นที่ไม่อาจหลีกเลี่ยงได้"}" จึงไม่อาจเข้าร่วมได้ในวันเวลาดังกล่าว`;

    const tableData = (templateKey === "activity" && decision === "accept" && participants.length > 0) ? {
      tableHeaders: ["ลำดับ", "ชื่อ-สกุล ผู้เข้าร่วม", "ตำแหน่ง / สังกัด", "หมายเลขโทรศัพท์"],
      tableRows: participants.map((p, idx) => [(idx + 1).toString(), p.name, p.position, p.telephone])
    } : {};

    await exportMemoToWord({
      department: `${organization} (โทรศัพท์: ${telephone})`,
      docNumber: responseNumber,
      date: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
      to: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ",
      subject: `แบบตอบรับ/แจ้งผล: ${projectName}`,
      paragraphs: [
        `ตามที่ คณะศิลปศาสตร์และวิทยาศาสตร์ ได้มีหนังสือเชิญเข้าร่วม/ขอความอนุเคราะห์ ${projectName} ในวันที่ ${eventDate} ณ ${location} นั้น`,
        decisionText,
        `จึงเรียนมาเพื่อโปรดทราบและประสานงานต่อไป (ผู้ประสานงาน: ${responderName} โทร. ${telephone})`
      ],
      signatoryName: responderName,
      signatoryPosition: responderPosition,
      ...tableData
    });
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
            ทะเบียนและสร้างแบบตอบรับ (Official Responses Registry)
          </h1>
          <p className="text-xs text-slate-500">
            ระบบสร้างแบบตอบรับวิทยากร ตอบรับเข้าร่วมกิจกรรม และตอบรับการขอใช้สถานที่ชุมชน (ส่งออก Word & PDF)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <FolderOpen className="w-4 h-4 text-blue-900" />
            <span>ประวัติตอบรับ ({savedResponses.length})</span>
          </button>
          <button
            type="button"
            onClick={handleSaveToFirestore}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all"
          >
            <Save className="w-4 h-4 text-slate-700" />
            <span>{saving ? "กำลังบันทึก..." : "บันทึกในระบบ"}</span>
          </button>
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
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
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>บันทึกแบบตอบรับลงในฐานข้อมูลคณะสำเร็จแล้ว</span>
        </div>
      )}

      {/* Template Selector & Decision Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-900" /> ประเภทแบบตอบรับ:
          </span>
          <button
            type="button"
            onClick={() => setTemplateKey("speaker")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              templateKey === "speaker" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            1. ตอบรับการเป็นวิทยากร
          </button>
          <button
            type="button"
            onClick={() => setTemplateKey("activity")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              templateKey === "activity" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            2. ตอบรับเข้าร่วมกิจกรรม / อบรม
          </button>
          <button
            type="button"
            onClick={() => setTemplateKey("facility")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              templateKey === "facility" ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            3. ตอบรับขอใช้สถานที่ชุมชน
          </button>
        </div>

        {/* Decision Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDecision("accept")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              decision === "accept" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>ยินดีตอบรับ (Accept)</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision("decline")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              decision === "decline" ? "bg-rose-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>ขอปฏิเสธ (Decline)</span>
          </button>
        </div>
      </div>

      {/* Main Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-800">
        {/* Editor Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-bold text-slate-900">
            <span>กรอกรายละเอียดข้อมูลการตอบรับ</span>
            <span className="text-[11px] text-slate-500 font-mono">เลขที่: {responseNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อ-สกุล ผู้ตอบรับ/ผู้มีอำนาจ</label>
              <input
                type="text"
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
              <input
                type="text"
                value={responderPosition}
                onChange={(e) => setResponderPosition(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">หน่วยงาน / สังกัด</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ (ปรากฏในเอกสาร)</label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ชื่อโครงการที่เกี่ยวข้อง</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">วัน เวลา ที่จัดกิจกรรม</label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">สถานที่จัดกิจกรรม</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>

          {decision === "accept" ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เงื่อนไข / ความประสงค์เพิ่มเติม</label>
              <input
                type="text"
                value={feeOption}
                onChange={(e) => setFeeOption(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
              />
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <label className="block font-bold text-rose-900 mb-1">เหตุผลในการขอปฏิเสธ / ไม่สะดวกเข้าร่วม</label>
              <textarea
                rows={2}
                placeholder="ระบุเหตุผลความจำเป็น เช่น ติดภารกิจราชการสำคัญอื่น..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full border border-rose-300 rounded-lg p-2 focus:border-rose-500 focus:outline-none bg-white"
                required
              />
            </div>
          )}

          {/* Participant Table if Activity & Accept */}
          {templateKey === "activity" && decision === "accept" && (
            <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-blue-900">รายชื่อผู้เข้าร่วม ({participants.length} คน)</label>
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="px-2 py-1 bg-blue-900 text-white text-[10px] font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> เพิ่มรายชื่อ
                </button>
              </div>

              {participants.map((p, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="ชื่อ-สกุล..."
                    value={p.name}
                    onChange={(e) => {
                      const next = [...participants];
                      next[idx].name = e.target.value;
                      setParticipants(next);
                    }}
                    className="border border-slate-200 rounded p-1.5"
                  />
                  <input
                    type="text"
                    placeholder="ตำแหน่ง..."
                    value={p.position}
                    onChange={(e) => {
                      const next = [...participants];
                      next[idx].position = e.target.value;
                      setParticipants(next);
                    }}
                    className="border border-slate-200 rounded p-1.5"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="เบอร์โทร..."
                      value={p.telephone}
                      onChange={(e) => {
                        const next = [...participants];
                        next[idx].telephone = e.target.value;
                        setParticipants(next);
                      }}
                      className="border border-slate-200 rounded p-1.5 w-full"
                    />
                    {participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Preview Container */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-bold text-slate-600">
            <span>ตัวอย่างแบบตอบรับ (Response Preview)</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${
              decision === "accept" ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-rose-100 text-rose-800 font-bold"
            }`}>
              {decision === "accept" ? "ตอบรับเข้าร่วม" : "ขอปฏิเสธ"}
            </span>
          </div>

          <div
            id="printable-document-area"
            className="bg-white shadow-xl rounded-lg p-8 sm:p-12 w-full max-w-[210mm] min-h-[297mm] text-slate-900 font-sans leading-relaxed text-sm flex flex-col justify-between"
            style={{ fontFamily: "'TH Sarabun PSK', 'Sarabun', sans-serif" }}
          >
            <div>
              <div className="text-center pb-4">
                <GarudaEmblem size={64} className="mx-auto mb-2" />
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  แบบตอบรับหนังสือราชการ
                </h2>
              </div>

              <div className="border-b-2 border-slate-900 pb-3 space-y-1.5 text-sm">
                <div className="flex">
                  <span className="font-bold w-24 flex-shrink-0">หน่วยงาน:</span>
                  <span>{organization} (โทร. {telephone})</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex">
                    <span className="font-bold w-12 flex-shrink-0">เลขที่:</span>
                    <span className="font-mono">{responseNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-12 flex-shrink-0">วันที่:</span>
                    <span>{new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 flex-shrink-0">เรื่อง:</span>
                  <span className="font-semibold">{decision === "accept" ? "ตอบรับ:" : "ขอปฏิเสธ:"} {projectName}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 flex-shrink-0">เรียน:</span>
                  <span>คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ</span>
                </div>
              </div>

              <div className="pt-6 space-y-4 text-sm text-justify">
                <p className="indent-12 leading-relaxed">
                  ตามที่ คณะศิลปศาสตร์และวิทยาศาสตร์ ได้มีหนังสือเชิญเข้าร่วม/ขอความอนุเคราะห์ {projectName} ในวันที่ {eventDate} ณ {location} นั้น
                </p>

                {decision === "accept" ? (
                  <p className="indent-12 leading-relaxed">
                    ข้าพเจ้า <strong>{responderName}</strong> ตำแหน่ง {responderPosition} สังกัด {organization} ขอแจ้งผลการพิจารณาว่า: <strong>มีความยินดีตอบรับเข้าร่วมกิจกรรมดังกล่าว</strong> โดย{feeOption}
                  </p>
                ) : (
                  <p className="indent-12 leading-relaxed text-rose-900">
                    ข้าพเจ้า <strong>{responderName}</strong> ตำแหน่ง {responderPosition} สังกัด {organization} ขอแจ้งผลการพิจารณาว่า: <strong>มีความจำเป็นต้องขอปฏิเสธการเข้าร่วมกิจกรรมดังกล่าว</strong> เนื่องจาก "{declineReason || "ติดภารกิจราชการสำคัญอื่นที่ไม่อาจหลีกเลี่ยงได้"}" จึงไม่อาจเข้าร่วมได้ในวันเวลาดังกล่าว
                  </p>
                )}

                {templateKey === "activity" && decision === "accept" && participants.length > 0 && (
                  <div className="py-2">
                    <p className="font-bold text-xs mb-1">รายชื่อผู้เข้าร่วมกิจกรรม:</p>
                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400 font-bold text-center">
                          <th className="p-1.5 border-r border-slate-400 w-10">ลำดับ</th>
                          <th className="p-1.5 border-r border-slate-400">ชื่อ-สกุล ผู้เข้าร่วม</th>
                          <th className="p-1.5 border-r border-slate-400">ตำแหน่ง / สังกัด</th>
                          <th className="p-1.5">หมายเลขโทรศัพท์</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, idx) => (
                          <tr key={idx} className="border-b border-slate-400">
                            <td className="p-1.5 text-center border-r border-slate-400">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-400 font-medium">{p.name || "-"}</td>
                            <td className="p-1.5 border-r border-slate-400">{p.position || "-"}</td>
                            <td className="p-1.5">{p.telephone || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="indent-12 leading-relaxed">
                  จึงเรียนมาเพื่อโปรดทราบและประสานงานต่อไป (ผู้ประสานงาน: {responderName} โทร. {telephone})
                </p>
              </div>
            </div>

            <div className="pt-16 pb-6 text-right">
              <div className="inline-block text-center pr-4">
                <p className="mb-8">(ลงชื่อ)........................................................</p>
                <p className="font-bold">({responderName})</p>
                <p className="text-xs text-slate-600 mt-0.5">{responderPosition}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{organization}</p>
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
              <h3 className="font-bold text-base text-slate-900">ประวัติแบบตอบรับในระบบ</h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 mt-3 text-xs">
              {savedResponses.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  ยังไม่มีประวัติแบบตอบรับ
                </div>
              ) : (
                savedResponses.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900">{r.responseNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.decision === "accept" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {r.decision === "accept" ? "ตอบรับ" : "ปฏิเสธ"}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 text-xs mt-1">{r.projectName}</p>
                      <p className="text-[11px] text-slate-500">ผู้ตอบรับ: {r.responderName} ({r.organization})</p>
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

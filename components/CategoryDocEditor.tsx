"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { 
  AdminDocCategory, 
  AdminDocRegistryRecord, 
  AdminDocCategoryConfig, 
  AdminDocAction,
  UserProfile,
  SignatoryPreset
} from "@/lib/types";
import { bangkokDate, registryNumber } from "@/lib/adminRegistryModel";
import { documentHtml } from "@/lib/adminDocument";
import { getPaper } from "@/lib/adminTemplateSpec";
import { bodyHtmlToParagraphs, paragraphsToBodyHtml, sanitizeBodyHtml } from "@/lib/richBody";
import RichBodyEditor from "@/components/RichBodyEditor";
import { getSignatoryPresets, DEFAULT_SIGNATORY_PRESETS } from "@/lib/adminSignatoryService";
import { validateGovernmentDocument, ValidationReport, ValidationIssue } from "@/lib/documentValidationService";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  X, 
  Eye, 
  Check, 
  AlertCircle, 
  User, 
  Building, 
  Calendar, 
  Hash, 
  ArrowLeft, 
  Paperclip, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  FileSearch
} from "lucide-react";

interface CategoryDocEditorProps {
  category: AdminDocCategory;
  categoryTitle: string;
  categorySubtitle?: string;
  catConfig: AdminDocCategoryConfig | null;
  initialRecord: AdminDocRegistryRecord | null;
  year: number;
  currentUser: UserProfile | null;
  isAdmin: boolean;
  onSave: (record: AdminDocRegistryRecord, file: File | null, removeFile: boolean) => Promise<void>;
  onCancel: () => void;
}

// Preset Signers in Faculty of Liberal Arts and Sciences (Default fallback)
const FACULTY_SIGNER_PRESETS: SignatoryPreset[] = DEFAULT_SIGNATORY_PRESETS;

export interface DocumentPreset {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  to?: string;
  from?: string;
  bodyText: string;
  referenceDoc?: string;
  attachmentsText?: string;
  coordinatorInfo?: string;
  officeAddress?: string;
  signatoryName?: string;
  signatoryPosition?: string;
}

/** รวมเนื้อหา Rich Text กับรายชื่อคณะกรรมการ (คำสั่ง) เป็น HTML และย่อหน้าข้อความล้วนชุดเดียวกัน */
function composeBody(bodyHtml: string, committeeLines: string[]) {
  let html = bodyHtml || "";
  if (committeeLines.length > 0) {
    html += paragraphsToBodyHtml(["๑. คณะกรรมการ", ...committeeLines]);
  }
  const clean = sanitizeBodyHtml(html);
  const paragraphs = bodyHtmlToParagraphs(clean);
  return { html: paragraphs.length > 0 ? clean : "", paragraphs };
}

export default function CategoryDocEditor({
  category,
  categoryTitle,
  categorySubtitle,
  catConfig,
  initialRecord,
  year,
  currentUser,
  isAdmin,
  onSave,
  onCancel
}: CategoryDocEditorProps) {
  const isEditing = !!initialRecord;
  const isOrder = category === "order";
  const isExternal = category === "external" || category === "external_circular";
  const isCircular = category === "memo_circular" || category === "external_circular";

  // Stable document ID (prevents duplicates upon save retry)
  const [docId] = useState<string>(() => initialRecord?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'doc_' + Date.now()));

  // Active view tab on mobile/small screens ('form' | 'preview')
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [presetSuccessMessage, setPresetSuccessMessage] = useState("");

  // Pre-Flight Quality Check Validation State
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  // File attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Core Form Fields (Required by default)
  const [date, setDate] = useState<string>(() => initialRecord?.date || bangkokDate());
  const [from, setFrom] = useState<string>(() => {
    if (initialRecord?.from) return initialRecord.from;
    if (catConfig?.preset?.from) return catConfig.preset.from;
    if (category.startsWith("memo")) return "มหาวิทยาลัยราชภัฏชัยภูมิ คณะศิลปศาสตร์และวิทยาศาสตร์ โทร ๔๑๐๐";
    return "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ";
  });
  const [to, setTo] = useState<string>(() => initialRecord?.to || "");
  const [subject, setSubject] = useState<string>(() => initialRecord?.subject || "");
  // เนื้อหา Rich Text เป็นแหล่งข้อมูลหลัก bodyText (ข้อความล้วน) คำนวณจากมันสำหรับแม่แบบและการตรวจสอบ
  const [bodyHtml, setBodyHtml] = useState<string>(
    () => initialRecord?.bodyHtml || paragraphsToBodyHtml(initialRecord?.bodyParagraphs || [])
  );
  const bodyText = useMemo(() => bodyHtmlToParagraphs(bodyHtml).join("\n\n"), [bodyHtml]);
  const setBodyText = (text: string) =>
    setBodyHtml(paragraphsToBodyHtml(text.split("\n\n").map(s => s.trim()).filter(Boolean)));
  
  // Office address (Required for external documents)
  const [officeAddress, setOfficeAddress] = useState<string>(() => {
    if (initialRecord?.officeAddress) return initialRecord.officeAddress;
    if (isExternal) return "คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n๑๖๗ หมู่ ๒ ถนนชัยภูมิ-ตาดโตน\nตำบลนาฝาย อำเภอเมือง จังหวัดชัยภูมิ ๓๖๐๐๐";
    return "";
  });

  // Signatory state
  const [signerPresets, setSignerPresets] = useState<SignatoryPreset[]>(DEFAULT_SIGNATORY_PRESETS);

  useEffect(() => {
    let isMounted = true;
    getSignatoryPresets()
      .then(list => {
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setSignerPresets(list.filter(p => p.isActive !== false));
        }
      })
      .catch(() => {});

    const handleUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<SignatoryPreset[]>;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setSignerPresets(customEvt.detail.filter(p => p.isActive !== false));
      }
    };
    window.addEventListener("flas_signatories_updated", handleUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener("flas_signatories_updated", handleUpdated);
    };
  }, []);

  const [signatoryPreset, setSignatoryPreset] = useState<string>(() => {
    if (!initialRecord) return "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์";
    const found = DEFAULT_SIGNATORY_PRESETS.find(p => p.name === initialRecord.signatoryName);
    return found ? found.label : "custom";
  });
  const [signatoryName, setSignatoryName] = useState<string>(() => {
    if (initialRecord?.signatoryName) return initialRecord.signatoryName;
    return "ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย";
  });
  const [signatoryPosition, setSignatoryPosition] = useState<string>(() => {
    if (initialRecord?.signatoryPosition) return initialRecord.signatoryPosition;
    if (isExternal) return "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน\nอธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ";
    return "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์";
  });

  // Digits and layout
  const [digitType, setDigitType] = useState<"thai" | "arabic">(() => {
    if (initialRecord?.digitType) return initialRecord.digitType;
    return catConfig?.defaultDigitType || (isExternal ? "arabic" : "thai");
  });

  // Document number prefix and trailing sequence
  const docPrefix = useMemo(() => {
    return catConfig?.prefix || (isOrder ? "ที่ " : (category === "memo_circular" ? "อว 0646.02/ว " : (category === "external" ? "ที่ อว 0646.02/" : (category === "external_circular" ? "ที่ อว 0646.02/ว " : "อว 0646.02/"))));
  }, [catConfig, isOrder, category]);

  const [docNumberTrailing, setDocNumberTrailing] = useState<string>(() => {
    if (!initialRecord?.docNumber) return "";
    const raw = initialRecord.docNumber.trim();
    if (raw.startsWith("(") || raw === "อว 0646.02/" || raw === "อว ๐๖๔๖.๐๒/" || raw === "อว 0646.02/ว " || raw === "อว ๐๖๔๖.๐๒/ว ") return "";
    if (raw.includes("/")) {
      return raw.slice(raw.lastIndexOf("/") + 1).trim();
    }
    return raw.replace(/^ที่\s*/, "");
  });

  const effectiveDocNumber = useMemo(() => {
    const trailing = docNumberTrailing.trim();
    if (trailing) {
      if (isOrder) {
        if (trailing.includes("/")) return trailing.startsWith("ที่") ? trailing : `ที่ ${trailing}`;
        const yearStr = date ? String(Number(date.slice(0, 4)) + 543) : "2569";
        return `ที่ ${trailing}/${yearStr}`;
      }
      return `${docPrefix}${trailing}`;
    }
    return docPrefix;
  }, [docNumberTrailing, docPrefix, isOrder, date]);

  // Optional Section 1: อ้างถึง (Reference Document)
  const [showReference, setShowReference] = useState<boolean>(() => !!initialRecord?.referenceDoc?.trim());
  const [referenceDoc, setReferenceDoc] = useState<string>(() => initialRecord?.referenceDoc || "");

  // Optional Section 2: สิ่งที่ส่งมาด้วย (Attachments List)
  const [showAttachments, setShowAttachments] = useState<boolean>(() => (initialRecord?.attachmentsList || []).length > 0);
  const [attachmentsText, setAttachmentsText] = useState<string>(() => (initialRecord?.attachmentsList || []).join("\n"));

  // Optional Section 3: ผู้ประสานงาน / ส่วนท้าย (Coordinator Info)
  const [showCoordinator, setShowCoordinator] = useState<boolean>(() => !!initialRecord?.coordinatorInfo?.trim());
  const [coordinatorInfo, setCoordinatorInfo] = useState<string>(() => initialRecord?.coordinatorInfo || "");

  // Optional Section 4: ผู้รับเวียน (Recipients - for circular memos and external letters)
  const [showRecipients, setShowRecipients] = useState<boolean>(() => (initialRecord?.recipients || []).length > 0);
  const [recipientsText, setRecipientsText] = useState<string>(() => (initialRecord?.recipients || []).join("\n"));

  // Optional Section 5: รายชื่อคณะกรรมการ (Order Committee members - for order)
  const [showCommittee, setShowCommittee] = useState<boolean>(() => {
    if (!isOrder || !initialRecord?.bodyParagraphs) return false;
    return initialRecord.bodyParagraphs.some(p => /^[๐-๙0-9]+\.\s*/.test(p) || p.includes("ประธานกรรมการ"));
  });
  const [committeeText, setCommitteeText] = useState<string>(() => {
    if (!isOrder || !initialRecord?.bodyParagraphs) return "";
    const memberLines = initialRecord.bodyParagraphs.filter(p => /^[๐-๙0-9]+\.\s*/.test(p) || p.includes("กรรมการ"));
    return memberLines.join("\n");
  });

  // Handle preset signer change
  function handleSignerPresetChange(presetLabel: string) {
    setSignatoryPreset(presetLabel);
    if (presetLabel === "custom") {
      setSignatoryName("");
      setSignatoryPosition("");
      return;
    }
    const found = signerPresets.find(p => p.label === presetLabel);
    if (found) {
      setSignatoryName(found.name);
      setSignatoryPosition(found.position);
    }
  }

  // Clear optional section cleanly
  function handleRemoveReference() {
    setShowReference(false);
    setReferenceDoc("");
  }

  function handleRemoveAttachments() {
    setShowAttachments(false);
    setAttachmentsText("");
  }

  function handleRemoveCoordinator() {
    setShowCoordinator(false);
    setCoordinatorInfo("");
  }

  function handleRemoveRecipients() {
    setShowRecipients(false);
    setRecipientsText("");
  }

  function handleRemoveCommittee() {
    setShowCommittee(false);
    setCommitteeText("");
  }

  // Handle applying a preset template into form
  function handleApplyPreset(preset: DocumentPreset) {
    if (preset.subject) setSubject(preset.subject);
    if (preset.to !== undefined) setTo(preset.to);
    if (preset.from !== undefined) setFrom(preset.from);
    if (preset.bodyText) setBodyText(preset.bodyText);

    if (preset.referenceDoc) {
      setReferenceDoc(preset.referenceDoc);
      setShowReference(true);
    }
    if (preset.attachmentsText) {
      setAttachmentsText(preset.attachmentsText);
      setShowAttachments(true);
    }
    if (preset.coordinatorInfo) {
      setCoordinatorInfo(preset.coordinatorInfo);
      setShowCoordinator(true);
    }
    if (preset.officeAddress) {
      setOfficeAddress(preset.officeAddress);
    }
    if (preset.signatoryName) {
      setSignatoryName(preset.signatoryName);
    }
    if (preset.signatoryPosition) {
      setSignatoryPosition(preset.signatoryPosition);
    }

    setPresetSuccessMessage(`ดึงข้อมูลต้นแบบ "${preset.title}" เข้าสู่ฟอร์มเรียบร้อยแล้ว`);
    setTimeout(() => setPresetSuccessMessage(""), 5000);
  }

  // Reactive Live Preview Record Construction
  const draftPreviewRecord = useMemo<AdminDocRegistryRecord>(() => {
    // Combine body text and committee text if order
    const composedBody = composeBody(
      bodyHtml,
      isOrder && showCommittee ? committeeText.split("\n").map(s => s.trim()).filter(Boolean) : []
    );
    const parsedBodyParagraphs = composedBody.paragraphs;

    const cleanAttachments = showAttachments 
      ? attachmentsText.split("\n").map(s => s.trim()).filter(Boolean)
      : [];

    const cleanRecipients = showRecipients
      ? recipientsText.split("\n").map(s => s.trim()).filter(Boolean)
      : [];

    return {
      id: docId,
      category,
      year: initialRecord?.year || year,
      sequenceNumber: initialRecord?.sequenceNumber || 0,
      docNumber: effectiveDocNumber,
      isNumberIssued: Boolean(docNumberTrailing.trim()) || (initialRecord?.isNumberIssued || false),
      date: date || bangkokDate(),
      from: from.trim(),
      to: isOrder ? "-" : to.trim(),
      subject: subject.trim(),
      action: initialRecord?.action || "รอตรวจ",
      remarks: initialRecord?.remarks || "",
      referenceDoc: showReference ? referenceDoc.trim() : undefined,
      attachmentsList: cleanAttachments.length > 0 ? cleanAttachments : undefined,
      bodyHtml: composedBody.html || undefined,
      bodyParagraphs: parsedBodyParagraphs.length > 0 ? parsedBodyParagraphs : [
        "พิมพ์ข้อความเนื้อหาในแบบฟอร์มด้านซ้ายเพื่อดูตัวอย่างเอกสารจริง..."
      ],
      signatoryName: signatoryName.trim(),
      signatoryPosition: signatoryPosition.trim(),
      coordinatorInfo: showCoordinator ? coordinatorInfo.trim() : undefined,
      officeAddress: isExternal ? officeAddress.trim() : undefined,
      recipients: cleanRecipients.length > 0 ? cleanRecipients : undefined,
      digitType,
      paperSize: catConfig?.paperSize || "a4",
      headerLineStyle: catConfig?.headerLineStyle || "dot_leader",
      lineVisibility: catConfig?.lineVisibility,
      fileUrl: initialRecord?.fileUrl,
      fileName: initialRecord?.fileName,
      filePath: initialRecord?.filePath,
      signatureUrl: initialRecord?.signatureUrl,
      signedAt: initialRecord?.signedAt,
      signedById: initialRecord?.signedById,
      signedByName: initialRecord?.signedByName,
      createdById: initialRecord?.createdById || currentUser?.id,
      createdByName: initialRecord?.createdByName || currentUser?.name,
      createdAt: initialRecord?.createdAt || new Date().toISOString()
    };
  }, [
    category,
    year,
    initialRecord,
    effectiveDocNumber,
    docNumberTrailing,
    date,
    from,
    to,
    subject,
    bodyText,
    bodyHtml,
    isOrder,
    isExternal,
    showReference,
    referenceDoc,
    showAttachments,
    attachmentsText,
    showCoordinator,
    coordinatorInfo,
    showRecipients,
    recipientsText,
    showCommittee,
    committeeText,
    signatoryName,
    signatoryPosition,
    officeAddress,
    digitType,
    catConfig,
    currentUser
  ]);

  // ใช้ข้อความจากต้นแบบของหมวด (ไฟล์ Word ต้นฉบับ) ถ้ามีข้อความที่กรอกไว้แล้วให้ยืนยันก่อน
  function handleUseTemplate() {
    const p = catConfig?.preset;
    if (!p) return;
    if ((subject.trim() || bodyText.trim()) && !window.confirm("ข้อความที่กรอกไว้จะถูกแทนที่ด้วยต้นแบบ ต้องการดำเนินการต่อหรือไม่")) return;
    handleApplyPreset({
      id: category,
      title: categoryTitle,
      subtitle: "",
      subject: p.subject || "",
      to: p.to,
      from: p.from,
      bodyText: p.bodyText || "",
      referenceDoc: p.referenceDoc,
      attachmentsText: p.attachmentsText,
      coordinatorInfo: p.coordinatorInfo,
      officeAddress: p.officeAddress,
      signatoryName: p.signatoryName,
      signatoryPosition: p.signatoryPosition
    });
  }

  function handleOpenValidation() {
    const report = validateGovernmentDocument(draftPreviewRecord, category);
    setValidationReport(report);
    setShowValidationModal(true);
  }

  // Form submission handling
  async function handleSubmit(targetAction: AdminDocAction) {
    setFormError("");

    // Pre-Flight Quality & Compliance Check
    const report = validateGovernmentDocument(draftPreviewRecord, category);
    setValidationReport(report);

    // If sending for review ("รอตรวจ") and blocking errors exist, open validation modal
    if (targetAction === "รอตรวจ" && !report.isValid) {
      setShowValidationModal(true);
      return;
    }

    // Validate Required Fields by Category
    if (!from.trim()) {
      setFormError(isOrder ? "กรุณาระบุหน่วยงานผู้ออกคำสั่ง" : "กรุณาระบุส่วนราชการ / จาก");
      return;
    }
    if (!isOrder && !to.trim()) {
      setFormError("กรุณาระบุเรียน / ถึง");
      return;
    }
    if (!subject.trim()) {
      setFormError("กรุณาระบุเรื่อง");
      return;
    }
    if (isExternal && !officeAddress.trim()) {
      setFormError("กรุณาระบุที่ตั้งส่วนราชการ / ที่อยู่ผู้ออกหนังสือ");
      return;
    }
    if (!bodyText.trim() && targetAction === "รอตรวจ") {
      setFormError("กรุณาระบุเนื้อหาข้อความเอกสารก่อนส่งตรวจ");
      return;
    }

    // Prepare payload record
    const composedBody = composeBody(
      bodyHtml,
      isOrder && showCommittee ? committeeText.split("\n").map(s => s.trim()).filter(Boolean) : []
    );
    const parsedBodyParagraphs = composedBody.paragraphs;

    const cleanAttachments = showAttachments 
      ? attachmentsText.split("\n").map(s => s.trim()).filter(Boolean)
      : [];

    const cleanRecipients = showRecipients
      ? recipientsText.split("\n").map(s => s.trim()).filter(Boolean)
      : [];

    const cleanDate = date || bangkokDate();
    const computedYear = Number(cleanDate.slice(0, 4)) + 543;

    const payload: AdminDocRegistryRecord = {
      id: docId,
      category,
      year: computedYear,
      sequenceNumber: initialRecord?.sequenceNumber || 0,
      docNumber: effectiveDocNumber,
      isNumberIssued: Boolean(docNumberTrailing.trim()) || (initialRecord?.isNumberIssued || false),
      date: cleanDate,
      from: from.trim(),
      to: isOrder ? "-" : to.trim(),
      subject: subject.trim(),
      action: targetAction,
      remarks: initialRecord?.remarks || "",
      referenceDoc: showReference && referenceDoc.trim() ? referenceDoc.trim() : undefined,
      attachmentsList: cleanAttachments.length > 0 ? cleanAttachments : undefined,
      bodyHtml: composedBody.html || undefined,
      bodyParagraphs: parsedBodyParagraphs,
      signatoryName: signatoryName.trim(),
      signatoryPosition: signatoryPosition.trim(),
      coordinatorInfo: showCoordinator && coordinatorInfo.trim() ? coordinatorInfo.trim() : undefined,
      officeAddress: isExternal && officeAddress.trim() ? officeAddress.trim() : undefined,
      recipients: cleanRecipients.length > 0 ? cleanRecipients : undefined,
      digitType,
      paperSize: catConfig?.paperSize || "a4",
      headerLineStyle: catConfig?.headerLineStyle || "dot_leader",
      lineVisibility: catConfig?.lineVisibility,
      fileUrl: initialRecord?.fileUrl,
      fileName: initialRecord?.fileName,
      filePath: initialRecord?.filePath,
      signatureUrl: initialRecord?.signatureUrl,
      signedAt: initialRecord?.signedAt,
      signedById: initialRecord?.signedById,
      signedByName: initialRecord?.signedByName,
      createdById: initialRecord?.createdById || currentUser?.id || "guest",
      createdByName: initialRecord?.createdByName || currentUser?.name || "ผู้ใช้งาน",
      createdByEmail: currentUser?.email || undefined,
      createdAt: initialRecord?.createdAt || new Date().toISOString()
    };

    setBusy(true);
    try {
      await onSave(payload, attachmentFile, removeExistingFile);
    } catch (err: any) {
      setFormError(err.message || "เกิดข้อผิดพลาดในการบันทึกเอกสาร");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = "w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 focus:outline-none transition-all placeholder:text-slate-400";
  const labelStyle = "block text-xs font-semibold text-slate-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Top Navigation & Action Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="กลับสู่สมุดทะเบียน"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                {categoryTitle}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {isEditing ? `แก้ไขเอกสาร: ${initialRecord.docNumber || initialRecord.subject}` : `สร้างเอกสารใหม่ (${categoryTitle})`}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
              {isEditing 
                ? `สถานะปัจจุบัน: ${initialRecord.action}` 
                : "กรอกข้อมูลในแบบฟอร์มด้านซ้าย ระบบจะจัดหน้ามาตรฐานราชการและแสดงตัวอย่างจริงอัตโนมัติด้านขวา"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Responsive Tab Toggle on Mobile */}
          <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "form" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              แบบฟอร์ม
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                activeTab === "preview" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ตัวอย่าง</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>ยกเลิก</span>
          </button>

          <button
            type="button"
            onClick={handleOpenValidation}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs font-semibold hover:bg-blue-100 transition-all shadow-xs"
            title="ตรวจสอบความถูกต้องตามระเบียบงานสารบรรณก่อนส่งตรวจ"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>ตรวจเอกสาร</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("ฉบับร่าง")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs"
            title="บันทึกไว้ในฉบับร่างเพื่อแก้ไขต่อภายหลัง"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>{busy ? "กำลังบันทึก..." : "บันทึกร่าง"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("รอตรวจ")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-all shadow-sm"
            title="ส่งเอกสารเข้าสู่กระบวนการตรวจทานและออกเลขหนังสือ"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{busy ? "กำลังส่ง..." : "ส่งตรวจ"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (2-Column Split Grid on Desktop) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Column: Category-Tailored Form Editor */}
        <div className={`lg:col-span-6 xl:col-span-5 h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/50 border-r border-slate-200 ${
          activeTab === "form" ? "block" : "hidden lg:block"
        }`}>
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Preset Success Notification Toast */}
            {presetSuccessMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{presetSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPresetSuccessMessage("")}
                  className="text-emerald-700 hover:text-emerald-950 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ต้นแบบของหมวดนี้ (จากไฟล์ Word ต้นฉบับของคณะ) */}
            {catConfig?.preset?.bodyText && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">ต้นแบบ{categoryTitle}</p>
                  <p className="text-[11px] text-slate-500">ใช้ข้อความจากไฟล์ต้นแบบของคณะเป็นจุดเริ่มต้น แล้วแก้ไขได้ตามต้องการ</p>
                </div>
                <button
                  type="button"
                  onClick={handleUseTemplate}
                  className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ใช้ข้อความจากต้นแบบ</span>
                </button>
              </div>
            )}

            {/* Section 1: ข้อมูลหัวหนังสือ (Header Metadata) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs">
                    ๑
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">ข้อมูลหัวเอกสาร</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">รูปแบบตัวเลข:</span>
                  <select
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                    value={digitType}
                    onChange={e => setDigitType(e.target.value as any)}
                  >
                    <option value="thai">เลขไทย (๑ ๒ ๓)</option>
                    <option value="arabic">เลขอารบิก (1 2 3)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Date */}
                <div>
                  <label className={labelStyle}>
                    วันที่ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={inputStyle}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>

                {/* Doc Number with permanent prefix and trailing number input */}
                <div>
                  <label className={labelStyle}>
                    เลขที่หนังสือ <span className="text-slate-400 font-normal">(คำนำหน้าถาวร เติมเลขส่วนท้ายทีหลังได้)</span>
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-blue-900/20 focus-within:border-blue-900 transition-all bg-white shadow-sm">
                    <span className="inline-flex items-center px-3 bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm select-none border-r border-slate-200">
                      {docPrefix}
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 font-medium"
                      placeholder={isOrder ? "เช่น ๑๒๓ หรือ 123" : "เช่น ๑๗๔๑ หรือ 1741 (เว้นว่างไว้หากยังไม่ออกเลข)"}
                      value={docNumberTrailing}
                      onChange={e => setDocNumberTrailing(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ระบบจะคงคำนำหน้าไว้ตลอด เลขส่วนท้ายสามารถกรอกได้ทันทีหรือเว้นว่างไว้ให้ออกในขั้นตอนรอตรวจ
                  </p>
                </div>

                {/* Agency / From */}
                <div className="sm:col-span-2">
                  <label className={labelStyle}>
                    {isOrder ? "หน่วยงานผู้ออกคำสั่ง" : "ส่วนราชการ / จาก"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    placeholder={
                      isOrder 
                        ? "เช่น มหาวิทยาลัยราชภัฏชัยภูมิ หรือ คณะศิลปศาสตร์และวิทยาศาสตร์"
                        : "เช่น คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ โทร. ๐-๔๔๘๑-๕๑๑๑"
                    }
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                  />
                </div>

                {/* External Office Address (Only for external letters) */}
                {isExternal && (
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>
                      ที่ตั้งส่วนราชการ / ที่อยู่ผู้ออกหนังสือ <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      className={inputStyle + " leading-relaxed"}
                      placeholder="ระบุที่ตั้งส่วนราชการ เช่น คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ ๑๖๗ หมู่ ๒ ถนนชัยภูมิ-ตาดโตน..."
                      value={officeAddress}
                      onChange={e => setOfficeAddress(e.target.value)}
                    />
                  </div>
                )}

                {/* Subject */}
                <div className="sm:col-span-2">
                  <label className={labelStyle}>
                    เรื่อง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputStyle + " font-semibold"}
                    placeholder={
                      isOrder
                        ? "เช่น แต่งตั้งคณะกรรมการตรวจรับพัสดุสำหรับโครงการ..."
                        : "เช่น ขออนุมัติจัดโครงการสัมมนาเชิงปฏิบัติการ..."
                    }
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>

                {/* To (Hidden for Order) */}
                {!isOrder && (
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>
                      เรียน / ถึง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputStyle}
                      placeholder={
                        isCircular 
                          ? "เช่น รองคณบดีทุกท่าน / คณาจารย์และบุคลากรทุกท่าน"
                          : "เช่น คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
                      }
                      value={to}
                      onChange={e => setTo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: ส่วนเสริมทางเลือก (Optional Collapsible Sections) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold text-xs">
                    ๒
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">ส่วนเสริมทางเลือก</h2>
                    <p className="text-[11px] text-slate-500">เปิดเฉพาะส่วนที่ต้องการใช้งาน (เมื่อลบออกจะไม่เหลือข้อความค้าง)</p>
                  </div>
                </div>
              </div>

              {/* Optional Section Toggles Toolbar */}
              <div className="flex flex-wrap gap-2 pt-1">
                {isCircular && !showRecipients && (
                  <button
                    type="button"
                    onClick={() => setShowRecipients(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-800" />
                    <span>เพิ่มรายชื่อผู้รับเวียน</span>
                  </button>
                )}

                {!showReference && (
                  <button
                    type="button"
                    onClick={() => setShowReference(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-800" />
                    <span>{isOrder ? "เพิ่มอ้างถึงคำสั่งเดิม" : "เพิ่มอ้างถึง"}</span>
                  </button>
                )}

                {!isOrder && !showAttachments && (
                  <button
                    type="button"
                    onClick={() => setShowAttachments(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-800" />
                    <span>เพิ่มสิ่งที่ส่งมาด้วย</span>
                  </button>
                )}

                {isOrder && !showCommittee && (
                  <button
                    type="button"
                    onClick={() => setShowCommittee(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-800" />
                    <span>เพิ่มรายชื่อคณะกรรมการ/หน้าที่</span>
                  </button>
                )}

                {!showCoordinator && (
                  <button
                    type="button"
                    onClick={() => setShowCoordinator(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-800" />
                    <span>เพิ่มข้อมูลผู้ประสานงาน</span>
                  </button>
                )}
              </div>

              {/* Activated Optional Fields */}
              <div className="space-y-3.5 pt-2">
                {/* 1. Recipients Section (for circulars) */}
                {isCircular && showRecipients && (
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950">รายชื่อผู้รับเวียน / หน่วยงาน (บรรทัดละ ๑ รายการ)</span>
                      <button
                        type="button"
                        onClick={handleRemoveRecipients}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> ลบส่วนนี้
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      className={inputStyle}
                      placeholder="เช่น&#10;๑. รองคณบดีทุกท่าน&#10;๒. ประธานสาขาวิชาทุกสาขา&#10;๓. คณาจารย์และบุคลากรทุกท่าน"
                      value={recipientsText}
                      onChange={e => setRecipientsText(e.target.value)}
                    />
                  </div>
                )}

                {/* 2. Reference Section */}
                {showReference && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {isOrder ? "อ้างถึงคำสั่งเดิม (ถ้ามี)" : "อ้างถึงหนังสือ (ถ้ามี)"}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveReference}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> ลบส่วนนี้
                      </button>
                    </div>
                    <input
                      type="text"
                      className={inputStyle}
                      placeholder="เช่น หนังสือคณะศิลปศาสตร์และวิทยาศาสตร์ ที่ อว ๐๖๔๖.๐๒/๑๐๑ ลงวันที่ ๑ ตุลาคม ๒๕๖๙"
                      value={referenceDoc}
                      onChange={e => setReferenceDoc(e.target.value)}
                    />
                  </div>
                )}

                {/* 3. Attachments Section */}
                {!isOrder && showAttachments && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">สิ่งที่ส่งมาด้วย (ระบุ ๑ รายการต่อ ๑ บรรทัด)</span>
                      <button
                        type="button"
                        onClick={handleRemoveAttachments}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> ลบส่วนนี้
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      className={inputStyle}
                      placeholder="เช่น&#10;โครงการสัมมนาทางวิชาการ จำนวน ๑ ชุด&#10;กำหนดการจัดกิจกรรม จำนวน ๑ ฉบับ"
                      value={attachmentsText}
                      onChange={e => setAttachmentsText(e.target.value)}
                    />
                  </div>
                )}

                {/* 4. Order Committee Section */}
                {isOrder && showCommittee && (
                  <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">รายชื่อคณะกรรมการและตำแหน่ง (บรรทัดละ ๑ คน)</span>
                      <button
                        type="button"
                        onClick={handleRemoveCommittee}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> ลบส่วนนี้
                      </button>
                    </div>
                    <p className="text-[11px] text-purple-900/80">
                      พิมพ์ชื่อและตำแหน่ง เช่น &quot;๑. ผศ.ดร.สมชาย ใจดี ประธานกรรมการ&quot;
                    </p>
                    <textarea
                      rows={4}
                      className={inputStyle + " font-mono text-xs"}
                      placeholder="เช่น&#10;๑. ผศ.ดร.สมชาย ใจดี            ประธานกรรมการ&#10;๒. ดร.กานดา สารบรรณ          กรรมการ&#10;๓. นายวินัย การเงิน             กรรมการและเลขานุการ"
                      value={committeeText}
                      onChange={e => setCommitteeText(e.target.value)}
                    />
                  </div>
                )}

                {/* 5. Coordinator Section */}
                {showCoordinator && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950">ข้อมูลผู้ประสานงาน / ส่วนท้าย</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoordinator}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> ลบส่วนนี้
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      className={inputStyle}
                      placeholder="เช่น สำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ โทร. ๐-๔๔๘๑-๕๑๑๑ ต่อ ๔๑๐๐ (นายสมชาย ผู้ประสานงาน)"
                      value={coordinatorInfo}
                      onChange={e => setCoordinatorInfo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: เนื้อหาเอกสาร (Body Paragraphs) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs">
                    ๓
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {isOrder ? "เนื้อหาข้อความคำสั่งและเหตุผล" : "เนื้อหาเอกสาร (ย่อหน้า)"} <span className="text-rose-500">*</span>
                    </h2>
                    <p className="text-[11px] text-slate-500">Enter ขึ้นย่อหน้าใหม่ (เยื้อง ๒.๕ ซม. อัตโนมัติ) ปรับตัวหนา เอียง จัดแนว และการเยื้องได้จากแถบเครื่องมือ</p>
                  </div>
                </div>
              </div>

              <RichBodyEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                placeholder={
                  isOrder
                    ? "ระบุเหตุผลและอำนาจตามกฎหมายในการออกคำสั่ง เช่น ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ มีความจำเป็นต้องดำเนินการ... อาศัยอำนาจตามความในมาตรา ๓๑ แห่งพระราชบัญญัติมหาวิทยาลัยราชภัฏ พ.ศ. ๒๕๔๗ จึงแต่งตั้งคณะกรรมการ..."
                    : "ระบุข้อความเนื้อหาเอกสาร เช่น ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มีความประสงค์จะจัดโครงการสัมมนาเชิงปฏิบัติการ... ในการนี้ เพื่อให้การจัดโครงการเป็นไปด้วยความเรียบร้อย จึงใคร่ขออนุมัติ..."
                }
              />
            </div>

            {/* Section 4: ผู้ลงนาม (Signatory) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold text-xs">
                    ๔
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">ผู้ลงนาม</h2>
                    <p className="text-[11px] text-slate-500">เลือกจากผู้บริหารคณะที่มีสิทธิ์ลงนาม หรือกำหนดเอง</p>
                  </div>
                </div>
              </div>

              {/* Quick Signer Preset Selector */}
              <div>
                <label className={labelStyle}>เลือกผู้ลงนามมาตรฐาน</label>
                <select
                  className={inputStyle}
                  value={signatoryPreset}
                  onChange={e => handleSignerPresetChange(e.target.value)}
                >
                  {signerPresets.map(p => (
                    <option key={p.id || p.label} value={p.label}>
                      {p.label} ({p.name})
                    </option>
                  ))}
                  <option value="custom">กำหนดชื่อและตำแหน่งผู้ลงนามเอง...</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelStyle}>ชื่อ-นามสกุลผู้ลงนาม</label>
                  <input
                    type="text"
                    className={inputStyle}
                    placeholder="เช่น ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย"
                    value={signatoryName}
                    onChange={e => {
                      setSignatoryName(e.target.value);
                      setSignatoryPreset("custom");
                    }}
                  />
                </div>

                <div>
                  <label className={labelStyle}>ตำแหน่งผู้ลงนาม</label>
                  <input
                    type="text"
                    className={inputStyle}
                    placeholder="เช่น คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
                    value={signatoryPosition}
                    onChange={e => {
                      setSignatoryPosition(e.target.value);
                      setSignatoryPreset("custom");
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: ไฟล์แนบเอกสาร (Attachment Upload) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center font-bold text-xs">
                    ๕
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">ไฟล์แนบ / ฉบับสแกน (ถ้ามี)</h2>
                    <p className="text-[11px] text-slate-500">รองรับไฟล์ PDF, Word (.docx) หรือภาพสแกน</p>
                  </div>
                </div>
              </div>

              {initialRecord?.fileUrl && !removeExistingFile ? (
                <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-700" />
                    <span className="font-semibold text-blue-950">{initialRecord.fileName || "ไฟล์แนบปัจจุบัน"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveExistingFile(true)}
                    className="text-rose-600 hover:underline font-semibold"
                  >
                    ลบไฟล์นี้
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                  onChange={e => setAttachmentFile(e.target.files?.[0] || null)}
                  className={inputStyle}
                />
              )}
            </div>

            {/* Bottom Actions inside form */}
            <div className="flex items-center justify-end gap-2.5 pt-4 pb-8">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("ฉบับร่าง")}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>บันทึกร่าง</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("รอตรวจ")}
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>ส่งตรวจ</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Real-time Live Preview (A4 Standard Paper View) */}
        <div className={`lg:col-span-6 xl:col-span-7 h-full flex flex-col bg-slate-200/80 overflow-hidden ${
          activeTab === "preview" ? "block" : "hidden lg:flex"
        }`}>
          {/* Live Preview Control Bar */}
          <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold tracking-tight">ตัวอย่างเอกสารจริง (Live Preview จากแม่แบบคงที่)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                {getPaper(draftPreviewRecord.category).label}
              </span>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomScale(s => Math.max(60, s - 10))}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors"
                title="ย่อ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-300">{zoomScale}%</span>
              <button
                type="button"
                onClick={() => setZoomScale(s => Math.min(140, s + 10))}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors"
                title="ขยาย"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Embedded Sandboxed IFrame Preview */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start">
            <div 
              className="bg-white shadow-2xl rounded-sm transition-all duration-150 origin-top"
              style={{
                width: `${getPaper(draftPreviewRecord.category).mm.width}mm`,
                minHeight: `${getPaper(draftPreviewRecord.category).mm.height}mm`,
                transform: `scale(${zoomScale / 100})`,
                transformOrigin: "top center"
              }}
            >
              <iframe
                title="Live Document Preview"
                srcDoc={documentHtml(
                  draftPreviewRecord, 
                  typeof window !== "undefined" ? window.location.origin : ""
                )}
                className="w-full border-0 pointer-events-none"
                style={{
                  height: `${getPaper(draftPreviewRecord.category).mm.height}mm`,
                  overflow: "hidden"
                }}
              />
            </div>
          </div>
        </div>

      {/* Pre-Flight Document Quality Check & Validation Modal */}
      {showValidationModal && validationReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                  validationReport.isValid ? "bg-emerald-600" : "bg-blue-900"
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">การตรวจสอบคุณภาพเอกสาร (Pre-Flight Quality Check)</h3>
                  <p className="text-[11px] text-slate-500">
                    ตามระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖ และข้อกำหนดมาตรฐานของคณะ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className={`p-3 rounded-2xl border text-center ${
                  validationReport.errorCount > 0 
                    ? "bg-rose-50 border-rose-200 text-rose-900" 
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  <div className="text-xl font-black">{validationReport.errorCount}</div>
                  <div className="text-[10px] font-bold mt-0.5">ข้อผิดพลาดร้ายแรง</div>
                </div>

                <div className={`p-3 rounded-2xl border text-center ${
                  validationReport.warningCount > 0 
                    ? "bg-amber-50 border-amber-200 text-amber-900" 
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  <div className="text-xl font-black">{validationReport.warningCount}</div>
                  <div className="text-[10px] font-bold mt-0.5">ข้อควรระวัง</div>
                </div>

                <div className={`p-3 rounded-2xl border text-center ${
                  validationReport.suggestionCount > 0 
                    ? "bg-blue-50 border-blue-200 text-blue-900" 
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  <div className="text-xl font-black">{validationReport.suggestionCount}</div>
                  <div className="text-[10px] font-bold mt-0.5">คำแนะนำ</div>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 font-semibold ${
                validationReport.isValid
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}>
                {validationReport.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{validationReport.summaryText}</span>
              </div>

              {/* Issues List */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  รายการผลการตรวจสอบอย่างละเอียด ({validationReport.issues.length} รายการ):
                </span>

                {validationReport.issues.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">เอกสารถูกต้องสมบูรณ์ทุกรายการ</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">พร้อมสำหรับการบันทึกร่างหรือส่งตรวจ</p>
                  </div>
                ) : (
                  validationReport.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        issue.severity === "error"
                          ? "bg-rose-50/50 border-rose-200"
                          : issue.severity === "warning"
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-blue-50/40 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {issue.severity === "error" && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                          {issue.severity === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                          {issue.severity === "suggestion" && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
                          <span className="text-xs font-bold text-slate-900">{issue.title}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          issue.severity === "error"
                            ? "bg-rose-100 text-rose-800"
                            : issue.severity === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {issue.severity === "error" ? "ข้อผิดพลาด" : issue.severity === "warning" ? "ข้อควรระวัง" : "คำแนะนำ"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        {issue.message}
                      </p>

                      <div className="bg-white/80 p-2 rounded-xl text-[11px] text-slate-700 border border-slate-200/60">
                        <span className="font-semibold text-slate-900">วิธีแก้ไข: </span>
                        {issue.recommendation}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {validationReport.isValid ? "เอกสารพร้อมส่งตรวจแล้ว" : "กรุณาแก้ไขข้อผิดพลาดก่อนส่งตรวจ"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowValidationModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  ปิดเพื่อแก้ไข
                </button>
                {validationReport.isValid && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowValidationModal(false);
                      handleSubmit("รอตรวจ");
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ดำเนินการส่งตรวจทันที</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
}

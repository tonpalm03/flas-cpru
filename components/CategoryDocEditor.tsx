"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { 
  AdminDocCategory, 
  AdminDocRegistryRecord, 
  AdminDocCategoryConfig, 
  AdminDocAction,
  UserProfile
} from "@/lib/types";
import { bangkokDate, registryNumber } from "@/lib/adminRegistryModel";
import { documentHtml } from "@/lib/adminDocument";
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
  FileCheck,
  Sparkles,
  HelpCircle
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

// Preset Signers in Faculty of Liberal Arts and Sciences
const FACULTY_SIGNER_PRESETS = [
  {
    label: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    name: "ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย",
    position: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
  },
  {
    label: "คณบดี (ปฏิบัติราชการแทนอธิการบดี)",
    name: "ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย",
    position: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน\nอธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ"
  },
  {
    label: "รองคณบดีฝ่ายวิชาการและวิจัย",
    name: "ผู้ช่วยศาสตราจารย์ ดร.วันวิสาข์ ปิ่นเพ็ชร",
    position: "รองคณบดีฝ่ายวิชาการและวิจัย"
  },
  {
    label: "รองคณบดีฝ่ายบริหารและแผนงาน",
    name: "อาจารย์พงศ์ธร มิ่งเมือง",
    position: "รองคณบดีฝ่ายบริหารและแผนงาน"
  },
  {
    label: "หัวหน้าสำนักงานคณบดี",
    name: "นางสาวศิริพร บุญช่วย",
    position: "หัวหน้าสำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"
  }
];

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

export const OFFICIAL_CATEGORY_PRESETS: Record<string, DocumentPreset[]> = {
  memo: [
    {
      id: "memo_project_approval",
      title: "ขออนุมัติจัดโครงการ / กิจกรรม",
      subtitle: "ขออนุมัติจัดโครงการและขออนุมัติใช้เงินงบประมาณประจำปี",
      subject: "ขออนุมัติจัดโครงการ... และขออนุมัติใช้เงินงบประมาณประจำปี...",
      to: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
      bodyText: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มีความประสงค์จะจัดโครงการ... ในระหว่างวันที่... ณ ... โดยมีวัตถุประสงค์เพื่อพัฒนาทักษะและความรู้ความสามารถของนักศึกษาและบุคลากร\n\nในการนี้ คณะฯ ขออนุมัติจัดโครงการดังกล่าว โดยขออนุมัติใช้เงินงบประมาณ... จำนวนเงินทั้งสิ้น... บาท (...) รายละเอียดตามเอกสารโครงการที่แนบมาพร้อมนี้\n\nจึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ",
      attachmentsText: "๑. โครงการ... จำนวน ๑ ชุด"
    },
    {
      id: "memo_disbursement",
      title: "ขออนุมัติเบิกจ่ายเงินงบประมาณ",
      subtitle: "ขอเบิกจ่ายเงินงบประมาณหลังดำเนินโครงการเสร็จสิ้น",
      subject: "ขออนุมัติเบิกจ่ายเงินงบประมาณค่าใช้จ่ายในการดำเนินโครงการ...",
      to: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
      bodyText: "ตามที่ คณะศิลปศาสตร์และวิทยาศาสตร์ ได้อนุมัติให้ดำเนินโครงการ... ในระหว่างวันที่... ณ ... นั้น\n\nบัดนี้ การดำเนินโครงการดังกล่าวได้เสร็จสิ้นเป็นที่เรียบร้อยแล้ว จึงขออนุมัติเบิกจ่ายเงินงบประมาณ... จำนวนเงินทั้งสิ้น... บาท (...) ตามใบสำคัญรับเงินและเอกสารประกอบการเบิกจ่ายที่แนบมาพร้อมนี้\n\nจึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ",
      referenceDoc: "บันทึกข้อความ ที่ อว ๐๖๔๖.๐๒/๑๐๑ ลงวันที่ ๑๐ มกราคม ๒๕๖๙",
      attachmentsText: "๑. ใบสำคัญรับเงินและหลักฐานการจ่าย  จำนวน ๑ ชุด"
    },
    {
      id: "memo_facility_request",
      title: "ขอความอนุเคราะห์ใช้อาคารสถานที่และอุปกรณ์",
      subtitle: "ขอความอนุเคราะห์ใช้อาคาร ห้องประชุม หรืออุปกรณ์โสตทัศนูปกรณ์",
      subject: "ขอความอนุเคราะห์ใช้อาคารสถานที่และอุปกรณ์ในการจัดกิจกรรม...",
      to: "ผู้อำนวยการกองกลาง / ผู้ดูแลอาคารสถานที่",
      bodyText: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ กำหนดจัดกิจกรรม... ในวัน... ที่... เวลา... ถึง... น. ณ ...\n\nในการนี้ คณะฯ จึงใคร่ขอความอนุเคราะห์ใช้อาคารสถานที่ และอุปกรณ์เครื่องเสียง/โสตทัศนูปกรณ์ เพื่อใช้ในการจัดกิจกรรมดังกล่าว\n\nจึงเรียนมาเพื่อโปรดพิจารณาอนุเคราะห์"
    }
  ],
  memo_circular: [
    {
      id: "memo_circ_meeting",
      title: "บันทึกเวียนแจ้งเข้าร่วมการประชุม",
      subtitle: "แจ้งเวียนบุคลากรเข้าร่วมประชุมประจำคณะ หรือประชุมสาขาวิชา",
      subject: "ขอแจ้งเวียนเข้าร่วมการประชุมบุคลากรประจำคณะศิลปศาสตร์และวิทยาศาสตร์",
      to: "อาจารย์ผู้สอนประจำรายวิชา และบุคลากรทุกท่าน",
      bodyText: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ กำหนดจัดประชุมบุคลากรประจำคณะ ครั้งที่... ในวัน... ที่... เวลา... น. ณ ...\n\nในการนี้ จึงขอเรียนเชิญท่านและบุคลากรในสังกัดเข้าร่วมการประชุมดังกล่าวโดยพร้อมเพรียงกัน\n\nจึงเรียนมาเพื่อทราบและเข้าร่วมประชุมตามวันและเวลาดังกล่าว"
    },
    {
      id: "memo_circ_guideline",
      title: "บันทึกเวียนแจ้งแนวปฏิบัติ / มาตรการความปลอดภัย",
      subtitle: "แจ้งเวียนแนวปฏิบัติงาน สวัสดิภาพ หรือประกาศสำคัญของคณะ",
      subject: "แจ้งแนวปฏิบัติการดำเนินงานและการรักษาความปลอดภัยภายในอาคารเรียน",
      to: "หัวหน้าสำนักงาน คณาจารย์ และเจ้าหน้าที่ทุกคน",
      bodyText: "ตามที่ คณะศิลปศาสตร์และวิทยาศาสตร์ ได้กำหนดแนวปฏิบัติการดำเนินงาน... เพื่อให้การดำเนินงานของคณะเป็นไปด้วยความเรียบร้อยและมีประสิทธิภาพ\n\nในการนี้ จึงขอแจ้งเวียนแนวปฏิบัติดังกล่าวให้บุคลากรทุกคนถือปฏิบัติโดยเคร่งครัด รายละเอียดตามเอกสารแนบ\n\nจึงเรียนมาเพื่อทราบและถือปฏิบัติต่อไป"
    }
  ],
  external: [
    {
      id: "ext_study_visit",
      title: "หนังสือขอความอนุเคราะห์นำนักศึกษาเข้าศึกษาดูงาน",
      subtitle: "หนังสือภายนอกส่งถึงหน่วยงาน/บริษัท เพื่อขอเข้าศึกษาดูงาน",
      subject: "ขอความอนุเคราะห์นำนักศึกษาเข้าศึกษาดูงาน",
      to: "ผู้อำนวยการ...",
      officeAddress: "คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 ถนนชัยภูมิ-ตาดโตน ตำบลนาฝาย\nอำเภอเมือง จังหวัดชัยภูมิ 36000",
      bodyText: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ กำหนดจัดกิจกรรมการเรียนการสอนในรายวิชา... ให้แก่นักศึกษาชั้นปีที่... จำนวน... คน ในการนี้ คณะฯ เล็งเห็นว่าหน่วยงานของท่านเป็นหน่วยงานที่มีความเชี่ยวชาญและมีผลงานเป็นที่ประจักษ์\n\nคณะศิลปศาสตร์และวิทยาศาสตร์ จึงใคร่ขอความอนุเคราะห์นำนักศึกษาและอาจารย์ผู้ควบคุมเข้าศึกษาดูงาน ณ หน่วยงานของท่าน ในวัน... ที่... เวลา... น.\n\nจึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้",
      coordinatorInfo: "สำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์\nโทรศัพท์ 044 815 111 ต่อ 4100"
    },
    {
      id: "ext_guest_speaker",
      title: "หนังสือขอเชิญเป็นวิทยากรบรรยาย",
      subtitle: "หนังสือภายนอกส่งถึงผู้เชี่ยวชาญเพื่อขอเชิญบรรยายพิเศษ",
      subject: "ขอเชิญเป็นวิทยากรบรรยายโครงการ...",
      to: "ท่านผู้เชี่ยวชาญ / (ชื่อ-นามสกุลวิทยากร)",
      officeAddress: "คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 ถนนชัยภูมิ-ตาดโตน ตำบลนาฝาย\nอำเภอเมือง จังหวัดชัยภูมิ 36000",
      bodyText: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ กำหนดจัดโครงการ... ในระหว่างวันที่... ณ ... โดยมีวัตถุประสงค์เพื่อ...\n\nในการนี้ คณะฯ เล็งเห็นว่าท่านเป็นผู้มีความรู้ ความสามารถ และประสบการณ์สูง จึงใคร่ขอเรียนเชิญท่านให้เกียรติเป็นวิทยากรบรรยายในหัวข้อ \"...\" ในวัน... ที่... เวลา... น.\n\nจึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้",
      coordinatorInfo: "สำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์\nโทรศัพท์ 044 815 111 ต่อ 4100"
    }
  ],
  external_circular: [
    {
      id: "ext_circ_publicity",
      title: "หนังสือเวียนขอความอนุเคราะห์ประชาสัมพันธ์",
      subtitle: "ส่งถึงหน่วยงานภายนอกหลายแห่งเพื่อประชาสัมพันธ์กิจกรรม",
      subject: "ขอความอนุเคราะห์ประชาสัมพันธ์การรับสมัครนักศึกษาใหม่",
      to: "ผู้อำนวยการโรงเรียน / หัวหน้าหน่วยงาน",
      officeAddress: "คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 ถนนชัยภูมิ-ตาดโตน ตำบลนาฝาย\nอำเภอเมือง จังหวัดชัยภูมิ 36000",
      bodyText: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ กำหนดเปิดรับสมัครนักศึกษาใหม่ ระดับปริญญาตรี ประจำปีการศึกษา...\n\nในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ จึงใคร่ขอความอนุเคราะห์จากท่านในการประชาสัมพันธ์การรับสมัครนักศึกษาดังกล่าว ให้แก่นักเรียนและผู้สนใจในสังกัดของท่านทราบ\n\nจึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์",
      coordinatorInfo: "สำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์\nโทรศัพท์ 044 815 111 ต่อ 4100"
    }
  ],
  order: [
    {
      id: "order_committee_appointment",
      title: "คำสั่งแต่งตั้งคณะกรรมการดำเนินงานโครงการ",
      subtitle: "คำสั่งมหาวิทยาลัย/คณะ แต่งตั้งคณะกรรมการและมอบหมายหน้าที่",
      subject: "แต่งตั้งคณะกรรมการดำเนินงานโครงการ...",
      from: "มหาวิทยาลัยราชภัฏชัยภูมิ",
      to: "คณะกรรมการดำเนินงานโครงการฯ",
      bodyText: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ กำหนดจัดโครงการ... ในระหว่างวันที่... ณ ...\n\nดังนั้น เพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย มีประสิทธิภาพ และบรรลุวัตถุประสงค์ที่กำหนดไว้ อาศัยอำนาจตามความในมาตรา ๓๑ แห่งพระราชบัญญัติมหาวิทยาลัยราชภัฏ พ.ศ. ๒๕๔๗ จึงแต่งตั้งคณะกรรมการดำเนินงาน ดังต่อไปนี้\n\n๑. คณะกรรมการอำนวยการ\n๑.๑ คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์  ประธานกรรมการ\n๑.๒ รองคณบดีฝ่ายวิชาการและวิจัย  รองประธานกรรมการ\n๑.๓ รองคณบดีฝ่ายบริหารและแผนงาน  กรรมการ\nหน้าที่ ให้คำปรึกษา แนะนำ วางแผน และอำนวยความสะดวกในการดำเนินงาน\n\n๒. คณะกรรมการดำเนินงาน\n๒.๑ อาจารย์ประจำสาขาวิชา...  ประธานกรรมการ\n๒.๒ บุคลากรสำนักงานคณบดี  กรรมการและเลขานุการ\nหน้าที่ ดำเนินงานจัดกิจกรรม ประสานงาน และสรุปผลการดำเนินโครงการ\n\nทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป",
      referenceDoc: "คำสั่งมหาวิทยาลัยราชภัฏชัยภูมิ ที่ ๓๔๒๗/๒๕๕๙"
    }
  ]
};

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
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetSuccessMessage, setPresetSuccessMessage] = useState("");

  // File attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Core Form Fields (Required by default)
  const [date, setDate] = useState<string>(() => initialRecord?.date || bangkokDate());
  const [from, setFrom] = useState<string>(() => {
    if (initialRecord?.from) return initialRecord.from;
    if (isOrder) return "มหาวิทยาลัยราชภัฏชัยภูมิ";
    return "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ";
  });
  const [to, setTo] = useState<string>(() => initialRecord?.to || "");
  const [subject, setSubject] = useState<string>(() => initialRecord?.subject || "");
  const [bodyText, setBodyText] = useState<string>(() => (initialRecord?.bodyParagraphs || []).join("\n\n"));
  
  // Office address (Required for external documents)
  const [officeAddress, setOfficeAddress] = useState<string>(() => {
    if (initialRecord?.officeAddress) return initialRecord.officeAddress;
    if (isExternal) return "คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n๑๖๗ หมู่ ๒ ถนนชัยภูมิ-ตาดโตน\nตำบลนาฝาย อำเภอเมือง จังหวัดชัยภูมิ ๓๖๐๐๐";
    return "";
  });

  // Signatory state
  const [signatoryPreset, setSignatoryPreset] = useState<string>(() => {
    if (!initialRecord) return "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์";
    const found = FACULTY_SIGNER_PRESETS.find(p => p.name === initialRecord.signatoryName);
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
    const found = FACULTY_SIGNER_PRESETS.find(p => p.label === presetLabel);
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
    setShowPresetModal(false);
    setTimeout(() => setPresetSuccessMessage(""), 5000);
  }

  // Reactive Live Preview Record Construction
  const draftPreviewRecord = useMemo<AdminDocRegistryRecord>(() => {
    // Combine body text and committee text if order
    let parsedBodyParagraphs: string[] = [];
    if (bodyText.trim()) {
      parsedBodyParagraphs = bodyText.split("\n\n").map(s => s.trim()).filter(Boolean);
    }

    if (isOrder && showCommittee && committeeText.trim()) {
      const committeeLines = committeeText.split("\n").map(s => s.trim()).filter(Boolean);
      if (committeeLines.length > 0) {
        parsedBodyParagraphs.push("๑. คณะกรรมการ");
        parsedBodyParagraphs.push(...committeeLines);
      }
    }

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
      docNumber: initialRecord?.docNumber || "",
      isNumberIssued: initialRecord?.isNumberIssued || false,
      date: date || bangkokDate(),
      from: from.trim(),
      to: isOrder ? "-" : to.trim(),
      subject: subject.trim(),
      action: initialRecord?.action || "รอตรวจ",
      remarks: initialRecord?.remarks || "",
      referenceDoc: showReference ? referenceDoc.trim() : undefined,
      attachmentsList: cleanAttachments.length > 0 ? cleanAttachments : undefined,
      bodyParagraphs: parsedBodyParagraphs.length > 0 ? parsedBodyParagraphs : [
        "พิมพ์ข้อความเนื้อหาในแบบฟอร์มด้านซ้ายเพื่อดูตัวอย่างเอกสารจริง..."
      ],
      signatoryName: signatoryName.trim(),
      signatoryPosition: signatoryPosition.trim(),
      coordinatorInfo: showCoordinator ? coordinatorInfo.trim() : undefined,
      officeAddress: isExternal ? officeAddress.trim() : undefined,
      recipients: cleanRecipients.length > 0 ? cleanRecipients : undefined,
      digitType,
      paperSize: catConfig?.paperSize || (isExternal ? "a4" : "letter"),
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
    date,
    from,
    to,
    subject,
    bodyText,
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

  // Form submission handling
  async function handleSubmit(targetAction: AdminDocAction) {
    setFormError("");

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
    let parsedBodyParagraphs: string[] = [];
    if (bodyText.trim()) {
      parsedBodyParagraphs = bodyText.split("\n\n").map(s => s.trim()).filter(Boolean);
    }
    if (isOrder && showCommittee && committeeText.trim()) {
      const committeeLines = committeeText.split("\n").map(s => s.trim()).filter(Boolean);
      if (committeeLines.length > 0) {
        parsedBodyParagraphs.push("๑. คณะกรรมการ");
        parsedBodyParagraphs.push(...committeeLines);
      }
    }

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
      docNumber: initialRecord?.docNumber || "",
      isNumberIssued: initialRecord?.isNumberIssued || false,
      date: cleanDate,
      from: from.trim(),
      to: isOrder ? "-" : to.trim(),
      subject: subject.trim(),
      action: targetAction,
      remarks: initialRecord?.remarks || "",
      referenceDoc: showReference && referenceDoc.trim() ? referenceDoc.trim() : undefined,
      attachmentsList: cleanAttachments.length > 0 ? cleanAttachments : undefined,
      bodyParagraphs: parsedBodyParagraphs,
      signatoryName: signatoryName.trim(),
      signatoryPosition: signatoryPosition.trim(),
      coordinatorInfo: showCoordinator && coordinatorInfo.trim() ? coordinatorInfo.trim() : undefined,
      officeAddress: isExternal && officeAddress.trim() ? officeAddress.trim() : undefined,
      recipients: cleanRecipients.length > 0 ? cleanRecipients : undefined,
      digitType,
      paperSize: catConfig?.paperSize || (isExternal ? "a4" : "letter"),
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

            {/* Template Preset Selector Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-4 rounded-2xl text-white shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">ดึงข้อมูลต้นแบบเอกสาร</h3>
                  <p className="text-[11px] text-blue-200 mt-0.5">เลือกโหลดข้อความและโครงสร้างตัวอย่างสำเร็จรูป</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white text-blue-950 hover:bg-blue-50 text-xs font-bold transition-all shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-blue-900" />
                <span>เลือกต้นแบบ</span>
              </button>
            </div>

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

                {/* Doc Number (System Controlled) */}
                <div>
                  <label className={labelStyle}>เลขที่หนังสือ (ระบบควบคุม)</label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      readOnly
                      className={inputStyle + " bg-slate-100/80 text-slate-500 font-mono cursor-not-allowed"}
                      value={initialRecord?.isNumberIssued && initialRecord?.docNumber ? initialRecord.docNumber : "(รอออกเลขในขั้นตอนรอตรวจ)"}
                    />
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                  </div>
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
                    <p className="text-[11px] text-slate-500">กด Enter 2 ครั้งเพื่อขึ้นย่อหน้าใหม่ (ระบบจะเยื้อง ๒.๕ ซม. อัตโนมัติ)</p>
                  </div>
                </div>
              </div>

              <textarea
                rows={8}
                className={inputStyle + " min-h-[180px] leading-relaxed font-sans"}
                placeholder={
                  isOrder
                    ? "ระบุเหตุผลและอำนาจตามกฎหมายในการออกคำสั่ง เช่น&#10;&#10;ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ มีความจำเป็นต้องดำเนินการ...&#10;&#10;อาศัยอำนาจตามความในมาตรา ๓๑ แห่งพระราชบัญญัติมหาวิทยาลัยราชภัฏ พ.ศ. ๒๕๔๗ จึงแต่งตั้งคณะกรรมการ..."
                    : "ระบุข้อความเนื้อหาเอกสารแต่ละย่อหน้า เช่น&#10;&#10;ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มีความประสงค์จะจัดโครงการสัมมนาเชิงปฏิบัติการ...&#10;&#10;ในการนี้ เพื่อให้การจัดโครงการเป็นไปด้วยความเรียบร้อย จึงใคร่ขออนุมัติ...&#10;&#10;จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ"
                }
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
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
                  {FACULTY_SIGNER_PRESETS.map(p => (
                    <option key={p.label} value={p.label}>
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
                {isExternal ? "A4" : "Letter"}
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
                width: isExternal ? "210mm" : "216mm",
                minHeight: isExternal ? "297mm" : "279mm",
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
                  height: isExternal ? "297mm" : "279mm",
                  overflow: "hidden"
                }}
              />
            </div>
          </div>
        </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">เลือกต้นแบบเอกสาร ({categoryTitle})</h3>
                  <p className="text-[11px] text-slate-500">คลิกเลือกต้นแบบเพื่อดึงข้อความตัวอย่างเข้าสู่แบบฟอร์ม</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content List */}
            <div className="p-5 overflow-y-auto space-y-3">
              {/* Cloud / Built-in Category Default Preset */}
              {catConfig?.preset && (
                <div 
                  onClick={() => {
                    const p = catConfig.preset!;
                    handleApplyPreset({
                      id: "cat_default",
                      title: `ต้นแบบหลักประจำหมวด (${categoryTitle})`,
                      subtitle: "แม่แบบมาตรฐานของคณะศิลปศาสตร์และวิทยาศาสตร์",
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
                  }}
                  className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 group-hover:text-blue-900 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-700" />
                      ต้นแบบหลักประจำหมวด ({categoryTitle})
                    </span>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      แม่แบบหลัก
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {catConfig.preset.subject || catConfig.preset.bodyText?.slice(0, 100)}
                  </p>
                </div>
              )}

              {/* Predefined Category Templates */}
              {(OFFICIAL_CATEGORY_PRESETS[category] || []).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 hover:border-blue-300 cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                      {preset.title}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      คลิกเพื่อดึงข้อมูล
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {preset.subtitle}
                  </p>
                  <div className="bg-slate-100/70 p-2 rounded-xl text-[11px] text-slate-700 font-mono line-clamp-2">
                    {preset.subject}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                คุณสามารถแก้ไขข้อความหลังดึงต้นแบบได้เสมอ
              </span>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
}

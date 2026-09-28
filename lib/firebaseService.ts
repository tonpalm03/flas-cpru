// Firebase Firestore & Storage Persistence Service Layer
// Enterprise Grade Multi-Module Data Access with Concurrency & Error Handling

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, isConfigured } from "./firebase";
import { 
  InboundDocument, 
  OutboundDocument, 
  OfficialMemo, 
  OfficialOrder,
  OfficialResponse,
  ChecklistSubmission,
  RoomBooking, 
  ProjectProposal,
  ProjectReport,
  PurchaseRequisition,
  LoanContract,
  BudgetLedgerItem,
  LedgerTransaction,
  TeachingDisbursement,
  LeaveRequest,
  MasterSystemConfig,
  UserProfile
} from "./types";
import { 
  MOCK_INBOUND_DOCS, 
  MOCK_OUTBOUND_DOCS, 
  MOCK_PROJECTS, 
  MOCK_ROOMS,
  MOCK_BUDGET_ITEMS,
  MOCK_LEDGER_TRANSACTIONS,
  MOCK_LOANS,
  MOCK_DISBURSEMENTS
} from "./mockData";
import { getNextAtomicNumber } from "./numberingService";
import { logAuditEvent } from "./auditService";

// Helper for local mock fallback when offline or in test
const getLocalData = <T>(key: string, defaultData: T[]): T[] => {
  if (typeof window === "undefined") return defaultData;
  const saved = localStorage.getItem(`faculty_erp_${key}`);
  if (!saved) return defaultData;
  try { return JSON.parse(saved); } catch { return defaultData; }
};

const setLocalData = <T>(key: string, data: T[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`faculty_erp_${key}`, JSON.stringify(data));
  }
};

// ==========================================
// 1. MASTER SETTINGS & TEMPLATES
// ==========================================
export async function getMasterSettings(): Promise<MasterSystemConfig> {
  const defaultConfig: MasterSystemConfig = {
    facultyName: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    universityName: "มหาวิทยาลัยราชภัฏชัยภูมิ",
    deanName: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
    deanPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    docPrefix: "อว 0643.04/",
    defaultVatRate: 7,
    withholdingTaxRate: 1,
    fiscalYear: 2569,
    academicYear: 2568,
    version: "2569.1",
    updatedAt: new Date().toISOString(),
    updatedBy: "ระบบกลาง"
  };

  if (isConfigured) {
    try {
      const snap = await getDoc(doc(db, "templates", "faculty_default_config"));
      if (snap.exists()) {
        return snap.data() as MasterSystemConfig;
      }
    } catch (err) {
      console.warn("Firestore getMasterSettings error:", err);
    }
  }

  return defaultConfig;
}

export async function saveMasterSettings(
  config: Partial<MasterSystemConfig>, 
  actor?: UserProfile | null
): Promise<void> {
  if (isConfigured) {
    try {
      await setDoc(doc(db, "templates", "faculty_default_config"), {
        ...config,
        updatedAt: serverTimestamp(),
        updatedBy: actor?.name || "ผู้ดูแลระบบ"
      }, { merge: true });

      await logAuditEvent(actor || null, "UPDATE_MASTER_SETTINGS", "templates", "faculty_default_config", config);
      return;
    } catch (err) {
      console.error("Firestore saveMasterSettings failed:", err);
      throw err;
    }
  }
}

// ==========================================
// 2. INBOUND DOCUMENTS (หนังสือรับ)
// ==========================================
export async function getInboundDocs(): Promise<InboundDocument[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "admin_documents_in"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InboundDocument));
      }
    } catch (e) {
      console.warn("Firestore getInboundDocs fallback:", e);
    }
  }
  return getLocalData("inbound_docs", MOCK_INBOUND_DOCS);
}

export async function createInboundDoc(
  data: Omit<InboundDocument, "id" | "createdAt" | "receiveNumber">,
  actor?: UserProfile | null
): Promise<InboundDocument> {
  const receiveNumber = await getNextAtomicNumber("inbound", 2569);
  const newDoc: Omit<InboundDocument, "id"> = {
    ...data,
    receiveNumber,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "admin_documents_in"), {
        ...newDoc,
        timestamp: serverTimestamp()
      });
      const created: InboundDocument = { id: ref.id, ...newDoc };
      await logAuditEvent(actor || null, "CREATE_INBOUND_DOC", "admin_documents_in", ref.id, { receiveNumber, title: data.title });
      return created;
    } catch (e) {
      console.error("Firestore createInboundDoc failed:", e);
      throw e;
    }
  }

  const localList = getLocalData<InboundDocument>("inbound_docs", MOCK_INBOUND_DOCS);
  const created: InboundDocument = { id: `in-${Date.now()}`, ...newDoc };
  setLocalData("inbound_docs", [created, ...localList]);
  return created;
}

export async function updateInboundDocStatus(
  id: string, 
  status: InboundDocument["status"], 
  actionNote?: string, 
  assignedDept?: string,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "admin_documents_in", id);
      await updateDoc(docRef, {
        status,
        ...(actionNote && { actionNote }),
        ...(assignedDept && { assignedDept }),
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_INBOUND_STATUS", "admin_documents_in", id, { status, actionNote, assignedDept });
      return;
    } catch (e) {
      console.error("Firestore updateInboundDocStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<InboundDocument>("inbound_docs", MOCK_INBOUND_DOCS);
  const updated = list.map(item => item.id === id ? { ...item, status, ...(actionNote && { actionNote }), ...(assignedDept && { assignedDept }) } : item);
  setLocalData("inbound_docs", updated);
}

// ==========================================
// 3. OUTBOUND DOCUMENTS (หนังสือส่ง)
// ==========================================
export async function getOutboundDocs(): Promise<OutboundDocument[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "admin_documents_out"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as OutboundDocument));
      }
    } catch (e) {
      console.warn("Firestore getOutboundDocs fallback:", e);
    }
  }
  return getLocalData("outbound_docs", MOCK_OUTBOUND_DOCS);
}

export async function createOutboundDoc(
  data: Omit<OutboundDocument, "id" | "createdAt" | "docNumber">,
  actor?: UserProfile | null
): Promise<OutboundDocument> {
  const master = await getMasterSettings();
  const docNumber = await getNextAtomicNumber("outbound", master.fiscalYear, master.docPrefix);
  
  const newDoc: Omit<OutboundDocument, "id"> = {
    ...data,
    docNumber,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "admin_documents_out"), {
        ...newDoc,
        timestamp: serverTimestamp()
      });
      const created: OutboundDocument = { id: ref.id, ...newDoc };
      await logAuditEvent(actor || null, "CREATE_OUTBOUND_DOC", "admin_documents_out", ref.id, { docNumber, title: data.title });
      return created;
    } catch (e) {
      console.error("Firestore createOutboundDoc failed:", e);
      throw e;
    }
  }

  const list = getLocalData<OutboundDocument>("outbound_docs", MOCK_OUTBOUND_DOCS);
  const created: OutboundDocument = { id: `out-${Date.now()}`, ...newDoc };
  setLocalData("outbound_docs", [created, ...list]);
  return created;
}

export async function updateOutboundDocStatus(
  id: string,
  status: OutboundDocument["status"],
  signedFileUrl?: string,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "admin_documents_out", id);
      await updateDoc(docRef, {
        status,
        ...(signedFileUrl && { signedFileUrl }),
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_OUTBOUND_STATUS", "admin_documents_out", id, { status, signedFileUrl });
      return;
    } catch (e) {
      console.error("Firestore updateOutboundDocStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<OutboundDocument>("outbound_docs", MOCK_OUTBOUND_DOCS);
  const updated = list.map(item => item.id === id ? { ...item, status, ...(signedFileUrl && { signedFileUrl }) } : item);
  setLocalData("outbound_docs", updated);
}

// ==========================================
// 3.1 OFFICIAL MEMOS (บันทึกข้อความราชการ)
// ==========================================
export async function getMemos(): Promise<OfficialMemo[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "memos"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as OfficialMemo));
      }
    } catch (e) {
      console.warn("Firestore getMemos fallback:", e);
    }
  }
  return getLocalData("memos", []);
}

export async function createMemo(
  data: Omit<OfficialMemo, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<OfficialMemo> {
  const newMemo: Omit<OfficialMemo, "id"> = {
    ...data,
    createdById: actor?.id,
    proposerId: actor?.id,
    proposerName: actor?.name,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "memos"), {
        ...newMemo,
        timestamp: serverTimestamp()
      });
      const created: OfficialMemo = { id: ref.id, ...newMemo };
      await logAuditEvent(actor || null, "CREATE_MEMO", "memos", ref.id, { subject: data.subject, docNumber: data.docNumber });
      return created;
    } catch (e) {
      console.error("Firestore createMemo failed:", e);
      throw e;
    }
  }

  const list = getLocalData<OfficialMemo>("memos", []);
  const created: OfficialMemo = { id: `memo-${Date.now()}`, ...newMemo };
  setLocalData("memos", [created, ...list]);
  return created;
}

export async function updateMemo(
  id: string,
  data: Partial<OfficialMemo>,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "memos", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_MEMO", "memos", id, data);
      return;
    } catch (e) {
      console.error("Firestore updateMemo failed:", e);
      throw e;
    }
  }

  const list = getLocalData<OfficialMemo>("memos", []);
  const updated = list.map(item => item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item);
  setLocalData("memos", updated);
}

// ==========================================
// 3.2 OFFICIAL ORDERS & ANNOUNCEMENTS (คำสั่ง/ประกาศคณะ)
// ==========================================
export async function getOrders(): Promise<OfficialOrder[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "orders"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as OfficialOrder));
      }
    } catch (e) {
      console.warn("Firestore getOrders fallback:", e);
    }
  }
  return getLocalData("orders", [
    {
      id: "ord-01",
      orderNumber: "คำสั่งคณะที่ 015/2569",
      orderType: "committee_appointment",
      date: "2026-09-10",
      title: "แต่งตั้งคณะกรรมการดำเนินงานโครงการบูรณาการธุรกิจการค้าสมัยใหม่ ดิจิทัล และสตาร์ทอัพ",
      signedBy: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
      signatoryPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
      category: "แต่งตั้งคณะกรรมการ",
      status: "active",
      committeeMembers: [
        { name: "อาจารย์ ดร.เดชา พัฒนากุล", position: "ประธานสาขาวิชา", role: "ประธานกรรมการ" },
        { name: "อาจารย์กิตติยา นาวาการ", position: "อาจารย์ประจำสาขา", role: "กรรมการ" },
        { name: "นางสาวศิริพร บุญมั่น", position: "เจ้าหน้าที่ธุรการ", role: "กรรมการและเลขานุการ" }
      ],
      createdAt: "2026-09-10T09:00:00.000Z"
    },
    {
      id: "ord-02",
      orderNumber: "คำสั่งคณะที่ 016/2569",
      orderType: "procurement_committee",
      date: "2026-09-18",
      title: "แต่งตั้งคณะกรรมการตรวจรับพัสดุ โครงการพัฒนาทักษะทางวิชาชีพ",
      signedBy: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
      signatoryPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
      category: "ตรวจรับพัสดุ",
      status: "active",
      committeeMembers: [
        { name: "ผู้ช่วยศาสตราจารย์ ดร.สมชาย ทรงคุณ", position: "อาจารย์", role: "ประธานกรรมการ" },
        { name: "อาจารย์พงษ์ศักดิ์ เจริญดี", position: "อาจารย์", role: "กรรมการ" },
        { name: "นายวีระยุทธ การดี", position: "เจ้าหน้าที่พัสดุ", role: "กรรมการและเลขานุการ" }
      ],
      createdAt: "2026-09-18T10:00:00.000Z"
    },
    {
      id: "ord-03",
      orderNumber: "ประกาศคณะที่ 004/2569",
      orderType: "announcement",
      date: "2026-09-22",
      title: "ประกาศแนวปฏิบัติการจัดการเรียนการสอนและการส่งหลักฐานเบิกค่าสอน กศ.ปช.",
      signedBy: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
      signatoryPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
      category: "ประกาศแนวปฏิบัติ",
      status: "active",
      createdAt: "2026-09-22T14:00:00.000Z"
    }
  ]);
}

export async function createOrder(
  data: Omit<OfficialOrder, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<OfficialOrder> {
  const newOrder: Omit<OfficialOrder, "id"> = {
    ...data,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "orders"), {
        ...newOrder,
        timestamp: serverTimestamp()
      });
      const created: OfficialOrder = { id: ref.id, ...newOrder };
      await logAuditEvent(actor || null, "CREATE_ORDER", "orders", ref.id, { orderNumber: data.orderNumber, title: data.title });
      return created;
    } catch (e) {
      console.error("Firestore createOrder failed:", e);
      throw e;
    }
  }

  const list = getLocalData<OfficialOrder>("orders", []);
  const created: OfficialOrder = { id: `ord-${Date.now()}`, ...newOrder };
  setLocalData("orders", [created, ...list]);
  return created;
}

export async function updateOrderStatus(
  id: string,
  status: OfficialOrder["status"],
  revokedReason?: string,
  revokedByOrderNumber?: string,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, {
        status,
        ...(revokedReason && { revokedReason }),
        ...(revokedByOrderNumber && { revokedByOrderNumber }),
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_ORDER_STATUS", "orders", id, { status, revokedReason, revokedByOrderNumber });
      return;
    } catch (e) {
      console.error("Firestore updateOrderStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<OfficialOrder>("orders", []);
  const updated = list.map(item => item.id === id ? { ...item, status, ...(revokedReason && { revokedReason }), ...(revokedByOrderNumber && { revokedByOrderNumber }) } : item);
  setLocalData("orders", updated);
}

// ==========================================
// 3.3 OFFICIAL RESPONSES (แบบตอบรับเข้าร่วม/สถานที่/วิทยากร)
// ==========================================
export async function getResponses(): Promise<OfficialResponse[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "admin_responses"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as OfficialResponse));
      }
    } catch (e) {
      console.warn("Firestore getResponses fallback:", e);
    }
  }
  return getLocalData("admin_responses", []);
}

export async function createResponse(
  data: Omit<OfficialResponse, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<OfficialResponse> {
  const newResp: Omit<OfficialResponse, "id"> = {
    ...data,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "admin_responses"), {
        ...newResp,
        timestamp: serverTimestamp()
      });
      const created: OfficialResponse = { id: ref.id, ...newResp };
      await logAuditEvent(actor || null, "CREATE_RESPONSE", "admin_responses", ref.id, { responseNumber: data.responseNumber, responderName: data.responderName, decision: data.decision });
      return created;
    } catch (e) {
      console.error("Firestore createResponse failed:", e);
      throw e;
    }
  }

  const list = getLocalData<OfficialResponse>("admin_responses", []);
  const created: OfficialResponse = { id: `resp-${Date.now()}`, ...newResp };
  setLocalData("admin_responses", [created, ...list]);
  return created;
}

// ==========================================
// 3.4 DOCUMENT CHECKLISTS (เช็คลิสต์ตรวจเอกสาร)
// ==========================================
export async function getChecklists(): Promise<ChecklistSubmission[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "admin_checklists"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChecklistSubmission));
      }
    } catch (e) {
      console.warn("Firestore getChecklists fallback:", e);
    }
  }
  return getLocalData("admin_checklists", []);
}

export async function createChecklist(
  data: Omit<ChecklistSubmission, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<ChecklistSubmission> {
  const newChecklist: Omit<ChecklistSubmission, "id"> = {
    ...data,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "admin_checklists"), {
        ...newChecklist,
        timestamp: serverTimestamp()
      });
      const created: ChecklistSubmission = { id: ref.id, ...newChecklist };
      await logAuditEvent(actor || null, "CREATE_CHECKLIST", "admin_checklists", ref.id, { checklistType: data.checklistType, title: data.title });
      return created;
    } catch (e) {
      console.error("Firestore createChecklist failed:", e);
      throw e;
    }
  }

  const list = getLocalData<ChecklistSubmission>("admin_checklists", []);
  const created: ChecklistSubmission = { id: `chk-${Date.now()}`, ...newChecklist };
  setLocalData("admin_checklists", [created, ...list]);
  return created;
}

// ==========================================
// 4. PROJECTS (โครงการยุทธศาสตร์)
// ==========================================
export async function getProjects(): Promise<ProjectProposal[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "projects"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectProposal));
      }
    } catch (e) {
      console.warn("Firestore getProjects fallback:", e);
    }
  }
  return getLocalData("projects", MOCK_PROJECTS);
}

export async function createProject(
  data: Omit<ProjectProposal, "id" | "createdAt" | "code">,
  actor?: UserProfile | null
): Promise<ProjectProposal> {
  const code = await getNextAtomicNumber("project", data.fiscalYear || 2569);
  const newProject: Omit<ProjectProposal, "id"> = {
    ...data,
    code,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "projects"), {
        ...newProject,
        timestamp: serverTimestamp()
      });
      const created: ProjectProposal = { id: ref.id, ...newProject };
      await logAuditEvent(actor || null, "CREATE_PROJECT", "projects", ref.id, { code, title: data.title, budget: data.budgetApproved });
      return created;
    } catch (e) {
      console.error("Firestore createProject failed:", e);
      throw e;
    }
  }

  const list = getLocalData<ProjectProposal>("projects", MOCK_PROJECTS);
  const created: ProjectProposal = { id: `proj-${Date.now()}`, ...newProject };
  setLocalData("projects", [created, ...list]);
  return created;
}

export async function updateProject(
  id: string,
  data: Partial<ProjectProposal>,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "projects", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_PROJECT", "projects", id, data);
      return;
    } catch (e) {
      console.error("Firestore updateProject failed:", e);
      throw e;
    }
  }

  const list = getLocalData<ProjectProposal>("projects", MOCK_PROJECTS);
  const updated = list.map(item => item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item);
  setLocalData("projects", updated);
}

// ==========================================
// 4.1 PROJECT REPORTS (รายงานผลโครงการ, ศาสตร์พระราชา, SDG, One Page)
// ==========================================
export async function getProjectReports(): Promise<ProjectReport[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "project_reports"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectReport));
      }
    } catch (e) {
      console.warn("Firestore getProjectReports fallback:", e);
    }
  }
  return getLocalData("project_reports", [
    {
      id: "rep-01",
      reportType: "kings_philosophy",
      projectId: "proj-01",
      projectCode: "69-KING-001",
      projectTitle: "โครงการเพิ่มมูลค่าสับปะรดด้วยนวัตกรรมการอบแห้งเพื่อพัฒนาเศรษฐกิจฐานราก",
      department: "สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ",
      leader: "ดร.สุรชัย นวัตกร",
      fiscalYear: 2569,
      budgetApproved: 250000,
      budgetUsed: 195000,
      participantCount: 65,
      targetAchieved: true,
      kpiResults: [
        { kpi: "กลุ่มเกษตรกรมีความรู้การแปรรูป", target: "80%", actual: "92%", status: "passed" },
        { kpi: "ผลิตภัณฑ์แปรรูปได้มาตรฐาน", target: "2 รายการ", actual: "3 รายการ", status: "passed" }
      ],
      impactEconomy: "สร้างรายได้เฉลี่ยเพิ่มขึ้นร้อยละ 18.5 ต่อครัวเรือนในชุมชนเป้าหมาย",
      impactSociety: "เกิดการรวมกลุ่มวิสาหกิจชุมชนแปรรูปผลผลิตทางการเกษตรอย่างเข้มแข็ง",
      impactEnvironment: "ลดการสูญเสียผลผลิตสับปะรดตกเกรด (Zero Waste)",
      impactEducation: "เป็นแหล่งเรียนรู้และฝึกทักษะวิชาชีพแก่นักศึกษาในพื้นที่จริง",
      sdgGoals: [1, 8, 12],
      problemsAndSuggestions: "ควรส่งเสริมช่องทางการตลาดออนไลน์และการออกแบบบรรจุภัณฑ์ที่เป็นมิตรต่อสิ่งแวดล้อมเพิ่มเติม",
      status: "approved",
      createdAt: "2026-09-20T10:00:00.000Z"
    }
  ]);
}

export async function createProjectReport(
  data: Omit<ProjectReport, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<ProjectReport> {
  const newReport: Omit<ProjectReport, "id"> = {
    ...data,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "project_reports"), {
        ...newReport,
        timestamp: serverTimestamp()
      });
      const created: ProjectReport = { id: ref.id, ...newReport };
      await logAuditEvent(actor || null, "CREATE_PROJECT_REPORT", "project_reports", ref.id, { 
        projectCode: data.projectCode, 
        projectTitle: data.projectTitle, 
        reportType: data.reportType 
      });

      // Update project status to reported
      if (data.projectId) {
        await updateProject(data.projectId, { status: "reported" }, actor);
      }

      return created;
    } catch (e) {
      console.error("Firestore createProjectReport failed:", e);
      throw e;
    }
  }

  const list = getLocalData<ProjectReport>("project_reports", []);
  const created: ProjectReport = { id: `rep-${Date.now()}`, ...newReport };
  setLocalData("project_reports", [created, ...list]);
  return created;
}

// ==========================================
// 5. PROCUREMENT (ใบขอซื้อ/ขอจ้าง พัสดุ)
// ==========================================
export async function getProcurementPRs(): Promise<PurchaseRequisition[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "procurement"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseRequisition));
      }
    } catch (e) {
      console.warn("Firestore getProcurementPRs fallback:", e);
    }
  }
  return getLocalData("procurement_prs", []);
}

export async function createProcurementPR(
  data: Omit<PurchaseRequisition, "id" | "createdAt" | "prNumber">,
  actor?: UserProfile | null
): Promise<PurchaseRequisition> {
  const prNumber = await getNextAtomicNumber("pr", 2569);
  const newPR: Omit<PurchaseRequisition, "id"> = {
    ...data,
    prNumber,
    requesterId: actor?.id,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "procurement"), {
        ...newPR,
        timestamp: serverTimestamp()
      });
      const created: PurchaseRequisition = { id: ref.id, ...newPR };
      await logAuditEvent(actor || null, "CREATE_PR", "procurement", ref.id, { prNumber, projectName: data.projectName, grandTotal: data.netTotalAmount });
      return created;
    } catch (e) {
      console.error("Firestore createProcurementPR failed:", e);
      throw e;
    }
  }

  const list = getLocalData<PurchaseRequisition>("procurement_prs", []);
  const created: PurchaseRequisition = { id: `pr-${Date.now()}`, ...newPR };
  setLocalData("procurement_prs", [created, ...list]);
  return created;
}

// ==========================================
// 6. FINANCE MODULE (งานการเงินและงบประมาณ)
// ==========================================

// 6.1 BUDGET LEDGER & ALLOCATIONS
export async function getBudgetLedger(): Promise<BudgetLedgerItem[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "finance_ledger"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as BudgetLedgerItem));
      }
    } catch (e) {
      console.warn("Firestore getBudgetLedger fallback:", e);
    }
  }
  return getLocalData("finance_ledger", MOCK_BUDGET_ITEMS);
}

export async function updateBudgetLedgerItem(
  id: string,
  data: Partial<BudgetLedgerItem>,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "finance_ledger", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_BUDGET_ITEM", "finance_ledger", id, data);
      return;
    } catch (e) {
      console.error("Firestore updateBudgetLedgerItem failed:", e);
      throw e;
    }
  }

  const list = getLocalData<BudgetLedgerItem>("finance_ledger", MOCK_BUDGET_ITEMS);
  const updated = list.map(item => item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item);
  setLocalData("finance_ledger", updated);
}

// 6.2 LEDGER TRANSACTIONS (รายการเคลื่อนไหวงบประมาณ)
export async function getLedgerTransactions(): Promise<LedgerTransaction[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "finance_transactions"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LedgerTransaction));
      }
    } catch (e) {
      console.warn("Firestore getLedgerTransactions fallback:", e);
    }
  }
  return getLocalData("finance_transactions", MOCK_LEDGER_TRANSACTIONS);
}

export async function createLedgerTransaction(
  data: Omit<LedgerTransaction, "id" | "createdAt" | "transactionNumber">,
  actor?: UserProfile | null
): Promise<LedgerTransaction> {
  const transactionNumber = `TX-${data.fiscalYear || 2569}-${Date.now().toString().slice(-4)}`;
  const newTx: Omit<LedgerTransaction, "id"> = {
    ...data,
    transactionNumber,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "finance_transactions"), {
        ...newTx,
        timestamp: serverTimestamp()
      });
      const created: LedgerTransaction = { id: ref.id, ...newTx };
      await logAuditEvent(actor || null, "CREATE_LEDGER_TX", "finance_transactions", ref.id, {
        transactionNumber,
        type: data.transactionType,
        amount: data.amount,
        subCategory: data.subCategory
      });
      return created;
    } catch (e) {
      console.error("Firestore createLedgerTransaction failed:", e);
      throw e;
    }
  }

  const list = getLocalData<LedgerTransaction>("finance_transactions", MOCK_LEDGER_TRANSACTIONS);
  const created: LedgerTransaction = { id: `tx-${Date.now()}`, ...newTx };
  setLocalData("finance_transactions", [created, ...list]);
  return created;
}

// 6.3 FINANCE LOANS (สัญญายืมเงินทดรองจ่าย และการส่งใช้คืน)
export async function getFinanceLoans(): Promise<LoanContract[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "finance_loans"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoanContract));
      }
    } catch (e) {
      console.warn("Firestore getFinanceLoans fallback:", e);
    }
  }
  return getLocalData("finance_loans", MOCK_LOANS);
}

export async function createFinanceLoan(
  data: Omit<LoanContract, "id" | "createdAt" | "contractNumber">,
  actor?: UserProfile | null
): Promise<LoanContract> {
  const contractNumber = await getNextAtomicNumber("loan", 2569);
  const newLoan: Omit<LoanContract, "id"> = {
    ...data,
    contractNumber,
    remainingBalance: data.amount,
    totalSettledAmount: 0,
    borrowerId: actor?.id,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "finance_loans"), {
        ...newLoan,
        timestamp: serverTimestamp()
      });
      const created: LoanContract = { id: ref.id, ...newLoan };
      await logAuditEvent(actor || null, "CREATE_LOAN", "finance_loans", ref.id, { contractNumber, amount: data.amount, borrowerName: data.borrowerName });
      return created;
    } catch (e) {
      console.error("Firestore createFinanceLoan failed:", e);
      throw e;
    }
  }

  const list = getLocalData<LoanContract>("finance_loans", MOCK_LOANS);
  const created: LoanContract = { id: `loan-${Date.now()}`, ...newLoan };
  setLocalData("finance_loans", [created, ...list]);
  return created;
}

export async function updateFinanceLoanStatus(
  id: string,
  status: LoanContract["status"],
  extraData?: Partial<LoanContract>,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "finance_loans", id);
      await updateDoc(docRef, {
        status,
        ...(extraData && extraData),
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_LOAN_STATUS", "finance_loans", id, { status, ...extraData });
      return;
    } catch (e) {
      console.error("Firestore updateFinanceLoanStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<LoanContract>("finance_loans", MOCK_LOANS);
  const updated = list.map(item => item.id === id ? { ...item, status, ...(extraData && extraData), updatedAt: new Date().toISOString() } : item);
  setLocalData("finance_loans", updated);
}

export async function settleFinanceLoan(
  id: string,
  settlement: {
    cashAmount: number;
    voucherAmount: number;
    receiptNumber?: string;
    voucherSummary?: string;
    receivedBy?: string;
    remark?: string;
  },
  actor?: UserProfile | null
): Promise<LoanContract> {
  const currentList = await getFinanceLoans();
  const currentLoan = currentList.find(l => l.id === id);
  if (!currentLoan) throw new Error("Loan contract not found");

  const settleTotal = (Number(settlement.cashAmount) || 0) + (Number(settlement.voucherAmount) || 0);
  const currentTotalSettled = (currentLoan.totalSettledAmount || 0) + settleTotal;
  const newRemainingBalance = Math.max(0, currentLoan.amount - currentTotalSettled);
  const newStatus: LoanContract["status"] = newRemainingBalance <= 0 ? "settled" : "partially_settled";

  const settlementRecord = {
    id: `stl-${Date.now()}`,
    settleDate: new Date().toISOString().split("T")[0],
    cashAmount: settlement.cashAmount,
    voucherAmount: settlement.voucherAmount,
    receiptNumber: settlement.receiptNumber,
    voucherSummary: settlement.voucherSummary,
    receivedBy: settlement.receivedBy || actor?.name || "เจ้าหน้าที่การเงิน",
    remainingBalance: newRemainingBalance,
    remark: settlement.remark
  };

  const updatedSettlements = [...(currentLoan.settlements || []), settlementRecord];

  if (isConfigured) {
    try {
      const docRef = doc(db, "finance_loans", id);
      await updateDoc(docRef, {
        status: newStatus,
        totalSettledAmount: currentTotalSettled,
        remainingBalance: newRemainingBalance,
        settlements: updatedSettlements,
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "SETTLE_LOAN", "finance_loans", id, {
        settleTotal,
        newRemainingBalance,
        newStatus
      });
      return {
        ...currentLoan,
        status: newStatus,
        totalSettledAmount: currentTotalSettled,
        remainingBalance: newRemainingBalance,
        settlements: updatedSettlements
      };
    } catch (e) {
      console.error("Firestore settleFinanceLoan failed:", e);
      throw e;
    }
  }

  const updatedLoan: LoanContract = {
    ...currentLoan,
    status: newStatus,
    totalSettledAmount: currentTotalSettled,
    remainingBalance: newRemainingBalance,
    settlements: updatedSettlements,
    updatedAt: new Date().toISOString()
  };
  const list = getLocalData<LoanContract>("finance_loans", MOCK_LOANS);
  setLocalData("finance_loans", list.map(l => l.id === id ? updatedLoan : l));
  return updatedLoan;
}

// 6.4 TEACHING & SUPERVISION DISBURSEMENTS
export async function getFinanceDisbursements(): Promise<TeachingDisbursement[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "finance_disbursements"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as TeachingDisbursement));
      }
    } catch (e) {
      console.warn("Firestore getFinanceDisbursements fallback:", e);
    }
  }
  return getLocalData("finance_disbursements", MOCK_DISBURSEMENTS);
}

export async function createFinanceDisbursement(
  data: Omit<TeachingDisbursement, "id" | "createdAt" | "batchNumber">,
  actor?: UserProfile | null
): Promise<TeachingDisbursement> {
  const batchNumber = `บจ. ${Date.now().toString().slice(-3)}/${data.academicYear || 2569}`;
  const newBatch: Omit<TeachingDisbursement, "id"> = {
    ...data,
    batchNumber,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "finance_disbursements"), {
        ...newBatch,
        timestamp: serverTimestamp()
      });
      const created: TeachingDisbursement = { id: ref.id, ...newBatch };
      await logAuditEvent(actor || null, "CREATE_DISBURSEMENT", "finance_disbursements", ref.id, {
        batchNumber,
        periodMonth: data.periodMonth,
        totalAmount: data.totalAmount,
        teachersCount: data.teachersCount
      });
      return created;
    } catch (e) {
      console.error("Firestore createFinanceDisbursement failed:", e);
      throw e;
    }
  }

  const list = getLocalData<TeachingDisbursement>("finance_disbursements", MOCK_DISBURSEMENTS);
  const created: TeachingDisbursement = { id: `disb-${Date.now()}`, ...newBatch };
  setLocalData("finance_disbursements", [created, ...list]);
  return created;
}

export async function updateFinanceDisbursementStatus(
  id: string,
  status: TeachingDisbursement["status"],
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "finance_disbursements", id);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_DISBURSEMENT_STATUS", "finance_disbursements", id, { status });
      return;
    } catch (e) {
      console.error("Firestore updateFinanceDisbursementStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<TeachingDisbursement>("finance_disbursements", MOCK_DISBURSEMENTS);
  const updated = list.map(item => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
  setLocalData("finance_disbursements", updated);
}

// ==========================================
// 7. HR LEAVES (ระบบ e-Leave)
// ==========================================
export async function getHRLeaves(): Promise<LeaveRequest[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "hr_leaves"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest));
      }
    } catch (e) {
      console.warn("Firestore getHRLeaves fallback:", e);
    }
  }
  return getLocalData("hr_leaves", []);
}

export async function createLeaveRequest(
  data: Omit<LeaveRequest, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<LeaveRequest> {
  const newLeave: Omit<LeaveRequest, "id"> = {
    ...data,
    staffId: actor?.id,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "hr_leaves"), {
        ...newLeave,
        timestamp: serverTimestamp()
      });
      const created: LeaveRequest = { id: ref.id, ...newLeave };
      await logAuditEvent(actor || null, "CREATE_LEAVE_REQUEST", "hr_leaves", ref.id, { staffName: data.staffName, leaveType: data.leaveType, totalDays: data.totalDays });
      return created;
    } catch (e) {
      console.error("Firestore createLeaveRequest failed:", e);
      throw e;
    }
  }

  const list = getLocalData<LeaveRequest>("hr_leaves", []);
  const created: LeaveRequest = { id: `leave-${Date.now()}`, ...newLeave };
  setLocalData("hr_leaves", [created, ...list]);
  return created;
}

// ==========================================
// 8. ROOMS & VEHICLES (จองห้องประชุม/ยานพาหนะ)
// ==========================================
export async function getRoomBookings(): Promise<RoomBooking[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "rooms"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as RoomBooking));
      }
    } catch (e) {
      console.warn("Firestore getRoomBookings fallback:", e);
    }
  }
  return getLocalData("rooms", MOCK_ROOMS);
}

export async function createRoomBooking(
  data: Omit<RoomBooking, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<RoomBooking> {
  const newBooking: Omit<RoomBooking, "id"> = {
    ...data,
    bookedById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "rooms"), {
        ...newBooking,
        timestamp: serverTimestamp()
      });
      const created = { id: ref.id, ...newBooking };
      await logAuditEvent(actor || null, "CREATE_ROOM_BOOKING", "rooms", ref.id, { roomName: data.roomName, date: data.date, time: `${data.startTime}-${data.endTime}` });
      return created;
    } catch (e) {
      console.error("Firestore createRoomBooking failed:", e);
      throw e;
    }
  }

  const list = getLocalData<RoomBooking>("rooms", MOCK_ROOMS);
  const created: RoomBooking = { id: `room-${Date.now()}`, ...newBooking };
  setLocalData("rooms", [created, ...list]);
  return created;
}

export async function updateRoomBookingStatus(
  id: string,
  status: RoomBooking["status"],
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "rooms", id);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_ROOM_BOOKING_STATUS", "rooms", id, { status });
      return;
    } catch (e) {
      console.error("Firestore updateRoomBookingStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<RoomBooking>("rooms", MOCK_ROOMS);
  const updated = list.map(item => item.id === id ? { ...item, status } : item);
  setLocalData("rooms", updated);
}

// ==========================================
// 9. FILE UPLOAD TO FIREBASE STORAGE
// ==========================================
export async function uploadDocumentFile(
  file: File, 
  folder: string = "faculty_attachments",
  actor?: UserProfile | null
): Promise<string> {
  if (isConfigured) {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageRef = ref(storage, `${folder}/${timestamp}_${sanitizedName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      await logAuditEvent(actor || null, "UPLOAD_FILE", "storage", snapshot.metadata.fullPath, { originalName: file.name, size: file.size });
      return downloadUrl;
    } catch (e) {
      console.error("Firebase Storage Upload Error:", e);
      throw e;
    }
  }
  return URL.createObjectURL(file);
}

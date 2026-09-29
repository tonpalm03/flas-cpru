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
  UserLeaveQuota, 
  FacultyPortfolio, 
  EmploymentContract, 
  StrategicPlan, 
  StrategicKPI, 
  AppNotification, 
  UserRole, 
  MasterSystemConfig, 
  UserProfile,
  EmployeeRecord,
  AccountInvitation,
  WorkShift,
  WorkPolicy,
  PublicHoliday,
  AttendanceEvent,
  AttendanceSession,
  AttendanceCorrection,
  MonthlyAttendanceReport,
  AttendancePeriodLock
} from "./types";
import { 
  MOCK_INBOUND_DOCS, 
  MOCK_OUTBOUND_DOCS, 
  MOCK_PROJECTS, 
  MOCK_ROOMS, 
  MOCK_BUDGET_ITEMS, 
  MOCK_LEDGER_TRANSACTIONS, 
  MOCK_LOANS, 
  MOCK_DISBURSEMENTS, 
  MOCK_PURCHASE_REQ, 
  MOCK_LEAVE_REQUESTS, 
  MOCK_USER_QUOTAS, 
  MOCK_FACULTY_PORTFOLIOS, 
  MOCK_EMPLOYMENT_CONTRACTS, 
  MOCK_STRATEGIC_PLAN, 
  MOCK_NOTIFICATIONS,
  MOCK_USERS,
  MOCK_EMPLOYEES,
  MOCK_INVITATIONS,
  MOCK_WORK_POLICY,
  MOCK_HOLIDAYS_2569,
  MOCK_ATTENDANCE_SESSIONS,
  MOCK_ATTENDANCE_CORRECTIONS,
  MOCK_MONTHLY_ATTENDANCE_REPORTS,
  MOCK_ATTENDANCE_PERIOD_LOCKS
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
// 5. PROCUREMENT (ใบขอซื้อ/ขอจ้าง พัสดุ และการตรวจรับ)
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
  return getLocalData("procurement_prs", MOCK_PURCHASE_REQ);
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
      await logAuditEvent(actor || null, "CREATE_PR", "procurement", ref.id, { 
        prNumber, 
        projectName: data.projectName, 
        grandTotal: data.netTotalAmount,
        procurementType: data.procurementType
      });
      return created;
    } catch (e) {
      console.error("Firestore createProcurementPR failed:", e);
      throw e;
    }
  }

  const list = getLocalData<PurchaseRequisition>("procurement_prs", MOCK_PURCHASE_REQ);
  const created: PurchaseRequisition = { id: `pr-${Date.now()}`, ...newPR };
  setLocalData("procurement_prs", [created, ...list]);
  return created;
}

export async function updateProcurementPRStatus(
  id: string,
  status: PurchaseRequisition["status"],
  extraData?: Partial<PurchaseRequisition>,
  actor?: UserProfile | null
) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "procurement", id);
      await updateDoc(docRef, {
        status,
        ...(extraData && extraData),
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_PR_STATUS", "procurement", id, { status, ...extraData });
      return;
    } catch (e) {
      console.error("Firestore updateProcurementPRStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<PurchaseRequisition>("procurement_prs", MOCK_PURCHASE_REQ);
  const updated = list.map(item => item.id === id ? { ...item, status, ...(extraData && extraData), updatedAt: new Date().toISOString() } : item);
  setLocalData("procurement_prs", updated);
}

export async function inspectProcurementPR(
  id: string,
  inspection: {
    inspectionDate: string;
    inspectionResult: "passed" | "failed";
    inspectionRemarks?: string;
  },
  actor?: UserProfile | null
) {
  const newStatus: PurchaseRequisition["status"] = inspection.inspectionResult === "passed" ? "inspected" : "purchasing";
  return updateProcurementPRStatus(id, newStatus, inspection, actor);
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
// 7. HR LEAVES, PORTFOLIO & CONTRACTS (ระบบ e-Leave & ทะเบียนบุคลากร)
// ==========================================

// 7.1 e-Leave Requests
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
  return getLocalData("hr_leaves", MOCK_LEAVE_REQUESTS);
}

export async function createLeaveRequest(
  data: Omit<LeaveRequest, "id" | "createdAt" | "requestNumber">,
  actor?: UserProfile | null
): Promise<LeaveRequest> {
  const numberingType = data.leaveType === "vacation" 
    ? "leave_vacation" 
    : data.leaveType === "sick" 
    ? "leave_sick" 
    : data.leaveType === "personal" 
    ? "leave_personal" 
    : "leave_duty";
  const prefix = data.leaveType === "vacation" ? "ลพ." : data.leaveType === "sick" ? "ลป." : data.leaveType === "personal" ? "ลก." : "ลร.";
  const requestNumber = await getNextAtomicNumber(numberingType, 2569, prefix);

  const newLeave: Omit<LeaveRequest, "id"> = {
    ...data,
    requestNumber,
    staffId: actor?.id || data.staffId,
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
      await logAuditEvent(actor || null, "CREATE_LEAVE_REQUEST", "hr_leaves", ref.id, { 
        requestNumber, 
        staffName: data.staffName, 
        leaveType: data.leaveType, 
        totalDays: data.totalDays 
      });
      return created;
    } catch (e) {
      console.error("Firestore createLeaveRequest failed:", e);
      throw e;
    }
  }

  const list = getLocalData<LeaveRequest>("hr_leaves", MOCK_LEAVE_REQUESTS);
  const created: LeaveRequest = { id: `leave-${Date.now()}`, ...newLeave };
  setLocalData("hr_leaves", [created, ...list]);
  return created;
}

export async function updateLeaveRequestStatus(
  id: string,
  status: LeaveRequest["status"],
  updates?: Partial<LeaveRequest>,
  actor?: UserProfile | null
): Promise<void> {
  const updatePayload = {
    status,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const docRef = doc(db, "hr_leaves", id);
      await updateDoc(docRef, {
        ...updatePayload,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_LEAVE_STATUS", "hr_leaves", id, { status, ...updates });
      return;
    } catch (e) {
      console.error("Firestore updateLeaveRequestStatus failed:", e);
      throw e;
    }
  }

  const list = getLocalData<LeaveRequest>("hr_leaves", MOCK_LEAVE_REQUESTS);
  const updated = list.map(item => item.id === id ? { ...item, ...updatePayload } : item);
  setLocalData("hr_leaves", updated);
}

// 7.2 User Leave Quotas
export async function getUserLeaveQuota(
  userId: string, 
  staffName?: string, 
  fiscalYear: number = 2569
): Promise<UserLeaveQuota> {
  if (isConfigured) {
    try {
      const q = query(
        collection(db, "hr_quotas"), 
        where("userId", "==", userId), 
        where("fiscalYear", "==", fiscalYear)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as UserLeaveQuota;
      }
    } catch (e) {
      console.warn("Firestore getUserLeaveQuota fallback:", e);
    }
  }

  const localQuotas = getLocalData<UserLeaveQuota>("hr_quotas", MOCK_USER_QUOTAS);
  const found = localQuotas.find(q => q.userId === userId && q.fiscalYear === fiscalYear);
  if (found) return found;

  // Default quota if none found
  const defaultQuota: UserLeaveQuota = {
    id: `quota-${userId}-${fiscalYear}`,
    userId,
    staffName: staffName || "บุคลากร",
    department: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "อาจารย์",
    employeeType: "contract_academic",
    fiscalYear,
    vacationQuota: { accumulated: 0, currentYear: 10, used: 0, remaining: 10 },
    personalQuota: { currentYear: 45, used: 0, remaining: 45 },
    sickQuota: { currentYear: 60, used: 0, remaining: 60 },
    dutyQuota: { used: 0 },
    updatedAt: new Date().toISOString()
  };

  return defaultQuota;
}

export async function getAllUserLeaveQuotas(fiscalYear: number = 2569): Promise<UserLeaveQuota[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "hr_quotas"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserLeaveQuota));
      }
    } catch (e) {
      console.warn("Firestore getAllUserLeaveQuotas fallback:", e);
    }
  }
  return getLocalData<UserLeaveQuota>("hr_quotas", MOCK_USER_QUOTAS);
}

export async function saveUserLeaveQuota(
  quota: UserLeaveQuota,
  actor?: UserProfile | null
): Promise<void> {
  const payload = {
    ...quota,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      await setDoc(doc(db, "hr_quotas", quota.id), {
        ...payload,
        timestamp: serverTimestamp()
      }, { merge: true });
      await logAuditEvent(actor || null, "SAVE_LEAVE_QUOTA", "hr_quotas", quota.id, { userId: quota.userId, fiscalYear: quota.fiscalYear });
      return;
    } catch (e) {
      console.error("Firestore saveUserLeaveQuota failed:", e);
      throw e;
    }
  }

  const list = getLocalData<UserLeaveQuota>("hr_quotas", MOCK_USER_QUOTAS);
  const exists = list.some(q => q.id === quota.id);
  const updated = exists ? list.map(q => q.id === quota.id ? payload : q) : [payload, ...list];
  setLocalData("hr_quotas", updated);
}

// 7.3 Faculty Portfolio & SAR
export async function getFacultyPortfolios(): Promise<FacultyPortfolio[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "hr_portfolios"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as FacultyPortfolio));
      }
    } catch (e) {
      console.warn("Firestore getFacultyPortfolios fallback:", e);
    }
  }
  return getLocalData("hr_portfolios", MOCK_FACULTY_PORTFOLIOS);
}

export async function saveFacultyPortfolio(
  portfolio: FacultyPortfolio,
  actor?: UserProfile | null
): Promise<FacultyPortfolio> {
  const payload = {
    ...portfolio,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      await setDoc(doc(db, "hr_portfolios", portfolio.id), {
        ...payload,
        timestamp: serverTimestamp()
      }, { merge: true });
      await logAuditEvent(actor || null, "SAVE_FACULTY_PORTFOLIO", "hr_portfolios", portfolio.id, { 
        fullName: portfolio.fullName, 
        department: portfolio.department 
      });
      return payload;
    } catch (e) {
      console.error("Firestore saveFacultyPortfolio failed:", e);
      throw e;
    }
  }

  const list = getLocalData<FacultyPortfolio>("hr_portfolios", MOCK_FACULTY_PORTFOLIOS);
  const exists = list.some(p => p.id === portfolio.id);
  const updated = exists ? list.map(p => p.id === portfolio.id ? payload : p) : [payload, ...list];
  setLocalData("hr_portfolios", updated);
  return payload;
}

// 7.4 Employment Contracts
export async function getEmploymentContracts(): Promise<EmploymentContract[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "hr_contracts"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as EmploymentContract));
      }
    } catch (e) {
      console.warn("Firestore getEmploymentContracts fallback:", e);
    }
  }
  return getLocalData("hr_contracts", MOCK_EMPLOYMENT_CONTRACTS);
}

export async function createEmploymentContract(
  data: Omit<EmploymentContract, "id" | "createdAt">,
  actor?: UserProfile | null
): Promise<EmploymentContract> {
  const newContract: Omit<EmploymentContract, "id"> = {
    ...data,
    createdById: actor?.id,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "hr_contracts"), {
        ...newContract,
        timestamp: serverTimestamp()
      });
      const created: EmploymentContract = { id: ref.id, ...newContract };
      await logAuditEvent(actor || null, "CREATE_EMPLOYMENT_CONTRACT", "hr_contracts", ref.id, { 
        contractNumber: data.contractNumber, 
        employeeName: data.employeeName 
      });
      return created;
    } catch (e) {
      console.error("Firestore createEmploymentContract failed:", e);
      throw e;
    }
  }

  const list = getLocalData<EmploymentContract>("hr_contracts", MOCK_EMPLOYMENT_CONTRACTS);
  const created: EmploymentContract = { id: `ct-${Date.now()}`, ...newContract };
  setLocalData("hr_contracts", [created, ...list]);
  return created;
}

export async function updateEmploymentContract(
  id: string,
  updates: Partial<EmploymentContract>,
  actor?: UserProfile | null
): Promise<void> {
  const payload = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const docRef = doc(db, "hr_contracts", id);
      await updateDoc(docRef, {
        ...payload,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_EMPLOYMENT_CONTRACT", "hr_contracts", id, updates);
      return;
    } catch (e) {
      console.error("Firestore updateEmploymentContract failed:", e);
      throw e;
    }
  }

  const list = getLocalData<EmploymentContract>("hr_contracts", MOCK_EMPLOYMENT_CONTRACTS);
  const updated = list.map(item => item.id === id ? { ...item, ...payload } : item);
  setLocalData("hr_contracts", updated);
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

// ==========================================
// 10. STRATEGIC PLANS & KPIS (แผนยุทธศาสตร์คณะ)
// ==========================================
export async function getStrategicPlan(fiscalYear: number = 2569): Promise<StrategicPlan> {
  if (isConfigured) {
    try {
      const snap = await getDoc(doc(db, "strategic_plans", `plan-${fiscalYear}`));
      if (snap.exists()) {
        return snap.data() as StrategicPlan;
      }
    } catch (e) {
      console.warn("Firestore getStrategicPlan fallback:", e);
    }
  }

  const local = getLocalData<StrategicPlan>("strategic_plans", [MOCK_STRATEGIC_PLAN]);
  const found = local.find(p => p.fiscalYear === fiscalYear);
  return found || MOCK_STRATEGIC_PLAN;
}

export async function saveStrategicPlan(
  plan: StrategicPlan,
  actor?: UserProfile | null
): Promise<void> {
  const payload = {
    ...plan,
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.name || "ผู้บริหารคณะ"
  };

  if (isConfigured) {
    try {
      await setDoc(doc(db, "strategic_plans", plan.id || `plan-${plan.fiscalYear}`), {
        ...payload,
        timestamp: serverTimestamp()
      }, { merge: true });
      await logAuditEvent(actor || null, "SAVE_STRATEGIC_PLAN", "strategic_plans", plan.id, { fiscalYear: plan.fiscalYear, planTitle: plan.planTitle });
      return;
    } catch (e) {
      console.error("Firestore saveStrategicPlan failed:", e);
      throw e;
    }
  }

  const list = getLocalData<StrategicPlan>("strategic_plans", [MOCK_STRATEGIC_PLAN]);
  const exists = list.some(p => p.id === plan.id);
  const updated = exists ? list.map(p => p.id === plan.id ? payload : p) : [payload, ...list];
  setLocalData("strategic_plans", updated);
}

// ==========================================
// 11. SYSTEM NOTIFICATIONS (ระบบแจ้งเตือนส่วนกลาง)
// ==========================================
export async function getAppNotifications(userId?: string, userRole?: UserRole): Promise<AppNotification[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc")));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      }
    } catch (e) {
      console.warn("Firestore getAppNotifications fallback:", e);
    }
  }

  return getLocalData<AppNotification>("notifications", MOCK_NOTIFICATIONS);
}

export async function createAppNotification(
  data: Omit<AppNotification, "id" | "createdAt" | "read">
): Promise<AppNotification> {
  const newNotif: Omit<AppNotification, "id"> = {
    ...data,
    read: false,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "notifications"), {
        ...newNotif,
        timestamp: serverTimestamp()
      });
      return { id: ref.id, ...newNotif };
    } catch (e) {
      console.error("Firestore createAppNotification error:", e);
    }
  }

  const list = getLocalData<AppNotification>("notifications", MOCK_NOTIFICATIONS);
  const created: AppNotification = { id: `notif-${Date.now()}`, ...newNotif };
  setLocalData("notifications", [created, ...list]);
  return created;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (isConfigured) {
    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        updatedAt: serverTimestamp()
      });
      return;
    } catch (e) {
      console.warn("Firestore markNotificationAsRead fallback:", e);
    }
  }

  const list = getLocalData<AppNotification>("notifications", MOCK_NOTIFICATIONS);
  const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
  setLocalData("notifications", updated);
}

export async function markAllNotificationsAsRead(userId?: string): Promise<void> {
  const list = getLocalData<AppNotification>("notifications", MOCK_NOTIFICATIONS);
  const updated = list.map(n => ({ ...n, read: true }));
  setLocalData("notifications", updated);
}

// ==========================================
// 12. USER ACCOUNTS, ROLES & INVITATIONS (ระบบบัญชีผู้ใช้ และสิทธิ์)
// ==========================================

export async function getAllUsers(): Promise<UserProfile[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "users"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      }
    } catch (e) {
      console.warn("Firestore getAllUsers fallback:", e);
    }
  }
  return getLocalData("users", MOCK_USERS);
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>,
  reason?: string,
  actor?: UserProfile | null
): Promise<void> {
  const users = await getAllUsers();
  const targetUser = users.find(u => u.id === userId);
  
  // Guard: Protect last active Super Admin from demotion or suspension
  if (targetUser?.role === "admin" && (data.role && data.role !== "admin" || data.status === "suspended")) {
    const activeAdmins = users.filter(u => u.role === "admin" && u.status === "active");
    if (activeAdmins.length <= 1 && activeAdmins[0]?.id === userId) {
      throw new Error("ไม่สามารถระงับการใช้งานหรือลดสิทธิ์ผู้ดูแลระบบหลัก (Super Admin) คนสุดท้ายของคณะได้");
    }
  }

  const payload = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, {
        ...payload,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "UPDATE_USER_PROFILE", "users", userId, { 
        before: targetUser, 
        after: data, 
        reason: reason || "ผู้ดูแลระบบปรับปรุงข้อมูลบัญชี" 
      });
      return;
    } catch (e) {
      console.error("Firestore updateUserProfile error:", e);
      throw e;
    }
  }

  const list = getLocalData<UserProfile>("users", MOCK_USERS);
  const updated = list.map(u => u.id === userId ? { ...u, ...payload } : u);
  setLocalData("users", updated);
  await logAuditEvent(actor || null, "UPDATE_USER_PROFILE", "users", userId, { before: targetUser, after: data, reason });
}

export async function approvePendingUser(
  userId: string,
  role: UserRole,
  employeeId?: string,
  actor?: UserProfile | null
): Promise<void> {
  const updateData: Partial<UserProfile> = {
    status: "active",
    role,
    ...(employeeId && { employeeId }),
    updatedAt: new Date().toISOString()
  };
  await updateUserProfile(userId, updateData, "อนุมัติเปิดใช้งานบัญชีผู้ใช้ใหม่", actor);
}

export async function updateMyProfile(
  userId: string,
  data: Pick<UserProfile, "phoneNumber" | "officeRoom" | "bio" | "avatarUrl" | "avatarVersion">,
  actor?: UserProfile | null
): Promise<void> {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, payload);
      await logAuditEvent(actor || null, "UPDATE_MY_PROFILE", "users", userId, data);
      return;
    } catch (e) {
      console.error("Firestore updateMyProfile error:", e);
      throw e;
    }
  }

  const list = getLocalData<UserProfile>("users", MOCK_USERS);
  const updated = list.map(u => u.id === userId ? { ...u, ...payload } : u);
  setLocalData("users", updated);
}

export async function getAccountInvitations(): Promise<AccountInvitation[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "invitations"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccountInvitation));
      }
    } catch (e) {
      console.warn("Firestore getAccountInvitations fallback:", e);
    }
  }
  return getLocalData("invitations", MOCK_INVITATIONS);
}

export async function createAccountInvitation(
  data: Omit<AccountInvitation, "id" | "createdAt" | "invitationToken" | "status">,
  actor?: UserProfile | null
): Promise<AccountInvitation> {
  const token = `tok_flas_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const newInvitation: AccountInvitation = {
    id: `inv-${Date.now()}`,
    ...data,
    invitationToken: token,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "invitations"), {
        ...newInvitation,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "CREATE_INVITATION", "invitations", ref.id, { email: data.email, employeeId: data.employeeId });
      return { ...newInvitation, id: ref.id };
    } catch (e) {
      console.error("Firestore createAccountInvitation error:", e);
      throw e;
    }
  }

  const list = getLocalData<AccountInvitation>("invitations", MOCK_INVITATIONS);
  setLocalData("invitations", [newInvitation, ...list]);
  return newInvitation;
}

export async function revokeAccountInvitation(
  invitationId: string,
  actor?: UserProfile | null
): Promise<void> {
  if (isConfigured) {
    try {
      await updateDoc(doc(db, "invitations", invitationId), {
        status: "revoked",
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "REVOKE_INVITATION", "invitations", invitationId, {});
      return;
    } catch (e) {
      console.error("Firestore revokeAccountInvitation error:", e);
      throw e;
    }
  }

  const list = getLocalData<AccountInvitation>("invitations", MOCK_INVITATIONS);
  const updated = list.map(i => i.id === invitationId ? { ...i, status: "revoked" as const } : i);
  setLocalData("invitations", updated);
}

// ==========================================
// 13. EMPLOYEES REGISTRY (ทะเบียนบุคลากร)
// ==========================================

export async function getEmployees(): Promise<EmployeeRecord[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "hr_employees"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeRecord));
      }
    } catch (e) {
      console.warn("Firestore getEmployees fallback:", e);
    }
  }
  return getLocalData("hr_employees", MOCK_EMPLOYEES);
}

export async function createEmployee(
  data: Omit<EmployeeRecord, "createdAt">,
  actor?: UserProfile | null
): Promise<EmployeeRecord> {
  const newEmp: EmployeeRecord = {
    ...data,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      await setDoc(doc(db, "hr_employees", data.id), {
        ...newEmp,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "CREATE_EMPLOYEE", "hr_employees", data.id, { officialName: data.officialName, department: data.department });
      return newEmp;
    } catch (e) {
      console.error("Firestore createEmployee error:", e);
      throw e;
    }
  }

  const list = getLocalData<EmployeeRecord>("hr_employees", MOCK_EMPLOYEES);
  setLocalData("hr_employees", [newEmp, ...list]);
  return newEmp;
}

export async function updateEmployee(
  id: string,
  data: Partial<EmployeeRecord>,
  actor?: UserProfile | null
): Promise<void> {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      await updateDoc(doc(db, "hr_employees", id), payload);
      await logAuditEvent(actor || null, "UPDATE_EMPLOYEE", "hr_employees", id, data);
      return;
    } catch (e) {
      console.error("Firestore updateEmployee error:", e);
      throw e;
    }
  }

  const list = getLocalData<EmployeeRecord>("hr_employees", MOCK_EMPLOYEES);
  const updated = list.map(e => e.id === id ? { ...e, ...payload } : e);
  setLocalData("hr_employees", updated);
}

// ==========================================
// 14. WORK POLICIES & PUBLIC HOLIDAYS (นโยบายตารางงาน กะ และวันหยุด)
// ==========================================

export async function getWorkPolicy(): Promise<WorkPolicy> {
  if (isConfigured) {
    try {
      const snap = await getDoc(doc(db, "work_policies", "faculty_default_policy"));
      if (snap.exists()) {
        return snap.data() as WorkPolicy;
      }
    } catch (e) {
      console.warn("Firestore getWorkPolicy fallback:", e);
    }
  }
  const local = getLocalData<WorkPolicy>("work_policies", [MOCK_WORK_POLICY]);
  return local[0] || MOCK_WORK_POLICY;
}

export async function saveWorkPolicy(
  policy: WorkPolicy,
  actor?: UserProfile | null
): Promise<void> {
  const payload = {
    ...policy,
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.name || "ผู้ดูแลระบบ"
  };

  if (isConfigured) {
    try {
      await setDoc(doc(db, "work_policies", "faculty_default_policy"), {
        ...payload,
        timestamp: serverTimestamp()
      }, { merge: true });
      await logAuditEvent(actor || null, "SAVE_WORK_POLICY", "work_policies", "faculty_default_policy", { version: policy.version });
      return;
    } catch (e) {
      console.error("Firestore saveWorkPolicy error:", e);
      throw e;
    }
  }

  setLocalData("work_policies", [payload]);
}

export async function getPublicHolidays(year: number = 2569): Promise<PublicHoliday[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "public_holidays"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as PublicHoliday));
      }
    } catch (e) {
      console.warn("Firestore getPublicHolidays fallback:", e);
    }
  }
  return getLocalData("public_holidays", MOCK_HOLIDAYS_2569);
}

export async function createPublicHoliday(
  data: Omit<PublicHoliday, "id">,
  actor?: UserProfile | null
): Promise<PublicHoliday> {
  const newHoliday: PublicHoliday = {
    id: `h-${Date.now()}`,
    ...data
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "public_holidays"), newHoliday);
      await logAuditEvent(actor || null, "CREATE_HOLIDAY", "public_holidays", ref.id, data);
      return { ...newHoliday, id: ref.id };
    } catch (e) {
      console.error("Firestore createPublicHoliday error:", e);
      throw e;
    }
  }

  const list = getLocalData<PublicHoliday>("public_holidays", MOCK_HOLIDAYS_2569);
  setLocalData("public_holidays", [...list, newHoliday]);
  return newHoliday;
}

export async function deletePublicHoliday(
  id: string,
  actor?: UserProfile | null
): Promise<void> {
  if (isConfigured) {
    try {
      await deleteDoc(doc(db, "public_holidays", id));
      await logAuditEvent(actor || null, "DELETE_HOLIDAY", "public_holidays", id, {});
      return;
    } catch (e) {
      console.error("Firestore deletePublicHoliday error:", e);
      throw e;
    }
  }

  const list = getLocalData<PublicHoliday>("public_holidays", MOCK_HOLIDAYS_2569);
  setLocalData("public_holidays", list.filter(h => h.id !== id));
}

// ==========================================
// 15. ATTENDANCE CHECK-IN & CHECK-OUT (ระบบลงเวลาเข้า-ออก)
// ==========================================

export async function getTodayAttendanceSession(
  employeeId: string,
  workDate?: string
): Promise<AttendanceSession | null> {
  const targetDate = workDate || new Date().toISOString().split("T")[0];
  const sessionId = `att-${employeeId}-${targetDate}`;

  if (isConfigured) {
    try {
      const snap = await getDoc(doc(db, "attendance_sessions", sessionId));
      if (snap.exists()) {
        return snap.data() as AttendanceSession;
      }
    } catch (e) {
      console.warn("Firestore getTodayAttendanceSession fallback:", e);
    }
  }

  const sessions = getLocalData<AttendanceSession>("attendance_sessions", MOCK_ATTENDANCE_SESSIONS);
  return sessions.find(s => s.employeeId === employeeId && s.workDate === targetDate) || null;
}

export async function getMyAttendanceSessions(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceSession[]> {
  if (isConfigured) {
    try {
      const q = query(
        collection(db, "attendance_sessions"),
        where("employeeId", "==", employeeId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceSession));
      }
    } catch (e) {
      console.warn("Firestore getMyAttendanceSessions fallback:", e);
    }
  }

  const sessions = getLocalData<AttendanceSession>("attendance_sessions", MOCK_ATTENDANCE_SESSIONS);
  return sessions.filter(s => s.employeeId === employeeId);
}

export async function getAllAttendanceSessions(
  workDate?: string,
  department?: string
): Promise<AttendanceSession[]> {
  const targetDate = workDate || new Date().toISOString().split("T")[0];

  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "attendance_sessions"));
      if (!snap.empty) {
        let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceSession));
        if (targetDate) list = list.filter(s => s.workDate === targetDate);
        if (department && department !== "all") list = list.filter(s => s.department === department);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getAllAttendanceSessions fallback:", e);
    }
  }

  let list = getLocalData<AttendanceSession>("attendance_sessions", MOCK_ATTENDANCE_SESSIONS);
  if (targetDate) list = list.filter(s => s.workDate === targetDate);
  if (department && department !== "all") list = list.filter(s => s.department === department);
  return list;
}

export async function recordAttendanceCheckIn(
  payload: {
    employeeId: string;
    userId: string;
    staffName: string;
    department: string;
    shiftId?: string;
    source: "web" | "gps" | "qr";
    locationCoords?: { latitude: number; longitude: number; accuracy?: number };
    locationName?: string;
    requestId: string;
  },
  actor?: UserProfile | null
): Promise<AttendanceSession> {
  const now = new Date();
  const workDate = now.toISOString().split("T")[0];
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const checkInTime = `${hours}:${minutes}`;
  const sessionId = `att-${payload.employeeId}-${workDate}`;

  // Check if session already exists for today
  const existingSession = await getTodayAttendanceSession(payload.employeeId, workDate);
  if (existingSession && existingSession.checkInTime) {
    return existingSession; // Idempotent check
  }

  const policy = await getWorkPolicy();
  const shift = policy.shifts.find(s => s.id === (payload.shiftId || "SHIFT-NORMAL")) || policy.shifts[0];

  // Calculate late status
  const [shiftHour, shiftMin] = shift.startTime.split(":").map(Number);
  const shiftStartTotalMin = shiftHour * 60 + shiftMin + shift.lateGraceMinutes;
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();
  const isLate = currentTotalMin > shiftStartTotalMin;
  const lateMinutes = isLate ? currentTotalMin - (shiftHour * 60 + shiftMin) : 0;

  const rawEventId = `ev-in-${Date.now()}`;
  const rawEvent: AttendanceEvent = {
    id: rawEventId,
    userId: payload.userId,
    employeeId: payload.employeeId,
    staffName: payload.staffName,
    eventType: "check_in",
    serverTimestamp: now.toISOString(),
    workDate,
    source: payload.source,
    locationCoords: payload.locationCoords,
    locationName: payload.locationName || "คณะศิลปศาสตร์และวิทยาศาสตร์ CPRU",
    sessionId,
    requestId: payload.requestId
  };

  const newSession: AttendanceSession = {
    id: sessionId,
    userId: payload.userId,
    employeeId: payload.employeeId,
    staffName: payload.staffName,
    department: payload.department,
    workDate,
    shiftId: shift.id,
    shiftName: shift.name,
    checkInTime,
    checkInEventId: rawEventId,
    checkInStatus: isLate ? "late" : "on_time",
    sessionStatus: "open",
    workType: "work",
    lateMinutes,
    earlyMinutes: 0,
    totalWorkMinutes: 0,
    updatedAt: now.toISOString()
  };

  if (isConfigured) {
    try {
      await addDoc(collection(db, "attendance_events"), rawEvent);
      await setDoc(doc(db, "attendance_sessions", sessionId), {
        ...newSession,
        timestamp: serverTimestamp()
      }, { merge: true });

      await logAuditEvent(actor || null, "ATTENDANCE_CHECK_IN", "attendance_sessions", sessionId, {
        checkInTime,
        checkInStatus: newSession.checkInStatus,
        lateMinutes
      });
      return newSession;
    } catch (e) {
      console.error("Firestore recordAttendanceCheckIn error:", e);
      throw e;
    }
  }

  const events = getLocalData<AttendanceEvent>("attendance_events", []);
  setLocalData("attendance_events", [rawEvent, ...events]);

  const sessions = getLocalData<AttendanceSession>("attendance_sessions", MOCK_ATTENDANCE_SESSIONS);
  const updatedSessions = sessions.some(s => s.id === sessionId)
    ? sessions.map(s => s.id === sessionId ? newSession : s)
    : [newSession, ...sessions];
  setLocalData("attendance_sessions", updatedSessions);

  return newSession;
}

export async function recordAttendanceCheckOut(
  payload: {
    employeeId: string;
    userId: string;
    source: "web" | "gps" | "qr";
    locationCoords?: { latitude: number; longitude: number; accuracy?: number };
    locationName?: string;
    requestId: string;
  },
  actor?: UserProfile | null
): Promise<AttendanceSession> {
  const now = new Date();
  const workDate = now.toISOString().split("T")[0];
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const checkOutTime = `${hours}:${minutes}`;
  const sessionId = `att-${payload.employeeId}-${workDate}`;

  const currentSession = await getTodayAttendanceSession(payload.employeeId, workDate);
  if (!currentSession) {
    throw new Error("ยังไม่มีข้อมูลการลงเวลาเข้างานในวันนี้ กรุณากดลงเวลาเข้างานก่อน");
  }

  const policy = await getWorkPolicy();
  const shift = policy.shifts.find(s => s.id === currentSession.shiftId) || policy.shifts[0];

  // Calculate early leave
  const [shiftEndH, shiftEndM] = shift.endTime.split(":").map(Number);
  const shiftEndTotalMin = shiftEndH * 60 + shiftEndM;
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();
  const isEarly = currentTotalMin < shiftEndTotalMin;
  const earlyMinutes = isEarly ? shiftEndTotalMin - currentTotalMin : 0;

  // Calculate total work minutes
  let totalWorkMinutes = 0;
  if (currentSession.checkInTime) {
    const [inH, inM] = currentSession.checkInTime.split(":").map(Number);
    const inTotalMin = inH * 60 + inM;
    totalWorkMinutes = Math.max(0, currentTotalMin - inTotalMin);
  }

  const rawEventId = `ev-out-${Date.now()}`;
  const rawEvent: AttendanceEvent = {
    id: rawEventId,
    userId: payload.userId,
    employeeId: payload.employeeId,
    staffName: currentSession.staffName,
    eventType: "check_out",
    serverTimestamp: now.toISOString(),
    workDate,
    source: payload.source,
    locationCoords: payload.locationCoords,
    locationName: payload.locationName || "คณะศิลปศาสตร์และวิทยาศาสตร์ CPRU",
    sessionId,
    requestId: payload.requestId
  };

  const updatedSession: AttendanceSession = {
    ...currentSession,
    checkOutTime,
    checkOutEventId: rawEventId,
    checkOutStatus: isEarly ? "early_leave" : "normal",
    sessionStatus: "closed",
    earlyMinutes,
    totalWorkMinutes,
    updatedAt: now.toISOString()
  };

  if (isConfigured) {
    try {
      await addDoc(collection(db, "attendance_events"), rawEvent);
      await setDoc(doc(db, "attendance_sessions", sessionId), {
        ...updatedSession,
        timestamp: serverTimestamp()
      }, { merge: true });

      await logAuditEvent(actor || null, "ATTENDANCE_CHECK_OUT", "attendance_sessions", sessionId, {
        checkOutTime,
        checkOutStatus: updatedSession.checkOutStatus,
        totalWorkMinutes
      });
      return updatedSession;
    } catch (e) {
      console.error("Firestore recordAttendanceCheckOut error:", e);
      throw e;
    }
  }

  const events = getLocalData<AttendanceEvent>("attendance_events", []);
  setLocalData("attendance_events", [rawEvent, ...events]);

  const sessions = getLocalData<AttendanceSession>("attendance_sessions", MOCK_ATTENDANCE_SESSIONS);
  setLocalData("attendance_sessions", sessions.map(s => s.id === sessionId ? updatedSession : s));

  return updatedSession;
}

// ==========================================
// 16. ATTENDANCE CORRECTIONS (คำขอแก้ไขเวลาย้อนหลัง)
// ==========================================

export async function getAttendanceCorrections(
  statusFilter?: string,
  department?: string
): Promise<AttendanceCorrection[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "attendance_corrections"));
      if (!snap.empty) {
        let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceCorrection));
        if (statusFilter && statusFilter !== "all") list = list.filter(c => c.status === statusFilter);
        if (department && department !== "all") list = list.filter(c => c.department === department);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getAttendanceCorrections fallback:", e);
    }
  }

  let list = getLocalData<AttendanceCorrection>("attendance_corrections", MOCK_ATTENDANCE_CORRECTIONS);
  if (statusFilter && statusFilter !== "all") list = list.filter(c => c.status === statusFilter);
  if (department && department !== "all") list = list.filter(c => c.department === department);
  return list;
}

export async function requestAttendanceCorrection(
  data: Omit<AttendanceCorrection, "id" | "createdAt" | "status">,
  actor?: UserProfile | null
): Promise<AttendanceCorrection> {
  const newCorr: AttendanceCorrection = {
    id: `corr-${Date.now()}`,
    ...data,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  // Update corresponding attendance session flag
  const sessionId = `att-${data.employeeId}-${data.workDate}`;

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "attendance_corrections"), {
        ...newCorr,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, "attendance_sessions", sessionId), {
        hasCorrection: true,
        correctionId: ref.id,
        updatedAt: serverTimestamp()
      });
      await logAuditEvent(actor || null, "REQUEST_ATTENDANCE_CORRECTION", "attendance_corrections", ref.id, {
        workDate: data.workDate,
        reason: data.reason
      });

      // Create Notification for Supervisor / HR
      await createAppNotification({
        title: "คำขอแก้ไขเวลาทำงานใหม่",
        message: `${data.staffName} ยื่นขอแก้ไขเวลาทำงานวันที่ ${data.workDate}`,
        category: "attendance",
        linkHref: "/hr/attendance"
      });

      return { ...newCorr, id: ref.id };
    } catch (e) {
      console.error("Firestore requestAttendanceCorrection error:", e);
      throw e;
    }
  }

  const list = getLocalData<AttendanceCorrection>("attendance_corrections", MOCK_ATTENDANCE_CORRECTIONS);
  setLocalData("attendance_corrections", [newCorr, ...list]);

  const sessions = getLocalData<AttendanceSession>("attendance_sessions", MOCK_ATTENDANCE_SESSIONS);
  setLocalData("attendance_sessions", sessions.map(s => s.id === sessionId ? { ...s, hasCorrection: true, correctionId: newCorr.id } : s));

  return newCorr;
}

export async function reviewAttendanceCorrection(
  correctionId: string,
  decision: "approved" | "rejected",
  comment?: string,
  actor?: UserProfile | null
): Promise<void> {
  const corrections = await getAttendanceCorrections();
  const correction = corrections.find(c => c.id === correctionId);
  if (!correction) throw new Error("Correction request not found");

  // Prevent self approval
  if (actor && actor.id === correction.userId) {
    throw new Error("ไม่อนุญาตให้อนุมัติคำขอแก้ไขเวลาทำงานของตนเอง ต้องให้หัวหน้างานหรือเจ้าหน้าที่บุคคลเป็นผู้ตรวจรับรอง");
  }

  const reviewedAt = new Date().toISOString();
  const updatePayload = {
    status: decision,
    reviewerId: actor?.employeeId || actor?.id,
    reviewerName: actor?.name || "ผู้บังคับบัญชา",
    reviewerComment: comment || (decision === "approved" ? "อนุมัติการแก้ไขเวลา" : "ไม่อนุมัติ"),
    reviewedAt
  };

  // If approved, update the session times without overwriting raw punch logs
  if (decision === "approved") {
    const sessionId = `att-${correction.employeeId}-${correction.workDate}`;
    const session = await getTodayAttendanceSession(correction.employeeId, correction.workDate);
    if (session) {
      const [inH, inM] = correction.requestedCheckIn.split(":").map(Number);
      const [outH, outM] = (correction.requestedCheckOut || "16:30").split(":").map(Number);
      const totalWorkMin = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

      const updatedSessionData: Partial<AttendanceSession> = {
        checkInTime: correction.requestedCheckIn,
        checkOutTime: correction.requestedCheckOut,
        checkInStatus: "on_time",
        checkOutStatus: "normal",
        sessionStatus: "closed",
        lateMinutes: 0,
        earlyMinutes: 0,
        totalWorkMinutes: totalWorkMin,
        updatedAt: reviewedAt
      };

      if (isConfigured) {
        await updateDoc(doc(db, "attendance_sessions", sessionId), updatedSessionData);
      } else {
        const sessions = getLocalData<AttendanceSession>("attendance_sessions", MOCK_ATTENDANCE_SESSIONS);
        setLocalData("attendance_sessions", sessions.map(s => s.id === sessionId ? { ...s, ...updatedSessionData } : s));
      }
    }
  }

  if (isConfigured) {
    try {
      await updateDoc(doc(db, "attendance_corrections", correctionId), {
        ...updatePayload,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "REVIEW_ATTENDANCE_CORRECTION", "attendance_corrections", correctionId, {
        decision,
        comment
      });
      return;
    } catch (e) {
      console.error("Firestore reviewAttendanceCorrection error:", e);
      throw e;
    }
  }

  setLocalData("attendance_corrections", corrections.map(c => c.id === correctionId ? { ...c, ...updatePayload } : c));
}

// ==========================================
// 17. MONTHLY ATTENDANCE REPORTS & PERIOD LOCK (ตรวจรายเดือนและปิดงวด)
// ==========================================

export async function getAttendancePeriodLock(period: string): Promise<AttendancePeriodLock> {
  const lockId = `lock-${period}`;
  if (isConfigured) {
    try {
      const snap = await getDoc(doc(db, "attendance_period_locks", lockId));
      if (snap.exists()) {
        return snap.data() as AttendancePeriodLock;
      }
    } catch (e) {
      console.warn("Firestore getAttendancePeriodLock fallback:", e);
    }
  }

  const locks = getLocalData<AttendancePeriodLock>("attendance_period_locks", MOCK_ATTENDANCE_PERIOD_LOCKS);
  return locks.find(l => l.period === period) || {
    id: lockId,
    period,
    isLocked: false,
    lockedBy: "",
    lockedByName: "",
    lockedAt: ""
  };
}

export async function lockAttendancePeriod(
  period: string,
  actor?: UserProfile | null
): Promise<AttendancePeriodLock> {
  const lockId = `lock-${period}`;
  const lockData: AttendancePeriodLock = {
    id: lockId,
    period,
    isLocked: true,
    lockedBy: actor?.id || "u-hr",
    lockedByName: actor?.name || "เจ้าหน้าที่บริหารงานบุคคล",
    lockedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      await setDoc(doc(db, "attendance_period_locks", lockId), {
        ...lockData,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "LOCK_ATTENDANCE_PERIOD", "attendance_period_locks", lockId, { period });
      return lockData;
    } catch (e) {
      console.error("Firestore lockAttendancePeriod error:", e);
      throw e;
    }
  }

  const list = getLocalData<AttendancePeriodLock>("attendance_period_locks", MOCK_ATTENDANCE_PERIOD_LOCKS);
  setLocalData("attendance_period_locks", list.some(l => l.period === period) ? list.map(l => l.period === period ? lockData : l) : [...list, lockData]);
  return lockData;
}

export async function reopenAttendancePeriod(
  period: string,
  reason: string,
  actor?: UserProfile | null
): Promise<AttendancePeriodLock> {
  const lockId = `lock-${period}`;
  const lockData: AttendancePeriodLock = {
    id: lockId,
    period,
    isLocked: false,
    lockedBy: "",
    lockedByName: "",
    lockedAt: "",
    reopenedBy: actor?.id || "u-hr",
    reopenedByName: actor?.name || "เจ้าหน้าที่บริหารงานบุคคล",
    reopenReason: reason,
    reopenedAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      await setDoc(doc(db, "attendance_period_locks", lockId), {
        ...lockData,
        timestamp: serverTimestamp()
      });
      await logAuditEvent(actor || null, "REOPEN_ATTENDANCE_PERIOD", "attendance_period_locks", lockId, { period, reason });
      return lockData;
    } catch (e) {
      console.error("Firestore reopenAttendancePeriod error:", e);
      throw e;
    }
  }

  const list = getLocalData<AttendancePeriodLock>("attendance_period_locks", MOCK_ATTENDANCE_PERIOD_LOCKS);
  setLocalData("attendance_period_locks", list.map(l => l.period === period ? lockData : l));
  return lockData;
}

export async function getMonthlyAttendanceReports(
  period: string,
  department?: string
): Promise<MonthlyAttendanceReport[]> {
  const employees = await getEmployees();
  const eligibleEmployees = employees.filter(e => e.attendanceEligible && e.status === "active");
  const filteredEmployees = (department && department !== "all") 
    ? eligibleEmployees.filter(e => e.department === department) 
    : eligibleEmployees;

  const approvedLeaves = await getHRLeaves();
  const allSessions = await getAllAttendanceSessions();

  // Compute monthly report dynamically per employee
  const reports: MonthlyAttendanceReport[] = filteredEmployees.map(emp => {
    const empSessions = allSessions.filter(s => s.employeeId === emp.id && s.workDate.startsWith(period));
    const empLeaves = approvedLeaves.filter(l => l.staffName === emp.officialName && l.status === "approved");

    const actualWorkDays = empSessions.filter(s => s.checkInTime).length;
    const lateDaysCount = empSessions.filter(s => s.checkInStatus === "late").length;
    const lateTotalMinutes = empSessions.reduce((acc, s) => acc + (s.lateMinutes || 0), 0);
    const earlyLeaveDaysCount = empSessions.filter(s => s.checkOutStatus === "early_leave").length;
    const incompleteDaysCount = empSessions.filter(s => s.sessionStatus === "incomplete").length;

    // Calculate approved leave days in this period
    let leaveDaysCount = 0;
    empLeaves.forEach(lv => {
      if (lv.startDate.startsWith(period) || lv.endDate.startsWith(period)) {
        leaveDaysCount += lv.totalDays;
      }
    });

    const expectedWorkDays = 21; // Normal working days in month
    const accountedDays = actualWorkDays + leaveDaysCount;
    const absentDaysCount = Math.max(0, expectedWorkDays - accountedDays);

    return {
      id: `mrep-${emp.id}-${period}`,
      period,
      fiscalYear: 2569,
      employeeId: emp.id,
      staffName: emp.officialName,
      department: emp.department,
      position: emp.position,
      expectedWorkDays,
      actualWorkDays,
      lateDaysCount,
      lateTotalMinutes,
      earlyLeaveDaysCount,
      leaveDaysCount,
      officialDutyDaysCount: 0,
      absentDaysCount,
      incompleteDaysCount,
      status: "verified"
    };
  });

  return reports;
}


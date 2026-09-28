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
  RoomBooking, 
  ProjectProposal,
  PurchaseRequisition,
  LoanContract,
  LeaveRequest,
  MasterSystemConfig,
  UserProfile
} from "./types";
import { MOCK_INBOUND_DOCS, MOCK_OUTBOUND_DOCS, MOCK_PROJECTS, MOCK_ROOMS } from "./mockData";
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
  const newDoc: InboundDocument = {
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
      const created = { id: ref.id, ...newDoc };
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
  
  const newDoc: OutboundDocument = {
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
      const created = { id: ref.id, ...newDoc };
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
  const newProject: ProjectProposal = {
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
      const created = { id: ref.id, ...newProject };
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
  const newPR: PurchaseRequisition = {
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
      const created = { id: ref.id, ...newPR };
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
// 6. FINANCE LOANS (สัญญายืมเงินทดรองจ่าย)
// ==========================================
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
  return getLocalData("finance_loans", []);
}

export async function createFinanceLoan(
  data: Omit<LoanContract, "id" | "createdAt" | "contractNumber">,
  actor?: UserProfile | null
): Promise<LoanContract> {
  const contractNumber = await getNextAtomicNumber("loan", 2569);
  const newLoan: LoanContract = {
    ...data,
    contractNumber,
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
      const created = { id: ref.id, ...newLoan };
      await logAuditEvent(actor || null, "CREATE_LOAN", "finance_loans", ref.id, { contractNumber, amount: data.amount, borrowerName: data.borrowerName });
      return created;
    } catch (e) {
      console.error("Firestore createFinanceLoan failed:", e);
      throw e;
    }
  }

  const list = getLocalData<LoanContract>("finance_loans", []);
  const created: LoanContract = { id: `loan-${Date.now()}`, ...newLoan };
  setLocalData("finance_loans", [created, ...list]);
  return created;
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
  const newLeave: LeaveRequest = {
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
      const created = { id: ref.id, ...newLeave };
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
  const newBooking: RoomBooking = {
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

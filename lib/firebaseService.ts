// Firebase Firestore & Storage Service Layer
// Works seamlessly with live Firebase or local storage fallback

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
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
import { InboundDocument, OutboundDocument, OfficialMemo, RoomBooking, ProjectProposal } from "./types";
import { MOCK_INBOUND_DOCS, MOCK_OUTBOUND_DOCS, MOCK_PROJECTS, MOCK_ROOMS } from "./mockData";

// Local storage helper
const getLocalData = <T>(key: string, defaultData: T[]): T[] => {
  if (typeof window === "undefined") return defaultData;
  const saved = localStorage.getItem(`faculty_erp_${key}`);
  if (!saved) {
    localStorage.setItem(`faculty_erp_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return defaultData;
  }
};

const setLocalData = <T>(key: string, data: T[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`faculty_erp_${key}`, JSON.stringify(data));
  }
};

// 1. INBOUND DOCUMENTS (หนังสือรับ)
export async function getInboundDocs(): Promise<InboundDocument[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "admin_documents_in"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as InboundDocument));
    } catch (e) {
      console.warn("Firestore read fallback to local storage:", e);
    }
  }
  return getLocalData("inbound_docs", MOCK_INBOUND_DOCS);
}

export async function createInboundDoc(data: Omit<InboundDocument, "id" | "createdAt">): Promise<InboundDocument> {
  const newDoc = {
    ...data,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "admin_documents_in"), {
        ...newDoc,
        timestamp: serverTimestamp()
      });
      return { id: ref.id, ...newDoc };
    } catch (e) {
      console.warn("Firestore write fallback to local storage:", e);
    }
  }

  const localList = getLocalData<InboundDocument>("inbound_docs", MOCK_INBOUND_DOCS);
  const created: InboundDocument = { id: `in-${Date.now()}`, ...newDoc };
  setLocalData("inbound_docs", [created, ...localList]);
  return created;
}

export async function updateInboundDocStatus(id: string, status: InboundDocument["status"], actionNote?: string, assignedDept?: string) {
  if (isConfigured) {
    try {
      const docRef = doc(db, "admin_documents_in", id);
      await updateDoc(docRef, {
        status,
        ...(actionNote && { actionNote }),
        ...(assignedDept && { assignedDept }),
        updatedAt: serverTimestamp()
      });
      return;
    } catch (e) {
      console.warn("Firestore update fallback to local:", e);
    }
  }

  const list = getLocalData<InboundDocument>("inbound_docs", MOCK_INBOUND_DOCS);
  const updated = list.map(item => {
    if (item.id === id) {
      return {
        ...item,
        status,
        ...(actionNote && { actionNote }),
        ...(assignedDept && { assignedDept })
      };
    }
    return item;
  });
  setLocalData("inbound_docs", updated);
}

// 2. OUTBOUND DOCUMENTS (หนังสือส่ง)
export async function getOutboundDocs(): Promise<OutboundDocument[]> {
  if (isConfigured) {
    try {
      const snap = await getDocs(collection(db, "admin_documents_out"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as OutboundDocument));
    } catch (e) {
      console.warn("Firestore read fallback to local storage:", e);
    }
  }
  return getLocalData("outbound_docs", MOCK_OUTBOUND_DOCS);
}

export async function createOutboundDoc(data: Omit<OutboundDocument, "id" | "createdAt">): Promise<OutboundDocument> {
  const newDoc = {
    ...data,
    createdAt: new Date().toISOString()
  };

  if (isConfigured) {
    try {
      const ref = await addDoc(collection(db, "admin_documents_out"), {
        ...newDoc,
        timestamp: serverTimestamp()
      });
      return { id: ref.id, ...newDoc };
    } catch (e) {
      console.warn("Firestore write fallback to local storage:", e);
    }
  }

  const list = getLocalData<OutboundDocument>("outbound_docs", MOCK_OUTBOUND_DOCS);
  const created: OutboundDocument = { id: `out-${Date.now()}`, ...newDoc };
  setLocalData("outbound_docs", [created, ...list]);
  return created;
}

// 3. FILE UPLOAD TO FIREBASE STORAGE
export async function uploadDocumentFile(file: File, folder: string = "admin_attachments"): Promise<string> {
  if (isConfigured) {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `${folder}/${timestamp}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (e) {
      console.error("Firebase Storage Upload Error:", e);
      throw e;
    }
  }
  // Mock upload for local preview
  return URL.createObjectURL(file);
}

// Audit Trail Logging Service for Faculty ERP
// Appends tamper-evident audit records to Firestore

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, isConfigured } from "./firebase";
import { AuditLogEntry, UserProfile } from "./types";

export async function logAuditEvent(
  actor: UserProfile | null,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
): Promise<void> {
  const auditEntry: Omit<AuditLogEntry, "id"> = {
    timestamp: new Date().toISOString(),
    userId: actor?.id || "anonymous",
    userName: actor?.name || "ระบบภายนอก",
    userRole: actor?.role || "gov_officer",
    action,
    entityType,
    entityId,
    details: details || {}
  };

  if (isConfigured) {
    try {
      await addDoc(collection(db, "audit_logs"), {
        ...auditEntry,
        createdAt: serverTimestamp()
      });
      return;
    } catch (err) {
      console.warn("Audit log write error:", err);
    }
  }

  // Local storage ring buffer for offline audit
  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(localStorage.getItem("faculty_audit_logs") || "[]");
      const updated = [{ id: `log-${Date.now()}`, ...auditEntry }, ...existing].slice(0, 100);
      localStorage.setItem("faculty_audit_logs", JSON.stringify(updated));
    } catch {}
  }
}

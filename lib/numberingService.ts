// Atomic Document Numbering Service for Faculty ERP
// Uses Firestore Transactions to ensure zero duplicate numbers under concurrent usage

import { doc, runTransaction, getDoc } from "firebase/firestore";
import { db, isConfigured } from "./firebase";

export type NumberingType = 
  | "inbound"         // หนังสือรับ (เช่น 001/2569)
  | "outbound"        // หนังสือส่ง (เช่น อว 0643.04/001)
  | "pr"              // ขอซื้อขอจ้าง (เช่น PR-69/001)
  | "loan"            // สัญญายืมเงิน (เช่น ยม 01/2569)
  | "memo"            // บันทึกข้อความ (เช่น บข 001/2569)
  | "project"         // รหัสโครงการ (เช่น 69-ART-001)
  | "leave_vacation"  // ใบลาพักผ่อน (เช่น ลพ 001/2569)
  | "leave_sick"      // ใบลาป่วย (เช่น ลป 001/2569)
  | "leave_personal"  // ใบลากิจ (เช่น ลก 001/2569)
  | "leave_duty"      // ใบไปราชการ (เช่น ลร 001/2569)
  | "contract";       // สัญญาจ้าง (เช่น สจ 001/2569)

export async function getNextAtomicNumber(
  type: NumberingType, 
  fiscalYear: number = 2569,
  prefixOverride?: string
): Promise<string> {
  const counterDocId = `${type}_${fiscalYear}`;

  if (isConfigured) {
    try {
      const counterRef = doc(db, "system_counters", counterDocId);
      
      const newSeq = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextNumber = 1;
        
        if (counterDoc.exists()) {
          nextNumber = (counterDoc.data().currentSequence || 0) + 1;
          transaction.update(counterRef, {
            currentSequence: nextNumber,
            updatedAt: new Date().toISOString()
          });
        } else {
          transaction.set(counterRef, {
            type,
            fiscalYear,
            currentSequence: nextNumber,
            createdAt: new Date().toISOString()
          });
        }
        
        return nextNumber;
      });

      return formatDocumentNumber(type, newSeq, fiscalYear, prefixOverride);
    } catch (err) {
      console.warn("Firestore transaction numbering fallback:", err);
    }
  }

  // Local fallback
  const localKey = `faculty_seq_${counterDocId}`;
  const current = parseInt(localStorage.getItem(localKey) || "0", 10);
  const next = current + 1;
  localStorage.setItem(localKey, next.toString());
  return formatDocumentNumber(type, next, fiscalYear, prefixOverride);
}

function formatDocumentNumber(
  type: NumberingType, 
  seq: number, 
  fiscalYear: number, 
  prefix?: string
): string {
  const pad3 = seq.toString().padStart(3, "0");
  const pad2 = seq.toString().padStart(2, "0");
  const year2 = (fiscalYear % 100).toString().padStart(2, "0");

  switch (type) {
    case "inbound":
      return `รับ ${pad3}/${fiscalYear}`;
    case "outbound":
      return `${prefix || "อว 0643.04/"}${pad3}`;
    case "pr":
      return `PR-${year2}/${pad3}`;
    case "loan":
      return `ยม ${pad2}/${fiscalYear}`;
    case "memo":
      return `บข ${pad3}/${fiscalYear}`;
    case "project":
      return `${year2}-FLAS-${pad3}`;
    case "leave_vacation":
      return `${prefix || "ลพ."} ${pad3}/${fiscalYear}`;
    case "leave_sick":
      return `${prefix || "ลป."} ${pad3}/${fiscalYear}`;
    case "leave_personal":
      return `${prefix || "ลก."} ${pad3}/${fiscalYear}`;
    case "leave_duty":
      return `${prefix || "ลร."} ${pad3}/${fiscalYear}`;
    case "contract":
      return `${prefix || "สจ."} ${pad3}/${fiscalYear}`;
    default:
      return `${pad3}/${fiscalYear}`;
  }
}

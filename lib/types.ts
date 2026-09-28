// Data Types for Faculty of Liberal Arts and Sciences ERP

export type UserRole = 
  | "admin"         // แอดมิน (ผู้ดูแลระบบและงานธุรการ)
  | "dean"          // คณบดี (ผู้บริหารคณะ)
  | "lecturer"      // อาจารย์
  | "gov_officer";  // พนักงานราชการ (สายสนับสนุน/การเงิน/พัสดุ)

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  email: string;
  avatarUrl?: string;
}

// 1. งานธุรการและสารบรรณ
export type DocumentUrgency = "normal" | "urgent" | "very_urgent" | "most_urgent";
export type DocumentStatus = "draft" | "pending_review" | "signed" | "forwarded" | "completed";

export interface InboundDocument {
  id: string;
  docNumber: string;         // เลขที่หนังสือต้นทาง เช่น อว 0604/1234
  receiveNumber: string;     // เลขรับคณะ เช่น 012/2569
  receiveDate: string;       // วันที่รับ
  title: string;             // เรื่อง
  sender: string;            // จากหน่วยงาน เช่น อธิการบดี, กองคลัง, อบต.
  urgency: DocumentUrgency;  // ความเร่งด่วน
  category: string;          // บันทึกข้อความ, คำสั่ง, ประชาสัมพันธ์
  assignedDept?: string;     // แทงเรื่องไปฝ่าย (การเงิน, พัสดุ, โครงการ, บุคลากร)
  assignedPerson?: string;   // มอบหมายอาจารย์/เจ้าหน้าที่
  actionNote?: string;       // ความเห็น/ข้อสั่งการ (เช่น "เพื่อโปรดทราบและดำเนินการ")
  status: DocumentStatus;
  fileAttachment?: string;
  createdAt: string;
}

export interface OutboundDocument {
  id: string;
  docNumber: string;         // เลขที่ส่งออก เช่น ศว 001/2569
  sendDate: string;
  title: string;
  recipient: string;         // เรียน
  category: string;
  signatory: string;         // ผู้ลงนาม เช่น คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์
  status: DocumentStatus;
  createdAt: string;
}

export interface OfficialMemo {
  id: string;
  title: string;
  docNumber: string;
  department: string;
  date: string;
  to: string;                // เรียน
  subject: string;           // เรื่อง
  bodyParagraphs: string[];  // ข้อความในบันทึก
  signatoryName: string;
  signatoryPosition: string;
  templateType: "invite_speaker_internal" | "invite_speaker_multiple" | "class_exemption" | "student_notice" | "official_travel" | "general_memo";
  createdAt: string;
}

export interface RoomBooking {
  id: string;
  roomName: string;
  capacity: number;
  bookedBy: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "approved" | "pending" | "rejected";
}

// 2. งานโครงการและแผน
export interface ProjectProposal {
  id: string;
  code: string;              // รหัสโครงการ เช่น 69-ART-001
  fiscalYear: number;        // 2569
  title: string;             // ชื่อโครงการ
  strategicGoal: string;     // ประเด็นยุทธศาสตร์ที่ 1-4 หรือ โครงการศาสตร์พระราชา
  department: string;        // สาขาวิชา
  leader: string;            // หัวหน้าโครงการ
  budgetApproved: number;    // งบประมาณจัดสรร (บาท)
  budgetUsed: number;        // งบประมาณใช้ไป (บาท)
  status: "draft" | "submitted" | "approved" | "in_progress" | "reported" | "closed";
  sdgGoals: number[];        // SDG 1-17
  kpis: string[];
  startDate: string;
  endDate: string;
}

// 3. งานการเงิน
export interface BudgetLedgerItem {
  id: string;
  category: string;          // งบดำเนินงาน, ค่าตอบแทน, ใช้สอย, วัสดุ
  subCategory: string;
  allocatedAmount: number;   // จัดสรร
  committedAmount: number;   // ผูกพัน
  disbursedAmount: number;   // เบิกจ่ายจริง
  remainingAmount: number;   // คงเหลือ
  department: string;
}

export interface LoanContract {
  id: string;
  contractNumber: string;    // สัญญาเลขที่ เช่น ยม. 015/2569
  borrowerName: string;      // ผู้ยืม
  position: string;
  purpose: string;           // ยืมเพื่อโครงการ
  amount: number;            // จำนวนเงิน
  borrowDate: string;
  settleDueDate: string;     // กำหนดชำระคืน (ภายใน 30 วัน)
  status: "pending_approval" | "active" | "settled" | "overdue";
  checklist: {
    hasContract: boolean;
    hasMemo: boolean;
    hasApprovedProject: boolean;
    hasEstimate: boolean;
  };
}

export interface TeachingDisbursement {
  id: string;
  periodMonth: string;       // กุมภาพันธ์ 2569
  program: "bachelor_regular" | "bachelor_gspch" | "supervision"; // ภาคปกติ, กศ.ปช., ค่านิเทศ
  totalAmount: number;
  teachersCount: number;
  status: "draft" | "verified" | "approved" | "paid";
  items: Array<{
    teacherName: string;
    courseCode: string;
    courseName: string;
    hours: number;
    ratePerHour: number;
    total: number;
    taxDeduction: number;
    netAmount: number;
  }>;
}

// 4. งานพัสดุ
export interface PurchaseRequisition {
  id: string;
  prNumber: string;          // ขอซื้อ-ขอจ้าง เลขที่ เช่น พด. 008/2569
  projectName: string;       // เพื่อใช้ในโครงการ/งาน
  requesterName: string;     // ผู้ขอซื้อ
  department: string;
  requestDate: string;
  budgetSource: string;      // งบรายได้คณะ / งบยุทธศาสตร์
  totalAmountBeforeTax: number;
  vatAmount: number;
  netTotalAmount: number;
  status: "draft" | "pending_director" | "procurement_processing" | "delivered" | "inspected";
  items: Array<{
    itemNumber: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
}

// 5. งานบุคคล
export interface LeaveRequest {
  id: string;
  staffName: string;
  position: string;
  department: string;
  leaveType: "vacation" | "sick" | "personal" | "duty"; // พักผ่อน, ป่วย, กิจ, ไปราชการ
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  substitutePerson: string;  // ผู้ปฏิบัติหน้าที่แทน
  contactAddress: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

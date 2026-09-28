// Data Types and Schema Definitions for Faculty of Liberal Arts and Sciences ERP (CPRU)
// Designed for Enterprise Grade Multi-Module Persistence & Role-Based Permissions

export type UserRole = 
  | "admin"              // ผู้ดูแลระบบสารบรรณและธุรการกลาง
  | "dean"               // ผู้บริหาร / คณบดี / รองคณบดี
  | "lecturer"           // อาจารย์ประจำสาขาวิชา
  | "staff_finance"      // เจ้าหน้าที่การเงินและงบประมาณ
  | "staff_procurement"  // เจ้าหน้าที่งานพัสดุและจัดซื้อ
  | "staff_hr"           // เจ้าหน้าที่งานบริหารบุคคล
  | "staff_plan"         // เจ้าหน้าที่งานแผนและยุทธศาสตร์
  | "gov_officer";       // เจ้าหน้าที่สายสนับสนุนทั่วไป

export type UserAccountStatus = "pending_approval" | "active" | "suspended";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  email: string;
  status: UserAccountStatus;
  permissions?: string[];
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

// Master System & Template Configuration
export interface MasterSystemConfig {
  facultyName: string;
  universityName: string;
  deanName: string;
  deanPosition: string;
  docPrefix: string;
  defaultVatRate: number;
  withholdingTaxRate: number;
  fiscalYear: number;
  academicYear: number;
  version: string;
  updatedAt: string;
  updatedBy: string;
}

// Audit Trail & Logging
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

// 1. งานธุรการและสารบรรณ
export type DocumentUrgency = "normal" | "urgent" | "very_urgent" | "most_urgent";
export type DocumentStatus = "draft" | "submitted" | "pending_review" | "signed" | "forwarded" | "completed" | "cancelled";

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
  assignedPersonId?: string;
  actionNote?: string;       // ความเห็น/ข้อสั่งการ
  status: DocumentStatus;
  fileAttachment?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OutboundDocument {
  id: string;
  docNumber: string;         // เลขที่ส่งออก เช่น อว 0643.04/001
  sendDate: string;
  title: string;
  recipient: string;         // เรียน
  category: string;
  signatory: string;         // ผู้ลงนาม เช่น ผศ.ดร.สานนท์ ด่านภักดี (คณบดี)
  urgency: DocumentUrgency;
  status: DocumentStatus;
  signedFileUrl?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
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
  status: "draft" | "submitted" | "approved" | "rejected";
  proposerId?: string;
  proposerName?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RoomBooking {
  id: string;
  roomName: string;
  capacity?: number;
  vehicleType?: "none" | "van" | "pickup";
  bookedBy: string;
  bookedById?: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  driverName?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

// 2. งานโครงการและแผนยุทธศาสตร์
export interface ProjectProposal {
  id: string;
  code: string;              // รหัสโครงการ เช่น 69-ART-001
  fiscalYear: number;        // 2569
  title: string;             // ชื่อโครงการ
  strategicGoal: string;     // ประเด็นยุทธศาสตร์ที่ 1-4 หรือ โครงการศาสตร์พระราชา
  department: string;        // สาขาวิชา
  leader: string;            // หัวหน้าโครงการ
  leaderId?: string;
  budgetApproved: number;    // งบประมาณจัดสรร (บาท)
  budgetUsed: number;        // งบประมาณใช้ไป (บาท)
  status: "draft" | "submitted" | "approved" | "in_progress" | "reported" | "closed";
  sdgGoals: number[];        // SDG 1-17
  kpis: string[];
  rationale?: string;        // หลักการและเหตุผล
  targetGroup?: string;      // กลุ่มเป้าหมาย
  location?: string;         // สถานที่จัด
  startDate: string;
  endDate: string;
  outcomes?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

// 3. งานการเงินและงบประมาณ
export interface BudgetLedgerItem {
  id: string;
  category: string;          // งบดำเนินงาน, ค่าตอบแทน, ใช้สอย, วัสดุ
  subCategory: string;
  fiscalYear: number;
  allocatedAmount: number;   // จัดสรร
  committedAmount: number;   // ผูกพัน
  disbursedAmount: number;   // เบิกจ่ายจริง
  remainingAmount: number;   // คงเหลือ
  department: string;
  updatedAt?: string;
}

export interface LoanContract {
  id: string;
  contractNumber: string;    // สัญญาเลขที่ เช่น ยม. 015/2569
  borrowerName: string;      // ผู้ยืม
  borrowerId?: string;
  position: string;
  department: string;
  purpose: string;           // ยืมเพื่อโครงการ
  amount: number;            // จำนวนเงิน
  borrowDate: string;
  settleDueDate: string;     // กำหนดชำระคืน (ภายใน 30 วัน)
  status: "draft" | "pending_approval" | "approved" | "active" | "settled" | "overdue" | "cancelled";
  checklist: {
    hasContract: boolean;
    hasMemo: boolean;
    hasApprovedProject: boolean;
    hasEstimate: boolean;
  };
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
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
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

// 4. งานพัสดุและจัดซื้อ
export interface PurchaseRequisition {
  id: string;
  prNumber: string;          // ขอซื้อ-ขอจ้าง เลขที่ เช่น พด. 008/2569
  projectName: string;       // เพื่อใช้ในโครงการ/งาน
  projectId?: string;
  requesterName: string;     // ผู้ขอซื้อ
  requesterId?: string;
  department: string;
  requestDate: string;
  budgetSource: string;      // งบรายได้คณะ / งบยุทธศาสตร์
  totalAmountBeforeTax: number;
  vatAmount: number;
  netTotalAmount: number;
  status: "draft" | "submitted" | "pending_director" | "procurement_processing" | "delivered" | "inspected" | "cancelled";
  items: Array<{
    itemNumber: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

// 5. งานบุคคล
export interface LeaveRequest {
  id: string;
  staffName: string;
  staffId?: string;
  position: string;
  department: string;
  leaveType: "vacation" | "sick" | "personal" | "duty"; // พักผ่อน, ป่วย, กิจ, ไปราชการ
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  substitutePerson: string;  // ผู้ปฏิบัติหน้าที่แทน
  contactAddress: string;
  status: "draft" | "submitted" | "pending" | "approved" | "rejected" | "cancelled";
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

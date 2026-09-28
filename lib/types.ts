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
  destination?: string;
  passengerCount?: number;
  travelMemoNumber?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

export interface OfficialOrder {
  id: string;
  orderNumber: string;         // เลขที่คำสั่ง/ประกาศ เช่น คำสั่งคณะที่ 015/2569
  orderType: "committee_appointment" | "procurement_committee" | "announcement" | "work_assignment";
  date: string;
  title: string;
  signedBy: string;
  signatoryPosition?: string;
  category: string;
  status: "active" | "revoked";
  revokedReason?: string;
  revokedByOrderNumber?: string;
  fileUrl?: string;
  committeeMembers?: Array<{
    name: string;
    position: string;
    role: string;              // ประธานกรรมการ, กรรมการ, กรรมการและเลขานุการ
  }>;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OfficialResponse {
  id: string;
  responseNumber: string;      // เช่น ตบ 01/2569
  responseType: "speaker" | "activity" | "facility";
  decision: "accept" | "decline";
  declineReason?: string;
  responderName: string;
  responderPosition: string;
  organization: string;
  telephone: string;
  projectName: string;
  eventDate: string;
  location: string;
  feeOption: string;
  participantsCount?: number;
  participantsList?: Array<{
    name: string;
    position: string;
    telephone?: string;
  }>;
  status: "draft" | "submitted" | "confirmed";
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChecklistSubmission {
  id: string;
  checklistType: "loan" | "reimbursement" | "travel" | "teaching_fee" | "supervision";
  title: string;
  applicantName: string;
  department: string;
  projectName: string;
  amount?: number;
  checkedItems: Record<string, { status: "yes" | "no" | "na"; remark?: string }>;
  isComplete: boolean;
  reviewerName?: string;
  reviewDate?: string;
  status: "draft" | "verified" | "returned" | "approved";
  returnReason?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

// 2. งานโครงการและแผนยุทธศาสตร์
export interface ProjectBudgetItem {
  id: string;
  category: "compensation" | "operating" | "material"; // ค่าตอบแทน, ค่าใช้สอย, ค่าวัสดุ
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  amount: number;
}

export interface ProjectActivityItem {
  id: string;
  name: string;
  quarter: number; // 1, 2, 3, 4
  targetGroup: string;
  participantCount: number;
  location: string;
  startDate: string;
  endDate: string;
  budget: number;
  kpis?: string[];
  responsiblePerson?: string;
}

export interface ProjectProposal {
  id: string;
  code: string;              // รหัสโครงการ เช่น 69-FLAS-001
  projectType: "faculty_strategy" | "kings_philosophy" | "department_focus" | "academic_service";
  planType: "in_plan" | "out_of_plan";
  fiscalYear: number;        // 2569
  academicYear?: number;     // 2568
  title: string;             // ชื่อโครงการ
  strategicGoal: string;     // ประเด็นยุทธศาสตร์ที่ 1-4 หรือ โครงการศาสตร์พระราชา
  department: string;        // สาขาวิชา
  leader: string;            // หัวหน้าโครงการ
  leaderId?: string;
  teamMembers?: string[];    // ผู้ร่วมรับผิดชอบ
  budgetApproved: number;    // งบประมาณจัดสรร (บาท)
  budgetUsed: number;        // งบประมาณใช้ไป (บาท)
  budgetSource: "national_budget" | "faculty_revenue" | "external";
  budgetItems?: ProjectBudgetItem[];
  activities?: ProjectActivityItem[];
  status: "draft" | "submitted" | "approved" | "in_progress" | "reported" | "closed";
  sdgGoals: number[];        // SDG 1-17
  kpis: string[];
  objectives?: string[];     // วัตถุประสงค์โครงการ
  rationale?: string;        // หลักการและเหตุผล
  targetGroup?: string;      // กลุ่มเป้าหมาย
  location?: string;         // สถานที่จัด
  startDate: string;
  endDate: string;
  outcomes?: string;         // ผลประโยชน์ที่คาดว่าจะได้รับ
  evaluationPlan?: string;   // แผนการประเมินผล
  revisions?: Array<{
    date: string;
    reason: string;
    changedBy: string;
  }>;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectReport {
  id: string;
  reportType: "faculty_standard" | "kings_philosophy" | "sdg_summary" | "one_page";
  projectId: string;
  projectCode: string;
  projectTitle: string;
  department: string;
  leader: string;
  fiscalYear: number;
  budgetApproved: number;
  budgetUsed: number;
  participantCount: number;
  targetAchieved: boolean;
  kpiResults: Array<{
    kpi: string;
    target: string;
    actual: string;
    status: "passed" | "failed" | "in_progress";
  }>;
  activityResults?: Array<{
    activityName: string;
    actualDate: string;
    actualParticipants: number;
    outcomeSummary: string;
  }>;
  impactEconomy?: string;
  impactSociety?: string;
  impactEnvironment?: string;
  impactEducation?: string;
  sdgGoals: number[];
  problemsAndSuggestions?: string;
  photos?: Array<{
    url: string;
    caption: string;
  }>;
  evidenceQrUrl?: string;
  status: "draft" | "submitted" | "approved";
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

// 3. งานการเงินและงบประมาณ
export interface BudgetLedgerItem {
  id: string;
  category: "compensation" | "operating" | "material" | "investment" | "general"; // งบดำเนินงาน, ค่าตอบแทน, ใช้สอย, วัสดุ, ลงทุน
  subCategory: string;
  fiscalYear: number;
  budgetSource: "faculty_revenue" | "national_budget" | "external";
  allocatedAmount: number;   // จัดสรร
  committedAmount: number;   // ผูกพัน
  disbursedAmount: number;   // เบิกจ่ายจริง
  remainingAmount: number;   // คงเหลือ = allocated - (committed + disbursed)
  department: string;
  projectId?: string;
  projectCode?: string;
  updatedAt?: string;
}

export interface LedgerTransaction {
  id: string;
  transactionNumber: string; // เช่น TX-2569-001
  fiscalYear: number;
  budgetSource: "faculty_revenue" | "national_budget" | "external";
  category: "compensation" | "operating" | "material" | "investment" | "general";
  subCategory: string;
  projectId?: string;
  projectCode?: string;
  activityId?: string;
  transactionType: "allocation" | "commitment" | "disbursement" | "settlement" | "refund" | "adjustment";
  amount: number;
  referenceDocNumber: string;
  description: string;
  performedBy: string;
  date: string;
  createdById?: string;
  createdAt: string;
}

export interface LoanContract {
  id: string;
  contractNumber: string;    // สัญญาเลขที่ เช่น ยม. 015/2569
  borrowerName: string;      // ผู้ยืม
  borrowerId?: string;
  position: string;
  department: string;
  purpose: string;           // ยืมเพื่อโครงการ
  projectId?: string;
  projectCode?: string;
  amount: number;            // จำนวนเงิน (ตัวเลข)
  bahtText?: string;         // จำนวนเงิน (ตัวอักษร)
  estimatedExpenses?: Array<{
    category: string;
    description: string;
    amount: number;
  }>;
  borrowDate: string;
  disbursedDate?: string;
  disbursedAmount?: number;
  settleDueDate: string;     // กำหนดชำระคืน (ภายใน 30 วัน)
  status: "draft" | "submitted" | "approved" | "disbursed" | "partially_settled" | "settled" | "overdue" | "cancelled";
  checklist: {
    hasContract: boolean;
    hasMemo: boolean;
    hasApprovedProject: boolean;
    hasEstimate: boolean;
  };
  settlements?: Array<{
    id: string;
    settleDate: string;
    cashAmount: number;
    voucherAmount: number;
    receiptNumber?: string;
    voucherSummary?: string;
    receivedBy?: string;
    remainingBalance: number;
    remark?: string;
  }>;
  totalSettledAmount?: number;
  remainingBalance?: number;
  approverName?: string;
  approverPosition?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeachingDisbursement {
  id: string;
  batchNumber?: string;      // เช่น บจ. 001/2569
  periodMonth: string;       // กุมภาพันธ์ 2569
  academicYear: number;      // 2568
  term: string;              // 1/2568, 2/2568, 1/2569
  program: "bachelor_regular" | "bachelor_gspch" | "supervision"; // ภาคปกติ, กศ.ปช., ค่านิเทศ
  totalAmount: number;
  taxDeductionTotal: number;
  netAmountTotal: number;
  teachersCount: number;
  taxRate: number;           // 0, 1, 3, 5%
  status: "draft" | "verified" | "approved" | "paid";
  items: Array<{
    id: string;
    teacherName: string;
    courseCode: string;
    courseName: string;
    hours: number;
    ratePerHour: number;
    total: number;
    taxDeduction: number;
    netAmount: number;
    dates?: string;
    room?: string;
  }>;
  supervisionItems?: Array<{
    id: string;
    supervisorName: string;
    department: string;
    studentName: string;
    organization: string;
    visitDate: string;
    visitMethod: "onsite" | "online";
    supervisionFee: number;
    travelAllowance: number;
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
  procurementType: "purchase" | "hire"; // ขอซื้อ / ขอจ้าง
  itemCategory: "materials" | "equipment" | "service"; // วัสดุ / ครุภัณฑ์ / จ้างเหมา
  projectName: string;       // เพื่อใช้ในโครงการ/งาน
  projectId?: string;
  projectCode?: string;
  activityName?: string;
  requesterName: string;     // ผู้ขอซื้อ
  requesterPosition?: string;
  requesterId?: string;
  department: string;
  requestDate: string;
  requiredDeliveryDate: string; // วันที่ต้องการใช้พัสดุ (ยื่นล่วงหน้า 10 วันทำการ)
  budgetSource: "faculty_revenue" | "national_budget" | "external";
  reason?: string;           // เหตุผลและความจำเป็น
  supplierName?: string;     // บริษัท/ร้านค้าผู้เสนอราคา
  quotationNumber?: string;
  quotationDate?: string;
  quotationUrl?: string;
  vatRate: number;           // 0 หรือ 7%
  totalAmountBeforeTax: number;
  vatAmount: number;
  netTotalAmount: number;
  committeeMembers?: Array<{
    name: string;
    position: string;
    role: "president" | "member" | "secretary";
  }>;
  status: "draft" | "submitted" | "budget_verified" | "approved" | "purchasing" | "delivered" | "inspected" | "sent_to_finance" | "cancelled";
  inspectionDate?: string;
  inspectionResult?: "passed" | "failed";
  inspectionRemarks?: string;
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

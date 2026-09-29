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

export type UserAccountStatus = "pending_approval" | "active" | "suspended" | "archived";

export interface UserProfile {
  id: string;
  employeeId?: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  position?: string;
  email: string;
  phoneNumber?: string;
  officeRoom?: string;
  bio?: string;
  status: UserAccountStatus;
  permissions?: string[];
  avatarUrl?: string;
  avatarVersion?: number;
  supervisorId?: string;
  supervisorName?: string;
  attendanceEligible?: boolean;
  requestedRole?: UserRole;
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

// 5. งานบุคคลและบริหารทรัพยากรมนุษย์ (HR & e-Leave, Portfolio, Contracts)
export interface LeaveRequest {
  id: string;
  requestNumber?: string;      // เลขที่ใบลา เช่น ลพ. 001/2569, ลป. 001/2569
  staffName: string;
  staffId?: string;
  position: string;
  department: string;
  employeeType?: "civil_servant" | "university_staff" | "contract_academic" | "temporary_employee"; // ประเภทบุคลากร
  leaveType: "vacation" | "sick" | "personal" | "duty"; // พักผ่อน, ป่วย, กิจ, ไปราชการ
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  totalDays: number;
  reason: string;
  substitutePerson: string;    // ผู้ปฏิบัติหน้าที่แทน
  substitutePersonId?: string;
  substituteStatus?: "pending" | "acknowledged" | "declined";
  substituteComment?: string;
  contactAddress: string;
  contactPhone?: string;
  medicalCertificateUrl?: string; // ใบรับรองแพทย์ (กรณีลาป่วย >= 3 วัน หรือตามระเบียบ)
  accumulatedDays: number;     // วันลาสะสมจากปีก่อน
  currentYearQuota: number;    // สิทธิลาปีปัจจุบัน
  usedDaysBefore: number;      // ลามาแล้วในปีนี้
  remainingDaysAfter: number;  // วันลาคงเหลือหลังการลาครั้งนี้
  status: "draft" | "submitted" | "substitute_acknowledged" | "verified" | "approved" | "rejected" | "cancelled";
  verifiedByName?: string;
  verifiedDate?: string;
  approverName?: string;
  approverPosition?: string;
  approverComment?: string;
  approvalDate?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserLeaveQuota {
  id: string;
  userId: string;
  employeeId?: string;
  staffName: string;
  department: string;
  position: string;
  employeeType: "civil_servant" | "university_staff" | "contract_academic" | "temporary_employee";
  fiscalYear: number;
  vacationQuota: {
    accumulated: number;       // สะสมจากปีก่อน
    currentYear: number;       // สิทธิปีนี้ (ปกติ 10 วัน)
    used: number;              // ใช้ไปแล้ว
    remaining: number;         // คงเหลือ
  };
  personalQuota: {
    currentYear: number;       // สิทธิปีนี้ (ปกติ 45 วัน)
    used: number;
    remaining: number;
  };
  sickQuota: {
    currentYear: number;       // สิทธิปีนี้ (ปกติ 60 วัน)
    used: number;
    remaining: number;
  };
  dutyQuota: {
    used: number;
  };
  updatedAt: string;
}

export interface FacultyPortfolioDegree {
  level: "bachelor" | "master" | "doctoral" | "other";
  degreeName: string;
  fieldOfStudy: string;
  institution: string;
  country?: string;
  yearGraduated: number;
}

export interface FacultyTeachingLoadItem {
  term: string;                // เช่น 1/2568, 2/2568, 1/2569
  academicYear: number;
  courseCode: string;
  courseName: string;
  credits: string;             // 3(2-2-5)
  hoursPerWeek: number;
  program: "bachelor_regular" | "bachelor_gspch" | "graduate";
  studentCount?: number;
}

export interface FacultyResearchPublication {
  id: string;
  title: string;
  publicationYear: number;
  journalName: string;
  volume?: string;
  issue?: string;
  pages?: string;
  indexing: "TCI_1" | "TCI_2" | "Scopus" | "WoS" | "National_Conf" | "International_Conf";
  authorRole: "first_author" | "corresponding" | "co_author";
  coAuthors?: string;
  evidenceUrl?: string;
}

export interface FacultyAcademicService {
  id: string;
  title: string;
  role: string;                // วิทยากร, กรรมการ, ผู้ทรงคุณวุฒิ, ที่ปรึกษา
  organization: string;
  serviceDate: string;
  participantCount?: number;
  evidenceUrl?: string;
  projectCategory?: "kings_philosophy" | "local_development" | "academic_workshop" | "community_empowerment";
}

export interface FacultySARRecord {
  academicYear: number;
  sarStatus: "draft" | "submitted" | "verified" | "certified";
  selfScore?: number;
  evaluatorScore?: number;
  comments?: string;
  certifiedBy?: string;
  certifiedDate?: string;
}

export interface FacultyPortfolio {
  id: string;
  userId?: string;
  employeeId: string;
  prefix?: string;
  fullName: string;
  academicRank: string;        // อาจารย์, ผู้ช่วยศาสตราจารย์, รองศาสตราจารย์, ศาสตราจารย์
  department: string;
  contactEmail?: string;
  contactPhone?: string;
  contractType: string;        // พนักงานจ้างตามภารกิจ (ประเภทวิชาการ), พนักงานมหาวิทยาลัย, ข้าราชการ
  degrees: FacultyPortfolioDegree[];
  currentTeachingLoad: FacultyTeachingLoadItem[];
  researchWorks: FacultyResearchPublication[];
  academicServices: FacultyAcademicService[];
  sarRecords: FacultySARRecord[];
  evidenceFiles?: Array<{
    name: string;
    url: string;
    category: string;
    uploadedAt: string;
  }>;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmploymentContract {
  id: string;
  contractNumber: string;      // เลขที่สัญญา เช่น สจ. 012/2568
  employeeName: string;
  employeeId?: string;
  position: string;
  department: string;
  contractCategory: "academic_mission" | "general_mission" | "university_staff" | "temporary_employee"; // ประเภทสัญญา
  startDate: string;           // วันเริ่มสัญญา
  endDate: string;             // วันสิ้นสุดสัญญา
  salary: number;              // อัตราเงินเดือน / ค่าตอบแทน
  signatoryFirst: string;      // ผู้ว่าจ้าง (อธิการบดี / คณบดีผู้รับมอบอำนาจ)
  signatorySecond: string;     // ผู้รับจ้าง
  signedDocumentUrl?: string;  // แนบไฟล์สัญญาลงนาม (.pdf)
  status: "active" | "expiring_soon" | "renewed" | "terminated";
  renewalHistory?: Array<{
    renewalDate: string;
    newEndDate: string;
    contractNumber: string;
    approvedBy?: string;
    remarks?: string;
  }>;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 6. แผนยุทธศาสตร์และตัวชี้วัด (Strategic Plan, OKRs & KPIs)
export interface StrategicKPI {
  id: string;
  code: string;                // รหัสตัวชี้วัด เช่น KPI-1.1.1, KPI-3.1.2
  name: string;                // ชื่อตัวชี้วัด
  pillarId: string;            // อ้างอิงประเด็นยุทธศาสตร์ที่ 1-4 หรือ ศาสตร์พระราชา
  pillarNumber: number;
  goalId?: string;             // อ้างอิงเป้าประสงค์
  unit: string;                // หน่วยนับ เช่น ร้อยละ, โครงการ, คน, ชุมชน, ระบบ
  targetValue: number;         // ค่าเป้าหมาย
  actualValue: number;         // ผลการดำเนินงานจริง
  hasData: boolean;            // มีข้อมูลผลการดำเนินงานแล้วหรือไม่ (แยกกรณีไม่มีข้อมูลออกจาก 0)
  progressPercent: number;     // ร้อยละความสำเร็จ (คำนวณ: min(100, (actual / target) * 100))
  weight: number;              // ค่าน้ำหนัก (%)
  calculationFormula?: string; // สูตรการคำนวณ
  reportingPeriod: "quarterly" | "biannual" | "annual"; // รอบการรายงาน
  quarterProgress?: {
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
  };
  responsibleDepartment: string; // หน่วยงานผู้รับผิดชอบ
  responsiblePerson: string;     // ผู้รับผิดชอบหลัก
  linkedProjectIds?: string[];   // รหัสโครงการที่เกี่ยวข้อง
  evidenceUrl?: string;          // ลิงก์เอกสารหลักฐาน / SAR
  status: "not_started" | "in_progress" | "achieved" | "exceeded";
}

export interface StrategicGoal {
  id: string;
  goalNumber: string;          // เช่น 1.1, 2.1, 3.1
  name: string;                // ชื่อเป้าประสงค์
  description?: string;
}

export interface StrategicPillar {
  id: string;
  pillarNumber: number;        // 1, 2, 3, 4, 5
  code: string;                // SO1, SO2, SO3, SO4, SO-KP
  name: string;                // ประเด็นยุทธศาสตร์
  description: string;
  weight: number;              // ค่าน้ำหนักรวมของยุทธศาสตร์ (%) เช่น 25%
  goals: StrategicGoal[];
  kpis: StrategicKPI[];
  calculatedProgress?: number; // ความก้าวหน้าถ่วงน้ำหนัก (%)
}

export interface StrategicPlan {
  id: string;
  fiscalYear: number;          // 2569
  planTitle: string;           // แผนปฏิบัติราชการประจำปีงบประมาณ พ.ศ. 2569
  facultyName: string;
  universityName: string;
  vision: string;              // วิสัยทัศน์
  missions: string[];          // พันธกิจ
  pillars: StrategicPillar[];
  totalOverallProgress?: number; // ร้อยละความก้าวหน้ารวมทั้งคณะ
  status: "draft" | "active" | "archived";
  updatedAt: string;
  updatedBy?: string;
}

// 7. ระบบแจ้งเตือนส่วนกลาง (System Notifications)
export interface AppNotification {
  id: string;
  userId?: string;             // ผู้รับเฉพาะบุคคล หรือ null สำหรับทุกคน
  targetRole?: UserRole | "all";
  title: string;
  message: string;
  category: "admin" | "project" | "finance" | "procurement" | "hr" | "plan" | "attendance" | "account";
  linkHref?: string;
  read: boolean;
  createdAt: string;
}

// ==========================================
// 8. บัญชีผู้ใช้ ทะเบียนบุคลากร และระบบลงเวลาทำงาน (User Access & Attendance)
// ==========================================

// 8.1 ทะเบียนบุคลากร (Employee Record)
export interface EmployeeRecord {
  id: string;                  // รหัสบุคลากรถาวร เช่น EMP-2569-001
  userId?: string;             // ผูกกับ Firebase Auth UID
  prefix: string;              // นาย / นาง / นางสาว / ผศ.ดร. / อ.
  firstName: string;
  lastName: string;
  officialName: string;        // เช่น ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี
  department: string;          // สำนักงานคณบดี, สาขาวิชารัฐประศาสนศาสตร์, ฯลฯ
  position: string;            // คณบดี, อาจารย์ประจำ, เจ้าหน้าที่บริหารงานทั่วไป
  academicRank?: string;       // อาจารย์, ผู้ช่วยศาสตราจารย์, รองศาสตราจารย์
  employeeType: "civil_servant" | "university_staff" | "contract_academic" | "temporary_employee";
  supervisorId?: string;       // รหัสบุคลากรของหัวหน้างานโดยตรง
  supervisorName?: string;     // ชื่อหัวหน้างาน
  startDate: string;           // วันที่เริ่มปฏิบัติงาน
  endDate?: string;            // วันที่สิ้นสุดสัญญา (กรณีสัญญาจ้าง)
  status: "active" | "resigned" | "retired" | "on_leave";
  attendanceEligible: boolean; // บุคลากรที่ต้องลงเวลาทำงานหรือไม่
  workScheduleId?: string;     // รหัสตารางงาน/กะที่กำหนด
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

// 8.2 คำเชิญเข้าใช้งานระบบ (Account Invitation)
export interface AccountInvitation {
  id: string;
  email: string;
  employeeId: string;
  employeeName: string;
  intendedRole: UserRole;
  department: string;
  invitationToken: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  acceptedAt?: string;
}

// 8.3 นโยบายการทำงาน กะเวลา และวันหยุด (Work Policy, Shifts & Holidays)
export interface WorkShift {
  id: string;
  name: string;                // กะปกติ (08.30 - 16.30 น.), กะพิเศษ
  code: string;                // SHIFT-NORMAL, SHIFT-FLEX
  startTime: string;           // "08:30"
  endTime: string;             // "16:30"
  lateGraceMinutes: number;    // เวลาผ่อนผัน เช่น 15 นาที (สายหลังจาก 08:45)
  earlyLeaveThreshold: string; // "16:00"
  halfDayThreshold: string;    // "12:00"
  isOvernight: boolean;        // กะข้ามเที่ยงคืนหรือไม่
  isDefault: boolean;
}

export interface WorkPolicy {
  id: string;
  version: string;             // "2569.1"
  title: string;
  timezone: string;            // "Asia/Bangkok"
  shifts: WorkShift[];
  workDays: number[];          // [1, 2, 3, 4, 5] (จันทร์-ศุกร์)
  locationModes: Array<"web" | "gps" | "qr">;
  gpsCenterLat?: number;       // พิกัดคณะ เช่น 15.8083 (CPRU)
  gpsCenterLng?: number;       // 102.0315
  gpsRadiusMeters?: number;    // รัศมีอนุญาต เช่น 500 เมตร
  qrSecretKey?: string;        // คีย์สำหรับ Dynamic QR
  effectiveDate: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PublicHoliday {
  id: string;
  date: string;                // "2026-10-13" (YYYY-MM-DD)
  name: string;                // วันนวมินทรมหาราช
  year: number;                // 2569
  isOfficial: boolean;
}

// 8.4 รายการลงเวลาดิบ และเซสชันรายวัน (Attendance Raw Events & Work Sessions)
export interface AttendanceEvent {
  id: string;
  userId: string;
  employeeId: string;
  staffName: string;
  eventType: "check_in" | "check_out";
  serverTimestamp: string;     // ISO timestamp จาก Server
  workDate: string;            // "YYYY-MM-DD"
  source: "web" | "gps" | "qr";
  locationCoords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  locationName?: string;       // "คณะศิลปศาสตร์และวิทยาศาสตร์"
  sessionId: string;
  requestId: string;           // Idempotency key ป้องกันกดซ้ำ
  isFlagged?: boolean;
  flagReason?: string;
}

export interface AttendanceSession {
  id: string;                  // `att-${employeeId}-${workDate}`
  userId: string;
  employeeId: string;
  staffName: string;
  department: string;
  workDate: string;            // "YYYY-MM-DD"
  shiftId: string;
  shiftName: string;
  checkInTime?: string;        // "08:25"
  checkOutTime?: string;       // "16:35"
  checkInEventId?: string;
  checkOutEventId?: string;
  checkInStatus?: "on_time" | "late";
  checkOutStatus?: "normal" | "early_leave";
  sessionStatus: "open" | "closed" | "incomplete"; // incomplete = ลืมออกงาน/รอตรวจสอบ
  workType: "work" | "holiday" | "approved_leave" | "official_duty" | "unexcused_absence";
  lateMinutes: number;         // จำนวนนาทีที่สาย
  earlyMinutes: number;        // จำนวนนาทีที่ออกก่อน
  totalWorkMinutes: number;    // นาทีทำงานจริง
  leaveRequestId?: string;     // ลิงก์ใบลา e-Leave ถ้ามี
  leaveType?: string;
  hasCorrection?: boolean;
  correctionId?: string;
  updatedAt: string;
}

// 8.5 คำขอแก้ไขเวลาย้อนหลัง (Attendance Correction Request)
export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  userId: string;
  staffName: string;
  department: string;
  workDate: string;
  originalCheckIn?: string;
  originalCheckOut?: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  evidenceUrl?: string;
  status: "pending" | "approved" | "rejected";
  reviewerId?: string;
  reviewerName?: string;
  reviewerComment?: string;
  reviewedAt?: string;
  initiatedBy: "employee" | "admin";
  createdAt: string;
}

// 8.6 สรุปเวลารายเดือน และการปิดงวด (Monthly Report & Period Lock)
export interface MonthlyAttendanceReport {
  id: string;                  // `mrep-${employeeId}-${period}`
  period: string;              // "2569-10" หรือ "2026-10"
  fiscalYear: number;
  employeeId: string;
  staffName: string;
  department: string;
  position: string;
  expectedWorkDays: number;
  actualWorkDays: number;
  lateDaysCount: number;
  lateTotalMinutes: number;
  earlyLeaveDaysCount: number;
  leaveDaysCount: number;
  officialDutyDaysCount: number;
  absentDaysCount: number;
  incompleteDaysCount: number;
  status: "unreviewed" | "verified" | "locked";
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface AttendancePeriodLock {
  id: string;                  // `lock-${period}`
  period: string;              // "2569-10"
  isLocked: boolean;
  lockedBy: string;
  lockedByName: string;
  lockedAt: string;
  reopenedBy?: string;
  reopenedByName?: string;
  reopenReason?: string;
  reopenedAt?: string;
}


import { 
  InboundDocument, 
  OutboundDocument, 
  ProjectProposal, 
  LoanContract, 
  PurchaseRequisition, 
  LeaveRequest, 
  UserProfile, 
  RoomBooking,
  BudgetLedgerItem,
  LedgerTransaction,
  TeachingDisbursement,
  UserLeaveQuota,
  FacultyPortfolio,
  EmploymentContract,
  StrategicPlan,
  StrategicPillar,
  StrategicKPI,
  AppNotification,
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

export const MOCK_USERS: UserProfile[] = [
  {
    id: "u-admin",
    employeeId: "EMP-2569-001",
    name: "นายสมเกียรติ วงศ์สารบรรณ",
    role: "admin",
    roleTitle: "ผู้ดูแลระบบกลาง / เจ้าหน้าที่ธุรการและสารบรรณ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "เจ้าหน้าที่บริหารงานทั่วไป (หัวหน้างานสารบรรณ)",
    email: "admin.saraban@cpru.ac.th",
    phoneNumber: "081-998-8776",
    officeRoom: "ห้องสำนักงานคณบดี ชั้น 2 อาคาร 4",
    status: "active",
    attendanceEligible: true,
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-dean",
    employeeId: "EMP-2569-002",
    name: "ผศ.ดร.สานนท์ ด่านภักดี",
    role: "dean",
    roleTitle: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    email: "dean.las@cpru.ac.th",
    phoneNumber: "089-112-2334",
    officeRoom: "ห้องคณบดี ชั้น 2 อาคาร 4",
    status: "active",
    attendanceEligible: false,
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-lecturer",
    employeeId: "EMP-2569-003",
    name: "อ.ฤทธิชัย ภาระวิเศษ",
    role: "lecturer",
    roleTitle: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    position: "อาจารย์ประจำสาขาวิชา",
    email: "ritthichai.p@cpru.ac.th",
    phoneNumber: "086-554-4332",
    officeRoom: "ห้องพักอาจารย์สาขารัฐศาสตร์ ชั้น 3 อาคาร 4",
    status: "active",
    attendanceEligible: true,
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-gov",
    employeeId: "EMP-2569-004",
    name: "นางสาวศิริพร เงินคลัง",
    role: "staff_finance",
    roleTitle: "เจ้าหน้าที่งานการเงินและงบประมาณ",
    department: "งานการเงินและพัสดุ",
    position: "นักวิชาการเงินและบัญชี",
    email: "finance@cpru.ac.th",
    phoneNumber: "087-443-3221",
    officeRoom: "ห้องการเงิน ชั้น 2 อาคาร 4",
    status: "active",
    attendanceEligible: true,
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-procurement",
    employeeId: "EMP-2569-005",
    name: "นายวีระยุทธ พัสดุดี",
    role: "staff_procurement",
    roleTitle: "เจ้าหน้าที่งานพัสดุและจัดซื้อ",
    department: "งานการเงินและพัสดุ",
    position: "นักวิชาการพัสดุ",
    email: "procurement@cpru.ac.th",
    phoneNumber: "084-332-2110",
    officeRoom: "ห้องพัสดุ ชั้น 2 อาคาร 4",
    status: "active",
    attendanceEligible: true,
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-hr",
    employeeId: "EMP-2569-006",
    name: "นางสาวมณีรัตน์ บุคลากรเลิศ",
    role: "staff_hr",
    roleTitle: "เจ้าหน้าที่งานบริหารงานบุคคล (HR)",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "นักทรัพยากรบุคคล",
    email: "hr.flas@cpru.ac.th",
    phoneNumber: "085-221-1009",
    officeRoom: "ห้องบุคคล ชั้น 2 อาคาร 4",
    status: "active",
    attendanceEligible: true,
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-plan",
    employeeId: "EMP-2569-007",
    name: "ผศ.ดร. นฤมล อนันตโชค",
    role: "staff_plan",
    roleTitle: "รองคณบดีฝ่ายแผนและยุทธศาสตร์",
    department: "งานนโยบายและแผน / สาขาวิชารัฐประศาสนศาสตร์",
    position: "รองคณบดีฝ่ายแผนและยุทธศาสตร์",
    email: "plan.flas@cpru.ac.th",
    phoneNumber: "089-776-6554",
    officeRoom: "ห้องรองคณบดี ชั้น 2 อาคาร 4",
    status: "active",
    attendanceEligible: false,
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-pending",
    name: "อาจารย์ทดสอบ รออนุมัติ",
    role: "lecturer",
    roleTitle: "อาจารย์ใหม่ (รอผู้ดูแลอนุมัติสิทธิ์)",
    department: "สาขาวิชาคณิตศาสตร์และวิทยาการคอมพิวเตอร์",
    position: "อาจารย์ประจำ",
    email: "new.teacher@cpru.ac.th",
    status: "pending_approval",
    attendanceEligible: true,
    requestedRole: "lecturer",
    createdAt: "2026-09-29T08:00:00Z"
  }
];

export const MOCK_INBOUND_DOCS: InboundDocument[] = [
  {
    id: "in-001",
    docNumber: "อว 0604/ว 114",
    receiveNumber: "รับ 042/2569",
    receiveDate: "2026-09-28",
    title: "ขอเชิญบุคลากรเข้าร่วมประชุมชี้แจงการดำเนินงานโครงการยุทธศาสตร์ มรภ. ประจำปีงบประมาณ 2569",
    sender: "กองนโยบายและแผน มหาวิทยาลัยราชภัฏชัยภูมิ",
    urgency: "very_urgent",
    category: "หนังสือเวียน",
    assignedDept: "งานนโยบายและแผน / ทุกสาขาวิชา",
    assignedPerson: "อ.ฤทธิชัย ภาระวิเศษ",
    actionNote: "มอบงานแผนประสานอาจารย์ทุกสาขาเพื่อเข้าร่วมประชุม",
    status: "forwarded",
    fileAttachment: "ชี้แจงการดำเนินงาน ค.ยุทธศาสตร์ มรภ. 69.pdf",
    createdAt: "2026-09-28T09:30:00Z"
  },
  {
    id: "in-002",
    docNumber: "ชย 0023.1/1042",
    receiveNumber: "รับ 043/2569",
    receiveDate: "2026-09-27",
    title: "ขอความอนุเคราะห์วิทยากรและสถานที่จัดโครงการอบรมเชิงปฏิบัติการพัฒนาผู้นำชุมชน",
    sender: "ที่ว่าการอำเภอเนินสง่า จังหวัดชัยภูมิ",
    urgency: "urgent",
    category: "หนังสือภายนอก",
    assignedDept: "สาขาวิชารัฐประศาสนศาสตร์",
    assignedPerson: "ผศ.ดร. นฤมล อนันตโชค",
    actionNote: "เห็นควรให้ความอนุเคราะห์ มอบหมาย อ.ประจำสาขาเป็นวิทยากร",
    status: "signed",
    fileAttachment: "ตย.หนังสือ อำเภอเนินสง่า ผอ สุนทร.pdf",
    createdAt: "2026-09-27T11:15:00Z"
  },
  {
    id: "in-003",
    docNumber: "อว 0604.03/ว 88",
    receiveNumber: "รับ 044/2569",
    receiveDate: "2026-09-26",
    title: "การจัดส่งหลักฐานการเบิกจ่ายค่าสอนภาค กศ.ปช. ภาคเรียนที่ 1/2569",
    sender: "กองคลัง สำนักงานอธิการบดี",
    urgency: "normal",
    category: "บันทึกข้อความ",
    assignedDept: "งานการเงิน",
    assignedPerson: "นางสาวศิริพร เงินคลัง",
    actionNote: "แจ้งอาจารย์ผู้สอนรวบรวมใบเบิกค่าสอนภายในวันที่ 5 ต.ค.",
    status: "forwarded",
    fileAttachment: "ระเบียบการจ่ายค่าตอบแทนการสอนภาคพิเศษ 2566.pdf",
    createdAt: "2026-09-26T14:20:00Z"
  },
  {
    id: "in-004",
    docNumber: "อว 0604/ว 209",
    receiveNumber: "รับ 045/2569",
    receiveDate: "2026-09-25",
    title: "แจ้งแนวปฏิบัติที่ดีเกี่ยวกับการยืมเงินทดรองราชการเพื่อดำเนินโครงการ",
    sender: "หน่วยตรวจสอบภายใน มรภ.ชัยภูมิ",
    urgency: "normal",
    category: "แนวปฏิบัติ",
    assignedDept: "งานการเงินและพัสดุ",
    assignedPerson: "นางสาวศิริพร เงินคลัง",
    actionNote: "แจ้งเวียนหัวหน้าโครงการทุกท่านทราบและถือปฏิบัติ",
    status: "completed",
    fileAttachment: "ขอแจ้งแนวปฏิบัติที่ดีเกี่ยวกับการยืมเงินทดรองราชการ.jpg",
    createdAt: "2026-09-25T10:00:00Z"
  }
];

export const MOCK_OUTBOUND_DOCS: OutboundDocument[] = [
  {
    id: "out-001",
    docNumber: "อว 0643.04/0112",
    sendDate: "2026-09-28",
    title: "ขอเชิญเป็นวิทยากรโครงการ Startup Creator สร้างนวัตกรท่องเที่ยวรุ่นใหม่",
    recipient: "ผู้อำนวยการสำนักงานการท่องเที่ยวและกีฬาจังหวัดชัยภูมิ",
    category: "หนังสือภายนอก",
    signatory: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี (คณบดี)",
    urgency: "normal",
    status: "signed",
    createdAt: "2026-09-28T10:00:00Z"
  },
  {
    id: "out-002",
    docNumber: "อว 0643.04/0113",
    sendDate: "2026-09-27",
    title: "ส่งรายงานผลการดำเนินโครงการยกระดับเศรษฐกิจฐานรากบนหลักปรัชญาเศรษฐกิจพอเพียง",
    recipient: "อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ",
    category: "หนังสือภายใน",
    signatory: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี (คณบดี)",
    urgency: "normal",
    status: "signed",
    createdAt: "2026-09-27T15:30:00Z"
  }
];

export const MOCK_PROJECTS: ProjectProposal[] = [
  {
    id: "proj-01",
    code: "69-FLAS-001",
    projectType: "kings_philosophy",
    planType: "in_plan",
    budgetSource: "national_budget",
    fiscalYear: 2569,
    title: "โครงการบูรณาการธุรกิจการค้าสมัยใหม่ ดิจิทัล และสตาร์ทอัพท่องเที่ยวเพื่อพัฒนาเศรษฐกิจสร้างสรรค์",
    strategicGoal: "โครงการตามยุทธศาสตร์เพื่อการพัฒนาท้องถิ่น (ศาสตร์พระราชา)",
    department: "สาขาวิชาบริหารธุรกิจ",
    leader: "ผศ.ดร. นฤมล อนันตโชค",
    budgetApproved: 180000,
    budgetUsed: 65000,
    status: "in_progress",
    sdgGoals: [4, 8, 11],
    kpis: ["จำนวนผู้เข้ารับการอบรมไม่น้อยกว่า 60 คน", "ได้ต้นแบบธุรกิจสร้างสรรค์ 5 แผนงาน"],
    startDate: "2026-10-01",
    endDate: "2027-03-31",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "proj-02",
    code: "69-FLAS-002",
    projectType: "faculty_strategy",
    planType: "in_plan",
    budgetSource: "faculty_revenue",
    fiscalYear: 2569,
    title: "โครงการยกระดับคุณภาพการศึกษาเพื่อพัฒนาคุณภาพบัณฑิตให้มีความรู้และทักษะในศตวรรษที่ 21",
    strategicGoal: "ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษา",
    department: "สาขาวิชาวิศวกรรมเครื่องกลและหุ่นยนต์",
    leader: "อ.ฤทธิชัย ภาระวิเศษ",
    budgetApproved: 120000,
    budgetUsed: 0,
    status: "approved",
    sdgGoals: [4, 9],
    kpis: ["นักศึกษาผ่านเกณฑ์มาตรฐานวิชาชีพ 85%"],
    startDate: "2026-11-01",
    endDate: "2027-04-30",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "proj-03",
    code: "69-FLAS-003",
    projectType: "kings_philosophy",
    planType: "in_plan",
    budgetSource: "national_budget",
    fiscalYear: 2569,
    title: "โครงการเพิ่มมูลค่าสับปะรดด้วยนวัตกรรมการอบแห้งเพื่อพัฒนาเศรษฐกิจฐานราก ต.ท่าหินโงม",
    strategicGoal: "โครงการตามยุทธศาสตร์เพื่อการพัฒนาท้องถิ่น (ศาสตร์พระราชา)",
    department: "สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ",
    leader: "ดร.สุรชัย นวัตกร",
    budgetApproved: 250000,
    budgetUsed: 195000,
    status: "reported",
    sdgGoals: [1, 2, 8, 12],
    kpis: ["กลุ่มวิสาหกิจชุมชนมีรายได้เพิ่มขึ้น 15%"],
    startDate: "2026-01-10",
    endDate: "2026-08-30",
    createdAt: "2026-09-28T00:00:00Z"
  }
];

export const MOCK_LOANS: LoanContract[] = [
  {
    id: "loan-001",
    contractNumber: "ยม 01/2569",
    borrowerName: "อ.ฤทธิชัย ภาระวิเศษ",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    purpose: "โครงการติดอาวุธเพื่อเตรียมความพร้อมสำหรับการเข้าสู่ระบบราชการกลุ่มวิชาทางรัฐศาสตร์",
    projectCode: "69-FLAS-002",
    amount: 35000,
    bahtText: "สามหมื่นห้าพันบาทถ้วน",
    estimatedExpenses: [
      { category: "ค่าตอบแทน", description: "ค่าตอบแทนวิทยากรเตรียมสอบราชการ (12 ชม.)", amount: 12000 },
      { category: "ค่าใช้สอย", description: "ค่าอาหารกลางวันและอาหารว่างผู้เข้าร่วม 50 คน", amount: 18000 },
      { category: "ค่าวัสดุ", description: "ค่าเอกสารแนวข้อสอบและอุปกรณ์จัดอบรม", amount: 5000 }
    ],
    borrowDate: "2026-09-15",
    disbursedDate: "2026-09-16",
    disbursedAmount: 35000,
    settleDueDate: "2026-10-16",
    status: "disbursed",
    checklist: {
      hasContract: true,
      hasMemo: true,
      hasApprovedProject: true,
      hasEstimate: true
    },
    settlements: [
      {
        id: "stl-01",
        settleDate: "2026-09-25",
        cashAmount: 5000,
        voucherAmount: 20000,
        receiptNumber: "บส. 69/042",
        voucherSummary: "ใบสำคัญจ่ายค่าอาหารและค่าวิทยากร",
        receivedBy: "นางสาวมณีรัตน์ การเงิน",
        remainingBalance: 10000,
        remark: "ส่งใช้คืนงวดที่ 1 คงเหลือ 10,000 บาท"
      }
    ],
    totalSettledAmount: 25000,
    remainingBalance: 10000,
    approverName: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
    approverPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    createdAt: "2026-09-15T00:00:00Z"
  },
  {
    id: "loan-002",
    contractNumber: "ยม 02/2569",
    borrowerName: "ผศ.ดร. นฤมล อนันตโชค",
    position: "อาจารย์ประจำสาขาบริหารธุรกิจ",
    department: "สาขาวิชาบริหารธุรกิจ",
    purpose: "โครงการอบรมเชิงปฏิบัติการ Startup Creator สร้างนวัตกรท่องเที่ยวรุ่นใหม่",
    projectCode: "69-FLAS-001",
    amount: 50000,
    bahtText: "ห้าหมื่นบาทถ้วน",
    estimatedExpenses: [
      { category: "ค่าตอบแทน", description: "ค่าวิทยากร Startup และ AI", amount: 18000 },
      { category: "ค่าใช้สอย", description: "ค่าอาหารและสถานที่", amount: 25000 },
      { category: "ค่าวัสดุ", description: "ค่าวัสดุและเกียรติบัตร", amount: 7000 }
    ],
    borrowDate: "2026-09-20",
    disbursedDate: "2026-09-21",
    disbursedAmount: 50000,
    settleDueDate: "2026-10-21",
    status: "disbursed",
    checklist: {
      hasContract: true,
      hasMemo: true,
      hasApprovedProject: true,
      hasEstimate: true
    },
    totalSettledAmount: 0,
    remainingBalance: 50000,
    approverName: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
    approverPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    createdAt: "2026-09-20T00:00:00Z"
  }
];

export const MOCK_BUDGET_ITEMS: BudgetLedgerItem[] = [
  {
    id: "bg-01",
    category: "operating",
    subCategory: "ค่าตอบแทนใช้สอยและวัสดุ (โครงการคณะ)",
    fiscalYear: 2569,
    budgetSource: "faculty_revenue",
    allocatedAmount: 1500000,
    committedAmount: 450000,
    disbursedAmount: 620000,
    remainingAmount: 430000,
    department: "คณะศิลปศาสตร์และวิทยาศาสตร์ (ส่วนกลาง)"
  },
  {
    id: "bg-02",
    category: "general",
    subCategory: "โครงการศาสตร์พระราชาเพื่อพัฒนาท้องถิ่น",
    fiscalYear: 2569,
    budgetSource: "national_budget",
    allocatedAmount: 2000000,
    committedAmount: 850000,
    disbursedAmount: 780000,
    remainingAmount: 370000,
    department: "ทุกสาขาวิชา"
  },
  {
    id: "bg-03",
    category: "compensation",
    subCategory: "ค่าตอบแทนการสอนภาคพิเศษ (กศ.ปช.)",
    fiscalYear: 2569,
    budgetSource: "faculty_revenue",
    allocatedAmount: 800000,
    committedAmount: 240000,
    disbursedAmount: 310000,
    remainingAmount: 250000,
    department: "งานบริการวิชาการ"
  },
  {
    id: "bg-04",
    category: "operating",
    subCategory: "ค่าใช้จ่ายในการเดินทางไปราชการและนิเทศนักศึกษา",
    fiscalYear: 2569,
    budgetSource: "faculty_revenue",
    allocatedAmount: 400000,
    committedAmount: 120000,
    disbursedAmount: 180000,
    remainingAmount: 100000,
    department: "ทุกสาขาวิชา"
  }
];

export const MOCK_LEDGER_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: "tx-01",
    transactionNumber: "TX-69-001",
    fiscalYear: 2569,
    budgetSource: "national_budget",
    category: "general",
    subCategory: "โครงการศาสตร์พระราชาเพื่อพัฒนาท้องถิ่น",
    projectCode: "69-KING-001",
    transactionType: "allocation",
    amount: 250000,
    referenceDocNumber: "อนุมัติแผน 2569",
    description: "จัดสรรงบประมาณโครงการพัฒนาเศรษฐกิจฐานรากสับปะรดอบแห้ง",
    performedBy: "เจ้าหน้าที่งานแผน",
    date: "2026-10-01",
    createdAt: "2026-10-01T00:00:00Z"
  },
  {
    id: "tx-02",
    transactionNumber: "TX-69-002",
    fiscalYear: 2569,
    budgetSource: "faculty_revenue",
    category: "operating",
    subCategory: "ค่าตอบแทนใช้สอยและวัสดุ (โครงการคณะ)",
    projectCode: "69-FLAS-001",
    transactionType: "commitment",
    amount: 50000,
    referenceDocNumber: "ยม 02/2569",
    description: "ผูกพันงบประมาณการยืมเงินทดรองราชการ โครงการ Startup Creator",
    performedBy: "ผศ.ดร. นฤมล อนันตโชค",
    date: "2026-09-20",
    createdAt: "2026-09-20T00:00:00Z"
  },
  {
    id: "tx-03",
    transactionNumber: "TX-69-003",
    fiscalYear: 2569,
    budgetSource: "faculty_revenue",
    category: "compensation",
    subCategory: "ค่าตอบแทนการสอนภาคพิเศษ (กศ.ปช.)",
    transactionType: "disbursement",
    amount: 45000,
    referenceDocNumber: "บจ. 09/2569",
    description: "เบิกจ่ายค่าสอนพิเศษอาจารย์ กศ.ปช. ประจำเดือนสิงหาคม 2569",
    performedBy: "นางสาวมณีรัตน์ การเงิน",
    date: "2026-09-10",
    createdAt: "2026-09-10T00:00:00Z"
  }
];

export const MOCK_DISBURSEMENTS: TeachingDisbursement[] = [
  {
    id: "disb-01",
    batchNumber: "บจ. 01/2569",
    periodMonth: "กันยายน 2569",
    academicYear: 2568,
    term: "1/2568",
    program: "bachelor_gspch",
    totalAmount: 23600,
    taxDeductionTotal: 236,
    netAmountTotal: 23364,
    teachersCount: 3,
    taxRate: 1,
    status: "approved",
    items: [
      {
        id: "item-1",
        teacherName: "ผศ.ดร. นฤมล อนันตโชค",
        courseCode: "BUS3201",
        courseName: "การบริหารธุรกิจสร้างสรรค์และสตาร์ทอัพ",
        hours: 16,
        ratePerHour: 600,
        total: 9600,
        taxDeduction: 96,
        netAmount: 9504,
        dates: "ส. 6, อา. 7, ส. 13, อา. 14 ก.ย. 69",
        room: "421"
      },
      {
        id: "item-2",
        teacherName: "อ.ฤทธิชัย ภาระวิเศษ",
        courseCode: "POL2104",
        courseName: "การเมืองการปกครองและนโยบายสาธารณะ",
        hours: 16,
        ratePerHour: 500,
        total: 8000,
        taxDeduction: 80,
        netAmount: 7920,
        dates: "ส. 6, อา. 7, ส. 13, อา. 14 ก.ย. 69",
        room: "422"
      },
      {
        id: "item-3",
        teacherName: "ดร.สุรชัย นวัตกร",
        courseCode: "ENG1102",
        courseName: "ระบบอัตโนมัติและนวัตกรรมชุมชน",
        hours: 12,
        ratePerHour: 500,
        total: 6000,
        taxDeduction: 60,
        netAmount: 5940,
        dates: "ส. 20, อา. 21, ส. 27 ก.ย. 69",
        room: "Lab 3"
      }
    ],
    createdAt: "2026-09-22T00:00:00Z"
  }
];

export const MOCK_PURCHASE_REQ: PurchaseRequisition[] = [
  {
    id: "pr-001",
    prNumber: "พด. 01/2569",
    procurementType: "purchase",
    itemCategory: "materials",
    projectName: "โครงการพัฒนาทักษะทางวิชาชีพ สาขาวิชาบริหารธุรกิจ",
    projectCode: "69-FLAS-001",
    requesterName: "อ.ฤทธิชัย ภาระวิเศษ",
    requesterPosition: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชาบริหารธุรกิจ",
    requestDate: "2026-09-22",
    requiredDeliveryDate: "2026-10-10",
    budgetSource: "faculty_revenue",
    reason: "เพื่อใช้ประกอบการจัดกิจกรรมอบรมเชิงปฏิบัติการเตรียมความพร้อมวิชาชีพ",
    supplierName: "บริษัท สยามเครื่องเขียนและไอที จำกัด",
    quotationNumber: "QT-2026-0941",
    quotationDate: "2026-09-20",
    vatRate: 7,
    totalAmountBeforeTax: 18500,
    vatAmount: 1295,
    netTotalAmount: 19795,
    status: "approved",
    committeeMembers: [
      { name: "ผศ.ดร. นฤมล อนันตโชค", position: "ประธานหลักสูตร", role: "president" },
      { name: "ดร.สุรชัย นวัตกร", position: "อาจารย์ประจำสาขา", role: "member" },
      { name: "นายสมเกียรติ วงศ์สารบรรณ", position: "เจ้าหน้าที่ธุรการ", role: "secretary" }
    ],
    items: [
      { itemNumber: 1, description: "กระดาษ A4 80 แกรม (Double A)", quantity: 20, unit: "รีม", unitPrice: 145, totalPrice: 2900 },
      { itemNumber: 2, description: "หมึกพิมพ์เลเซอร์ HP LaserJet MFP", quantity: 2, unit: "กล่อง", unitPrice: 3800, totalPrice: 7600 },
      { itemNumber: 3, description: "แฟ้มเสนอเซ็นและเครื่องเขียนจัดอบรม", quantity: 40, unit: "ชุด", unitPrice: 200, totalPrice: 8000 }
    ],
    createdAt: "2026-09-22T00:00:00Z"
  }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "lv-001",
    requestNumber: "ลพ. 001/2569",
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    staffId: "u-teacher",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    employeeType: "contract_academic",
    leaveType: "vacation",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    isHalfDay: false,
    totalDays: 3,
    reason: "ลาพักผ่อนประจำปีเพื่อฟื้นฟูสุขภาพและดูแลครอบครัว",
    substitutePerson: "ผศ.ดร. นฤมล อนันตโชค",
    substitutePersonId: "u-dean",
    substituteStatus: "acknowledged",
    contactAddress: "123 ม.2 ต.ในเมือง อ.เมือง จ.ชัยภูมิ",
    contactPhone: "081-234-5678",
    accumulatedDays: 5,
    currentYearQuota: 10,
    usedDaysBefore: 0,
    remainingDaysAfter: 12,
    status: "approved",
    verifiedByName: "นางสาวมณีรัตน์ การเงิน (เจ้าหน้าที่บุคคล)",
    verifiedDate: "2026-09-26",
    approverName: "ผศ.ดร.สานนท์ ด่านภักดี",
    approverPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    approverComment: "อนุมัติให้ลาได้ตามระเบียบ",
    approvalDate: "2026-09-27",
    createdAt: "2026-09-25T08:30:00Z"
  },
  {
    id: "lv-002",
    requestNumber: "ลป. 001/2569",
    staffName: "ดร.สุรชัย นวัตกร",
    staffId: "u-teacher2",
    position: "อาจารย์ประจำสาขาวิชาวิศวกรรมการผลิต",
    department: "สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ",
    employeeType: "university_staff",
    leaveType: "sick",
    startDate: "2026-09-20",
    endDate: "2026-09-21",
    isHalfDay: false,
    totalDays: 2,
    reason: "มีไข้หวัดใหญ่และแพทย์สั่งให้พักรักษาตัว",
    substitutePerson: "อ.สมบัติ วิชาการ",
    substituteStatus: "acknowledged",
    contactAddress: "88/1 ถ.บรรณาการ ต.ในเมือง อ.เมือง จ.ชัยภูมิ",
    contactPhone: "089-876-5432",
    medicalCertificateUrl: "https://example.com/med-cert-01.pdf",
    accumulatedDays: 0,
    currentYearQuota: 60,
    usedDaysBefore: 0,
    remainingDaysAfter: 58,
    status: "approved",
    approverName: "ผศ.ดร.สานนท์ ด่านภักดี",
    approverPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    approvalDate: "2026-09-20",
    createdAt: "2026-09-20T07:15:00Z"
  },
  {
    id: "lv-003",
    requestNumber: "ลก. 001/2569",
    staffName: "นายสมเกียรติ วงศ์สารบรรณ",
    staffId: "u-admin",
    position: "เจ้าหน้าที่ธุรการและสารบรรณ",
    department: "สำนักงานคณบดี",
    employeeType: "university_staff",
    leaveType: "personal",
    startDate: "2026-10-12",
    endDate: "2026-10-12",
    isHalfDay: true,
    halfDayPeriod: "afternoon",
    totalDays: 0.5,
    reason: "ติดต่อธุระส่วนตัวที่สำนักงานที่ดินจังหวัดชัยภูมิ",
    substitutePerson: "นางสาวมณีรัตน์ การเงิน",
    substituteStatus: "acknowledged",
    contactAddress: "45 ม.3 ต.บ้านเล่า อ.เมือง จ.ชัยภูมิ",
    contactPhone: "086-112-2334",
    accumulatedDays: 0,
    currentYearQuota: 45,
    usedDaysBefore: 0,
    remainingDaysAfter: 44.5,
    status: "submitted",
    createdAt: "2026-09-28T10:00:00Z"
  }
];

export const MOCK_USER_QUOTAS: UserLeaveQuota[] = [
  {
    id: "quota-001",
    userId: "u-teacher",
    employeeId: "CPRU-65042",
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    employeeType: "contract_academic",
    fiscalYear: 2569,
    vacationQuota: {
      accumulated: 5,
      currentYear: 10,
      used: 3,
      remaining: 12
    },
    personalQuota: {
      currentYear: 45,
      used: 0,
      remaining: 45
    },
    sickQuota: {
      currentYear: 60,
      used: 0,
      remaining: 60
    },
    dutyQuota: {
      used: 2
    },
    updatedAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "quota-002",
    userId: "u-admin",
    employeeId: "CPRU-60012",
    staffName: "นายสมเกียรติ วงศ์สารบรรณ",
    department: "สำนักงานคณบดี",
    position: "เจ้าหน้าที่ธุรการและสารบรรณ",
    employeeType: "university_staff",
    fiscalYear: 2569,
    vacationQuota: {
      accumulated: 10,
      currentYear: 10,
      used: 0,
      remaining: 20
    },
    personalQuota: {
      currentYear: 45,
      used: 0.5,
      remaining: 44.5
    },
    sickQuota: {
      currentYear: 60,
      used: 0,
      remaining: 60
    },
    dutyQuota: {
      used: 0
    },
    updatedAt: "2026-09-28T00:00:00Z"
  }
];

export const MOCK_FACULTY_PORTFOLIOS: FacultyPortfolio[] = [
  {
    id: "port-001",
    userId: "u-teacher",
    employeeId: "CPRU-65042",
    prefix: "อาจารย์",
    fullName: "ฤทธิชัย ภาระวิเศษ",
    academicRank: "อาจารย์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    contactEmail: "ritthichai.p@cpru.ac.th",
    contactPhone: "081-234-5678",
    contractType: "พนักงานจ้างตามภารกิจ (ประเภทวิชาการ)",
    degrees: [
      {
        level: "master",
        degreeName: "รัฐศาสตรมหาบัณฑิต (ร.ม.)",
        fieldOfStudy: "การปกครองและนโยบายสาธารณะ",
        institution: "จุฬาลงกรณ์มหาวิทยาลัย",
        country: "ประเทศไทย",
        yearGraduated: 2562
      },
      {
        level: "bachelor",
        degreeName: "รัฐศาสตรบัณฑิต (ร.บ.) เกียรตินิยมอันดับสอง",
        fieldOfStudy: "การปกครอง",
        institution: "มหาวิทยาลัยธรรมศาสตร์",
        country: "ประเทศไทย",
        yearGraduated: 2558
      }
    ],
    currentTeachingLoad: [
      {
        term: "1/2569",
        academicYear: 2569,
        courseCode: "POL1101",
        courseName: "ความรู้เบื้องต้นทางรัฐศาสตร์",
        credits: "3(3-0-6)",
        hoursPerWeek: 4,
        program: "bachelor_regular",
        studentCount: 45
      },
      {
        term: "1/2569",
        academicYear: 2569,
        courseCode: "PAD2203",
        courseName: "การบริหารนโยบายสาธารณะและการวางแผน",
        credits: "3(3-0-6)",
        hoursPerWeek: 4,
        program: "bachelor_regular",
        studentCount: 38
      },
      {
        term: "1/2569",
        academicYear: 2569,
        courseCode: "PAD3301",
        courseName: "การบริหารราชการไทยและกฎหมายปกครอง",
        credits: "3(3-0-6)",
        hoursPerWeek: 4,
        program: "bachelor_gspch",
        studentCount: 28
      }
    ],
    researchWorks: [
      {
        id: "res-01",
        title: "การพัฒนานโยบายสาธารณะแบบมีส่วนร่วมเพื่อเสริมสร้างความเข้มแข็งของชุมชนท้องถิ่นในจังหวัดชัยภูมิ",
        publicationYear: 2568,
        journalName: "วารสารวิชาการคณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ",
        volume: "12",
        issue: "2",
        pages: "45-58",
        indexing: "TCI_1",
        authorRole: "first_author"
      },
      {
        id: "res-02",
        title: "การประยุกต์ใช้ปัญญาประดิษฐ์ (AI) ในการบริการภาครัฐสู่การเป็นพลเมืองดิจิทัลขององค์กรปกครองส่วนท้องถิ่น",
        publicationYear: 2569,
        journalName: "วารสารรัฐประศาสนศาสตร์ มหาวิทยาลัยขอนแก่น",
        volume: "16",
        issue: "1",
        pages: "102-118",
        indexing: "TCI_2",
        authorRole: "corresponding"
      }
    ],
    academicServices: [
      {
        id: "srv-01",
        title: "วิทยากรบรรยายหัวข้อ 'การจัดทำแผนพัฒนาท้องถิ่นและการมีส่วนร่วมของประชาชน' องค์การบริหารส่วนตำบลเนินสง่า",
        role: "วิทยากรหลัก",
        organization: "อบต.เนินสง่า อ.เนินสง่า จ.ชัยภูมิ",
        serviceDate: "2026-08-15",
        participantCount: 65,
        projectCategory: "local_development"
      },
      {
        id: "srv-02",
        title: "ผู้ทรงคุณวุฒิตรวจประเมินแผนยุทธศาสตร์การพัฒนาเศรษฐกิจฐานราก โครงการศาสตร์พระราชา",
        role: "กรรมการผู้ทรงคุณวุฒิ",
        organization: "ศูนย์การเรียนรู้ศาสตร์พระราชา มรภ.ชัยภูมิ",
        serviceDate: "2026-09-02",
        participantCount: 40,
        projectCategory: "kings_philosophy"
      }
    ],
    sarRecords: [
      {
        academicYear: 2568,
        sarStatus: "certified",
        selfScore: 4.65,
        evaluatorScore: 4.58,
        comments: "ผลการประเมินอยู่ในระดับดีมาก มีผลงานวิจัยตีพิมพ์ในฐาน TCI กลุ่ม 1 ครบถ้วน",
        certifiedBy: "ผศ.ดร.สานนท์ ด่านภักดี",
        certifiedDate: "2026-06-30"
      },
      {
        academicYear: 2569,
        sarStatus: "draft",
        selfScore: 4.70
      }
    ],
    createdAt: "2026-09-01T00:00:00Z"
  }
];

export const MOCK_EMPLOYMENT_CONTRACTS: EmploymentContract[] = [
  {
    id: "ct-001",
    contractNumber: "สจ. 012/2568",
    employeeName: "อ.ฤทธิชัย ภาระวิเศษ",
    employeeId: "CPRU-65042",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    contractCategory: "academic_mission",
    startDate: "2025-10-01",
    endDate: "2026-09-30",
    salary: 28500,
    signatoryFirst: "ผศ.ดร.สานนท์ ด่านภักดี (คณบดี ผู้รับมอบอำนาจ)",
    signatorySecond: "อ.ฤทธิชัย ภาระวิเศษ (ผู้รับจ้าง)",
    signedDocumentUrl: "https://example.com/contract_ritthichai_2568.pdf",
    status: "expiring_soon",
    renewalHistory: [
      {
        renewalDate: "2025-09-15",
        newEndDate: "2026-09-30",
        contractNumber: "สจ. 012/2568",
        approvedBy: "ที่ประชุม ก.บ.ม. มหาวิทยาลัยราชภัฏชัยภูมิ",
        remarks: "ต่อสัญญาจ้าง 1 ปี ผลการประเมินผ่านเกณฑ์ดีมาก"
      }
    ],
    createdAt: "2025-09-20T00:00:00Z"
  },
  {
    id: "ct-002",
    contractNumber: "สจ. 005/2569",
    employeeName: "ดร.สุรชัย นวัตกร",
    employeeId: "CPRU-63018",
    position: "อาจารย์ประจำสาขาวิชาวิศวกรรมการผลิต",
    department: "สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ",
    contractCategory: "university_staff",
    startDate: "2026-01-01",
    endDate: "2028-12-31",
    salary: 34200,
    signatoryFirst: "อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ",
    signatorySecond: "ดร.สุรชัย นวัตกร",
    signedDocumentUrl: "https://example.com/contract_surachai.pdf",
    status: "active",
    createdAt: "2025-12-15T00:00:00Z"
  }
];

export const MOCK_ROOMS: RoomBooking[] = [
  {
    id: "rm-01",
    roomName: "ห้องประชุมสิริวิชาญ (อาคาร 4 ชั้น 2)",
    capacity: 40,
    bookedBy: "นายสมเกียรติ วงศ์สารบรรณ",
    department: "งานธุรการและสารบรรณ",
    date: "2026-09-30",
    startTime: "09:00",
    endTime: "12:00",
    purpose: "ประชุมคณะกรรมการบริหารคณะศิลปศาสตร์และวิทยาศาสตร์ ประจำเดือนกันยายน 2569",
    status: "approved",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "rm-02",
    roomName: "ห้อง Smart Classroom 421",
    capacity: 60,
    bookedBy: "อ.ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชารัฐศาสตร์",
    date: "2026-10-02",
    startTime: "13:00",
    endTime: "16:30",
    purpose: "อบรมเชิงปฏิบัติการเตรียมความพร้อมสหกิจศึกษา",
    status: "approved",
    createdAt: "2026-09-28T00:00:00Z"
  }
];

export const MOCK_STRATEGIC_PLAN: StrategicPlan = {
  id: "plan-2569",
  fiscalYear: 2569,
  planTitle: "แผนปฏิบัติราชการประจำปีงบประมาณ พ.ศ. 2569",
  facultyName: "คณะศิลปศาสตร์และวิทยาศาสตร์",
  universityName: "มหาวิทยาลัยราชภัฏชัยภูมิ",
  vision: "คณะชั้นนำในการจัดการศึกษาและบูรณาการศาสตร์ เพื่อการพัฒนาท้องถิ่นอย่างยั่งยืนด้วยนวัตกรรมและเทคโนโลยีดิจิทัล",
  missions: [
    "ผลิตบัณฑิตที่มีสมรรถนะวิชาชีพและทักษะแห่งศตวรรษที่ 21 ตอบสนองความต้องการของท้องถิ่นและประเทศ",
    "สร้างสรรค์งานวิจัยและนวัตกรรมเพื่อการพัฒนาเศรษฐกิจฐานรากตามแนวทางศาสตร์พระราชา",
    "ให้บริการวิชาการและถ่ายทอดเทคโนโลยีเพื่อเสริมสร้างความเข้มแข็งของชุมชนและสังคม",
    "พัฒนาระบบบริหารจัดการองค์กรด้วยหลักธรรมาภิบาลและเทคโนโลยีดิจิทัลสู่ความเป็นเลิศ"
  ],
  pillars: [
    {
      id: "pillar-1",
      pillarNumber: 1,
      code: "SO1",
      name: "การพัฒนาท้องถิ่นและสร้างความเข้มแข็งของชุมชน (ศาสตร์พระราชา)",
      description: "ยกระดับคุณภาพชีวิต ชุมชนเข้มแข็ง และสร้างมูลค่าเพิ่มแก่ผลผลิตทางการเกษตรและภูมิปัญญาท้องถิ่นในจังหวัดชัยภูมิ",
      weight: 25,
      goals: [
        {
          id: "goal-1.1",
          goalNumber: "1.1",
          name: "ยกระดับเศรษฐกิจฐานรากและส่งเสริมการพึ่งพาตนเองของชุมชนเป้าหมาย"
        }
      ],
      kpis: [
        {
          id: "kpi-1.1.1",
          code: "KPI-1.1.1",
          pillarId: "pillar-1",
          pillarNumber: 1,
          goalId: "goal-1.1",
          name: "จำนวนกลุ่มวิสาหกิจชุมชน/ท้องถิ่นที่ได้รับการถ่ายทอดองค์ความรู้และนวัตกรรม",
          unit: "กลุ่ม",
          targetValue: 5,
          actualValue: 4,
          hasData: true,
          progressPercent: 80,
          weight: 15,
          calculationFormula: "(ผลจริง / เป้าหมาย) * 100",
          reportingPeriod: "quarterly",
          quarterProgress: { q1: 1, q2: 2, q3: 1, q4: 0 },
          responsibleDepartment: "สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ",
          responsiblePerson: "ดร.สุรชัย นวัตกร",
          linkedProjectIds: ["69-FLAS-003"],
          evidenceUrl: "https://example.com/sar_kpi_1_1_1.pdf",
          status: "in_progress"
        },
        {
          id: "kpi-1.1.2",
          code: "KPI-1.1.2",
          pillarId: "pillar-1",
          pillarNumber: 1,
          goalId: "goal-1.1",
          name: "ร้อยละของกลุ่มเป้าหมายในชุมชนที่มีรายได้หรือผลผลิตเพิ่มขึ้นหลังเข้าร่วมโครงการ",
          unit: "ร้อยละ",
          targetValue: 80,
          actualValue: 85,
          hasData: true,
          progressPercent: 100,
          weight: 10,
          calculationFormula: "(กลุ่มที่มีรายได้เพิ่ม / กลุ่มเป้าหมายทั้งหมด) * 100",
          reportingPeriod: "annual",
          quarterProgress: { q3: 85 },
          responsibleDepartment: "สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ",
          responsiblePerson: "ดร.สุรชัย นวัตกร",
          linkedProjectIds: ["69-FLAS-003"],
          status: "achieved"
        }
      ]
    },
    {
      id: "pillar-2",
      pillarNumber: 2,
      code: "SO2",
      name: "การผลิตและพัฒนาครูและบุคลากรทางการศึกษา/วิชาการ",
      description: "ส่งเสริมและพัฒนาศักยภาพอาจารย์ บุคลากรสายสนับสนุน และอาจารย์ผู้สอนสู่มาตรฐานวิชาชีพชั้นสูง",
      weight: 25,
      goals: [
        {
          id: "goal-2.1",
          goalNumber: "2.1",
          name: "พัฒนาสมรรถนะอาจารย์และบุคลากรให้มีผลงานวิจัยและการตีพิมพ์ในระดับชาติและนานาชาติ"
        }
      ],
      kpis: [
        {
          id: "kpi-2.1.1",
          code: "KPI-2.1.1",
          pillarId: "pillar-2",
          pillarNumber: 2,
          goalId: "goal-2.1",
          name: "ร้อยละของคณาจารย์ที่มีผลงานวิจัยตีพิมพ์ในวารสารวิชาการระดับ TCI หรือ Scopus",
          unit: "ร้อยละ",
          targetValue: 60,
          actualValue: 55,
          hasData: true,
          progressPercent: 91.6,
          weight: 15,
          calculationFormula: "(จำนวนอาจารย์ที่ตีพิมพ์ / อาจารย์ทั้งหมด) * 100",
          reportingPeriod: "biannual",
          quarterProgress: { q2: 40, q4: 55 },
          responsibleDepartment: "งานวิจัยและบริการวิชาการ",
          responsiblePerson: "ผศ.ดร. นฤมล อนันตโชค",
          evidenceUrl: "https://example.com/research_summary_2569.pdf",
          status: "in_progress"
        },
        {
          id: "kpi-2.1.2",
          code: "KPI-2.1.2",
          pillarId: "pillar-2",
          pillarNumber: 2,
          goalId: "goal-2.1",
          name: "จำนวนคณาจารย์ที่ได้รับการพัฒนาทักษะดิจิทัลและ AI เพื่อการจัดการเรียนรู้",
          unit: "คน",
          targetValue: 35,
          actualValue: 38,
          hasData: true,
          progressPercent: 100,
          weight: 10,
          calculationFormula: "(ผลจริง / เป้าหมาย) * 100",
          reportingPeriod: "annual",
          quarterProgress: { q2: 20, q3: 18 },
          responsibleDepartment: "งานบริหารงานบุคคล",
          responsiblePerson: "นางสาวมณีรัตน์ การเงิน",
          status: "exceeded"
        }
      ]
    },
    {
      id: "pillar-3",
      pillarNumber: 3,
      code: "SO3",
      name: "การยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต",
      description: "พัฒนาหลักสูตรที่ทันสมัย บัณฑิตมีทักษะศตวรรษที่ 21 และมีงานทำตรงตามความต้องการของตลาดแรงงาน",
      weight: 25,
      goals: [
        {
          id: "goal-3.1",
          goalNumber: "3.1",
          name: "ยกระดับคุณภาพหลักสูตรและการมีงานทำของบัณฑิต"
        }
      ],
      kpis: [
        {
          id: "kpi-3.1.1",
          code: "KPI-3.1.1",
          pillarId: "pillar-3",
          pillarNumber: 3,
          goalId: "goal-3.1",
          name: "ร้อยละของบัณฑิตที่มีงานทำหรือประกอบอาชีพอิสระภายใน 1 ปีหลังสำเร็จการศึกษา",
          unit: "ร้อยละ",
          targetValue: 85,
          actualValue: 82,
          hasData: true,
          progressPercent: 96.4,
          weight: 15,
          calculationFormula: "(บัณฑิตมีงานทำ / บัณฑิตที่ตอบแบบสำรวจ) * 100",
          reportingPeriod: "annual",
          quarterProgress: { q3: 82 },
          responsibleDepartment: "งานบริการการศึกษาและพัฒนานักศึกษา",
          responsiblePerson: "อ.สมบัติ วิชาการ",
          linkedProjectIds: ["69-FLAS-001", "69-FLAS-002"],
          status: "in_progress"
        },
        {
          id: "kpi-3.1.2",
          code: "KPI-3.1.2",
          pillarId: "pillar-3",
          pillarNumber: 3,
          goalId: "goal-3.1",
          name: "จำนวนหลักสูตรที่ผ่านการประเมินคุณภาพการศึกษาระดับหลักสูตรตามเกณฑ์ AUN-QA",
          unit: "หลักสูตร",
          targetValue: 4,
          actualValue: 4,
          hasData: true,
          progressPercent: 100,
          weight: 10,
          calculationFormula: "(ผลจริง / เป้าหมาย) * 100",
          reportingPeriod: "annual",
          quarterProgress: { q4: 4 },
          responsibleDepartment: "งานประกันคุณภาพการศึกษา",
          responsiblePerson: "ผศ.ดร. นฤมล อนันตโชค",
          status: "achieved"
        }
      ]
    },
    {
      id: "pillar-4",
      pillarNumber: 4,
      code: "SO4",
      name: "การพัฒนาระบบบริหารจัดการองค์กรสู่ความเป็นเลิศ (FLAS Digital ERP)",
      description: "พัฒนาระบบดิจิทัลเพื่อการบริหารจัดการคณะครบ 6 โมดูล และส่งเสริมธรรมาภิบาลในการปฏิบัติงาน",
      weight: 25,
      goals: [
        {
          id: "goal-4.1",
          goalNumber: "4.1",
          name: "พัฒนาระบบเทคโนโลยีดิจิทัลและสารสนเทศเพื่อการบริหารงานคณะให้มีประสิทธิภาพ"
        }
      ],
      kpis: [
        {
          id: "kpi-4.1.1",
          code: "KPI-4.1.1",
          pillarId: "pillar-4",
          pillarNumber: 4,
          goalId: "goal-4.1",
          name: "ร้อยละความสำเร็จของการนำระบบ FLAS ERP 6 โมดูลมาใช้ในการปฏิบัติงานจริงของคณะ",
          unit: "ร้อยละ",
          targetValue: 100,
          actualValue: 90,
          hasData: true,
          progressPercent: 90,
          weight: 15,
          calculationFormula: "(โมดูลที่เปิดใช้จริง / 6 โมดูล) * 100",
          reportingPeriod: "quarterly",
          quarterProgress: { q1: 50, q2: 75, q3: 90 },
          responsibleDepartment: "สำนักงานคณบดี",
          responsiblePerson: "นายสมเกียรติ วงศ์สารบรรณ",
          evidenceUrl: "https://flas-cpru.web.app",
          status: "in_progress"
        },
        {
          id: "kpi-4.1.2",
          code: "KPI-4.1.2",
          pillarId: "pillar-4",
          pillarNumber: 4,
          goalId: "goal-4.1",
          name: "ระดับความพึงพอใจของบุคลากรและนักศึกษาต่อระบบการบริหารจัดการคณะ",
          unit: "ระดับคะแนน",
          targetValue: 4.5,
          actualValue: 4.62,
          hasData: true,
          progressPercent: 100,
          weight: 10,
          calculationFormula: "(ผลคะแนนเฉลี่ย / 5.00) * 100",
          reportingPeriod: "annual",
          quarterProgress: { q4: 4.62 },
          responsibleDepartment: "งานประกันคุณภาพและยุทธศาสตร์",
          responsiblePerson: "ผศ.ดร. นฤมล อนันตโชค",
          status: "exceeded"
        }
      ]
    }
  ],
  status: "active",
  updatedAt: "2026-09-28T00:00:00Z"
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-01",
    title: "หนังสือรับใหม่: ชี้แจงโครงการยุทธศาสตร์ 2569",
    message: "กองนโยบายและแผน ส่งหนังสือรับเลขที่ 015/2569 เรื่อง แนวทางการจัดสรรงบประมาณยุทธศาสตร์",
    category: "admin",
    linkHref: "/admin/inbound",
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: "notif-02",
    title: "สัญญายืมเงิน ยม. 01/2569 ได้รับอนุมัติและพร้อมจ่ายเงิน",
    message: "ฝ่ายการเงินอนุมัติสัญญายืมเงินเพื่อจัดโครงการเตรียมความพร้อมราชการ จำนวน 35,000 บาท",
    category: "finance",
    linkHref: "/finance/loans",
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: "notif-03",
    title: "คำขอซื้อ-ขอจ้าง พด. 01/2569 ผ่านการอนุมัติงบประมาณ",
    message: "งานพัสดุและจัดซื้อดำเนินการสั่งซื้อวัสดุประกอบการจัดอบรมเรียบร้อยแล้ว รอนัดหมายตรวจรับ",
    category: "procurement",
    linkHref: "/procurement",
    read: true,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: "notif-04",
    title: "ใบลาพักผ่อน ลพ. 001/2569 ได้รับการอนุมัติแล้ว",
    message: "คณบดีอนุมัติคำขอลาพักผ่อนของ อ.ฤทธิชัย ภาระวิเศษ วันที่ 5-7 ต.ค. 2569",
    category: "hr",
    linkHref: "/hr",
    read: true,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: "notif-05",
    title: "มีคำขอแก้ไขเวลาลงทำงานใหม่รอการตรวจสอบ",
    message: "อ.ฤทธิชัย ภาระวิเศษ ยื่นขอแก้ไขเวลาเข้างานวันที่ 28 ก.ย. 2569",
    category: "attendance",
    linkHref: "/hr/attendance",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

// ==========================================
// 8. MOCK DATA FOR ATTENDANCE & USER ACCESS
// ==========================================

export const MOCK_EMPLOYEES: EmployeeRecord[] = [
  {
    id: "EMP-2569-001",
    userId: "u-admin",
    prefix: "นาย",
    firstName: "สมเกียรติ",
    lastName: "วงศ์สารบรรณ",
    officialName: "นายสมเกียรติ วงศ์สารบรรณ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "เจ้าหน้าที่บริหารงานทั่วไป (หัวหน้างานสารบรรณ)",
    employeeType: "university_staff",
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    startDate: "2020-10-01",
    status: "active",
    attendanceEligible: true,
    workScheduleId: "SHIFT-NORMAL",
    email: "admin.saraban@cpru.ac.th",
    phone: "081-998-8776",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "EMP-2569-002",
    userId: "u-dean",
    prefix: "ผศ.ดร.",
    firstName: "สานนท์",
    lastName: "ด่านภักดี",
    officialName: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    academicRank: "ผู้ช่วยศาสตราจารย์",
    employeeType: "civil_servant",
    startDate: "2015-06-01",
    status: "active",
    attendanceEligible: false,
    email: "dean.las@cpru.ac.th",
    phone: "089-112-2334",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "EMP-2569-003",
    userId: "u-lecturer",
    prefix: "อาจารย์",
    firstName: "ฤทธิชัย",
    lastName: "ภาระวิเศษ",
    officialName: "อาจารย์ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    position: "อาจารย์ประจำสาขาวิชา",
    academicRank: "อาจารย์",
    employeeType: "contract_academic",
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    startDate: "2022-08-01",
    endDate: "2027-07-31",
    status: "active",
    attendanceEligible: true,
    workScheduleId: "SHIFT-NORMAL",
    email: "ritthichai.p@cpru.ac.th",
    phone: "086-554-4332",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "EMP-2569-004",
    userId: "u-gov",
    prefix: "นางสาว",
    firstName: "ศิริพร",
    lastName: "เงินคลัง",
    officialName: "นางสาวศิริพร เงินคลัง",
    department: "งานการเงินและพัสดุ",
    position: "นักวิชาการเงินและบัญชี",
    employeeType: "university_staff",
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    startDate: "2021-02-01",
    status: "active",
    attendanceEligible: true,
    workScheduleId: "SHIFT-NORMAL",
    email: "finance@cpru.ac.th",
    phone: "087-443-3221",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "EMP-2569-005",
    userId: "u-procurement",
    prefix: "นาย",
    firstName: "วีระยุทธ",
    lastName: "พัสดุดี",
    officialName: "นายวีระยุทธ พัสดุดี",
    department: "งานการเงินและพัสดุ",
    position: "นักวิชาการพัสดุ",
    employeeType: "university_staff",
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    startDate: "2021-05-15",
    status: "active",
    attendanceEligible: true,
    workScheduleId: "SHIFT-NORMAL",
    email: "procurement@cpru.ac.th",
    phone: "084-332-2110",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "EMP-2569-006",
    userId: "u-hr",
    prefix: "นางสาว",
    firstName: "มณีรัตน์",
    lastName: "บุคลากรเลิศ",
    officialName: "นางสาวมณีรัตน์ บุคลากรเลิศ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "นักทรัพยากรบุคคล",
    employeeType: "university_staff",
    supervisorId: "EMP-2569-002",
    supervisorName: "ผศ.ดร.สานนท์ ด่านภักดี",
    startDate: "2023-01-10",
    status: "active",
    attendanceEligible: true,
    workScheduleId: "SHIFT-NORMAL",
    email: "hr.flas@cpru.ac.th",
    phone: "085-221-1009",
    createdAt: "2026-09-28T00:00:00Z"
  }
];

export const MOCK_INVITATIONS: AccountInvitation[] = [
  {
    id: "inv-01",
    email: "sarawut.t@cpru.ac.th",
    employeeId: "EMP-2569-008",
    employeeName: "อาจารย์ ดร.ศราวุฒิ ตั้งมั่น",
    intendedRole: "lecturer",
    department: "สาขาวิชานวัตกรรมดิจิทัลและคอมพิวเตอร์",
    invitationToken: "tok_flas_98a72b14c3",
    expiresAt: "2026-10-15T23:59:59Z",
    status: "pending",
    invitedBy: "u-admin",
    invitedByName: "นายสมเกียรติ วงศ์สารบรรณ",
    createdAt: "2026-09-28T14:00:00Z"
  },
  {
    id: "inv-02",
    email: "ritthichai.p@cpru.ac.th",
    employeeId: "EMP-2569-003",
    employeeName: "อาจารย์ฤทธิชัย ภาระวิเศษ",
    intendedRole: "lecturer",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    invitationToken: "tok_flas_accepted_001",
    expiresAt: "2026-09-20T23:59:59Z",
    status: "accepted",
    invitedBy: "u-admin",
    invitedByName: "นายสมเกียรติ วงศ์สารบรรณ",
    createdAt: "2026-09-01T09:00:00Z",
    acceptedAt: "2026-09-02T10:15:00Z"
  }
];

export const MOCK_WORK_POLICY: WorkPolicy = {
  id: "policy-2569",
  version: "2569.1",
  title: "ประกาศคณะศิลปศาสตร์ฯ เรื่อง แนวปฏิบัติการลงเวลาทำงานของบุคลากร พ.ศ. 2569",
  timezone: "Asia/Bangkok",
  shifts: [
    {
      id: "SHIFT-NORMAL",
      name: "กะทำงานมาตรฐาน (08.30 - 16.30 น.)",
      code: "NORMAL",
      startTime: "08:30",
      endTime: "16:30",
      lateGraceMinutes: 15,
      earlyLeaveThreshold: "16:00",
      halfDayThreshold: "12:00",
      isOvernight: false,
      isDefault: true
    },
    {
      id: "SHIFT-FLEX",
      name: "กะยืดหยุ่นสายวิชาการ (09.00 - 17.00 น.)",
      code: "FLEX",
      startTime: "09:00",
      endTime: "17:00",
      lateGraceMinutes: 15,
      earlyLeaveThreshold: "16:30",
      halfDayThreshold: "12:30",
      isOvernight: false,
      isDefault: false
    }
  ],
  workDays: [1, 2, 3, 4, 5], // จันทร์ - ศุกร์
  locationModes: ["web", "gps", "qr"],
  gpsCenterLat: 15.8083,
  gpsCenterLng: 102.0315,
  gpsRadiusMeters: 500,
  effectiveDate: "2026-10-01",
  updatedAt: "2026-09-28T00:00:00Z",
  updatedBy: "นางสาวมณีรัตน์ บุคลากรเลิศ"
};

export const MOCK_HOLIDAYS_2569: PublicHoliday[] = [
  { id: "h-01", date: "2026-10-13", name: "วันนวมินทรมหาราช", year: 2569, isOfficial: true },
  { id: "h-02", date: "2026-10-23", name: "วันปิยมหาราช", year: 2569, isOfficial: true },
  { id: "h-03", date: "2026-12-05", name: "วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ", year: 2569, isOfficial: true },
  { id: "h-04", date: "2026-12-10", name: "วันรัฐธรรมนูญ", year: 2569, isOfficial: true },
  { id: "h-05", date: "2026-12-31", name: "วันสิ้นปี", year: 2569, isOfficial: true }
];

export const MOCK_ATTENDANCE_SESSIONS: AttendanceSession[] = [
  {
    id: "att-EMP-2569-001-2026-09-29",
    userId: "u-admin",
    employeeId: "EMP-2569-001",
    staffName: "นายสมเกียรติ วงศ์สารบรรณ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    workDate: "2026-09-29",
    shiftId: "SHIFT-NORMAL",
    shiftName: "กะทำงานมาตรฐาน (08.30 - 16.30 น.)",
    checkInTime: "08:24",
    checkInStatus: "on_time",
    sessionStatus: "open",
    workType: "work",
    lateMinutes: 0,
    earlyMinutes: 0,
    totalWorkMinutes: 0,
    updatedAt: "2026-09-29T08:24:00Z"
  },
  {
    id: "att-EMP-2569-003-2026-09-29",
    userId: "u-lecturer",
    employeeId: "EMP-2569-003",
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    workDate: "2026-09-29",
    shiftId: "SHIFT-NORMAL",
    shiftName: "กะทำงานมาตรฐาน (08.30 - 16.30 น.)",
    checkInTime: "08:52",
    checkInStatus: "late",
    sessionStatus: "open",
    workType: "work",
    lateMinutes: 7, // เกิน grace period 15 นาที (นับจาก 08:45)
    earlyMinutes: 0,
    totalWorkMinutes: 0,
    hasCorrection: true,
    correctionId: "corr-01",
    updatedAt: "2026-09-29T08:52:00Z"
  },
  {
    id: "att-EMP-2569-004-2026-09-28",
    userId: "u-gov",
    employeeId: "EMP-2569-004",
    staffName: "นางสาวศิริพร เงินคลัง",
    department: "งานการเงินและพัสดุ",
    workDate: "2026-09-28",
    shiftId: "SHIFT-NORMAL",
    shiftName: "กะทำงานมาตรฐาน (08.30 - 16.30 น.)",
    checkInTime: "08:15",
    checkOutTime: "16:40",
    checkInStatus: "on_time",
    checkOutStatus: "normal",
    sessionStatus: "closed",
    workType: "work",
    lateMinutes: 0,
    earlyMinutes: 0,
    totalWorkMinutes: 505,
    updatedAt: "2026-09-28T16:40:00Z"
  },
  {
    id: "att-EMP-2569-005-2026-09-28",
    userId: "u-procurement",
    employeeId: "EMP-2569-005",
    staffName: "นายวีระยุทธ พัสดุดี",
    department: "งานการเงินและพัสดุ",
    workDate: "2026-09-28",
    shiftId: "SHIFT-NORMAL",
    shiftName: "กะทำงานมาตรฐาน (08.30 - 16.30 น.)",
    checkInTime: "08:20",
    checkInStatus: "on_time",
    sessionStatus: "incomplete", // ลืมลงเวลาออก
    workType: "work",
    lateMinutes: 0,
    earlyMinutes: 0,
    totalWorkMinutes: 0,
    updatedAt: "2026-09-28T08:20:00Z"
  },
  {
    id: "att-EMP-2569-003-2026-09-20",
    userId: "u-lecturer",
    employeeId: "EMP-2569-003",
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    workDate: "2026-09-20",
    shiftId: "SHIFT-NORMAL",
    shiftName: "กะทำงานมาตรฐาน (08.30 - 16.30 น.)",
    sessionStatus: "closed",
    workType: "approved_leave",
    leaveRequestId: "lv-002",
    leaveType: "ลาป่วย",
    lateMinutes: 0,
    earlyMinutes: 0,
    totalWorkMinutes: 0,
    updatedAt: "2026-09-20T00:00:00Z"
  }
];

export const MOCK_ATTENDANCE_CORRECTIONS: AttendanceCorrection[] = [
  {
    id: "corr-01",
    employeeId: "EMP-2569-003",
    userId: "u-lecturer",
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    workDate: "2026-09-29",
    originalCheckIn: "08:52",
    requestedCheckIn: "08:20",
    requestedCheckOut: "16:30",
    reason: "ติดภารกิจช่วยคณบดีประสานงานต้อนรับคณะศึกษาดูงานที่ห้องประชุมชั้น 1 ก่อนขึ้นมาสแกนนิ้วมือที่โต๊ะทำงาน",
    evidenceUrl: "",
    status: "pending",
    initiatedBy: "employee",
    createdAt: "2026-09-29T09:10:00Z"
  },
  {
    id: "corr-02",
    employeeId: "EMP-2569-005",
    userId: "u-procurement",
    staffName: "นายวีระยุทธ พัสดุดี",
    department: "งานการเงินและพัสดุ",
    workDate: "2026-09-25",
    originalCheckIn: "08:10",
    requestedCheckIn: "08:10",
    requestedCheckOut: "16:45",
    reason: "เดินทางไปรับเอกสารใบกำกับภาษีที่ร้านค้าคู่สัญญาในตัวเมืองชัยภูมิช่วงบ่ายและไม่ได้กลับมาสแกนออกที่คณะ",
    status: "approved",
    reviewerId: "EMP-2569-002",
    reviewerName: "ผศ.ดร.สานนท์ ด่านภักดี",
    reviewerComment: "อนุมัติเนื่องจากมีใบส่งมอบพัสดุและใบเสร็จรับเงินเป็นหลักฐานยืนยัน",
    reviewedAt: "2026-09-26T10:30:00Z",
    initiatedBy: "employee",
    createdAt: "2026-09-25T17:30:00Z"
  }
];

export const MOCK_MONTHLY_ATTENDANCE_REPORTS: MonthlyAttendanceReport[] = [
  {
    id: "mrep-EMP-2569-001-2026-09",
    period: "2026-09",
    fiscalYear: 2568,
    employeeId: "EMP-2569-001",
    staffName: "นายสมเกียรติ วงศ์สารบรรณ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    position: "เจ้าหน้าที่บริหารงานทั่วไป",
    expectedWorkDays: 21,
    actualWorkDays: 21,
    lateDaysCount: 0,
    lateTotalMinutes: 0,
    earlyLeaveDaysCount: 0,
    leaveDaysCount: 0,
    officialDutyDaysCount: 0,
    absentDaysCount: 0,
    incompleteDaysCount: 0,
    status: "verified",
    verifiedBy: "นางสาวมณีรัตน์ บุคลากรเลิศ",
    verifiedAt: "2026-09-28T16:00:00Z"
  },
  {
    id: "mrep-EMP-2569-003-2026-09",
    period: "2026-09",
    fiscalYear: 2568,
    employeeId: "EMP-2569-003",
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    position: "อาจารย์ประจำสาขาวิชา",
    expectedWorkDays: 21,
    actualWorkDays: 18,
    lateDaysCount: 1,
    lateTotalMinutes: 7,
    earlyLeaveDaysCount: 0,
    leaveDaysCount: 2, // ลาป่วย 2 วัน
    officialDutyDaysCount: 1,
    absentDaysCount: 0,
    incompleteDaysCount: 0,
    status: "verified",
    verifiedBy: "นางสาวมณีรัตน์ บุคลากรเลิศ",
    verifiedAt: "2026-09-28T16:00:00Z"
  },
  {
    id: "mrep-EMP-2569-004-2026-09",
    period: "2026-09",
    fiscalYear: 2568,
    employeeId: "EMP-2569-004",
    staffName: "นางสาวศิริพร เงินคลัง",
    department: "งานการเงินและพัสดุ",
    position: "นักวิชาการเงินและบัญชี",
    expectedWorkDays: 21,
    actualWorkDays: 21,
    lateDaysCount: 0,
    lateTotalMinutes: 0,
    earlyLeaveDaysCount: 0,
    leaveDaysCount: 0,
    officialDutyDaysCount: 0,
    absentDaysCount: 0,
    incompleteDaysCount: 0,
    status: "verified",
    verifiedBy: "นางสาวมณีรัตน์ บุคลากรเลิศ",
    verifiedAt: "2026-09-28T16:00:00Z"
  }
];

export const MOCK_ATTENDANCE_PERIOD_LOCKS: AttendancePeriodLock[] = [
  {
    id: "lock-2026-08",
    period: "2026-08",
    isLocked: true,
    lockedBy: "u-admin",
    lockedByName: "นายสมเกียรติ วงศ์สารบรรณ",
    lockedAt: "2026-08-31T17:00:00Z"
  },
  {
    id: "lock-2026-09",
    period: "2026-09",
    isLocked: false,
    lockedBy: "",
    lockedByName: "",
    lockedAt: ""
  }
];


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
  EmploymentContract
} from "./types";

export const MOCK_USERS: UserProfile[] = [
  {
    id: "u-admin",
    name: "นายสมเกียรติ วงศ์สารบรรณ",
    role: "admin",
    roleTitle: "แอดมิน / เจ้าหน้าที่ธุรการและสารบรรณ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    email: "admin.saraban@cpru.ac.th",
    status: "active",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-dean",
    name: "ผศ.ดร.สานนท์ ด่านภักดี",
    role: "dean",
    roleTitle: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    department: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    email: "dean.las@cpru.ac.th",
    status: "active",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-lecturer",
    name: "อ.ฤทธิชัย ภาระวิเศษ",
    role: "lecturer",
    roleTitle: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    email: "ritthichai.p@cpru.ac.th",
    status: "active",
    createdAt: "2026-09-28T00:00:00Z"
  },
  {
    id: "u-gov",
    name: "นางสาวศิริพร เงินคลัง",
    role: "staff_finance",
    roleTitle: "เจ้าหน้าที่งานการเงินและงบประมาณ",
    department: "งานการเงินและพัสดุ",
    email: "finance@cpru.ac.th",
    status: "active",
    createdAt: "2026-09-28T00:00:00Z"
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

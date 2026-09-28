import { 
  InboundDocument, 
  OutboundDocument, 
  ProjectProposal, 
  LoanContract, 
  PurchaseRequisition, 
  LeaveRequest, 
  UserProfile, 
  RoomBooking,
  BudgetLedgerItem
} from "./types";

export const MOCK_USERS: UserProfile[] = [
  {
    id: "u-admin",
    name: "นายสมเกียรติ วงศ์สารบรรณ",
    role: "admin",
    roleTitle: "แอดมิน / เจ้าหน้าที่ธุรการและสารบรรณ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
    email: "admin.saraban@cpru.ac.th",
  },
  {
    id: "u-dean",
    name: "ผศ.ดร. นฤมล อนันตโชค",
    role: "dean",
    roleTitle: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    department: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    email: "dean.las@cpru.ac.th",
  },
  {
    id: "u-lecturer",
    name: "อ.ฤทธิชัย ภาระวิเศษ",
    role: "lecturer",
    roleTitle: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
    email: "ritthichai.p@cpru.ac.th",
  },
  {
    id: "u-gov",
    name: "นางสาวศิริพร เงินคลัง",
    role: "gov_officer",
    roleTitle: "พนักงานราชการ (งานการเงินและพัสดุ)",
    department: "งานการเงินและพัสดุ",
    email: "finance@cpru.ac.th",
  }
];

export const MOCK_INBOUND_DOCS: InboundDocument[] = [
  {
    id: "in-001",
    docNumber: "อว 0604/ว 114",
    receiveNumber: "042/2569",
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
    receiveNumber: "043/2569",
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
    receiveNumber: "044/2569",
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
    receiveNumber: "045/2569",
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
    docNumber: "อว 0604.05/0112",
    sendDate: "2026-09-28",
    title: "ขอเชิญเป็นวิทยากรโครงการ Startup Creator สร้างนวัตกรท่องเที่ยวรุ่นใหม่",
    recipient: "ผู้อำนวยการสำนักงานการท่องเที่ยวและกีฬาจังหวัดชัยภูมิ",
    category: "หนังสือภายนอก",
    signatory: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    status: "signed",
    createdAt: "2026-09-28T10:00:00Z"
  },
  {
    id: "out-002",
    docNumber: "อว 0604.05/0113",
    sendDate: "2026-09-27",
    title: "ส่งรายงานผลการดำเนินโครงการยกระดับเศรษฐกิจฐานรากบนหลักปรัชญาเศรษฐกิจพอเพียง",
    recipient: "อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ",
    category: "หนังสือภายใน",
    signatory: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    status: "signed",
    createdAt: "2026-09-27T15:30:00Z"
  }
];

export const MOCK_PROJECTS: ProjectProposal[] = [
  {
    id: "proj-01",
    code: "69-STRAT-001",
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
    endDate: "2027-03-31"
  },
  {
    id: "proj-02",
    code: "69-STRAT-002",
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
    endDate: "2027-04-30"
  },
  {
    id: "proj-03",
    code: "69-STRAT-003",
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
    endDate: "2026-08-30"
  }
];

export const MOCK_LOANS: LoanContract[] = [
  {
    id: "loan-001",
    contractNumber: "ยม. 018/2569",
    borrowerName: "อ.ฤทธิชัย ภาระวิเศษ",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    purpose: "โครงการติดอาวุธเพื่อเตรียมความพร้อมสำหรับการเข้าสู่ระบบราชการกลุ่มวิชาทางรัฐศาสตร์",
    amount: 35000,
    borrowDate: "2026-09-15",
    settleDueDate: "2026-10-15",
    status: "active",
    checklist: {
      hasContract: true,
      hasMemo: true,
      hasApprovedProject: true,
      hasEstimate: true
    }
  },
  {
    id: "loan-002",
    contractNumber: "ยม. 019/2569",
    borrowerName: "ผศ.ดร. นฤมล อนันตโชค",
    position: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    purpose: "โครงการอบรมเชิงปฏิบัติการ Startup Creator สร้างนวัตกรท่องเที่ยวรุ่นใหม่",
    amount: 50000,
    borrowDate: "2026-09-20",
    settleDueDate: "2026-10-20",
    status: "active",
    checklist: {
      hasContract: true,
      hasMemo: true,
      hasApprovedProject: true,
      hasEstimate: true
    }
  }
];

export const MOCK_BUDGET_ITEMS: BudgetLedgerItem[] = [
  {
    id: "bg-01",
    category: "งบดำเนินงาน",
    subCategory: "ค่าตอบแทนใช้สอยและวัสดุ (โครงการคณะ)",
    allocatedAmount: 1500000,
    committedAmount: 450000,
    disbursedAmount: 620000,
    remainingAmount: 430000,
    department: "คณะศิลปศาสตร์และวิทยาศาสตร์ (ส่วนกลาง)"
  },
  {
    id: "bg-02",
    category: "งบยุทธศาสตร์ มรภ.",
    subCategory: "โครงการศาสตร์พระราชาเพื่อพัฒนาท้องถิ่น",
    allocatedAmount: 2000000,
    committedAmount: 850000,
    disbursedAmount: 780000,
    remainingAmount: 370000,
    department: "ทุกสาขาวิชา"
  },
  {
    id: "bg-03",
    category: "งบรายได้จัดการศึกษา",
    subCategory: "ค่าตอบแทนการสอนภาคพิเศษ (กศ.ปช.)",
    allocatedAmount: 800000,
    committedAmount: 240000,
    disbursedAmount: 310000,
    remainingAmount: 250000,
    department: "งานบริการวิชาการ"
  }
];

export const MOCK_PURCHASE_REQ: PurchaseRequisition[] = [
  {
    id: "pr-001",
    prNumber: "พด. 014/2569",
    projectName: "โครงการพัฒนาทักษะทางวิชาชีพ สาขาวิชาบริหารธุรกิจ",
    requesterName: "อ.ฤทธิชัย ภาระวิเศษ",
    department: "สาขาวิชาบริหารธุรกิจ",
    requestDate: "2026-09-22",
    budgetSource: "งบประมาณรายได้คณะ ประจำปี 2569",
    totalAmountBeforeTax: 18500,
    vatAmount: 1295,
    netTotalAmount: 19795,
    status: "procurement_processing",
    items: [
      { itemNumber: 1, description: "กระดาษ A4 80 แกรม (Double A)", quantity: 20, unit: "รีม", unitPrice: 145, totalPrice: 2900 },
      { itemNumber: 2, description: "หมึกพิมพ์เลเซอร์ HP LaserJet MFP", quantity: 2, unit: "กล่อง", unitPrice: 3800, totalPrice: 7600 },
      { itemNumber: 3, description: "แฟ้มเสนอเซ็นและเครื่องเขียนจัดอบรม", quantity: 40, unit: "ชุด", unitPrice: 200, totalPrice: 8000 }
    ]
  }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "lv-001",
    staffName: "อ.ฤทธิชัย ภาระวิเศษ",
    position: "อาจารย์ประจำสาขาวิชารัฐศาสตร์",
    department: "สาขาวิชารัฐศาสตร์",
    leaveType: "vacation",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    totalDays: 3,
    reason: "ลาพักผ่อนประจำปี",
    substitutePerson: "อ.สมบัติ วิชาการ",
    contactAddress: "123 ม.2 ต.ในเมือง อ.เมือง จ.ชัยภูมิ โทร 081-xxxxxxx",
    status: "approved",
    createdAt: "2026-09-25"
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
    status: "approved"
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
    status: "approved"
  }
];

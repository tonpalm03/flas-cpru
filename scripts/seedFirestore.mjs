// Seed initial data to Firebase Firestore so all collections appear in Firebase Console
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRa6Tby0WK_oPqUxU2CnzdLAbeJ1quZpk",
  authDomain: "flas-cpru.firebaseapp.com",
  projectId: "flas-cpru",
  storageBucket: "flas-cpru.firebasestorage.app",
  messagingSenderId: "721439868539",
  appId: "1:721439868539:web:87f3375dc3589539d484de"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  console.log("Seeding initial structure to Firebase Firestore...");

  // 1. Templates (Admin default template settings)
  await setDoc(doc(db, "templates", "faculty_default_config"), {
    facultyName: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    universityName: "มหาวิทยาลัยราชภัฏชัยภูมิ",
    deanName: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
    deanPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    docPrefix: "อว 0643.04/",
    defaultVatRate: 7,
    withholdingTaxRate: 1,
    updatedAt: serverTimestamp()
  });
  console.log("+ Seeded 'templates'");

  // 2. Admin Inbound Documents (หนังสือรับ)
  await setDoc(doc(db, "admin_documents_in", "in_doc_sample_01"), {
    receiveNumber: "รับ 001/2568",
    docNumber: "อว 0643/ว 123",
    title: "ขอเชิญประชุมคณะกรรมการบริหารมหาวิทยาลัย ครั้งที่ 1/2568",
    sender: "กองกลาง สำนักงานอธิการบดี",
    date: "2026-09-28",
    status: "เสร็จสิ้น",
    priority: "ด่วนที่สุด",
    assignedDept: "สำนักงานคณบดี",
    actionNote: "แจ้งผู้บริหารเข้าร่วมประชุม",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'admin_documents_in'");

  // 3. Admin Outbound Documents (หนังสือส่ง)
  await setDoc(doc(db, "admin_documents_out", "out_doc_sample_01"), {
    docNumber: "อว 0643.04/001",
    title: "ส่งรายงานผลการดำเนินงานโครงการยกระดับเศรษฐกิจชุมชน",
    recipient: "อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ",
    date: "2026-09-28",
    signatory: "ผศ.ดร.สานนท์ ด่านภักดี (คณบดี)",
    status: "ส่งแล้ว",
    urgency: "ปกติ",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'admin_documents_out'");

  // 4. Memos (บันทึกข้อความ)
  await setDoc(doc(db, "memos", "memo_sample_01"), {
    docNumber: "อว 0643.04/บข 012",
    date: "2026-09-28",
    subject: "ขออนุมัติจัดโครงการอบรมเชิงปฏิบัติการพัฒนาทักษะดิจิทัลสำหรับนักศึกษา",
    department: "สาขาวิชารัฐประศาสนศาสตร์",
    proposer: "อาจารย์ ดร. นฤมล เกียรติสกุล",
    status: "อนุมัติแล้ว",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'memos'");

  // 5. Projects (โครงการยุทธศาสตร์)
  await setDoc(doc(db, "projects", "proj_sample_01"), {
    title: "โครงการพัฒนาทักษะวิชาชีพและภาษาต่างประเทศเพื่อการทำงานในศตวรรษที่ 21",
    code: "PROJ-68-001",
    category: "โครงการยุทธศาสตร์มหาวิทยาลัย",
    budget: 150000,
    leader: "ผศ. ประเสริฐ ชัยภูมิ",
    department: "สาขาวิชาภาษาอังกฤษธุรกิจ",
    status: "กำลังดำเนินการ",
    sdgGoal: "SDG 4 - การศึกษาที่มีคุณภาพ",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'projects'");

  // 6. Procurement (พัสดุ - ใบขอซื้อขอจ้าง)
  await setDoc(doc(db, "procurement", "pr_sample_01"), {
    prNumber: "PR-68/001",
    title: "ขอซื้อวัสดุสำนักงานและกระดาษสำหรับงานบริการการศึกษา ประจำภาคเรียนที่ 1/2568",
    requestDate: "2026-09-28",
    requestedBy: "นางสาวสมหญิง ใจดี",
    department: "งานธุรการและสารบรรณ",
    totalAmount: 18500,
    vatAmount: 1295,
    grandTotal: 19795,
    status: "รอตรวจรับ",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'procurement'");

  // 7. Finance Loans (การเงิน - สัญญายืมเงินทดรองจ่าย)
  await setDoc(doc(db, "finance_loans", "loan_sample_01"), {
    contractNumber: "ยืม 01/2568",
    borrowerName: "อาจารย์ วิชัย ศรีเจริญ",
    department: "สาขาวิชานิติศาสตร์",
    purpose: "ยืมเงินทดรองจ่ายสำหรับจัดโครงการสัมมนากฎหมายสู่ชุมชน",
    amount: 25000,
    loanDate: "2026-09-28",
    dueDate: "2026-10-28",
    status: "อนุมัติและจ่ายเงินแล้ว",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'finance_loans'");

  // 8. HR Leaves (การลา)
  await setDoc(doc(db, "hr_leaves", "leave_sample_01"), {
    applicantName: "นายสมเกียรติ วงศ์สารบรรณ",
    position: "เจ้าหน้าที่ธุรการชำนาญงาน",
    leaveType: "ลาพักผ่อน",
    startDate: "2026-10-05",
    endDate: "2026-10-06",
    totalDays: 2,
    reason: "ทำภารกิจส่วนตัว",
    status: "อนุมัติแล้ว",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'hr_leaves'");

  // 9. Rooms & Vehicles (การจองห้องประชุมและยานพาหนะ)
  await setDoc(doc(db, "rooms", "room_sample_01"), {
    roomName: "ห้องประชุมสารบรรณ 1 (อาคาร 4 ชั้น 2)",
    bookedBy: "งานธุรการและสารบรรณ",
    title: "ประชุมคณะกรรมการประจำคณะศิลปศาสตร์และวิทยาศาสตร์",
    date: "2026-09-29",
    startTime: "09:00",
    endTime: "12:00",
    status: "อนุมัติแล้ว",
    createdAt: serverTimestamp()
  });
  console.log("+ Seeded 'rooms'");

  console.log("All collections seeded successfully to Firebase Firestore!");
}

seedData().then(() => process.exit(0)).catch(err => {
  console.error("Error seeding:", err);
  process.exit(1);
});

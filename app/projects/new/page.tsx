"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FolderKanban, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft, 
  Save, 
  Calendar, 
  Building, 
  User, 
  Layers, 
  DollarSign, 
  Target, 
  FileText,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { createProject } from "@/lib/firebaseService";
import { ProjectBudgetItem, ProjectActivityItem, ProjectProposal } from "@/lib/types";
import { exportProjectToWord, printDocumentView } from "@/lib/documentGenerator";

const SDG_LIST = [
  { id: 1, name: "SDG 1: ขจัดความยากจน" },
  { id: 2, name: "SDG 2: ขจัดความหิวโหย" },
  { id: 3, name: "SDG 3: สุขภาพและความเป็นอยู่ที่ดี" },
  { id: 4, name: "SDG 4: การศึกษาที่มีคุณภาพ" },
  { id: 5, name: "SDG 5: ความเท่าเทียมทางเพศ" },
  { id: 6, name: "SDG 6: น้ำสะอาดและสุขอนามัย" },
  { id: 7, name: "SDG 7: พลังงานสะอาดที่เข้าถึงได้" },
  { id: 8, name: "SDG 8: งานที่มีคุณค่าและการเติบโตทางเศรษฐกิจ" },
  { id: 9, name: "SDG 9: อุตสาหกรรม นวัตกรรม และโครงสร้างพื้นฐาน" },
  { id: 10, name: "SDG 10: ลดความเหลื่อมล้ำ" },
  { id: 11, name: "SDG 11: เมืองและชุมชนที่ยั่งยืน" },
  { id: 12, name: "SDG 12: การบริโภคและการผลิตที่ยั่งยืน" },
  { id: 13, name: "SDG 13: การรับมือการเปลี่ยนแปลงสภาพภูมิอากาศ" },
  { id: 14, name: "SDG 14: ทรัพยากรทางทะเลและมหาสมุทร" },
  { id: 15, name: "SDG 15: ทรัพยากรบนบกและระบบนิเวศ" },
  { id: 16, name: "SDG 16: สังคมสงบสุข ยุติธรรม และสถาบันเข้มแข็ง" },
  { id: 17, name: "SDG 17: ความร่วมมือเพื่อการพัฒนาที่ยั่งยืน" },
];

export default function NewProjectProposalPage() {
  const router = useRouter();
  const { currentUser } = useRole();
  const [submitting, setSubmitting] = useState(false);
  const [savedProject, setSavedProject] = useState<ProjectProposal | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [projectType, setProjectType] = useState<ProjectProposal["projectType"]>("faculty_strategy");
  const [planType, setPlanType] = useState<ProjectProposal["planType"]>("in_plan");
  const [fiscalYear, setFiscalYear] = useState<number>(2569);
  const [academicYear, setAcademicYear] = useState<number>(2568);
  const [title, setTitle] = useState("โครงการพัฒนาทักษะวิชาชีพและการประยุกต์ใช้ AI เพื่อการตัดสินใจเชิงนโยบาย");
  const [strategicGoal, setStrategicGoal] = useState("ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต");
  const [department, setDepartment] = useState(currentUser?.department || "สาขาวิชารัฐศาสตร์และรัฐประศาสนศาสตร์");
  const [leader, setLeader] = useState(currentUser?.name || "อ.ฤทธิชัย ภาระวิเศษ");
  const [teamMembersInput, setTeamMembersInput] = useState("ดร.สมชาย นักวิจัย, ผศ.ดร.วิภาวรรณ วิชาการ");
  const [budgetSource, setBudgetSource] = useState<ProjectProposal["budgetSource"]>("national_budget");

  const [rationale, setRationale] = useState(
    "ในปัจจุบันเทคโนโลยีปัญญาประดิษฐ์ (AI) เข้ามามีบทบาทสำคัญในการบริหารงานภาครัฐและการตัดสินใจเชิงนโยบาย คณะศิลปศาสตร์และวิทยาศาสตร์จึงเห็นควรจัดโครงการนี้เพื่อเสริมสร้างทักษะทางเทคโนโลยีดิจิทัลขั้นสูงให้กับคณาจารย์และนักศึกษา เพื่อตอบสนองต่อการพัฒนาท้องถิ่นและเป้าหมายยุทธศาสตร์ของมหาวิทยาลัยราชภัฏชัยภูมิ"
  );
  
  const [objectives, setObjectives] = useState<string[]>([
    "เพื่อเสริมสร้างทักษะความรู้ด้านการประยุกต์ใช้เทคโนโลยี AI ในการตัดสินใจเชิงนโยบายและการวิเคราะห์ข้อมูล",
    "เพื่อพัฒนานวัตกรรมต้นแบบและชิ้นงานนโยบายจำลองที่ตอบสนองต่อโจทย์การพัฒนาชุมชนท้องถิ่น",
    "เพื่อสร้างเครือข่ายความร่วมมือทางวิชาการระหว่างมหาวิทยาลัยกับหน่วยงานภาครัฐและเอกชน"
  ]);
  const [newObjective, setNewObjective] = useState("");

  const [targetGroup, setTargetGroup] = useState("นักศึกษาชั้นปีที่ 3-4 สาขาวิชารัฐศาสตร์ และคณาจารย์ จำนวน 60 คน");
  const [location, setLocation] = useState("ห้อง Smart Classroom 421 อาคาร 4 คณะศิลปศาสตร์และวิทยาศาสตร์ มรภ.ชัยภูมิ");
  const [startDate, setStartDate] = useState("2026-11-15");
  const [endDate, setEndDate] = useState("2026-11-16");

  // Activities Table
  const [activities, setActivities] = useState<ProjectActivityItem[]>([
    {
      id: "act-1",
      name: "กิจกรรมที่ 1: การบรรยายเชิงปฏิบัติการ 'AI for Policy Analysis and Decision Making'",
      quarter: 1,
      targetGroup: "นักศึกษาและอาจารย์ 60 คน",
      participantCount: 60,
      location: "ห้อง Smart Classroom 421",
      startDate: "2026-11-15",
      endDate: "2026-11-15",
      budget: 35000,
      responsiblePerson: "อ.ฤทธิชัย ภาระวิเศษ"
    },
    {
      id: "act-2",
      name: "กิจกรรมที่ 2: การประกวดและนำเสนอชิ้นงานนโยบายจำลอง (Policy Hackathon Showcase)",
      quarter: 1,
      targetGroup: "นักศึกษา 10 ทีม (50 คน)",
      participantCount: 50,
      location: "หอประชุมใหญ่ อาคารเฉลิมพระเกียรติ",
      startDate: "2026-11-16",
      endDate: "2026-11-16",
      budget: 50000,
      responsiblePerson: "ดร.สมชาย นักวิจัย"
    }
  ]);

  const [newActName, setNewActName] = useState("");
  const [newActQuarter, setNewActQuarter] = useState<number>(1);
  const [newActTarget, setNewActTarget] = useState("");
  const [newActLocation, setNewActLocation] = useState("");
  const [newActBudget, setNewActBudget] = useState<number>(0);

  // Budget Breakdown (3 Categories)
  const [budgetItems, setBudgetItems] = useState<ProjectBudgetItem[]>([
    {
      id: "b-1",
      category: "compensation",
      description: "ค่าตอบแทนวิทยากรผู้ทรงคุณวุฒิภายนอก (6 ชม. x 1,000 บาท x 2 ท่าน)",
      amount: 12000
    },
    {
      id: "b-2",
      category: "operating",
      description: "ค่าอาหารกลางวันและอาหารว่างเครื่องดื่มสำหรับผู้เข้าร่วม 60 คน (2 วัน)",
      amount: 45000
    },
    {
      id: "b-3",
      category: "operating",
      description: "ค่าเช่าระบบและเครื่องมือ Cloud AI สำหรับฝึกอบรมปฏิบัติการ",
      amount: 15000
    },
    {
      id: "b-4",
      category: "material",
      description: "ค่าวัสดุเอกสารประกอบการอบรม ป้ายไวนิล และเกียรติบัตร",
      amount: 13000
    }
  ]);

  const [newBudgetItemCat, setNewBudgetItemCat] = useState<ProjectBudgetItem["category"]>("compensation");
  const [newBudgetItemDesc, setNewBudgetItemDesc] = useState("");
  const [newBudgetItemAmount, setNewBudgetItemAmount] = useState<number>(0);

  // Total budget calculated automatically
  const calculatedTotalBudget = budgetItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const [manualBudget, setManualBudget] = useState<number | null>(null);
  const totalBudget = manualBudget !== null ? manualBudget : calculatedTotalBudget;

  // KPIs
  const [kpis, setKpis] = useState<string[]>([
    "ร้อยละของผู้เข้าร่วมโครงการมีความรู้ความเข้าใจเพิ่มขึ้นหลังการอบรม (ไม่น้อยกว่าร้อยละ 85)",
    "จำนวนผลงานชิ้นงาน/นโยบายจำลองต้นแบบที่ประยุกต์ใช้ AI (ไม่น้อยกว่า 5 ชิ้นงาน)",
    "ระดับความพึงพอใจโดยรวมของผู้เข้าร่วมโครงการ (ไม่น้อยกว่า 4.50 จาก 5.00)"
  ]);
  const [newKpi, setNewKpi] = useState("");

  // SDG Goals
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([4, 8, 9]);

  // Expected Outcomes & Evaluation
  const [outcomes, setOutcomes] = useState(
    "1. นักศึกษาและคณาจารย์มีทักษะการใช้ปัญญาประดิษฐ์ในการประมวลผลข้อมูลและวิเคราะห์นโยบายอย่างมีจริยธรรม\n2. ได้โมเดลและนโยบายจำลองที่สามารถส่งต่อให้องค์กรปกครองส่วนท้องถิ่นในจังหวัดชัยภูมินำไปใช้ประโยชน์\n3. เสริมสร้างความเข้มแข็งทางวิชาการและชื่อเสียงของคณะศิลปศาสตร์และวิทยาศาสตร์"
  );
  const [evaluationPlan, setEvaluationPlan] = useState(
    "ประเมินผลผ่านแบบทดสอบก่อน-หลังการอบรม (Pre-test / Post-test), แบบประเมินความพึงพอใจออนไลน์, และการประเมินคุณภาพผลงานโดยคณะกรรมการผู้ทรงคุณวุฒิ"
  );

  // Handlers
  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (idx: number) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  const handleAddActivity = () => {
    if (!newActName.trim()) return;
    const item: ProjectActivityItem = {
      id: `act-${Date.now()}`,
      name: newActName.trim(),
      quarter: newActQuarter,
      targetGroup: newActTarget.trim() || targetGroup,
      participantCount: 50,
      location: newActLocation.trim() || location,
      startDate: startDate,
      endDate: endDate,
      budget: Number(newActBudget) || 0
    };
    setActivities([...activities, item]);
    setNewActName("");
    setNewActTarget("");
    setNewActLocation("");
    setNewActBudget(0);
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const handleAddBudgetItem = () => {
    if (!newBudgetItemDesc.trim() || newBudgetItemAmount <= 0) return;
    const item: ProjectBudgetItem = {
      id: `b-${Date.now()}`,
      category: newBudgetItemCat,
      description: newBudgetItemDesc.trim(),
      amount: Number(newBudgetItemAmount)
    };
    setBudgetItems([...budgetItems, item]);
    setNewBudgetItemDesc("");
    setNewBudgetItemAmount(0);
  };

  const handleRemoveBudgetItem = (id: string) => {
    setBudgetItems(budgetItems.filter(b => b.id !== id));
  };

  const handleAddKpi = () => {
    if (newKpi.trim()) {
      setKpis([...kpis, newKpi.trim()]);
      setNewKpi("");
    }
  };

  const handleRemoveKpi = (idx: number) => {
    setKpis(kpis.filter((_, i) => i !== idx));
  };

  const toggleSdg = (id: number) => {
    if (selectedSdgs.includes(id)) {
      setSelectedSdgs(selectedSdgs.filter(s => s !== id));
    } else {
      setSelectedSdgs([...selectedSdgs, id].sort((a, b) => a - b));
    }
  };

  const constructPayload = (): Omit<ProjectProposal, "id" | "createdAt" | "code"> => {
    return {
      projectType,
      planType,
      fiscalYear,
      academicYear,
      title: title.trim(),
      strategicGoal: strategicGoal.trim(),
      department: department.trim(),
      leader: leader.trim(),
      teamMembers: teamMembersInput.split(",").map(t => t.trim()).filter(Boolean),
      budgetApproved: totalBudget,
      budgetUsed: 0,
      budgetSource,
      budgetItems,
      activities,
      status: "draft",
      sdgGoals: selectedSdgs,
      kpis,
      objectives,
      rationale: rationale.trim(),
      targetGroup: targetGroup.trim(),
      location: location.trim(),
      startDate,
      endDate,
      outcomes: outcomes.trim(),
      evaluationPlan: evaluationPlan.trim()
    };
  };

  const handleExportWord = async () => {
    const payload = constructPayload();
    await exportProjectToWord(payload);
  };

  const handleSaveToFirestore = async () => {
    if (!title.trim() || !leader.trim() || !department.trim()) {
      setErrorMsg("กรุณากรอกชื่อโครงการ, หัวหน้าโครงการ และสาขาวิชาให้ครบถ้วน");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const payload = constructPayload();
      const created = await createProject(payload, currentUser);
      setSavedProject(created);
    } catch (err: any) {
      console.error("Save project error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกโครงการ: " + (err.message || "โปรดลองใหม่อีกครั้ง"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/projects" className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมโครงการ
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              แบบเสนอโครงการประจำปีงบประมาณ พ.ศ. {fiscalYear}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
              แบบฟอร์ม มรภ.ชัยภูมิ 2569
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            กรอกรายละเอียดโครงการ จัดสรรงบประมาณ 3 หมวด กำหนดกิจกรรมย่อย และเป้าหมาย SDG
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveToFirestore}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "กำลังบันทึก..." : "บันทึกโครงการเข้าระบบ"}</span>
          </button>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {savedProject && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                บันทึกข้อเสนอโครงการสำเร็จเรียบร้อย!
              </p>
              <p className="text-xs text-emerald-700">
                รหัสโครงการที่ได้รับ: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">{savedProject.code}</span> — บันทึกเข้าระบบฐานข้อมูลกลางแล้ว
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportWord}
              className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-lg hover:bg-emerald-100/50"
            >
              ดาวน์โหลด Word
            </button>
            <Link
              href="/projects"
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg"
            >
              ไปที่รายการโครงการ
            </Link>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-8 text-xs text-slate-800">
        
        {/* Section 1: Classification & General Info */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" />
              1. ข้อมูลทั่วไปและการจัดประเภทโครงการ
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 1 จาก 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ประเภทโครงการ</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:border-blue-900 focus:outline-none font-medium"
              >
                <option value="faculty_strategy">โครงการยุทธศาสตร์คณะ (Faculty Strategy)</option>
                <option value="kings_philosophy">โครงการตามยุทธศาสตร์เพื่อการพัฒนาท้องถิ่น (ศาสตร์พระราชา)</option>
                <option value="department_focus">โครงการจุดเน้นตามอัตลักษณ์สาขาวิชา</option>
                <option value="academic_service">โครงการบริการวิชาการแก่สังคม</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ลักษณะแผนงาน</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:border-blue-900 focus:outline-none"
              >
                <option value="in_plan">โครงการตามแผนปฏิบัติราชการประจำปี</option>
                <option value="out_of_plan">โครงการนอกแผน / โครงการเร่งด่วน</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ปีงบประมาณ / ปีการศึกษา</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  placeholder="ปีงบประมาณ"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-bold text-center focus:border-blue-900 focus:outline-none"
                />
                <input
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(Number(e.target.value))}
                  placeholder="ปีการศึกษา"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-center focus:border-blue-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อโครงการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ระบุชื่อโครงการให้ชัดเจน สื่อถึงเป้าหมายและผลลัพธ์..."
                className="w-full border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">ความสอดคล้องกับประเด็นยุทธศาสตร์</label>
              <select
                value={strategicGoal}
                onChange={(e) => setStrategicGoal(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              >
                <option value="โครงการตามยุทธศาสตร์เพื่อการพัฒนาท้องถิ่น (ศาสตร์พระราชา)">
                  โครงการตามยุทธศาสตร์เพื่อการพัฒนาท้องถิ่น (ศาสตร์พระราชา)
                </option>
                <option value="ประเด็นยุทธศาสตร์ที่ 1 : การพัฒนาท้องถิ่นและชุมชนเข้มแข็ง">
                  ประเด็นยุทธศาสตร์ที่ 1 : การพัฒนาท้องถิ่นและชุมชนเข้มแข็ง
                </option>
                <option value="ประเด็นยุทธศาสตร์ที่ 2 : การผลิตและพัฒนาครูและบุคลากรทางการศึกษา">
                  ประเด็นยุทธศาสตร์ที่ 2 : การผลิตและพัฒนาครูและบุคลากรทางการศึกษา
                </option>
                <option value="ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต">
                  ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต
                </option>
                <option value="ประเด็นยุทธศาสตร์ที่ 4 : การพัฒนาระบบบริหารจัดการองค์กรสู่ความทันสมัย">
                  ประเด็นยุทธศาสตร์ที่ 4 : การพัฒนาระบบบริหารจัดการองค์กรสู่ความทันสมัย
                </option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">แหล่งงบประมาณ</label>
              <select
                value={budgetSource}
                onChange={(e) => setBudgetSource(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              >
                <option value="national_budget">งบประมาณแผ่นดิน (งบยุทธศาสตร์)</option>
                <option value="faculty_revenue">งบประมาณเงินรายได้คณะ</option>
                <option value="external">งบประมาณสนับสนุนจากภายนอก</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา / หน่วยงานที่รับผิดชอบ</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ผู้รับผิดชอบโครงการ (หัวหน้าโครงการ)</label>
              <input
                type="text"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ผู้ร่วมรับผิดชอบโครงการ (คั่นด้วยเครื่องหมายจุลภาค ,)</label>
              <input
                type="text"
                value={teamMembersInput}
                onChange={(e) => setTeamMembersInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Rationale & Objectives */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-900" />
              2. หลักการ เหตุผล และวัตถุประสงค์โครงการ
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 2 จาก 5</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">หลักการและเหตุผล (Rationale)</label>
            <textarea
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="ระบุที่มา ความจำเป็น ปัญหา และสภาพบริบทที่ทำให้ต้องดำเนินโครงการนี้..."
              className="w-full border border-slate-200 rounded-lg p-3 focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              วัตถุประสงค์ของโครงการ (Objectives)
            </label>
            <div className="space-y-2 mb-3">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-medium text-slate-800">{idx + 1}. {obj}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="พิมพ์วัตถุประสงค์ข้อใหม่..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddObjective())}
                className="flex-1 border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddObjective}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มวัตถุประสงค์</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">กลุ่มเป้าหมายและจำนวนผู้เข้าร่วม</label>
              <input
                type="text"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                placeholder="เช่น นักศึกษา 50 คน, ประชาชน 20 คน"
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">สถานที่ดำเนินการ</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ระบุสถานที่จัดกิจกรรม ห้องปฏิบัติการ หรือชุมชนเป้าหมาย"
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">วันที่เริ่มต้นโครงการ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">วันที่สิ้นสุดโครงการ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Activities & Milestones Table */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-900" />
              3. แผนการดำเนินงานและกิจกรรมย่อย (Activities Plan)
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 3 จาก 5</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-2.5 text-center w-12">ลำดับ</th>
                  <th className="p-2.5">กิจกรรม / ขั้นตอนดำเนินงาน</th>
                  <th className="p-2.5 text-center w-24">ไตรมาส</th>
                  <th className="p-2.5">กลุ่มเป้าหมาย / สถานที่</th>
                  <th className="p-2.5 text-right w-28">งบประมาณ (บาท)</th>
                  <th className="p-2.5 text-center w-12">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act, idx) => (
                  <tr key={act.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-slate-900">{act.name}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold text-[11px]">
                        ไตรมาส {act.quarter}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{act.targetGroup} ({act.location})</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">
                      {act.budget.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(act.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Activity Controls */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
            <p className="font-bold text-slate-800 text-[11px]">+ เพิ่มกิจกรรมย่อยในโครงการ</p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="ชื่อกิจกรรมย่อย..."
                  value={newActName}
                  onChange={(e) => setNewActName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <select
                  value={newActQuarter}
                  onChange={(e) => setNewActQuarter(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                >
                  <option value={1}>ไตรมาส 1 (ต.ค.-ธ.ค.)</option>
                  <option value={2}>ไตรมาส 2 (ม.ค.-มี.ค.)</option>
                  <option value={3}>ไตรมาส 3 (เม.ย.-มิ.ย.)</option>
                  <option value={4}>ไตรมาส 4 (ก.ค.-ก.ย.)</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="สถานที่/กลุ่มเป้าหมาย..."
                  value={newActLocation}
                  onChange={(e) => setNewActLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  placeholder="งบ (บาท)"
                  value={newActBudget || ""}
                  onChange={(e) => setNewActBudget(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-right focus:border-blue-900 focus:outline-none font-medium"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddActivity}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-subtle"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>บันทึกกิจกรรมลงตาราง</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Budget Breakdown 3 Categories */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-900" />
              4. รายละเอียดงบประมาณจำแนก 3 หมวด (Budget Breakdown)
            </h2>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-2">งบประมาณรวมทั้งสิ้น:</span>
              <span className="text-base font-extrabold text-blue-900 font-mono">
                {totalBudget.toLocaleString()} บาท
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-2.5 text-center w-12">ลำดับ</th>
                  <th className="p-2.5 w-32">หมวดรายจ่าย</th>
                  <th className="p-2.5">รายการ / รายละเอียดค่าใช้จ่าย</th>
                  <th className="p-2.5 text-right w-32">จำนวนเงิน (บาท)</th>
                  <th className="p-2.5 text-center w-12">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgetItems.map((item, idx) => {
                  const catLabel = item.category === "compensation" ? "1. ค่าตอบแทน" : item.category === "operating" ? "2. ค่าใช้สอย" : "3. ค่าวัสดุ";
                  const catBadgeColor = item.category === "compensation" ? "bg-amber-50 text-amber-900 border-amber-200" : item.category === "operating" ? "bg-blue-50 text-blue-900 border-blue-200" : "bg-emerald-50 text-emerald-900 border-emerald-200";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${catBadgeColor}`}>
                          {catLabel}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium text-slate-900">{item.description}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                        {item.amount.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBudgetItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <td colSpan={3} className="p-2.5 text-right">
                    รวมงบประมาณที่ขอรับจัดสรรทั้งสิ้น:
                  </td>
                  <td className="p-2.5 text-right font-mono text-sm text-blue-900">
                    {calculatedTotalBudget.toLocaleString()} บาท
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add Budget Item Controls */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
            <p className="font-bold text-slate-800 text-[11px]">+ เพิ่มรายการงบประมาณ</p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-3">
                <select
                  value={newBudgetItemCat}
                  onChange={(e) => setNewBudgetItemCat(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none font-medium"
                >
                  <option value="compensation">1. หมวดค่าตอบแทน</option>
                  <option value="operating">2. หมวดค่าใช้สอย</option>
                  <option value="material">3. หมวดค่าวัสดุ</option>
                </select>
              </div>
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="รายละเอียดรายการ (เช่น ค่าอาหารกลางวัน 50 คน x 2 มื้อ)..."
                  value={newBudgetItemDesc}
                  onChange={(e) => setNewBudgetItemDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:border-blue-900 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="number"
                  placeholder="จำนวนเงิน (บาท)"
                  value={newBudgetItemAmount || ""}
                  onChange={(e) => setNewBudgetItemAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-right focus:border-blue-900 focus:outline-none font-bold text-blue-900"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddBudgetItem}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-subtle"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการงบประมาณ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: KPIs, SDG & Outcomes */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-900" />
              5. ตัวชี้วัดความสำเร็จ (KPIs), เป้าหมาย SDG และผลลัพธ์
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ส่วนที่ 5 จาก 5</span>
          </div>

          {/* KPIs */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ตัวชี้วัดความสำเร็จของโครงการ (KPIs)
            </label>
            <div className="space-y-2 mb-3">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-medium text-slate-800">{idx + 1}. {kpi}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKpi(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="เพิ่มตัวชี้วัดความสำเร็จ (เช่น ร้อยละความพึงพอใจ, จำนวนผู้เข้าร่วม)..."
                value={newKpi}
                onChange={(e) => setNewKpi(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKpi())}
                className="flex-1 border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddKpi}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่ม KPI</span>
              </button>
            </div>
          </div>

          {/* SDG Goals Multi-Selector */}
          <div className="pt-2">
            <label className="block font-semibold text-slate-700 mb-2">
              เป้าหมายการพัฒนาที่ยั่งยืน (Sustainable Development Goals : SDG 1-17)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SDG_LIST.map((sdg) => {
                const isSelected = selectedSdgs.includes(sdg.id);
                return (
                  <button
                    key={sdg.id}
                    type="button"
                    onClick={() => toggleSdg(sdg.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{sdg.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expected Outcomes & Evaluation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ผลประโยชน์ที่คาดว่าจะได้รับ (Expected Outcomes)</label>
              <textarea
                rows={3}
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">แผนการประเมินผลและการติดตาม (Evaluation Plan)</label>
              <textarea
                rows={3}
                value={evaluationPlan}
                onChange={(e) => setEvaluationPlan(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-blue-900 focus:outline-none leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/projects"
            className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-600 text-xs w-full sm:w-auto text-center"
          >
            ยกเลิกและย้อนกลับ
          </Link>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportWord}
              className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Word (.docx)</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSaveToFirestore}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? "กำลังบันทึก..." : "บันทึกโครงการเข้าระบบ"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

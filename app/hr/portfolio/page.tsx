"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Download, 
  Printer, 
  Plus, 
  ArrowLeft, 
  GraduationCap, 
  Award, 
  BookOpen, 
  Briefcase, 
  Save, 
  Trash2, 
  FileCheck, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";
import { 
  FacultyPortfolio, 
  FacultyPortfolioDegree, 
  FacultyTeachingLoadItem, 
  FacultyResearchPublication, 
  FacultyAcademicService, 
  FacultySARRecord 
} from "@/lib/types";
import { 
  getFacultyPortfolios, 
  saveFacultyPortfolio 
} from "@/lib/firebaseService";
import { 
  exportFacultyPortfolioToWord, 
  printDocumentView 
} from "@/lib/documentGenerator";
import { useRole } from "@/components/RoleContext";

export default function FacultyPortfolioPage() {
  const { currentUser: user } = useRole();
  const [portfolios, setPortfolios] = useState<FacultyPortfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [activeSection, setActiveSection] = useState<"personal" | "degrees" | "teaching" | "research" | "services" | "sar">("personal");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Current active portfolio state
  const [currentPortfolio, setCurrentPortfolio] = useState<FacultyPortfolio>({
    id: "port-001",
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
    ]
  });

  // Load portfolios from Firebase
  useEffect(() => {
    async function load() {
      try {
        const list = await getFacultyPortfolios();
        setPortfolios(list);
        if (list.length > 0) {
          // If current user matches any, select it; else first
          const matched = list.find(p => p.userId === user?.id || p.fullName === user?.name) || list[0];
          setSelectedPortfolioId(matched.id);
          setCurrentPortfolio(matched);
        }
      } catch (e) {
        console.error("Failed to load faculty portfolios:", e);
      }
    }
    load();
  }, [user]);

  // Handle select faculty member
  const handleSelectFaculty = (id: string) => {
    setSelectedPortfolioId(id);
    const found = portfolios.find(p => p.id === id);
    if (found) {
      setCurrentPortfolio(found);
    }
  };

  // Save portfolio changes
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveFacultyPortfolio(currentPortfolio, user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  // Add items helpers
  const handleAddDegree = () => {
    const newDegree: FacultyPortfolioDegree = {
      level: "bachelor",
      degreeName: "",
      fieldOfStudy: "",
      institution: "มหาวิทยาลัยราชภัฏชัยภูมิ",
      yearGraduated: 2565
    };
    setCurrentPortfolio(prev => ({ ...prev, degrees: [...prev.degrees, newDegree] }));
  };

  const handleRemoveDegree = (index: number) => {
    setCurrentPortfolio(prev => ({
      ...prev,
      degrees: prev.degrees.filter((_, i) => i !== index)
    }));
  };

  const handleAddTeaching = () => {
    const newTeaching: FacultyTeachingLoadItem = {
      term: "1/2569",
      academicYear: 2569,
      courseCode: "",
      courseName: "",
      credits: "3(3-0-6)",
      hoursPerWeek: 3,
      program: "bachelor_regular"
    };
    setCurrentPortfolio(prev => ({ ...prev, currentTeachingLoad: [...prev.currentTeachingLoad, newTeaching] }));
  };

  const handleRemoveTeaching = (index: number) => {
    setCurrentPortfolio(prev => ({
      ...prev,
      currentTeachingLoad: prev.currentTeachingLoad.filter((_, i) => i !== index)
    }));
  };

  const handleAddResearch = () => {
    const newResearch: FacultyResearchPublication = {
      id: `res-${Date.now()}`,
      title: "",
      publicationYear: 2569,
      journalName: "",
      indexing: "TCI_1",
      authorRole: "first_author"
    };
    setCurrentPortfolio(prev => ({ ...prev, researchWorks: [...prev.researchWorks, newResearch] }));
  };

  const handleRemoveResearch = (index: number) => {
    setCurrentPortfolio(prev => ({
      ...prev,
      researchWorks: prev.researchWorks.filter((_, i) => i !== index)
    }));
  };

  const handleAddService = () => {
    const newService: FacultyAcademicService = {
      id: `srv-${Date.now()}`,
      title: "",
      role: "วิทยากร",
      organization: "หน่วยงานในจังหวัดชัยภูมิ",
      serviceDate: new Date().toISOString().split("T")[0],
      projectCategory: "local_development"
    };
    setCurrentPortfolio(prev => ({ ...prev, academicServices: [...prev.academicServices, newService] }));
  };

  const handleRemoveService = (index: number) => {
    setCurrentPortfolio(prev => ({
      ...prev,
      academicServices: prev.academicServices.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/hr" className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้าระบบงานบุคคลและการลา
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            แฟ้มประวัติและผลงานทางวิชาการ (Faculty Staff Portfolio & SAR)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกประวัติอาจารย์ วุฒิการศึกษา ภาระงานสอน ผลงานวิจัย บริการวิชาการ และรายงานประเมินตนเอง SAR
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Faculty Selector */}
          {portfolios.length > 0 && (
            <select
              value={selectedPortfolioId}
              onChange={(e) => handleSelectFaculty(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 shadow-subtle"
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>
                  {p.prefix || ""}{p.fullName} ({p.department})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={printDocumentView}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-subtle"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => exportFacultyPortfolioToWord(currentPortfolio)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word แฟ้มประวัติ / SAR</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle text-xs space-y-1">
            <div className="pb-3 mb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ข้อมูลอาจารย์
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {currentPortfolio.prefix || ""}{currentPortfolio.fullName}
              </p>
              <p className="text-slate-500 text-[11px]">{currentPortfolio.department}</p>
              <p className="text-slate-400 text-[10px] font-mono mt-0.5">รหัส: {currentPortfolio.employeeId}</p>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection("personal")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                activeSection === "personal" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>1. ข้อมูลส่วนบุคคล & ตำแหน่ง</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("degrees")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                activeSection === "degrees" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>2. ประวัติการศึกษา ({currentPortfolio.degrees.length})</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("teaching")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                activeSection === "teaching" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>3. ภาระงานสอน ({currentPortfolio.currentTeachingLoad.length})</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("research")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                activeSection === "research" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>4. วิจัยและบทความ ({currentPortfolio.researchWorks.length})</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("services")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                activeSection === "services" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>5. บริการวิชาการ ({currentPortfolio.academicServices.length})</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("sar")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                activeSection === "sar" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>6. รายงานประเมิน SAR ({currentPortfolio.sarRecords.length})</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</span>
            </button>
            {saveSuccess && (
              <div className="flex items-center justify-center gap-1 text-emerald-700 text-[11px] font-semibold mt-2">
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกข้อมูลเรียบร้อยแล้ว</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 1: PERSONAL */}
          {activeSection === "personal" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4 text-xs">
              <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-900" />
                <span>ข้อมูลประวัติส่วนบุคคลและตำแหน่งทางวิชาการ</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">คำนำหน้าชื่อ</label>
                  <input
                    type="text"
                    value={currentPortfolio.prefix || ""}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, prefix: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium"
                    placeholder="อาจารย์, ผศ.ดร., รศ."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ - สกุล</label>
                  <input
                    type="text"
                    value={currentPortfolio.fullName}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, fullName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสบุคลากร</label>
                  <input
                    type="text"
                    value={currentPortfolio.employeeId}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, employeeId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งทางวิชาการ</label>
                  <input
                    type="text"
                    value={currentPortfolio.academicRank}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, academicRank: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สังกัด / สาขาวิชา</label>
                  <input
                    type="text"
                    value={currentPortfolio.department}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, department: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทสัญญาปฏิบัติงาน</label>
                  <input
                    type="text"
                    value={currentPortfolio.contractType}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, contractType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={currentPortfolio.contactEmail || ""}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, contactEmail: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมายเลขโทรศัพท์</label>
                  <input
                    type="text"
                    value={currentPortfolio.contactPhone || ""}
                    onChange={(e) => setCurrentPortfolio({ ...currentPortfolio, contactPhone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DEGREES */}
          {activeSection === "degrees" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-900" />
                  <span>ประวัติการศึกษาและคุณวุฒิ</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAddDegree}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มคุณวุฒิ</span>
                </button>
              </div>

              <div className="space-y-3">
                {currentPortfolio.degrees.map((deg, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ระดับการศึกษา</label>
                      <select
                        value={deg.level}
                        onChange={(e) => {
                          const updated = [...currentPortfolio.degrees];
                          updated[idx].level = e.target.value as FacultyPortfolioDegree["level"];
                          setCurrentPortfolio({ ...currentPortfolio, degrees: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                      >
                        <option value="doctoral">ปริญญาเอก</option>
                        <option value="master">ปริญญาโท</option>
                        <option value="bachelor">ปริญญาตรี</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อปริญญา (ย่อ/เต็ม)</label>
                      <input
                        type="text"
                        value={deg.degreeName}
                        placeholder="เช่น รัฐศาสตรมหาบัณฑิต (ร.ม.)"
                        onChange={(e) => {
                          const updated = [...currentPortfolio.degrees];
                          updated[idx].degreeName = e.target.value;
                          setCurrentPortfolio({ ...currentPortfolio, degrees: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา</label>
                      <input
                        type="text"
                        value={deg.fieldOfStudy}
                        placeholder="เช่น การปกครอง"
                        onChange={(e) => {
                          const updated = [...currentPortfolio.degrees];
                          updated[idx].fieldOfStudy = e.target.value;
                          setCurrentPortfolio({ ...currentPortfolio, degrees: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สถาบันที่สำเร็จการศึกษา</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={deg.institution}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.degrees];
                            updated[idx].institution = e.target.value;
                            setCurrentPortfolio({ ...currentPortfolio, degrees: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDegree(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: TEACHING */}
          {activeSection === "teaching" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-900" />
                  <span>ภาระงานสอนประจำภาคเรียน</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAddTeaching}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายวิชาสอน</span>
                </button>
              </div>

              <div className="space-y-3">
                {currentPortfolio.currentTeachingLoad.map((tch, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ภาคเรียน/ปี</label>
                      <input
                        type="text"
                        value={tch.term}
                        placeholder="1/2569"
                        onChange={(e) => {
                          const updated = [...currentPortfolio.currentTeachingLoad];
                          updated[idx].term = e.target.value;
                          setCurrentPortfolio({ ...currentPortfolio, currentTeachingLoad: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">รหัสวิชา</label>
                      <input
                        type="text"
                        value={tch.courseCode}
                        placeholder="POL1101"
                        onChange={(e) => {
                          const updated = [...currentPortfolio.currentTeachingLoad];
                          updated[idx].courseCode = e.target.value;
                          setCurrentPortfolio({ ...currentPortfolio, currentTeachingLoad: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อรายวิชา</label>
                      <input
                        type="text"
                        value={tch.courseName}
                        placeholder="ความรู้เบื้องต้นทางรัฐศาสตร์"
                        onChange={(e) => {
                          const updated = [...currentPortfolio.currentTeachingLoad];
                          updated[idx].courseName = e.target.value;
                          setCurrentPortfolio({ ...currentPortfolio, currentTeachingLoad: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชม./สัปดาห์</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tch.hoursPerWeek}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.currentTeachingLoad];
                            updated[idx].hoursPerWeek = Number(e.target.value);
                            setCurrentPortfolio({ ...currentPortfolio, currentTeachingLoad: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white text-center font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTeaching(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: RESEARCH */}
          {activeSection === "research" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-900" />
                  <span>ผลงานวิจัยและบทความวิชาการที่ตีพิมพ์</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAddResearch}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มผลงานวิจัย</span>
                </button>
              </div>

              <div className="space-y-4">
                {currentPortfolio.researchWorks.map((res, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">ผลงานลำดับที่ {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveResearch(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อเรื่องผลงานวิจัย / บทความ</label>
                      <input
                        type="text"
                        value={res.title}
                        onChange={(e) => {
                          const updated = [...currentPortfolio.researchWorks];
                          updated[idx].title = e.target.value;
                          setCurrentPortfolio({ ...currentPortfolio, researchWorks: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-white font-medium text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ชื่อวารสาร / แหล่งตีพิมพ์</label>
                        <input
                          type="text"
                          value={res.journalName}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.researchWorks];
                            updated[idx].journalName = e.target.value;
                            setCurrentPortfolio({ ...currentPortfolio, researchWorks: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ฐานข้อมูลรับรอง</label>
                        <select
                          value={res.indexing}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.researchWorks];
                            updated[idx].indexing = e.target.value as FacultyResearchPublication["indexing"];
                            setCurrentPortfolio({ ...currentPortfolio, researchWorks: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white font-semibold"
                        >
                          <option value="TCI_1">TCI กลุ่ม 1</option>
                          <option value="TCI_2">TCI กลุ่ม 2</option>
                          <option value="Scopus">Scopus</option>
                          <option value="WoS">Web of Science</option>
                          <option value="National_Conf">การประชุมวิชาการระดับชาติ</option>
                          <option value="International_Conf">การประชุมวิชาการระดับนานาชาติ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ปีที่ตีพิมพ์ (พ.ศ.)</label>
                        <input
                          type="number"
                          value={res.publicationYear}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.researchWorks];
                            updated[idx].publicationYear = Number(e.target.value);
                            setCurrentPortfolio({ ...currentPortfolio, researchWorks: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: SERVICES */}
          {activeSection === "services" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900" />
                  <span>งานบริการวิชาการแก่สังคมและโครงการพัฒนาท้องถิ่น</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มงานบริการวิชาการ</span>
                </button>
              </div>

              <div className="space-y-4">
                {currentPortfolio.academicServices.map((srv, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">กิจกรรมบริการวิชาการที่ {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อโครงการ / หัวข้อบรรยาย</label>
                      <input
                        type="text"
                        value={srv.title}
                        onChange={(e) => {
                          const updated = [...currentPortfolio.academicServices];
                          updated[idx].title = e.target.value;
                          setCurrentPortfolio({ ...currentPortfolio, academicServices: updated });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-white font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">บทบาทหน้าที่</label>
                        <input
                          type="text"
                          value={srv.role}
                          placeholder="วิทยากร, กรรมการ, ผู้ทรงคุณวุฒิ"
                          onChange={(e) => {
                            const updated = [...currentPortfolio.academicServices];
                            updated[idx].role = e.target.value;
                            setCurrentPortfolio({ ...currentPortfolio, academicServices: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">หน่วยงาน / องค์กรที่จัด</label>
                        <input
                          type="text"
                          value={srv.organization}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.academicServices];
                            updated[idx].organization = e.target.value;
                            setCurrentPortfolio({ ...currentPortfolio, academicServices: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">วันที่จัดกิจกรรม</label>
                        <input
                          type="date"
                          value={srv.serviceDate}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.academicServices];
                            updated[idx].serviceDate = e.target.value;
                            setCurrentPortfolio({ ...currentPortfolio, academicServices: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: SAR */}
          {activeSection === "sar" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4 text-xs">
              <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-900" />
                <span>รายงานประเมินตนเอง (Self-Assessment Report: SAR)</span>
              </h2>

              <div className="space-y-4">
                {currentPortfolio.sarRecords.map((sar, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">ปีการศึกษา {sar.academicYear}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sar.sarStatus === "certified" ? "bg-emerald-100 text-emerald-900" :
                          sar.sarStatus === "verified" ? "bg-indigo-100 text-indigo-900" :
                          sar.sarStatus === "submitted" ? "bg-blue-100 text-blue-900" : "bg-slate-200 text-slate-700"
                        }`}>
                          {sar.sarStatus === "certified" ? "รับรองผลการประเมินแล้ว" :
                           sar.sarStatus === "verified" ? "ผ่านการตรวจสอบแล้ว" :
                           sar.sarStatus === "submitted" ? "ยื่นรายงานแล้ว" : "ร่างรายงาน"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">คะแนนประเมินตนเอง (เต็ม 5.00)</label>
                        <input
                          type="number"
                          step="0.01"
                          max="5.00"
                          min="0"
                          value={sar.selfScore || 0}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.sarRecords];
                            updated[idx].selfScore = Number(e.target.value);
                            setCurrentPortfolio({ ...currentPortfolio, sarRecords: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">คะแนนคณะกรรมการประเมิน</label>
                        <input
                          type="number"
                          step="0.01"
                          max="5.00"
                          min="0"
                          value={sar.evaluatorScore || 0}
                          onChange={(e) => {
                            const updated = [...currentPortfolio.sarRecords];
                            updated[idx].evaluatorScore = Number(e.target.value);
                            setCurrentPortfolio({ ...currentPortfolio, sarRecords: updated });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-2 bg-white font-mono font-bold text-blue-900"
                        />
                      </div>
                    </div>

                    {sar.comments && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-semibold text-slate-700 block mb-1">ความเห็นคณะกรรมการประเมิน:</span>
                        <p className="text-slate-600">{sar.comments}</p>
                        {sar.certifiedBy && (
                          <p className="text-slate-400 text-[10px] mt-1">ผู้รับรอง: {sar.certifiedBy} ({sar.certifiedDate})</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FolderKanban, Download, Printer, Plus, Sparkles, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { exportMemoToWord, printDocumentView } from "@/lib/documentGenerator";

export default function ProjectReportsPage() {
  const [projectTitle, setProjectTitle] = useState("โครงการเพิ่มมูลค่าสับปะรดด้วยนวัตกรรมการอบแห้งเพื่อพัฒนาเศรษฐกิจฐานราก");
  const [department, setDepartment] = useState("สาขาวิชาวิศวกรรมการผลิตและระบบอัตโนมัติ");
  const [leader, setLeader] = useState("ดร.สุรชัย นวัตกร");
  const [budgetApproved, setBudgetApproved] = useState(250000);
  const [budgetUsed, setBudgetUsed] = useState(195000);
  const [participantCount, setParticipantCount] = useState(65);
  const [sdgGoals, setSdgGoals] = useState("SDG 1, SDG 8, SDG 12");
  const [outcomes, setOutcomes] = useState("กลุ่มวิสาหกิจชุมชนสามารถแปรรูปสับปะรดอบแห้งได้มาตรฐาน สร้างรายได้เฉลี่ยเพิ่มขึ้นร้อยละ 18.5 ต่อครัวเรือน");
  const [problemsAndSuggestions, setProblemsAndSuggestions] = useState("ควรส่งเสริมช่องทางการตลาดออนไลน์และการออกแบบบรรจุภัณฑ์ที่เป็นมิตรต่อสิ่งแวดล้อมเพิ่มเติม");

  const handleExportWord = async () => {
    await exportMemoToWord({
      department: "งานนโยบายและแผน คณะศิลปศาสตร์และวิทยาศาสตร์",
      docNumber: "อว 0604.05/ว 145",
      date: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
      to: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
      subject: `รายงานสรุปผลการดำเนินงาน ${projectTitle}`,
      paragraphs: [
        `ตามที่ ${department} ได้รับอนุมัติให้ดำเนินงาน ${projectTitle} ประจำปีงบประมาณ พ.ศ. 2569 งบประมาณจัดสรร ${budgetApproved.toLocaleString()} บาท นั้น`,
        `บัดนี้ การดำเนินโครงการได้เสร็จสิ้นเรียบร้อยแล้ว โดยมีผลการดำเนินงานสรุปดังนี้: มีผู้เข้าร่วมกิจกรรมทั้งสิ้น ${participantCount} คน, งบประมาณที่ใช้จริง ${budgetUsed.toLocaleString()} บาท (คงเหลือ ${(budgetApproved - budgetUsed).toLocaleString()} บาท), ตอบสนองเป้าหมายการพัฒนาที่ยั่งยืน (${sdgGoals}) ผลสัมฤทธิ์ที่สำคัญ: ${outcomes}`,
        `ข้อเสนอแนะสำหรับการดำเนินงานในอนาคต: ${problemsAndSuggestions}`,
        `จึงเรียนมาเพื่อโปรดทราบและพิจารณาเล่มรายงานผลโครงการฉบับสมบูรณ์`
      ],
      signatoryName: leader,
      signatoryPosition: "หัวหน้าโครงการ / อาจารย์ประจำสาขาวิชา"
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/projects" className="text-xs text-blue-800 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้ารวมโครงการ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            รายงานสรุปผลการดำเนินโครงการและ SDG (Project Outcome Report)
          </h1>
          <p className="text-xs text-slate-500">
            บันทึกผลสัมฤทธิ์โครงการ สรุปการใช้งบประมาณ เป้าหมาย SDG และส่งออกเล่มรายงาน Word (.docx)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Word เล่มรายงาน</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-4 text-xs text-slate-800">
        <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
          ข้อมูลสรุปผลโครงการ (อ้างอิงไฟล์ แบบรายงานโครงการตามแผน-นอกแผน 2569)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">ชื่อโครงการ</label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full border rounded-lg p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา / หน่วยงาน</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">หัวหน้าโครงการ / ผู้รายงาน</label>
            <input
              type="text"
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">งบประมาณจัดสรร (บาท)</label>
            <input
              type="number"
              value={budgetApproved}
              onChange={(e) => setBudgetApproved(Number(e.target.value))}
              className="w-full border rounded-lg p-2.5 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">งบประมาณใช้จริง (บาท)</label>
            <input
              type="number"
              value={budgetUsed}
              onChange={(e) => setBudgetUsed(Number(e.target.value))}
              className="w-full border rounded-lg p-2.5 font-bold text-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">จำนวนผู้เข้าร่วมโครงการจริง (คน)</label>
            <input
              type="number"
              value={participantCount}
              onChange={(e) => setParticipantCount(Number(e.target.value))}
              className="w-full border rounded-lg p-2.5 font-bold text-blue-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">เป้าหมายการพัฒนาที่ยั่งยืน (SDG Goals)</label>
            <input
              type="text"
              value={sdgGoals}
              onChange={(e) => setSdgGoals(e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">ผลสัมฤทธิ์และประโยชน์ที่ได้รับ</label>
            <textarea
              rows={3}
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              className="w-full border rounded-lg p-2.5 resize-none leading-relaxed"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">ปัญหา อุปสรรค และข้อเสนอแนะ</label>
            <textarea
              rows={2}
              value={problemsAndSuggestions}
              onChange={(e) => setProblemsAndSuggestions(e.target.value)}
              className="w-full border rounded-lg p-2.5 resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportWord}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>สร้างและส่งออก Word (.docx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

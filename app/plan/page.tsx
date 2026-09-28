"use client";

import React from "react";
import Link from "next/link";
import { LineChart, TrendingUp, CheckCircle2, Award, Target, BarChart3 } from "lucide-react";

export default function StrategicPlanPage() {
  const strategies = [
    {
      id: 1,
      title: "ประเด็นยุทธศาสตร์ที่ 1 : การพัฒนาท้องถิ่นและสร้างความเข้มแข็งของชุมชน",
      target: "5 ชุมชนเป้าหมาย",
      achieved: "4 ชุมชน",
      progress: 80,
      description: "โครงการยกระดับเศรษฐกิจฐานราก, ถ่ายทอดนวัตกรรมไหมโบราณบ้านเสี้ยวน้อย, เพิ่มมูลค่าสับปะรดท่าหินโงม"
    },
    {
      id: 2,
      title: "ประเด็นยุทธศาสตร์ที่ 2 : การผลิตและพัฒนาครูและบุคลากรทางการศึกษา",
      target: "100% ผ่านเกณฑ์มาตรฐาน",
      achieved: "92% ผ่านเกณฑ์",
      progress: 92,
      description: "พัฒนาสมรรถนะอาจารย์และผู้ช่วยสอน, การพัฒนาทักษะวิชาชีพ"
    },
    {
      id: 3,
      title: "ประเด็นยุทธศาสตร์ที่ 3 : ยกระดับคุณภาพการศึกษาและการเรียนรู้ตลอดชีวิต",
      target: "12 โครงการพัฒนาผู้เรียน",
      achieved: "9 โครงการจัดสำเร็จ",
      progress: 75,
      description: "Startup Creator สร้างนวัตกรท่องเที่ยว, AI Coding เบื้องต้น, พัฒนาทักษะศตวรรษที่ 21 ภาค กศ.ปช."
    },
    {
      id: 4,
      title: "ประเด็นยุทธศาสตร์ที่ 4 : การพัฒนาระบบบริหารจัดการองค์กรสู่ความเป็นเลิศ",
      target: "ERP ครบวงจร 6 โมดูล",
      achieved: "ระบบเชื่อมต่อ 100%",
      progress: 100,
      description: "ระบบสารบรรณอิเล็กทรอนิกส์, คุมงบประมาณรายได้, ขอซื้อขอจ้าง, ระบบใบลาออนไลน์"
    }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            แผนยุทธศาสตร์และตัวชี้วัด (Strategic Plan & KPIs)
          </h1>
          <p className="text-xs text-slate-500">
            ติดตามผลการดำเนินงานตามแผนยุทธศาสตร์คณะ 4 ประเด็น ประจำปีงบประมาณ พ.ศ. 2569
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-100 text-blue-900 font-bold rounded-xl text-xs">
            ความก้าวหน้าภาพรวม: 86.7%
          </span>
        </div>
      </div>

      {/* 4 Strategies Grid */}
      <div className="space-y-4">
        {strategies.map((strat) => (
          <div
            key={strat.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900">{strat.title}</h3>
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {strat.progress}% สำเร็จ
              </span>
            </div>

            <p className="text-xs text-slate-500">{strat.description}</p>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">เป้าหมายตัวชี้วัด (Target):</span>
                <span className="font-semibold text-slate-800">{strat.target}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">ผลการดำเนินงานจริง (Achieved):</span>
                <span className="font-bold text-emerald-700">{strat.achieved}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-900 h-full rounded-full transition-all duration-500"
                style={{ width: `${strat.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility functions for generating Word (.docx), Excel (.xlsx), and PDF files

import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Packer } from "docx";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to trigger browser download of a Blob
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Export Official Memo (บันทึกข้อความราชการ) to Word (.docx)
export async function exportMemoToWord(memo: {
  department: string;
  docNumber: string;
  date: string;
  to: string;
  subject: string;
  paragraphs: string[];
  signatoryName: string;
  signatoryPosition: string;
  tableHeaders?: string[];
  tableRows?: string[][];
}) {
  const tableElements = (memo.tableHeaders && memo.tableRows && memo.tableRows.length > 0) ? [
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: memo.tableHeaders.map((header) => new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: header, bold: true, size: 28, font: "TH Sarabun PSK" })]
              })
            ]
          }))
        }),
        ...memo.tableRows.map((row) => new TableRow({
          children: row.map((cell) => new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: cell, size: 28, font: "TH Sarabun PSK" })]
              })
            ]
          }))
        }))
      ]
    }),
    new Paragraph({ text: "" })
  ] : [];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "บันทึกข้อความ",
                bold: true,
                size: 36, // 18pt
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `ส่วนราชการ: `,
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `${memo.department}`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `ที่: `,
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `${memo.docNumber}\t\t`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `วันที่: `,
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `${memo.date}`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `เรื่อง: `,
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `${memo.subject}`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `เรียน: `,
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `${memo.to}`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({ text: "" }), // Space
          ...memo.paragraphs.map(
            (p) =>
              new Paragraph({
                indent: { firstLine: 720 }, // Indent ~1 tab
                children: [
                  new TextRun({
                    text: p,
                    size: 32,
                    font: "TH Sarabun PSK",
                  }),
                ],
              })
          ),
          ...tableElements,
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `(ลงชื่อ)........................................................\n`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `(${memo.signatoryName})\n`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
              new TextRun({
                text: `${memo.signatoryPosition}`,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `บันทึกข้อความ_${memo.subject.substring(0, 30)}.docx`);
}

// 2. Export Project Proposal to Word (.docx) - CPRU Full Form Standard 2569
export async function exportProjectToWord(project: {
  title: string;
  strategicGoal: string;
  department: string;
  leader: string;
  fiscalYear: number;
  budgetApproved: number;
  budgetSource?: string;
  planType?: string;
  kpis: string[];
  rationale?: string;
  objectives?: string[];
  targetGroup?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  outcomes?: string;
  activities?: Array<{ name: string; quarter: number; targetGroup: string; location: string; budget: number }>;
  budgetItems?: Array<{ category: string; description: string; amount: number }>;
}) {
  // Build Activities Table
  const activitiesTable = (project.activities && project.activities.length > 0) ? [
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["ลำดับ", "กิจกรรม / ขั้นตอนดำเนินงาน", "ไตรมาส", "กลุ่มเป้าหมาย/สถานที่", "งบประมาณ (บาท)"].map(h => (
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 26, font: "TH Sarabun PSK" })] })]
            })
          ))
        }),
        ...project.activities.map((act, idx) => (
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (idx + 1).toString(), size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: act.name, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `ไตรมาส ${act.quarter}`, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${act.targetGroup || "-"} / ${act.location || "-"}`, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: act.budget.toLocaleString(), size: 26, font: "TH Sarabun PSK" })] })] })
            ]
          })
        ))
      ]
    }),
    new Paragraph({ text: "" })
  ] : [];

  // Build Budget Items Table
  const budgetTable = (project.budgetItems && project.budgetItems.length > 0) ? [
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["ลำดับ", "หมวดรายจ่าย / รายการรายละเอียด", "จำนวนเงิน (บาท)"].map(h => (
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 26, font: "TH Sarabun PSK" })] })]
            })
          ))
        }),
        ...project.budgetItems.map((b, idx) => (
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (idx + 1).toString(), size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `[${b.category === "compensation" ? "ค่าตอบแทน" : b.category === "operating" ? "ค่าใช้สอย" : "ค่าวัสดุ"}] ${b.description}`, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: b.amount.toLocaleString(), size: 26, font: "TH Sarabun PSK" })] })] })
            ]
          })
        )),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "" })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "รวมงบประมาณทั้งสิ้น", bold: true, size: 26, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${project.budgetApproved.toLocaleString()} บาท`, bold: true, size: 26, font: "TH Sarabun PSK" })] })] })
          ]
        })
      ]
    }),
    new Paragraph({ text: "" })
  ] : [];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `แบบเสนอโครงการประจำปีงบประมาณ พ.ศ. ${project.fiscalYear}`,
                bold: true,
                size: 36,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ`,
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Section 1
          new Paragraph({
            children: [
              new TextRun({ text: "1. ชื่อโครงการ: ", bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: project.title, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          // Section 2
          new Paragraph({
            children: [
              new TextRun({ text: "2. ความสอดคล้องกับยุทธศาสตร์: ", bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: project.strategicGoal, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          // Section 3
          new Paragraph({
            children: [
              new TextRun({ text: "3. หน่วยงานที่รับผิดชอบ: ", bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${project.department}`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          // Section 4
          new Paragraph({
            children: [
              new TextRun({ text: "4. ผู้รับผิดชอบโครงการ: ", bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${project.leader}`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          // Section 5: Rationale
          new Paragraph({
            children: [
              new TextRun({ text: "5. หลักการและเหตุผล:", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: project.rationale || "เพื่อพัฒนาและยกระดับศักยภาพตามยุทธศาสตร์ของคณะและมหาวิทยาลัย", size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          // Section 6: Objectives
          new Paragraph({
            children: [
              new TextRun({ text: "6. วัตถุประสงค์ของโครงการ:", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          ...(project.objectives && project.objectives.length > 0
            ? project.objectives.map((obj, i) => new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun({ text: `${i + 1}. ${obj}`, size: 30, font: "TH Sarabun PSK" })] }))
            : [new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun({ text: "1. เพื่อให้บรรลุตามวัตถุประสงค์และตัวชี้วัดของโครงการ", size: 30, font: "TH Sarabun PSK" })] })]
          ),

          // Section 7: Target Group & Location
          new Paragraph({
            children: [
              new TextRun({ text: "7. กลุ่มเป้าหมายและสถานที่ดำเนินการ:", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: `กลุ่มเป้าหมาย: ${project.targetGroup || "คณาจารย์ บุคลากร และนักศึกษา"} | สถานที่: ${project.location || "คณะศิลปศาสตร์และวิทยาศาสตร์"} (${project.startDate || ""} ถึง ${project.endDate || ""})`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          // Section 8: Activities Table
          new Paragraph({
            children: [
              new TextRun({ text: "8. แผนการดำเนินงานและกิจกรรมย่อย:", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          ...activitiesTable,

          // Section 9: Budget Table
          new Paragraph({
            children: [
              new TextRun({ text: `9. รายละเอียดงบประมาณ (รวมทั้งสิ้น ${project.budgetApproved.toLocaleString()} บาท แหล่งงบ: ${project.budgetSource === "national_budget" ? "งบประมาณแผ่นดิน" : project.budgetSource === "faculty_revenue" ? "งบรายได้คณะ" : "งบประมาณโครงการ"}):`, bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          ...budgetTable,

          // Section 10: KPIs
          new Paragraph({
            children: [
              new TextRun({ text: "10. ตัวชี้วัดความสำเร็จ (KPI):", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          ...project.kpis.map((kpi, idx) => new Paragraph({
            indent: { firstLine: 720 },
            children: [new TextRun({ text: `${idx + 1}. ${kpi}`, size: 30, font: "TH Sarabun PSK" })]
          })),

          // Section 11: Expected Outcomes
          new Paragraph({
            children: [
              new TextRun({ text: "11. ประโยชน์ที่คาดว่าจะได้รับ:", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: project.outcomes || "ผู้เข้าร่วมโครงการได้รับองค์ความรู้และสามารถนำไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีประสิทธิภาพ", size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          // Signatory Approval Block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ)........................................................\n", size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${project.leader})\n`, size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ผู้เสนอโครงการ", size: 28, font: "TH Sarabun PSK" })] })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ)........................................................\n", size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี)\n", size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์", size: 28, font: "TH Sarabun PSK" })] })
                    ]
                  })
                ]
              })
            ]
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `แบบเสนอโครงการ_${project.title.substring(0, 30)}.docx`);
}

// 2.1 Export Project Outcome Report to Word (.docx)
export async function exportProjectReportToWord(report: {
  reportType: string;
  projectCode: string;
  projectTitle: string;
  department: string;
  leader: string;
  fiscalYear: number;
  budgetApproved: number;
  budgetUsed: number;
  participantCount: number;
  outcomesSummary?: string;
  impactEconomy?: string;
  impactSociety?: string;
  impactEnvironment?: string;
  impactEducation?: string;
  sdgGoals?: number[];
  problemsAndSuggestions?: string;
  kpiResults?: Array<{ kpi: string; target: string; actual: string; status: string }>;
}) {
  const kpiTable = (report.kpiResults && report.kpiResults.length > 0) ? [
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["ลำดับ", "ตัวชี้วัดความสำเร็จ (KPI)", "เป้าหมาย", "ผลที่ทำได้จริง", "สถานะ"].map(h => (
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 26, font: "TH Sarabun PSK" })] })]
            })
          ))
        }),
        ...report.kpiResults.map((k, idx) => (
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (idx + 1).toString(), size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.kpi, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: k.target, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: k.actual, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: k.status === "passed" ? "บรรลุเป้าหมาย" : "กำลังดำเนินงาน", size: 26, font: "TH Sarabun PSK" })] })] })
            ]
          })
        ))
      ]
    }),
    new Paragraph({ text: "" })
  ] : [];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: report.reportType === "kings_philosophy" ? "รายงานผลการดำเนินโครงการตามศาสตร์พระราชาเพื่อการพัฒนาท้องถิ่น" :
                      report.reportType === "one_page" ? "รายงานสรุปสำหรับผู้บริหาร (One Page Summary)" :
                      `รายงานผลการดำเนินโครงการประจำปีงบประมาณ พ.ศ. ${report.fiscalYear}`,
                bold: true,
                size: 36,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ`,
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: `รหัสโครงการ: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${report.projectCode}  `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `ชื่อโครงการ: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${report.projectTitle}`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: `หน่วยงาน: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${report.department}  `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `หัวหน้าโครงการ: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${report.leader}`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: `งบประมาณจัดสรร: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${report.budgetApproved.toLocaleString()} บาท  `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `ใช้จ่ายจริง: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${report.budgetUsed.toLocaleString()} บาท (คงเหลือ ${(report.budgetApproved - report.budgetUsed).toLocaleString()} บาท)`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: `ผู้เข้าร่วมโครงการทั้งสิ้น: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${report.participantCount} คน  `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `เป้าหมาย SDG: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: report.sdgGoals ? report.sdgGoals.map(g => `SDG ${g}`).join(", ") : "SDG 4, SDG 8", size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "ผลการดำเนินงานเปรียบเทียบตัวชี้วัด (KPIs):", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          ...kpiTable,

          new Paragraph({
            children: [
              new TextRun({ text: "ผลสัมฤทธิ์และผลกระทบของการดำเนินงาน (Impacts):", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          ...(report.impactEconomy ? [new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun({ text: `• ด้านเศรษฐกิจและรายได้: ${report.impactEconomy}`, size: 30, font: "TH Sarabun PSK" })] })] : []),
          ...(report.impactSociety ? [new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun({ text: `• ด้านสังคมและชุมชน: ${report.impactSociety}`, size: 30, font: "TH Sarabun PSK" })] })] : []),
          ...(report.impactEnvironment ? [new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun({ text: `• ด้านสิ่งแวดล้อม: ${report.impactEnvironment}`, size: 30, font: "TH Sarabun PSK" })] })] : []),
          ...(report.impactEducation ? [new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun({ text: `• ด้านการศึกษาและการเรียนรู้: ${report.impactEducation}`, size: 30, font: "TH Sarabun PSK" })] })] : []),
          ...(report.outcomesSummary ? [new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun({ text: report.outcomesSummary, size: 30, font: "TH Sarabun PSK" })] })] : []),

          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "ปัญหา อุปสรรค และข้อเสนอแนะในการดำเนินงาน:", bold: true, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: report.problemsAndSuggestions || "ไม่มีปัญหาอุปสรรคสำคัญ และควรส่งเสริมการขยายผลโครงการสู่ชุมชนอื่นต่อไป", size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "(ลงชื่อ)........................................................\n", size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `(${report.leader})\n`, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: "ผู้รายงานผลโครงการ", size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `รายงานผลโครงการ_${report.projectCode}.docx`);
}

// 3. Export Budget Ledger / Table to Excel (.xlsx)
export function exportTableToExcel(data: Record<string, any>[], filename: string, sheetName: string = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// 4. Export Purchase Requisition to Excel (.xlsx)
export function exportPurchaseRequisitionExcel(pr: {
  prNumber: string;
  projectName: string;
  requesterName: string;
  department: string;
  requestDate: string;
  items: Array<{
    itemNumber: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
}) {
  const formattedItems: Record<string, any>[] = pr.items.map(item => ({
    "ลำดับ": item.itemNumber,
    "รายการพัสดุ / รายละเอียด": item.description,
    "จำนวน": item.quantity,
    "หน่วยนับ": item.unit,
    "ราคาต่อหน่วย (บาท)": item.unitPrice,
    "จำนวนเงิน (บาท)": item.totalPrice
  }));

  const totalBeforeVat = pr.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const vat = totalBeforeVat * 0.07;
  const netTotal = totalBeforeVat + vat;

  formattedItems.push({
    "ลำดับ": "",
    "รายการพัสดุ / รายละเอียด": "รวมเป็นเงินทั้งสิ้น (ก่อนภาษีมูลค่าเพิ่ม)",
    "จำนวน": 0,
    "หน่วยนับ": "",
    "ราคาต่อหน่วย (บาท)": 0,
    "จำนวนเงิน (บาท)": totalBeforeVat
  });
  formattedItems.push({
    "ลำดับ": "",
    "รายการพัสดุ / รายละเอียด": "ภาษีมูลค่าเพิ่ม 7%",
    "จำนวน": 0,
    "หน่วยนับ": "",
    "ราคาต่อหน่วย (บาท)": 0,
    "จำนวนเงิน (บาท)": vat
  });
  formattedItems.push({
    "ลำดับ": "",
    "รายการพัสดุ / รายละเอียด": "ยอดเงินรวมสุทธิ",
    "จำนวน": 0,
    "หน่วยนับ": "",
    "ราคาต่อหน่วย (บาท)": 0,
    "จำนวนเงิน (บาท)": netTotal
  });

  exportTableToExcel(formattedItems, `ใบขอซื้อขอจ้าง_${pr.prNumber.replace('/', '-')}`, "รายการขอซื้อขอจ้าง");
}

// 5. Export Loan Contract (Form 8500 สัญญาการยืมเงิน ฉบับ มรภ.ชัยภูมิ 2569) to Word (.docx)
export async function exportLoanContractToWord(loan: {
  contractNumber: string;
  borrowerName: string;
  position: string;
  department: string;
  purpose: string;
  amount: number;
  bahtText?: string;
  borrowDate: string;
  settleDueDate: string;
  approverName?: string;
  approverPosition?: string;
  estimatedExpenses?: Array<{ category: string; description: string; amount: number }>;
  settlements?: Array<{ settleDate: string; cashAmount: number; voucherAmount: number; receiptNumber?: string; remainingBalance: number }>;
}) {
  const expenseTable = (loan.estimatedExpenses && loan.estimatedExpenses.length > 0) ? [
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["ลำดับ", "หมวดรายจ่าย / รายละเอียดประมาณการ", "จำนวนเงิน (บาท)"].map(h => (
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 26, font: "TH Sarabun PSK" })] })]
            })
          ))
        }),
        ...loan.estimatedExpenses.map((exp, idx) => (
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (idx + 1).toString(), size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `[${exp.category}] ${exp.description}`, size: 26, font: "TH Sarabun PSK" })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: exp.amount.toLocaleString(), size: 26, font: "TH Sarabun PSK" })] })] })
            ]
          })
        )),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "" })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "รวมเป็นเงินยืมทั้งสิ้น", bold: true, size: 26, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${loan.amount.toLocaleString()} บาท`, bold: true, size: 26, font: "TH Sarabun PSK" })] })] })
          ]
        })
      ]
    }),
    new Paragraph({ text: "" })
  ] : [];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "สัญญาการยืมเงิน (แบบ 8500)",
                bold: true,
                size: 36,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ",
                bold: true,
                size: 32,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `สัญญาเลขที่: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.contractNumber}\n`, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `วันที่ทำสัญญา: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.borrowDate}`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: `ข้าพเจ้า `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.borrowerName} `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `ตำแหน่ง `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.position} `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `สังกัด `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.department} `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `มีความประสงค์ขอยืมเงินจากมหาวิทยาลัยราชภัฏชัยภูมิ เพื่อนำไปใช้จ่ายในการดำเนินงาน: `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.purpose} `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `รวมเป็นจำนวนเงินทั้งสิ้น `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.amount.toLocaleString()} บาท `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `(${loan.bahtText || "บาทถ้วน"})`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: `โดยมีรายละเอียดประมาณการค่าใช้จ่ายดังรายการต่อไปนี้:`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          ...expenseTable,

          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: `ข้าพเจ้าสัญญาว่าจะปฏิบัติตามระเบียบของทางราชการทุกประการ และจะนำใบสำคัญคู่จ่ายพร้อมเงินสดที่เหลือ (ถ้ามี) มาส่งใช้คืนตามสัญญานี้ให้เสร็จสิ้นภายในวันที่ `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${loan.settleDueDate} `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `(ภายใน 30 วันนับแต่วันที่ได้รับเงินยืม) หากข้าพเจ้าไม่ส่งใช้คืนตามกำหนด ยินยอมให้หักเงินเดือนหรือเงินอื่นใดที่ข้าพเจ้าพึงได้รับจากทางราชการชดใช้เงินยืมนี้จนครบถ้วน`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          // Signatures Block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ)........................................................\n", size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${loan.borrowerName})\n`, size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ผู้ยืมเงิน", size: 28, font: "TH Sarabun PSK" })] })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ)........................................................\n", size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${loan.approverName || "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี"})\n`, size: 28, font: "TH Sarabun PSK" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${loan.approverPosition || "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"}`, size: 28, font: "TH Sarabun PSK" })] })
                    ]
                  })
                ]
              })
            ]
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `สัญญายืมเงิน_${loan.contractNumber.replace('/', '-')}.docx`);
}

// 6. Export Teaching / Supervision Fee Reimbursement Memo to Word (.docx)
export async function exportTeachingDisbursementToWord(batch: {
  batchNumber?: string;
  periodMonth: string;
  program: string;
  academicYear: number;
  term: string;
  totalAmount: number;
  netAmountTotal: number;
  taxDeductionTotal: number;
  teachersCount: number;
  items: Array<{
    teacherName: string;
    courseCode: string;
    courseName: string;
    hours: number;
    ratePerHour: number;
    total: number;
    taxDeduction: number;
    netAmount: number;
  }>;
}) {
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["ลำดับ", "ชื่อ-สกุล อาจารย์ผู้สอน", "รหัสวิชา / รายวิชา", "ชั่วโมง", "อัตรา", "รวมเงิน", "ภาษี 1%", "ยอดสุทธิ"].map(h => (
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 24, font: "TH Sarabun PSK" })] })]
          })
        ))
      }),
      ...batch.items.map((item, idx) => (
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (idx + 1).toString(), size: 24, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.teacherName, size: 24, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${item.courseCode} ${item.courseName}`, size: 24, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.hours.toString(), size: 24, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.ratePerHour.toLocaleString(), size: 24, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.total.toLocaleString(), size: 24, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.taxDeduction.toLocaleString(), size: 24, font: "TH Sarabun PSK" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.netAmount.toLocaleString(), size: 24, font: "TH Sarabun PSK" })] })] })
          ]
        })
      )),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "" })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `รวมทั้งสิ้น (${batch.teachersCount} ท่าน)`, bold: true, size: 24, font: "TH Sarabun PSK" })] })] }),
          new TableCell({ children: [new Paragraph({ text: "" })] }),
          new TableCell({ children: [new Paragraph({ text: "" })] }),
          new TableCell({ children: [new Paragraph({ text: "" })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: batch.totalAmount.toLocaleString(), bold: true, size: 24, font: "TH Sarabun PSK" })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: batch.taxDeductionTotal.toLocaleString(), bold: true, size: 24, font: "TH Sarabun PSK" })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${batch.netAmountTotal.toLocaleString()} บาท`, bold: true, size: 24, font: "TH Sarabun PSK" })] })] })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "บันทึกข้อความขออนุมัติเบิกจ่ายค่าตอบแทนการสอนพิเศษ",
                bold: true,
                size: 36,
                font: "TH Sarabun PSK",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `ส่วนราชการ: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ โทร. 044-816-200`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `ที่: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `อว 0643.04/บจ ${batch.batchNumber || "01/2569"}    `, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `วันที่: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }), size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `เรื่อง: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `ขออนุมัติเบิกจ่ายค่าตอบแทนการสอนพิเศษ ประจำเดือน ${batch.periodMonth} (${batch.program})`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `เรียน: `, bold: true, size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: `คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: `ตามที่ คณะศิลปศาสตร์และวิทยาศาสตร์ ได้จัดการเรียนการสอน ${batch.program} ภาคเรียนที่ ${batch.term} ประจำปีการศึกษา ${batch.academicYear} บัดนี้ อาจารย์ผู้สอนได้ปฏิบัติการสอนเรียบร้อยแล้ว จึงขออนุมัติเบิกจ่ายเงินค่าตอบแทนการสอนพิเศษ ประจำเดือน ${batch.periodMonth} จำนวน ${batch.teachersCount} ท่าน เป็นจำนวนเงินสุทธิทั้งสิ้น ${batch.netAmountTotal.toLocaleString()} บาท ดังมีรายละเอียดประกอบดังนี้:`, size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({ text: "" }),
          table,
          new Paragraph({ text: "" }),
          new Paragraph({
            indent: { firstLine: 720 },
            children: [
              new TextRun({ text: "จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติการเบิกจ่ายงบประมาณดังกล่าวต่อไป", size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "(ลงชื่อ)........................................................\n", size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: "(หัวหน้างานบริการวิชาการและจัดการศึกษา)\n", size: 30, font: "TH Sarabun PSK" }),
              new TextRun({ text: "ผู้เสนอขอเบิกจ่าย", size: 30, font: "TH Sarabun PSK" }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `ใบเบิกค่าสอนพิเศษ_${batch.periodMonth}.docx`);
}

// 7. Generate Print-Ready PDF
export function printDocumentView() {
  if (typeof window !== "undefined") {
    window.print();
  }
}


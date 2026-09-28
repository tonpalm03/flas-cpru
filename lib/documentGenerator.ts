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

// 2. Export Project Proposal to Word (.docx)
export async function exportProjectToWord(project: {
  title: string;
  strategicGoal: string;
  department: string;
  leader: string;
  fiscalYear: number;
  budgetApproved: number;
  kpis: string[];
  rationale?: string;
  objectives?: string[];
}) {
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
          new Paragraph({
            children: [
              new TextRun({ text: "1. ชื่อโครงการ: ", bold: true, size: 32, font: "TH Sarabun PSK" }),
              new TextRun({ text: project.title, size: 32, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. ประเด็นยุทธศาสตร์: ", bold: true, size: 32, font: "TH Sarabun PSK" }),
              new TextRun({ text: project.strategicGoal, size: 32, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. หน่วยงานที่รับผิดชอบ: ", bold: true, size: 32, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${project.department}`, size: 32, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "4. ผู้รับผิดชอบโครงการ: ", bold: true, size: 32, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${project.leader}`, size: 32, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "5. งบประมาณที่เสนอขอ: ", bold: true, size: 32, font: "TH Sarabun PSK" }),
              new TextRun({ text: `${project.budgetApproved.toLocaleString()} บาท`, bold: true, size: 32, font: "TH Sarabun PSK" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "6. ตัวชี้วัดความสำเร็จ (KPI):", bold: true, size: 32, font: "TH Sarabun PSK" }),
            ],
          }),
          ...project.kpis.map((kpi, idx) => new Paragraph({
            indent: { firstLine: 720 },
            children: [new TextRun({ text: `${idx + 1}. ${kpi}`, size: 32, font: "TH Sarabun PSK" })]
          })),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `แบบเสนอโครงการ_${project.title.substring(0, 25)}.docx`);
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

// 5. Generate Print-Ready PDF
export function printDocumentView() {
  if (typeof window !== "undefined") {
    window.print();
  }
}

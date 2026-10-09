import type { AdminDocCategory, AdminDocRegistryRecord } from './types';

export function garudaPath(category: string, garudaImage?: string) {
  if (garudaImage) return garudaImage;
  if (category.startsWith('memo')) return '/templates/admin/garuda-memo.jpg';
  if (category === 'order') return '/templates/admin/garuda-order.png';
  return '/templates/admin/garuda-external.png';
}

export const toThaiDigits = (value: unknown): string =>
  String(value ?? '').replace(/[0-9]/g, digit => '๐๑๒๓๔๕๖๗๘๙'[Number(digit)]);

export const toArabicDigits = (value: unknown): string =>
  String(value ?? '').replace(/[๐-๙]/g, digit => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(digit)));

export const formatDocDigits = (value: unknown, digitType: 'thai' | 'arabic' = 'thai'): string =>
  digitType === 'arabic' ? toArabicDigits(value) : toThaiDigits(value);

export function getRecordDigitType(r: Partial<AdminDocRegistryRecord>): 'thai' | 'arabic' {
  if (r.digitType === 'arabic' || r.digitType === 'thai') return r.digitType;
  return r.category === 'external' ? 'arabic' : 'thai';
}

export function thaiGovDate(
  value: string,
  digitType: 'thai' | 'arabic' = 'thai',
  mode: 'external' | 'memo' | 'order' | 'full' = 'memo'
): string {
  if (!value) return '(ยังไม่ระบุวันที่)';
  const d = new Date(value + 'T12:00:00+07:00');
  if (Number.isNaN(d.getTime())) return '(ยังไม่ระบุวันที่)';
  const day = d.getDate();
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;

  let res = '';
  if (mode === 'order') {
    res = `สั่ง ณ วันที่  ${day}  เดือน  ${month}  พ.ศ.  ${year}`;
  } else if (mode === 'full') {
    res = `วันที่  ${day}  เดือน  ${month}  พ.ศ.  ${year}`;
  } else if (mode === 'external') {
    res = `${day}  ${month}  ${year}`;
  } else {
    // memo format
    res = `${day}  ${month}  ${year}`;
  }
  return formatDocDigits(res, digitType);
}

export function thaiDate(value: string, digitType: 'thai' | 'arabic' = 'thai') {
  return thaiGovDate(value, digitType, 'memo');
}

export function formatSignatoryName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/([^\s])\s+([^\s])/g, '$1  $2');
}

export function sanitizeFieldText(text: string, keyword?: string): string {
  let clean = (text || '').trim().replace(/[ \t]{3,}/g, '  ');
  if (keyword) {
    const regex = new RegExp(`^${keyword}\\s*`, 'i');
    clean = clean.replace(regex, '').trim();
  }
  return clean;
}

const escape = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const lines = (v: unknown) => escape(v).replace(/\n/g, '<br>');

export function orderBlocks(paragraphs: string[]) {
  const blocks: string[] = [];
  for (const raw of paragraphs.join("\n").split("\n")) {
    const line = raw.trim().replace(/[ \t]{2,}/g, " ");
    if (!line) continue;
    if (!blocks.length || /^(?:[๐-๙0-9]+\.|หน้าที่|ดังนั้น|ให้คณะกรรมการ|ทั้งนี้|สั่ง ณ)/.test(line)) {
      blocks.push(line);
    } else {
      blocks[blocks.length - 1] += " " + line;
    }
  }
  return blocks;
}

export function parseCommitteeRow(text: string) {
  const match = text.match(/^([๐-๙0-9]+\.\s*.+?)\s{2,}(.+)$/) ||
                text.match(/^([๐-๙0-9]+\.\s*.+?)\s+(ประธานกรรมการ|รองประธานกรรมการ|กรรมการและ(?:ผู้ช่วย)?เลขานุการ|กรรมการ|ที่ปรึกษา)$/);
  if (match) {
    return { isMember: true, name: match[1].trim(), role: match[2].trim() };
  }
  return { isMember: false, name: text, role: '' };
}

export function parseAttachmentRow(text: string) {
  const match = text.match(/^([๐-๙0-9]+\.\s*.+?)\s+(จำนวน\s+[๐-๙0-9]+\s*ฉบับ|\d+\s*ฉบับ)$/);
  if (match) {
    return { item: match[1].trim(), qty: match[2].trim() };
  }
  return { item: text, qty: '' };
}

/**
 * Display formatted document number or pending placeholder
 */
export function getDisplayDocNumber(r: Partial<AdminDocRegistryRecord>): string {
  if (r.docNumber && r.docNumber.trim()) {
    return r.docNumber.trim();
  }
  return '(รอออกเลขหนังสือ)';
}

/**
 * HTML Preview and PDF printing template generator
 */
export function documentHtml(r: AdminDocRegistryRecord, origin: string, autoPrint = false) {
  const isMemo = r.category.startsWith('memo');
  const isOrder = r.category === 'order';
  const recipients = r.recipients?.filter(x => x.trim()) || [];
  const targets = r.category === 'external_circular' && recipients.length ? recipients : [r.to || ''];
  const digitType = getRecordDigitType(r);
  const displayDigits = (t: string) => formatDocDigits(t, digitType);

  const formattedSignatory = formatSignatoryName(r.signedByName || r.signatoryName || '');
  const signatoryPos = r.signedByPosition || r.signatoryPosition || '';
  const cleanSubject = sanitizeFieldText(r.subject, 'เรื่อง');
  const cleanReference = sanitizeFieldText(r.referenceDoc || '', 'อ้างถึง');
  const displayNum = getDisplayDocNumber(r);
  const formattedOrderNum = isOrder
    ? displayNum.replace(/^ที่\s*/, 'ที่  ').replace(/([๐-๙0-9]+)\s*\/\s*([๐-๙0-9]+)/, '$1  /$2')
    : displayNum;

  const lineStyle = r.headerLineStyle || 'dot_leader';
  const lineVis = {
    govOrg: r.lineVisibility?.govOrg ?? true,
    docNumber: r.lineVisibility?.docNumber ?? true,
    docDate: r.lineVisibility?.docDate ?? true,
    subject: r.lineVisibility?.subject ?? true
  };

  const getLineClass = (visible: boolean) => {
    if (!visible || lineStyle === 'none') return '';
    if (lineStyle === 'dotted') return 'border-dotted';
    if (lineStyle === 'solid') return 'border-solid';
    return '';
  };

  const isLetter = r.paperSize === 'letter';

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>${escape(displayDigits(displayNum))} ${escape(cleanSubject)}</title>
  <style>
    @font-face {
      font-family: 'THSarabunPSK';
      src: url('${escape(origin)}/templates/admin/fonts/THSarabunPSK-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'THSarabunPSK';
      src: url('${escape(origin)}/templates/admin/fonts/THSarabunPSK-Bold.ttf') format('truetype');
      font-weight: bold;
      font-style: normal;
    }
    @page {
      size: ${isLetter ? 'letter portrait' : 'A4 portrait'};
      margin: 25mm 20mm 20mm 30mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #000;
      background: #f1f5f9;
      font-family: 'THSarabunPSK', 'Sarabun', sans-serif;
      font-size: 16pt;
      line-height: 1.25;
      -webkit-font-smoothing: antialiased;
    }
    .print-bar {
      text-align: center;
      padding: 12px;
      background: #0f172a;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .print-btn {
      background: #1e3a8a;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      font-family: inherit;
    }
    .print-btn:hover { background: #1e40af; }
    article {
      background: white;
      width: ${isLetter ? '216mm' : '210mm'};
      min-height: ${isLetter ? '279mm' : '297mm'};
      padding: 25mm 20mm 20mm 30mm;
      margin: 20px auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      position: relative;
      overflow-wrap: break-word;
    }
    article + article { break-before: page; }
    .garuda-memo {
      position: absolute;
      left: 0;
      top: 0;
      height: 15mm;
      width: auto;
    }
    .garuda-center {
      display: block;
      height: 30mm;
      width: auto;
      margin: 0 auto 3mm;
    }
    .memohead {
      position: relative;
      height: 18mm;
      text-align: center;
      font-size: 29pt;
      font-weight: bold;
      line-height: 35pt;
      margin-bottom: 2mm;
    }
    .memo-row {
      display: flex;
      padding: 0.5mm 0;
      line-height: 1.35;
      min-height: 7mm;
      align-items: baseline;
    }
    .memo-row.border-dotted { border-bottom: 1px dotted #333; }
    .memo-row.border-solid { border-bottom: 1px solid #333; }
    .memo-row b { font-size: 20pt; margin-right: 2mm; white-space: nowrap; flex-shrink: 0; }
    .memo-row .val-text { font-size: 16pt; }
    .leader-dots {
      flex: 1;
      margin-left: 2mm;
      border-bottom: 1.5px dotted #333;
      min-width: 4mm;
      height: 0;
      align-self: baseline;
    }
    .split-memo { display: flex; justify-content: space-between; gap: 4mm; }
    .split-memo > div:first-child { width: 52%; }
    .split-memo > div:last-child { width: 48%; }
    .body-para {
      text-indent: 25mm;
      text-align: justify;
      text-justify: inter-cluster;
      margin: 3mm 0;
      line-height: 1.35;
    }
    .signature-container {
      margin-top: 10mm;
      margin-left: auto;
      text-align: center;
      width: 80mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sig-img {
      max-height: 18mm;
      max-width: 50mm;
      object-fit: contain;
      margin: 0 auto 2mm auto;
      display: block;
    }
    .footer-memo {
      position: absolute;
      bottom: 12mm;
      left: 30mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      font-size: 11pt;
      color: #64748b;
    }
    @media print {
      body { background: white; }
      .print-bar { display: none; }
      article { margin: 0; box-shadow: none; width: 100%; min-height: 100vh; padding: 0; }
    }
  </style>
</head>
<body ${autoPrint ? 'onload="window.print();"' : ''}>
  ${!autoPrint ? `
  <div class="print-bar">
    <button class="print-btn" onclick="window.print();">พิมพ์เอกสาร / บันทึกเป็น PDF</button>
  </div>
  ` : ''}

  ${targets.map((targetTo, targetIdx) => `
  <article>
    ${isMemo ? `
      <div class="memohead">
        <img class="garuda-memo" src="${garudaPath(r.category)}" alt="ครุฑ" />
        บันทึกข้อความ
      </div>

      <div class="memo-row ${getLineClass(lineVis.govOrg)}">
        <b>ส่วนราชการ</b>
        <span class="val-text">${escape(displayDigits(r.from))}</span>
        ${lineVis.govOrg && lineStyle === 'dot_leader' ? '<span class="leader-dots"></span>' : ''}
      </div>

      <div class="split-memo">
        <div class="memo-row ${getLineClass(lineVis.docNumber)}">
          <b>ที่</b>
          <span class="val-text">${escape(displayDigits(displayNum))}</span>
          ${lineVis.docNumber && lineStyle === 'dot_leader' ? '<span class="leader-dots"></span>' : ''}
        </div>
        <div class="memo-row ${getLineClass(lineVis.docDate)}">
          <b>วันที่</b>
          <span class="val-text">${escape(thaiGovDate(r.date, digitType, 'memo'))}</span>
          ${lineVis.docDate && lineStyle === 'dot_leader' ? '<span class="leader-dots"></span>' : ''}
        </div>
      </div>

      <div class="memo-row ${getLineClass(lineVis.subject)}">
        <b>เรื่อง</b>
        <span class="val-text" style="font-weight: bold;">${escape(displayDigits(cleanSubject))}</span>
        ${lineVis.subject && lineStyle === 'dot_leader' ? '<span class="leader-dots"></span>' : ''}
      </div>

      <div class="memo-row">
        <b>เรียน</b>
        <span class="val-text">${escape(displayDigits(targetTo || r.to))}</span>
      </div>
    ` : isOrder ? `
      <img class="garuda-center" src="${garudaPath(r.category)}" alt="ครุฑ" />
      <div style="text-align: center; font-weight: bold; font-size: 18pt; line-height: 1.35; margin-bottom: 3mm;">
        <div>คำสั่ง${escape(displayDigits(r.from.startsWith('คำสั่ง') ? r.from.slice(6) : r.from))}</div>
        <div style="margin: 1mm 0;">${escape(displayDigits(formattedOrderNum))}</div>
        <div>เรื่อง  ${escape(displayDigits(cleanSubject))}</div>
        <div style="border-bottom: 1.5px dashed #000; width: 60%; margin: 4mm auto 5mm auto;"></div>
      </div>
    ` : `
      <img class="garuda-center" src="${garudaPath(r.category)}" alt="ครุฑ" />
      <div style="display: flex; justify-content: space-between; font-size: 16pt; margin-bottom: 2mm;">
        <div>${escape(displayDigits(displayNum))}</div>
        <div style="text-align: left; white-space: pre-line; line-height: 1.25; font-size: 15pt;">
          ${escape(displayDigits(r.officeAddress || r.from))}
        </div>
      </div>
      <div style="text-align: center; margin: 3mm 0; font-size: 16pt;">
        ${escape(thaiGovDate(r.date, digitType, 'external'))}
      </div>
      <div style="display: flex; margin: 1mm 0;"><b style="width: 20mm;">เรื่อง</b><span>${escape(displayDigits(cleanSubject))}</span></div>
      <div style="display: flex; margin: 1mm 0;"><b style="width: 20mm;">เรียน</b><span>${escape(displayDigits(targetTo || r.to))}</span></div>
    `}

    ${cleanReference ? `
      <div style="display: flex; margin: 1mm 0;"><b style="width: 20mm;">อ้างถึง</b><span>${escape(displayDigits(cleanReference))}</span></div>
    ` : ''}

    ${(r.attachmentsList || []).length > 0 ? `
      <div style="margin: 1.5mm 0;">
        ${(r.attachmentsList || []).map((att, i) => `
          <div style="display: flex;">
            <b style="width: 28mm;">${i === 0 ? 'สิ่งที่ส่งมาด้วย' : ''}</b>
            <span>${displayDigits(String(i + 1))}. ${escape(displayDigits(att))}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div style="margin-top: 4mm;">
      ${(r.bodyParagraphs || []).map(p => {
        if (isOrder) {
          const mem = parseCommitteeRow(p);
          if (mem.isMember) {
            return `<div style="display: flex; justify-content: space-between; padding-left: 35mm; padding-right: 5mm; margin: 0.5mm 0; line-height: 1.35;">
              <span>${escape(displayDigits(mem.name))}</span>
              <span>${escape(displayDigits(mem.role))}</span>
            </div>`;
          }
          if (/^[๐-๙0-9]+\.\s*คณะกรรมการ/.test(p)) {
            return `<div style="padding-left: 25mm; font-weight: bold; margin: 3mm 0 1.5mm; line-height: 1.35;">${escape(displayDigits(p))}</div>`;
          }
          if (p === 'หน้าที่' || p.startsWith('หน้าที่')) {
            const dutyText = p.startsWith('หน้าที่') ? p : 'หน้าที่';
            return `<div style="padding-left: 25mm; font-weight: bold; margin: 2mm 0 1mm; line-height: 1.35;">${escape(displayDigits(dutyText))}</div>`;
          }
          if (p.startsWith('สั่ง ณ วันที่')) {
            return `<div style="padding-left: 45mm; margin: 5mm 0 3mm; line-height: 1.35;">${escape(displayDigits(p))}</div>`;
          }
        }
        return `<div class="body-para">${escape(displayDigits(p))}</div>`;
      }).join('')}
    </div>

    <div class="signature-container">
      ${!isMemo && !isOrder ? '<p style="margin-bottom: 6mm;">ขอแสดงความนับถือ</p>' : ''}
      ${r.signatureUrl ? `
        <img class="sig-img" src="${r.signatureUrl}" alt="ลายเซ็น" />
      ` : '<div style="height: 14mm;"></div>'}
      <p style="font-weight: bold; margin: 1mm 0;">(${escape(displayDigits(formattedSignatory))})</p>
      <p style="font-size: 15pt; margin: 0; white-space: pre-line; line-height: 1.2;">${escape(displayDigits(signatoryPos))}</p>
    </div>

    ${r.coordinatorInfo ? `
      <div style="margin-top: 10mm; font-size: 14pt; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 2mm; white-space: pre-line;">
        ${escape(displayDigits(r.coordinatorInfo))}
      </div>
    ` : ''}

    ${isMemo ? `
      <div class="footer-memo">
        <span></span>
        <span>${displayDigits(String(targetIdx + 1))}</span>
      </div>
    ` : ''}
  </article>
  `).join('')}
</body>
</html>`;
}

export function openDocument(r: AdminDocRegistryRecord, autoPrint = false) {
  const preview = window.open('', '_blank');
  if (!preview) {
    throw new Error('กรุณาอนุญาตหน้าต่างใหม่ (Pop-up) เพื่อดูและพิมพ์เอกสาร');
  }
  preview.document.open();
  preview.document.write(documentHtml(r, window.location.origin, autoPrint));
  preview.document.close();
}

export function exportAdminPdf(r: AdminDocRegistryRecord) {
  openDocument(r, true);
}

/**
 * High-fidelity Word (.docx) builder
 */
export async function buildAdminWord(r: AdminDocRegistryRecord): Promise<Blob> {
  if (r.action === 'รอลงนาม') {
    throw new Error('เอกสารอยู่ในขั้นตอน "รอลงนาม" ไม่อนุญาตให้ดาวน์โหลดไฟล์ Word เพื่อป้องกันการแก้ไขก่อนลงนาม');
  }

  const {
    Document, Paragraph, TextRun, ImageRun, Packer, AlignmentType, Table, TableRow, TableCell,
    BorderStyle, WidthType, LineRuleType, VerticalAlign, TabStopType,
    Footer, Header
  } = await import('docx');

  // Load garuda image
  let garudaBytes: ArrayBuffer | null = null;
  try {
    const res = await fetch(garudaPath(r.category));
    if (res.ok) garudaBytes = await res.arrayBuffer();
  } catch (err) {
    console.warn('Garuda image load warning:', err);
  }

  // Load signature image if present
  let signatureBytes: ArrayBuffer | null = null;
  if (r.signatureUrl) {
    try {
      if (r.signatureUrl.startsWith('data:image/')) {
        const base64Data = r.signatureUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        signatureBytes = bytes.buffer;
      } else {
        const res = await fetch(r.signatureUrl);
        if (res.ok) signatureBytes = await res.arrayBuffer();
      }
    } catch (err) {
      console.warn('Signature image load warning in Word export:', err);
    }
  }

  const font = 'TH SarabunPSK';
  const digitType = getRecordDigitType(r);
  const display = (text: string) => formatDocDigits(text, digitType);
  const formattedSignatory = formatSignatoryName(r.signedByName || r.signatoryName || '');
  const signatoryPos = r.signedByPosition || r.signatoryPosition || '';
  const cleanSubject = sanitizeFieldText(r.subject, 'เรื่อง');
  const cleanReference = sanitizeFieldText(r.referenceDoc || '', 'อ้างถึง');
  const displayNum = getDisplayDocNumber(r);
  const isMemo = r.category.startsWith('memo');
  const isOrder = r.category === 'order';
  const formattedOrderNum = isOrder
    ? displayNum.replace(/^ที่\s*/, 'ที่  ').replace(/([๐-๙0-9]+)\s*\/\s*([๐-๙0-9]+)/, '$1  /$2')
    : displayNum;
  const isLetter = r.paperSize === 'letter';

  const pageWidth = isLetter ? 12240 : 11906;
  const pageHeight = isLetter ? 15840 : 16838;
  const border = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

  const recipients = r.recipients?.filter(x => x.trim()) || [];
  const targets = r.category === 'external_circular' && recipients.length ? recipients : [r.to || ''];

  const run = (text: string, bold = false, size = 32) =>
    new TextRun({
      text: display(text),
      font,
      size,
      bold,
      sizeComplexScript: size,
      language: { value: 'th-TH' }
    });

  const para = (text: string, opts: Record<string, unknown> = {}) =>
    new Paragraph({
      children: text.split('\n').flatMap((line, i) => [
        ...(i ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
        run(line)
      ]),
      spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 60 },
      ...opts
    });

  const body = (text: string) =>
    para(text, {
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 1417 }, // 2.5 cm
      spacing: { line: 360, lineRule: LineRuleType.EXACT, before: 60, after: 60 }
    });

  // Signature block
  const signatureParagraphs = [
    ...(signatureBytes ? [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        indent: { left: 4536 },
        children: [
          new ImageRun({
            type: 'png',
            data: signatureBytes,
            transformation: { width: 140, height: 48 }
          })
        ],
        spacing: { before: 240, after: 60 },
        keepNext: true
      })
    ] : []),
    para('(' + formattedSignatory + ')', {
      alignment: AlignmentType.CENTER,
      indent: { left: 4536 },
      keepNext: true,
      spacing: { before: signatureBytes ? 60 : (isOrder ? 1400 : 1000), after: 0, line: 360, lineRule: LineRuleType.EXACT }
    }),
    para(signatoryPos.replace(/ ปฏิบัติราชการแทน /, ' ปฏิบัติราชการแทน\n').replace(/ รักษาราชการแทน /, ' รักษาราชการแทน\n'), {
      alignment: AlignmentType.CENTER,
      indent: { left: 4536 },
      keepLines: true,
      spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0 }
    })
  ];

  if (isMemo) {
    const dotted = { style: BorderStyle.DOTTED, size: 4, color: '000000' };
    const solid = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
    const lineBorder = r.headerLineStyle === 'solid' ? solid : r.headerLineStyle === 'none' ? undefined : dotted;

    const field = (label: string, value: string, applyBorder = false) =>
      new Paragraph({
        children: [
          new TextRun({ text: label + '  ', font, size: 40, bold: true, sizeComplexScript: 40, language: { value: 'th-TH' } }),
          new TextRun({ text: display(value), font, size: 32, sizeComplexScript: 32, language: { value: 'th-TH' } })
        ],
        spacing: { line: 452, lineRule: LineRuleType.EXACT, after: 0 },
        border: applyBorder && lineBorder ? { bottom: lineBorder } : undefined
      });

    const memoPair = (left: InstanceType<typeof Paragraph>, right: InstanceType<typeof Paragraph>, leftWidth = 54) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: leftWidth, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.BOTTOM, children: [left] }),
              new TableCell({ width: { size: 100 - leftWidth, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.BOTTOM, children: [right] })
            ]
          })
        ]
      });

    const memoSections = targets.map((to, targetIdx) => ({
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: { top: 1417, left: 1701, right: 1134, bottom: 1134 } // 2.5cm top, 3.0cm left, 2.0cm right, 2.0cm bottom
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
                    new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: display(String(targetIdx + 1)), font, size: 24, language: { value: 'th-TH' } })] })] })
                  ]
                })
              ]
            })
          ]
        })
      },
      children: [
        memoPair(
          new Paragraph({
            children: garudaBytes ? [new ImageRun({ type: 'jpg', data: garudaBytes, transformation: { width: 56, height: 48 } })] : [],
            spacing: { after: 0 }
          }),
          new Paragraph({
            children: [new TextRun({ text: 'บันทึกข้อความ', font, size: 58, bold: true, language: { value: 'th-TH' } })],
            spacing: { line: 700, lineRule: LineRuleType.EXACT, after: 0 }
          }),
          38
        ),
        field('ส่วนราชการ', r.from, r.lineVisibility?.govOrg ?? true),
        memoPair(
          field('ที่', displayNum, r.lineVisibility?.docNumber ?? true),
          field('วันที่', thaiGovDate(r.date, digitType, 'memo'), r.lineVisibility?.docDate ?? true)
        ),
        field('เรื่อง', cleanSubject, r.lineVisibility?.subject ?? true),
        para('เรียน  ' + to, { spacing: { before: 120, after: 120, line: 360, lineRule: LineRuleType.EXACT } }),
        ...(!cleanReference ? [] : [para('อ้างถึง  ' + cleanReference)]),
        ...(r.attachmentsList || []).map((item, i) => para((i === 0 ? 'สิ่งที่ส่งมาด้วย  ' : '                  ') + (i + 1) + '. ' + item)),
        ...(r.bodyParagraphs || []).map(p => para(p, { alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 1417 }, spacing: { line: 360, lineRule: LineRuleType.EXACT, before: p.startsWith('จึงเรียน') ? 120 : 60, after: 60 } })),
        ...signatureParagraphs,
        ...(r.coordinatorInfo ? [para(r.coordinatorInfo, { spacing: { before: 240, after: 0 } })] : [])
      ]
    }));

    return Packer.toBlob(new Document({ sections: memoSections }));
  }

  if (isOrder) {
    const orderBody = orderBlocks(r.bodyParagraphs || []).map(block => {
      const mem = parseCommitteeRow(block);
      if (mem.isMember) {
        return new Paragraph({
          children: [run(mem.name), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(mem.role)],
          indent: { left: 1984 },
          tabStops: [{ type: TabStopType.LEFT, position: 6520 }],
          spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0 },
          keepLines: true
        });
      }
      if (/^[๐-๙0-9]+\.\s*คณะกรรมการ/.test(block) || block === 'หน้าที่' || block.startsWith('หน้าที่')) {
        return new Paragraph({
          children: [run(block, true)],
          indent: { left: 1417 },
          spacing: { before: 120, after: 60, line: 360, lineRule: LineRuleType.EXACT },
          keepNext: true
        });
      }
      if (block.startsWith('สั่ง ณ วันที่')) {
        return new Paragraph({
          children: [run(block)],
          indent: { left: 2835 },
          spacing: { before: 180, after: 60, line: 360, lineRule: LineRuleType.EXACT },
          keepNext: true
        });
      }
      return body(block);
    });

    const hasDateInBody = orderBlocks(r.bodyParagraphs || []).some(b => b.startsWith('สั่ง ณ วันที่'));

    const orderSections = [{
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: { top: 1417, right: 1134, bottom: 1134, left: 1701 }
        }
      },
      children: [
        ...(garudaBytes ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({ type: 'png', data: garudaBytes, transformation: { width: 101, height: 113 } })],
            spacing: { after: 60 },
            keepNext: true
          })
        ] : []),
        new Paragraph({ children: [run('คำสั่ง' + (r.from.startsWith('คำสั่ง') ? r.from.slice(6) : r.from), true)], alignment: AlignmentType.CENTER, spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0 }, keepNext: true }),
        new Paragraph({ children: [run(formattedOrderNum, true)], alignment: AlignmentType.CENTER, spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0 }, keepNext: true }),
        new Paragraph({ children: [run('เรื่อง  ' + cleanSubject, true)], alignment: AlignmentType.CENTER, spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0 }, keepNext: true }),
        new Paragraph({ children: [run('------------------------------------------------------------')], alignment: AlignmentType.CENTER, spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 120 }, keepNext: true }),
        ...orderBody,
        ...(!hasDateInBody ? [new Paragraph({ children: [run(thaiGovDate(r.date, digitType, 'order'))], indent: { left: 2835 }, spacing: { before: 180, after: 60, line: 360, lineRule: LineRuleType.EXACT }, keepNext: true })] : []),
        ...signatureParagraphs,
        ...(r.coordinatorInfo ? [para(r.coordinatorInfo)] : [])
      ]
    }];

    return Packer.toBlob(new Document({ sections: orderSections }));
  }

  // External correspondence & Custom layouts
  const extField = (label: string, text: string, indent = 720) =>
    new Paragraph({
      children: [run(label), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(text)],
      indent: { left: indent, hanging: indent },
      tabStops: [{ type: TabStopType.LEFT, position: indent }],
      spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 60 }
    });

  const extSections = targets.map(to => ({
    properties: {
      page: {
        size: { width: pageWidth, height: pageHeight },
        margin: { top: 1417, right: 1134, bottom: 1134, left: 1701 }
      }
    },
    children: [
      ...(garudaBytes ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ type: 'png', data: garudaBytes, transformation: { width: 107, height: 113 } })],
          spacing: { line: 1, lineRule: LineRuleType.EXACT, after: 60 }
        })
      ] : []),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [para(displayNum)] }),
              new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [para(r.officeAddress || r.from, { spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0 } })] })
            ]
          })
        ]
      }),
      para(thaiGovDate(r.date, digitType, 'external'), { indent: { left: 4320 }, spacing: { before: 120, after: 120, line: 360, lineRule: LineRuleType.EXACT } }),
      extField('เรื่อง', cleanSubject),
      extField('เรียน', to),
      ...(cleanReference ? [extField('อ้างถึง', cleanReference)] : []),
      ...(r.attachmentsList || []).map((item, i) => extField(i === 0 ? 'สิ่งที่ส่งมาด้วย' : '', (i + 1) + '. ' + item, 1417)),
      ...(r.bodyParagraphs || []).map(body),
      para('ขอแสดงความนับถือ', { alignment: AlignmentType.CENTER, indent: { left: 4536 }, keepNext: true, spacing: { before: 180, after: 0, line: 360, lineRule: LineRuleType.EXACT } }),
      ...signatureParagraphs,
      ...(r.coordinatorInfo ? [para(r.coordinatorInfo, { spacing: { before: 240, after: 0, line: 360, lineRule: LineRuleType.EXACT } })] : [])
    ]
  }));

  return Packer.toBlob(new Document({ sections: extSections }));
}

export async function exportAdminWord(r: AdminDocRegistryRecord) {
  const blob = await buildAdminWord(r);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileNameNum = (r.docNumber || 'ฉบับร่าง').replace(/[\\/:*?"<>|]/g, '-');
  a.download = `${fileNameNum}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import type { AdminDocCategory, AdminDocRegistryRecord } from './types';
import { INDENT_STEP_MM, INDENT_STEP_TWIPS, getBodyBlocks, newBlock, type RichBlock } from './richBody';
import { A4_MM, A4_TWIPS, cssMargin, getTemplateSpec, mmToTwips, wordMargin } from './adminTemplateSpec';

export function garudaPath(category: string, garudaImage?: string) {
  if (garudaImage) return garudaImage;
  if (category.startsWith('memo')) return '/templates/admin/garuda-memo.png';
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
    res = `สั่ง ณ วันที่ ${day} เดือน ${month} พ.ศ. ${year}`;
  } else if (mode === 'full') {
    res = `วันที่ ${day} เดือน ${month} พ.ศ. ${year}`;
  } else if (mode === 'external') {
    res = `${day} ${month} ${year}`;
  } else {
    // memo format
    res = `${day} ${month} ${year}`;
  }
  return formatDocDigits(res, digitType);
}

export function thaiDate(value: string, digitType: 'thai' | 'arabic' = 'thai') {
  return thaiGovDate(value, digitType, 'memo');
}

export function formatSignatoryName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\s+/g, ' ');
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
    if (!blocks.length || /^(?:[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]|หน้าที่|ดังนั้น|ให้คณะกรรมการ|ทั้งนี้|สั่ง ณ)/.test(line)) {
      blocks.push(line);
    } else {
      blocks[blocks.length - 1] += " " + line;
    }
  }
  return blocks;
}

/**
 * แบ่งเนื้อหาคำสั่งเป็นรายการพร้อมข้อความล้วนสำหรับจัดประเภท (หัวข้อ/รายชื่อกรรมการ/หน้าที่)
 * ใช้ร่วมกันทั้ง Preview และ Word เพื่อให้ผลตรงกัน
 */
export function orderItems(blocks: RichBlock[]): { text: string; block: RichBlock }[] {
  const out: { text: string; block: RichBlock }[] = [];
  for (const b of blocks) {
    const ls = orderBlocks([b.text]);
    if (ls.length === 1 && ls[0] === b.text.trim().replace(/[ \t]{2,}/g, ' ')) {
      out.push({ text: ls[0], block: b });
    } else {
      for (const l of ls) out.push({ text: l, block: newBlock(l, { align: b.align, firstLine: b.firstLine, indent: b.indent }) });
    }
  }
  return out;
}

export function parseCommitteeRow(text: string) {
  const match = text.match(/^([๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*.+?)\s{2,}(.+)$/) ||
                text.match(/^([๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*.+?)\s*(ประธานกรรมการ|รองประธานกรรมการ|กรรมการและ(?:ผู้ช่วย)?เลขานุการ|ผู้ช่วยเลขานุการ|กรรมการ|ที่ปรึกษา)$/);
  if (match) {
    return { isMember: true, name: match[1].trim(), role: match[2].trim() };
  }
  return { isMember: false, name: text, role: '' };
}

export function parseAttachmentRow(text: string) {
  const numMatch = text.match(/^([๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*)(.*)$/);
  const core = numMatch ? numMatch[2].trim() : text.trim();
  const qtyMatch = core.match(/^(.*?)\s{2,}(.*?)$/) ||
                   core.match(/^(.*?)\s+(จำนวน\s+[๐-๙0-9]+\s*ฉบับ|\d+\s*ฉบับ|[๐-๙0-9]+\s*ชุด|จำนวน\s+[๐-๙0-9]+\s*ชุด)$/);
  if (qtyMatch) {
    return { item: qtyMatch[1].trim(), qty: qtyMatch[2].trim() };
  }
  return { item: core, qty: '' };
}

export function getCategoryDocPrefix(category = 'memo'): string {
  if (category === 'memo_circular') return 'อว 0646.02/ว ';
  if (category === 'memo') return 'อว 0646.02/';
  if (category === 'external_circular') return 'ที่ อว 0646.02/ว ';
  if (category === 'external') return 'ที่ อว 0646.02/';
  if (category === 'order') return 'ที่ ';
  return 'อว 0646.02/';
}

/**
 * Display formatted document number with permanent category prefix.
 * Trailing sequence number is appended when available.
 */
export function getDisplayDocNumber(r: Partial<AdminDocRegistryRecord>): string {
  const category = r.category || 'memo';
  const prefix = getCategoryDocPrefix(category);
  const raw = (r.docNumber || '').trim();

  // If order category
  if (category === 'order') {
    if (raw && !raw.startsWith('(')) {
      return raw.startsWith('ที่') ? raw : `ที่ ${raw}`;
    }
    const yearStr = r.year ? String(r.year) : (r.date ? String(Number(r.date.slice(0, 4)) + 543) : '๒๕๖๙');
    return `ที่      /${yearStr}`;
  }

  // If empty or placeholder like (รอออกเลข...)
  if (!raw || raw.startsWith('(')) {
    return prefix;
  }

  // If raw already contains slash or faculty code
  if (raw.includes('/') || raw.includes('อว')) {
    let clean = raw;
    if (category.startsWith('memo') && clean.startsWith('ที่')) {
      clean = clean.replace(/^ที่\s*/, '');
    }
    return clean;
  }

  // If raw is just sequence number e.g. "1741" or "๑๗๔๑"
  return `${prefix}${raw}`;
}

/**
 * HTML Preview and PDF printing template generator
 */
export function documentHtml(r: AdminDocRegistryRecord, origin: string, autoPrint = false) {
  const isMemo = r.category.startsWith('memo');
  const isOrder = r.category === 'order';
  const recipients = r.recipients?.filter(x => x.trim()) || [];
  const targets = (r.category === 'external_circular' || r.category === 'memo_circular') && recipients.length ? recipients : [r.to || ''];
  const digitType = getRecordDigitType(r);
  const displayDigits = (t: string) => formatDocDigits(t, digitType);

  const formattedSignatory = formatSignatoryName(r.signedByName || r.signatoryName || '');
  const signatoryPos = r.signedByPosition || r.signatoryPosition || '';
  const cleanSubject = sanitizeFieldText(r.subject, 'เรื่อง');
  const cleanReference = sanitizeFieldText(r.referenceDoc || '', 'อ้างถึง');
  const displayNum = getDisplayDocNumber(r);
  const formattedOrderNum = displayNum;

  const lineStyle = r.headerLineStyle || 'dot_leader';
  const lineVis = {
    govOrg: r.lineVisibility?.govOrg ?? true,
    docNumber: r.lineVisibility?.docNumber ?? true,
    docDate: r.lineVisibility?.docDate ?? true,
    subject: r.lineVisibility?.subject ?? true
  };

  const getLineClass = (visible: boolean) => {
    if (!visible || lineStyle === 'none') return '';
    if (lineStyle === 'solid') return 'border-solid';
    return 'border-dotted';
  };

  const bodyBlocks = getBodyBlocks(r);
  const bodyItems = isOrder ? orderItems(bodyBlocks) : bodyBlocks.map(b => ({ text: b.text, block: b }));
  const richRunsHtml = (b: RichBlock) =>
    b.runs.map(run => {
      let t = escape(displayDigits(run.text)).replace(/\n/g, '<br>');
      if (run.bold) t = `<strong>${t}</strong>`;
      if (run.italic) t = `<em>${t}</em>`;
      if (run.underline) t = `<u>${t}</u>`;
      return t;
    }).join('') || '&nbsp;';
  const bodyParaHtml = (b: RichBlock) =>
    `<div class="body-para" style="text-align: ${b.align};${b.firstLine ? '' : ' text-indent: 0;'}${b.indent ? ` margin-left: ${b.indent * INDENT_STEP_MM}mm;` : ''}">${richRunsHtml(b)}</div>`;
  const spec = getTemplateSpec(r.category);
  const letter = spec.letter;
  const pageMargin = cssMargin(spec.margins);
  const firstTopMm = spec.firstPageTop;
  const MEMO_GARUDA_TOP_MM = 10; // ตราครุฑบันทึกข้อความอยู่สูงจากขอบกระดาษ 1 ซม. ตามต้นฉบับ

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>${escape(displayDigits(displayNum))} ${escape(cleanSubject)}</title>
  <style>
    @font-face {
      font-family: 'THSarabunPSK';
      src: local('TH SarabunPSK'), local('THSarabunPSK'), url('${escape(origin)}/templates/admin/fonts/THSarabunPSK-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'THSarabunPSK';
      src: local('TH SarabunPSK Bold'), local('THSarabunPSK-Bold'), local('TH SarabunPSK'), url('${escape(origin)}/templates/admin/fonts/THSarabunPSK-Bold.ttf') format('truetype');
      font-weight: bold;
      font-style: normal;
    }
    @page {
      size: A4 portrait;
      /* ระยะขอบตามต้นฉบับของประเภทเอกสาร ใช้กับทุกหน้า ไม่ใช่เฉพาะหน้าแรก */
      margin: ${pageMargin};
      ${isMemo ? `
      @bottom-left { content: 'CPRU-66-001'; font-family: 'THSarabunPSK', 'Sarabun', sans-serif; font-size: 15pt; vertical-align: bottom; padding-bottom: 15mm; }
      @bottom-right { content: counter(page${digitType === 'thai' ? ', thai' : ''}); font-family: 'THSarabunPSK', 'Sarabun', sans-serif; font-size: 15pt; vertical-align: bottom; padding-bottom: 15mm; }
      ` : ''}
    }
    article { page: doc; }
    @page doc { size: A4 portrait; margin: ${pageMargin}; }
    ${firstTopMm !== undefined ? `@page doc:first { margin-top: ${MEMO_GARUDA_TOP_MM}mm; }` : ''}
    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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
    .print-hint {
      display: inline-block;
      margin-left: 16px;
      color: #94a3b8;
      font-size: 12px;
      font-family: 'Sarabun', sans-serif;
      vertical-align: middle;
    }
    article {
      background: white;
      width: ${A4_MM.width}mm;
      min-height: ${A4_MM.height}mm;
      padding: ${firstTopMm !== undefined ? `${firstTopMm}mm ${spec.margins.right}mm ${spec.margins.bottom}mm ${spec.margins.left}mm` : pageMargin};
      margin: 20px auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      position: relative;
      overflow-wrap: break-word;
    }
    article + article { break-before: page; }
    .garuda-memo {
      position: absolute;
      left: 0;
      top: -${(firstTopMm ?? MEMO_GARUDA_TOP_MM) - MEMO_GARUDA_TOP_MM}mm;
      width: 14.9mm;
      height: 15.4mm;
      object-fit: contain;
    }
    .garuda-center {
      display: block;
      width: 28.5mm;
      height: 30mm;
      margin: 0 auto 3mm;
      object-fit: contain;
    }
    .ext-header {
      position: relative;
      margin-bottom: 0;
    }
    .ext-header-left {
      position: absolute;
      left: 0;
      top: 27mm;
      width: 60mm;
      font-size: 16pt;
      line-height: 1.25;
    }
    .ext-header-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      text-align: center;
      width: 32mm;
    }
    .garuda-ext {
      width: 28.5mm;
      height: 30mm;
      display: block;
      margin: 0 auto;
      object-fit: contain;
    }
    .ext-header-right {
      margin-left: 101mm;
      padding-top: 27mm;
      min-height: 30mm;
      font-size: 16pt;
      line-height: 1.25;
      white-space: pre-line;
      text-align: left;
    }
    .ext-date {
      margin: 3mm 0 3mm 75mm;
      font-size: 16pt;
      line-height: 1.25;
    }
    .ext-row {
      display: flex;
      margin: 3.1mm 0 0;
      line-height: 1.25;
      font-size: 16pt;
    }
    .ext-label {
      width: 12.5mm;
      font-size: 16pt;
      font-weight: normal;
      flex-shrink: 0;
    }
    .ext-closing {
      margin-left: 40mm;
      width: 120mm;
      text-align: center;
      margin-top: 8mm;
      margin-bottom: 2mm;
      font-size: 16pt;
      line-height: 1.25;
    }
    .memohead {
      position: relative;
      height: 12mm;
      text-align: center;
      font-size: 29pt;
      font-weight: bold;
      line-height: 12mm;
      margin-bottom: 0;
    }
    .memo-row {
      display: flex;
      padding: 0;
      line-height: 1.4;
      align-items: baseline;
    }
    .memo-row b {
      font-size: 20pt;
      margin-right: 1.7mm;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .memo-label-regular {
      font-size: 16pt;
      font-weight: normal;
      margin-right: 0;
      width: 12.7mm;
      white-space: nowrap;
      flex-shrink: 0;
      color: #000;
    }
    .memo-val-line {
      flex: 1;
      display: flex;
      align-items: baseline;
      min-width: 0;
    }
    .memo-val-line.border-dotted {
      border-bottom: 1px dotted #555;
    }
    .memo-val-line.border-solid {
      border-bottom: 1px solid #333;
    }
    .val-text {
      font-size: 16pt;
      line-height: 1.25;
      white-space: pre-wrap;
    }
    .split-memo { display: flex; justify-content: space-between; gap: 4mm; }
    .split-memo > div:first-child { width: 52%; }
    .split-memo > div:last-child { width: 48%; }
    .body-para {
      text-indent: 25mm;
      text-align: justify;
      text-justify: inter-character;
      margin: 3mm 0;
      line-height: 1.35;
    }
    .signature-container {
      margin-top: 17mm;
      margin-left: 60mm;
      width: 100mm;
      text-align: center;
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
      bottom: 15mm;
      left: 30mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      font-size: 15pt;
      color: #000;
    }
    @media print {
      body { background: white; }
      .print-bar { display: none; }
      article {
        margin: 0;
        box-shadow: none;
        width: auto;
        min-height: 0;
        /* ระยะขอบมาตรฐานมาจาก @page แล้ว ห้ามใส่ padding ซ้ำ ไม่เช่นนั้นหน้าแรกจะขอบหนาเกินและเนื้อหาเลื่อน */
        padding: ${firstTopMm !== undefined ? `${firstTopMm - MEMO_GARUDA_TOP_MM}mm 0 0 0` : '0'};
      }
      .footer-memo { display: none; }
    }
  </style>
</head>
<body ${autoPrint ? 'onload="window.print();"' : ''}>
  ${!autoPrint ? `
  <div class="print-bar">
    <button class="print-btn" onclick="window.print();">พิมพ์เอกสาร / บันทึกเป็น PDF</button>
    <span class="print-hint">หากต้องการซ่อนวันที่/URL ที่ขอบกระดาษ: ในหน้าต่างพิมพ์ ให้ยกเลิก "ส่วนหัวและส่วนท้าย" (Headers and Footers)</span>
  </div>
  ` : ''}

  ${targets.map((targetTo, targetIdx) => `
  <article>
    ${isMemo ? `
      <div class="memohead">
        <img class="garuda-memo" src="${garudaPath(r.category)}" alt="ครุฑ" />
        บันทึกข้อความ
      </div>

      <div class="memo-row">
        <b>ส่วนราชการ</b>
        <div class="memo-val-line ${getLineClass(lineVis.govOrg)}">
          <span class="val-text">${escape(displayDigits(r.from))}</span>
        </div>
      </div>

      <div class="split-memo">
        <div class="memo-row">
          <b>ที่</b>
          <div class="memo-val-line ${getLineClass(lineVis.docNumber)}">
            <span class="val-text">${escape(displayDigits(displayNum))}</span>
          </div>
        </div>
        <div class="memo-row">
          <b>วันที่</b>
          <div class="memo-val-line ${getLineClass(lineVis.docDate)}">
            <span class="val-text">${escape(thaiGovDate(r.date, digitType, 'memo'))}</span>
          </div>
        </div>
      </div>

      <div class="memo-row">
        <b style="width: 12.7mm; margin-right: 0;">เรื่อง</b>
        <div class="memo-val-line ${getLineClass(lineVis.subject)}">
          <span class="val-text">${escape(displayDigits(cleanSubject))}</span>
        </div>
      </div>

      <div class="memo-row" style="margin-top: 0;">
        <span class="memo-label-regular">เรียน</span>
        <div class="memo-val-line">
          <span class="val-text">${escape(displayDigits(targetTo || r.to))}</span>
        </div>
      </div>
    ` : isOrder ? `
      <img class="garuda-center" src="${garudaPath(r.category)}" alt="ครุฑ" />
      <div style="text-align: center; font-weight: bold; font-size: 16pt; line-height: 1.35; margin-bottom: 3mm;">
        <div>คำสั่ง${escape(displayDigits((r.from || '').trim().replace(/^คำสั่ง\s*/, '')))}</div>
        <div>${escape(displayDigits(formattedOrderNum))}</div>
        <div style="padding-left: 25mm; text-indent: -25mm;">เรื่อง  ${escape(displayDigits(cleanSubject))}</div>
        <div style="font-size: 16pt;">........................................................</div>
      </div>
    ` : `
      <div class="ext-header">
        <div class="ext-header-left">
          ${escape(displayDigits(displayNum))}
        </div>
        <div class="ext-header-center" ${letter ? `style="left: ${letter.garuda.leftMm}mm; transform: none; width: ${letter.garuda.widthMm}mm;"` : ''}>
          <img class="garuda-ext" ${letter ? `style="width: ${letter.garuda.widthMm}mm; height: ${letter.garuda.heightMm}mm;"` : ''} src="${garudaPath(r.category)}" alt="ครุฑ" />
        </div>
        <div class="ext-header-right">${escape(displayDigits(r.officeAddress || r.from))}</div>
      </div>
      <div class="ext-date">
        ${escape(thaiGovDate(r.date, digitType, 'external'))}
      </div>
      <div class="ext-row"><b class="ext-label">เรื่อง</b><span>${escape(displayDigits(cleanSubject))}</span></div>
      <div class="ext-row"><b class="ext-label">เรียน</b><span>${escape(displayDigits(targetTo || r.to))}</span></div>
    `}

    ${cleanReference ? `
      <div class="ext-row"><b class="ext-label">อ้างถึง</b><span>${escape(displayDigits(cleanReference))}</span></div>
    ` : ''}

    ${(r.attachmentsList || []).length > 0 ? `
      <div style="margin: 1.2mm 0;">
        ${(r.attachmentsList || []).map((att, i) => {
          const parsed = parseAttachmentRow(att);
          return `<div class="ext-row" style="justify-content: space-between;${i > 0 ? ' margin-top: 0;' : ''}">
            <div style="display: flex;">
              <b class="ext-label" style="width: 25mm;">${i === 0 ? 'สิ่งที่ส่งมาด้วย' : ''}</b>
              <span>${displayDigits(String(i + 1))}. ${escape(displayDigits(parsed.item))}</span>
            </div>
            ${parsed.qty ? `<span style="text-align: right; margin-right: 10mm;">${escape(displayDigits(parsed.qty))}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    ` : ''}

    <div style="margin-top: 4mm;">
      ${bodyItems.map(({ text: p, block }) => {
        if (isOrder) {
          const mem = parseCommitteeRow(p);
          if (mem.isMember) {
            return `<div style="display: flex; padding-left: 32.5mm; margin: 0; line-height: 1.35;">
              <span style="width: 81.5mm; flex-shrink: 0;">${escape(displayDigits(mem.name))}</span>
              <span>${escape(displayDigits(mem.role))}</span>
            </div>`;
          }
          if (/^[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*คณะกรรมการ/.test(p)) {
            return `<div style="padding-left: 32.5mm; font-weight: bold; margin: 2mm 0 2mm; line-height: 1.35;">${escape(displayDigits(p))}</div>`;
          }
          if (p === 'หน้าที่' || p.startsWith('หน้าที่')) {
            const dutyText = p.startsWith('หน้าที่') ? p : 'หน้าที่';
            return `<div style="padding-left: 32.5mm; font-weight: bold; margin: 2mm 0 2mm; line-height: 1.35;">${escape(displayDigits(dutyText))}</div>`;
          }
          if (/^[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]/.test(p) && !mem.isMember) {
            return `<div style="padding-left: 32.5mm; margin: 0; line-height: 1.35;">${escape(displayDigits(p))}</div>`;
          }
          if (p.startsWith('สั่ง ณ วันที่')) {
            return `<div style="padding-left: 25.4mm; margin: 5mm 0 3mm; line-height: 1.35;">${escape(displayDigits(p))}</div>`;
          }
        }
        return bodyParaHtml(block);
      }).join('')}
      ${isOrder && !bodyItems.some(i => i.text.startsWith('สั่ง ณ วันที่')) ? `
        <div style="padding-left: 25.4mm; margin: 5mm 0 3mm; line-height: 1.35;">
          ${escape(displayDigits(thaiGovDate(r.date, digitType, 'order')))}
        </div>
      ` : ''}
    </div>

    ${!isMemo && !isOrder ? `<div class="ext-closing"${letter ? ` style="margin-top: ${(letter.closingGapMm + 0.2).toFixed(1)}mm;"` : ''}>ขอแสดงความนับถือ</div>` : ''}

    <div class="signature-container" ${!isMemo && !isOrder ? `style="margin-left: 40mm; width: 120mm; margin-top: ${letter ? (letter.signGapMm - 15).toFixed(1) : 9}mm;"` : isMemo ? 'style="margin-top: 20.5mm;"' : ''}>
      ${r.signatureUrl ? `
        <img class="sig-img" src="${r.signatureUrl}" alt="ลายเซ็น" />
      ` : '<div style="height: 14mm;"></div>'}
      <p style="font-size: 16pt; font-weight: normal; margin: 1.5mm 0; color: #000;">(${escape(displayDigits(formattedSignatory))})</p>
      <p style="font-size: 16pt; font-weight: normal; margin: 0; white-space: pre-line; line-height: 1.25; color: #000;">${escape(displayDigits(signatoryPos))}</p>
    </div>

    ${r.coordinatorInfo ? `
      <div style="margin-top: ${letter ? (letter.coordinatorGapMm - 7.3).toFixed(1) : 8}mm; font-size: ${letter ? 16 : 14}pt; line-height: ${letter ? 1.33 : 1.25}; white-space: pre-line;">
        ${escape(displayDigits(r.coordinatorInfo))}
      </div>
    ` : ''}

    ${isMemo ? `
      <div class="footer-memo">
        <span>CPRU-66-001</span>
        <span>${displayDigits(String(targetIdx + 1))}</span>
      </div>
    ` : ''}
  </article>
  `).join('')}
</body>
</html>`;
}

export function openDocument(r: AdminDocRegistryRecord, autoPrint = false) {
  const html = documentHtml(r, window.location.origin, autoPrint);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const preview = window.open(url, '_blank');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('กรุณาอนุญาตหน้าต่างใหม่ (Pop-up) เพื่อดูและพิมพ์เอกสาร');
  }
  // คืน memory หลังจากหน้าต่างโหลดเสร็จ
  preview.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
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
    BorderStyle, WidthType, LineRuleType, VerticalAlign, TabStopType, UnderlineType,
    Footer, Header, PageNumber, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType
  } = await import('docx');

  // Load garuda image
  let garudaBytes: ArrayBuffer | null = null;
  try {
    const rawPath = garudaPath(r.category);
    if (typeof window !== 'undefined') {
      const res = await fetch(rawPath);
      if (res.ok) garudaBytes = await res.arrayBuffer();
    } else {
      // In Node.js testing/CLI environment
      const fs = await import('fs');
      const path = await import('path');
      const localFile = path.join(process.cwd(), 'public', rawPath.replace(/^\//, ''));
      if (fs.existsSync(localFile)) {
        const buf = fs.readFileSync(localFile);
        garudaBytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      }
    }
  } catch (err) {
    // Graceful fallback if image is not accessible
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

  // ต้นฉบับใช้ระยะบรรทัดเดี่ยว (line=240 auto) ไม่ใช่ exact เพื่อให้ตัดบรรทัดและเว้นระยะเหมือน Word จริง
  const docStyles = { default: { document: { run: { font: { ascii: 'TH SarabunPSK', hAnsi: 'TH SarabunPSK', cs: 'TH SarabunPSK', eastAsia: 'TH SarabunPSK' }, size: 32, sizeComplexScript: 32 } } } };
  const SINGLE = { line: 240, lineRule: LineRuleType.AUTO } as const;
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
  // กึ่งกลางบล็อกลงนามตามต้นฉบับ: หนังสือภายนอก ~10 ซม. จากขอบซ้าย, บันทึกข้อความ/คำสั่ง ~10.5 ซม.
  const letterSpec = getTemplateSpec(r.category).letter;
  const sigIndent = isMemo || isOrder ? 2835 : 2268;
  const formattedOrderNum = displayNum;
  const pageWidth = A4_TWIPS.width;
  const pageHeight = A4_TWIPS.height;
  const pageMargins = wordMargin(getTemplateSpec(r.category).margins);
  const border = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

  const recipients = r.recipients?.filter(x => x.trim()) || [];
  const targets = (r.category === 'external_circular' || r.category === 'memo_circular') && recipients.length ? recipients : [r.to || ''];

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
      spacing: { ...SINGLE, after: 0 },
      ...opts
    });

  const alignMap = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.THAI_DISTRIBUTE
  } as const;

  const blockRuns = (b: RichBlock) => {
    const runs = b.runs.flatMap(rr => rr.text.split('\n').flatMap((line, i) => [
      ...(i ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
      ...(line ? [new TextRun({
        text: display(line),
        font,
        size: 32,
        sizeComplexScript: 32,
        bold: rr.bold,
        italics: rr.italic,
        underline: rr.underline ? { type: UnderlineType.SINGLE } : undefined,
        language: { value: 'th-TH' }
      })] : [])
    ]));
    return runs.length ? runs : [new TextRun({ text: '', font, size: 32 })];
  };

  const body = (b: RichBlock, spacing: Record<string, unknown> = { ...SINGLE, before: 120, after: 0 }) =>
    new Paragraph({
      children: blockRuns(b),
      alignment: alignMap[b.align],
      indent: { firstLine: b.firstLine ? 1417 : 0, left: b.indent * INDENT_STEP_TWIPS }, // 2.5 cm
      spacing
    });

  // Signature block
  const signatureParagraphs = [
    ...(signatureBytes ? [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        indent: { left: sigIndent },
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
      indent: { left: sigIndent },
      keepNext: true,
      spacing: { before: signatureBytes ? 60 : (isOrder ? 1400 : isMemo ? 2055 : letterSpec ? mmToTwips(letterSpec.signGapMm) : 1000), after: 0, ...SINGLE }
    }),
    para(signatoryPos.replace(/\s*ปฏิบัติราชการแทน\s*/, ' ปฏิบัติราชการแทน\n').replace(/\s*รักษาราชการแทน\s*/, ' รักษาราชการแทน\n'), {
      alignment: AlignmentType.CENTER,
      indent: { left: sigIndent },
      keepLines: true,
      spacing: { ...SINGLE, after: 0 }
    })
  ];

  if (isMemo) {
    const dotted = { style: BorderStyle.DOTTED, size: 4, color: '000000' };
    const solid = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
    const lineBorder = r.headerLineStyle === 'solid' ? solid : r.headerLineStyle === 'none' ? undefined : dotted;

    // ช่องว่างหลังป้ายหัวข้อตามต้นฉบับ: ส่วนราชการ/ที่/วันที่ เคาะ 2 ครั้งขนาดเล็ก (ต้นฉบับใช้ 11 พอยต์
    // ตามฟอนต์เริ่มต้นของเอกสาร) ส่วนเรื่องใช้แท็บไปที่ 1.27 ซม.
    const field = (label: string, value: string, applyBorder = false, isHalfCell = false, gap: 'spaces' | 'tab' = 'spaces') => {
      const underlineStyle = applyBorder && r.headerLineStyle !== 'none'
        ? { type: r.headerLineStyle === 'solid' ? UnderlineType.SINGLE : UnderlineType.DOTTED }
        : undefined;

      return new Paragraph({
        children: [
          new TextRun({ text: label, font, size: 40, bold: true, sizeComplexScript: 40, language: { value: 'th-TH' } }),
          gap === 'tab'
            ? new TextRun({ text: '\t', font, size: 40, bold: true, language: { value: 'th-TH' } })
            : new TextRun({ text: '  ', font, size: 22, sizeComplexScript: 22, language: { value: 'th-TH' } }),
          new TextRun({ text: display(value), font, size: 32, sizeComplexScript: 32, language: { value: 'th-TH' }, underline: underlineStyle }),
          ...(underlineStyle ? [
            new TextRun({ text: '\t', font, size: 32, underline: underlineStyle })
          ] : [])
        ],
        tabStops: [
          ...(gap === 'tab' ? [{ type: TabStopType.LEFT, position: 720 }] : []),
          { type: TabStopType.RIGHT, position: isHalfCell ? 4500 : 9070 }
        ],
        spacing: { line: 520, lineRule: LineRuleType.EXACT, after: 0 }
      });
    };

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

    const spec = getTemplateSpec(r.category);
    const firstTop = spec.firstPageTop;
    const memoFooter = () => new Footer({
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: 'CPRU-66-001', font, size: 30, language: { value: 'th-TH' } })] })]
                }),
                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font, size: 30, language: { value: 'th-TH' } })] })] })
              ]
            })
          ]
        })
      ]
    });

    const memoSections = targets.map((to, targetIdx) => ({
      properties: {
        titlePage: firstTop !== undefined,
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: {
            ...pageMargins,
            ...(firstTop !== undefined ? { top: mmToTwips(firstTop), header: mmToTwips(15), footer: mmToTwips(15) } : {})
          }
        }
      },
      ...(firstTop !== undefined ? {
        // หน้าแรกเริ่มหัวเอกสารสูงตามต้นฉบับ หน้าถัดไปดันเนื้อหาลงให้ได้ขอบบนมาตรฐานด้วยหัวกระดาษเปล่า
        headers: {
          first: new Header({ children: [new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] })] }),
          default: new Header({ children: [new Paragraph({ spacing: { before: 0, after: 0, line: mmToTwips(spec.margins.top - 15), lineRule: LineRuleType.EXACT }, children: [] })] })
        }
      } : {}),
      footers: {
        default: memoFooter(),
        ...(firstTop !== undefined ? { first: memoFooter() } : {})
      },
      children: [
        // ตราครุฑลอยอิสระ 1.5 ซม. ตามต้นฉบับ (ลอยขึ้นเหนือบรรทัดหัวเรื่อง ชิดซ้าย อยู่สูงจากขอบกระดาษ 1 ซม.)
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 600, lineRule: LineRuleType.EXACT, after: 0 },
          children: [
            ...(garudaBytes ? [new ImageRun({
              type: 'png',
              data: garudaBytes,
              transformation: { width: 56, height: 58 },
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: 0 },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: -Math.round(((firstTop ?? 10) - 10) * 36000) },
                wrap: { type: TextWrappingType.NONE },
                allowOverlap: true,
                behindDocument: false
              }
            })] : []),
            new TextRun({ text: 'บันทึกข้อความ', font, size: 58, bold: true, language: { value: 'th-TH' } })
          ]
        }),
        field('ส่วนราชการ', r.from, r.lineVisibility?.govOrg ?? true),
        memoPair(
          field('ที่', displayNum, r.lineVisibility?.docNumber ?? true, true),
          field('วันที่', thaiGovDate(r.date, digitType, 'memo'), r.lineVisibility?.docDate ?? true, true)
        ),
        field('เรื่อง', cleanSubject, r.lineVisibility?.subject ?? true, false, 'tab'),
        new Paragraph({
          children: [run('เรียน'), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(to)],
          tabStops: [{ type: TabStopType.LEFT, position: 720 }],
          spacing: { before: 120, after: 120, ...SINGLE }
        }),
        ...(!cleanReference ? [] : [para('อ้างถึง  ' + cleanReference)]),
        ...(r.attachmentsList || []).map((item, i) => para((i === 0 ? 'สิ่งที่ส่งมาด้วย  ' : '                  ') + (i + 1) + '. ' + item)),
        ...getBodyBlocks(r).map(b => body(b, { ...SINGLE, before: b.text.startsWith('จึงเรียน') ? 240 : 120, after: 0 })),
        ...signatureParagraphs,
        ...(r.coordinatorInfo ? [para(r.coordinatorInfo, { spacing: { before: 240, after: 0 } })] : [])
      ]
    }));

    return Packer.toBlob(new Document({ styles: docStyles, sections: memoSections }));
  }

  if (isOrder) {
    const orderBody = orderItems(getBodyBlocks(r)).map(({ text: block, block: rich }) => {
      const mem = parseCommitteeRow(block);
      if (mem.isMember) {
        return new Paragraph({
          children: [run(mem.name), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(mem.role)],
          indent: { left: 1843 },
          tabStops: [{ type: TabStopType.LEFT, position: 6460 }],
          spacing: { ...SINGLE, after: 0 },
          keepLines: true
        });
      }
      if (/^[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]\s*คณะกรรมการ/.test(block) || block === 'หน้าที่' || block.startsWith('หน้าที่')) {
        return new Paragraph({
          children: [run(block, true)],
          indent: { left: 1843 },
          spacing: { before: 120, after: 120, ...SINGLE },
          keepNext: true
        });
      }
      if (/^[๐-๙0-9]+(?:\.[๐-๙0-9]+)*[\.\s]/.test(block) && !mem.isMember) {
        return new Paragraph({
          children: [run(block)],
          indent: { left: 1843 },
          spacing: { ...SINGLE, after: 30 }
        });
      }
      if (block.startsWith('สั่ง ณ วันที่')) {
        return new Paragraph({
          children: [run(block)],
          indent: { left: 1440 },
          spacing: { before: 180, after: 60, ...SINGLE },
          keepNext: true
        });
      }
      return body(rich);
    });

    const hasDateInBody = orderItems(getBodyBlocks(r)).some(i => i.text.startsWith('สั่ง ณ วันที่'));

    const orderSections = [{
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: pageMargins
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
        new Paragraph({ children: [run('คำสั่ง' + (r.from || '').trim().replace(/^คำสั่ง\s*/, ''), true)], alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 0 }, keepNext: true }),
        new Paragraph({ children: [run(formattedOrderNum, true)], alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 0 }, keepNext: true }),
        new Paragraph({ children: [run('เรื่อง  ' + cleanSubject, true)], alignment: AlignmentType.CENTER, indent: { left: 1418, hanging: 1418 }, spacing: { ...SINGLE, after: 0 }, keepNext: true }),
        new Paragraph({ children: [run('........................................................', true)], alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 120 }, keepNext: true }),
        ...orderBody,
        ...(!hasDateInBody ? [new Paragraph({ children: [run(thaiGovDate(r.date, digitType, 'order'))], indent: { left: 1440 }, spacing: { before: 180, after: 60, ...SINGLE }, keepNext: true })] : []),
        ...signatureParagraphs,
        ...(r.coordinatorInfo ? [para(r.coordinatorInfo)] : [])
      ]
    }];

    return Packer.toBlob(new Document({ styles: docStyles, sections: orderSections }));
  }

  // External correspondence & Custom layouts
  const extField = (label: string, text: string, indent = 720) =>
    new Paragraph({
      children: [run(label), new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }), run(text)],
      indent: { left: indent, hanging: indent },
      tabStops: [{ type: TabStopType.LEFT, position: indent }],
      spacing: { ...SINGLE, before: 120, after: 0 }
    });

  const extSections = targets.map(to => ({
    properties: {
      page: {
        size: { width: pageWidth, height: pageHeight },
        margin: pageMargins
      }
    },
    children: [
      // ตราครุฑลอยอิสระตามต้นฉบับ: ผูกกับย่อหน้าเหนือตารางเพื่อให้ระยะวัดจากขอบเนื้อหา (ไม่ใช่จากเซลล์)
      ...(garudaBytes && letterSpec ? [
        new Paragraph({
          children: [new ImageRun({
            type: 'png',
            data: garudaBytes,
            transformation: { width: Math.round(letterSpec.garuda.widthMm * 96 / 25.4), height: Math.round(letterSpec.garuda.heightMm * 96 / 25.4) },
            floating: {
              horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: Math.round(letterSpec.garuda.leftMm * 36000) },
              verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
              wrap: { type: TextWrappingType.NONE },
              allowOverlap: true,
              behindDocument: false
            }
          })],
          spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }
        })
      ] : []),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                children: [
                  new Paragraph({
                    children: [run(displayNum)],
                    spacing: { before: 1400, ...SINGLE, after: 0 }
                  })
                ]
              }),
              new TableCell({
                width: { size: 28.5, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                children: [
                  new Paragraph({ children: [] })
                ]
              }),
              new TableCell({
                width: { size: 36.5, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                children: [
                  new Paragraph({
                    children: (r.officeAddress || r.from).split('\n').flatMap((line, idx) => [
                      ...(idx ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
                      run(line)
                    ]),
                    spacing: { before: 1400, ...SINGLE, after: 0 }
                  })
                ]
              })
            ]
          })
        ]
      }),
      para(thaiGovDate(r.date, digitType, 'external'), { indent: { left: 4252 }, spacing: { before: 180, after: 120, ...SINGLE } }),
      extField('เรื่อง', cleanSubject),
      extField('เรียน', to),
      ...(cleanReference ? [extField('อ้างถึง', cleanReference)] : []),
      ...(r.attachmentsList || []).map((att, i) => {
        const parsed = parseAttachmentRow(att);
        const numText = display(String(i + 1)) + '. ' + parsed.item;
        if (parsed.qty) {
          return new Paragraph({
            children: [
              run(i === 0 ? 'สิ่งที่ส่งมาด้วย' : ''),
              new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }),
              run(numText),
              new TextRun({ text: '\t', font, size: 32, language: { value: 'th-TH' } }),
              run(parsed.qty)
            ],
            indent: { left: 1417, hanging: 1417 },
            tabStops: [
              { type: TabStopType.LEFT, position: 1417 },
              { type: TabStopType.LEFT, position: 7200 }
            ],
            spacing: { ...SINGLE, after: 0 }
          });
        }
        return extField(i === 0 ? 'สิ่งที่ส่งมาด้วย' : '', numText, 1417);
      }),
      ...getBodyBlocks(r).map(b => body(b)),
      para('ขอแสดงความนับถือ', { alignment: AlignmentType.CENTER, indent: { left: sigIndent }, keepNext: true, spacing: { before: letterSpec ? mmToTwips(letterSpec.closingGapMm) : 240, after: 60, ...SINGLE } }),
      ...signatureParagraphs,
      ...(r.coordinatorInfo ? [new Paragraph({
        children: r.coordinatorInfo.split('\n').flatMap((line, idx) => [
          ...(idx ? [new TextRun({ break: 1, font, size: 32, language: { value: 'th-TH' } })] : []),
          new TextRun({ text: display(line), font, size: 32, sizeComplexScript: 32, language: { value: 'th-TH' } })
        ]),
        spacing: { before: letterSpec ? mmToTwips(letterSpec.coordinatorGapMm) : 240, after: 0, ...SINGLE }
      })] : [])
    ]
  }));

  return Packer.toBlob(new Document({ styles: docStyles, sections: extSections }));
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

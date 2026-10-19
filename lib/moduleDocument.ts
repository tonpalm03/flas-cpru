import { INDENT_STEP_MM, INDENT_STEP_TWIPS, type RichBlock } from './richBody';

/**
 * ตัวสร้างเอกสารกลางของโมดูลธุรการ (จดหมายข่าว วาระ/รายงานการประชุม)
 * ประมวลผลฝั่งผู้ใช้ทั้งหมด: HTML สำหรับพิมพ์/PDF และ Word (.docx) จากข้อมูลชุดเดียวกัน
 */
export type DocPart =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'line'; text: string; bold?: boolean }
  | { kind: 'blocks'; blocks: RichBlock[] }
  | { kind: 'spacer' };

const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function blocksToHtml(blocks: RichBlock[]): string {
  return blocks
    .map(b => {
      const runs =
        b.runs
          .map(run => {
            let t = escapeHtml(run.text).replace(/\n/g, '<br>');
            if (run.bold) t = `<strong>${t}</strong>`;
            if (run.italic) t = `<em>${t}</em>`;
            if (run.underline) t = `<u>${t}</u>`;
            return t;
          })
          .join('') || '&nbsp;';
      const style =
        `text-align: ${b.align};` +
        (b.firstLine ? '' : ' text-indent: 0;') +
        (b.indent ? ` margin-left: ${b.indent * INDENT_STEP_MM}mm;` : '');
      return `<div class="body-para" style="${style}">${runs}</div>`;
    })
    .join('');
}

export function documentPartsHtml(parts: DocPart[]): string {
  return parts
    .map(p => {
      switch (p.kind) {
        case 'title':
          return `<h1 class="doc-title">${escapeHtml(p.text)}</h1>`;
        case 'subtitle':
          return `<div class="doc-subtitle">${escapeHtml(p.text)}</div>`;
        case 'heading':
          return `<h2 class="doc-heading">${escapeHtml(p.text)}</h2>`;
        case 'line':
          return `<div class="doc-line"${p.bold ? ' style="font-weight: bold;"' : ''}>${escapeHtml(p.text).replace(/\n/g, '<br>')}</div>`;
        case 'blocks':
          return blocksToHtml(p.blocks);
        default:
          return '<div class="doc-spacer"></div>';
      }
    })
    .join('\n');
}

/** หน้า A4 สำหรับพิมพ์/บันทึกเป็น PDF ขอบ 3.0/2.0/2.5/2.0 ซม. ฟอนต์ TH SarabunPSK 16 พอยต์ */
export function pageHtml(docTitle: string, parts: DocPart[], origin: string, autoPrint = false): string {
  const base = escapeHtml(origin);
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>${escapeHtml(docTitle)}</title>
<style>
  @font-face { font-family: 'THSarabunPSK'; src: local('TH SarabunPSK'), local('THSarabunPSK'), url('${base}/templates/admin/fonts/THSarabunPSK-Regular.ttf') format('truetype'); font-weight: normal; }
  @font-face { font-family: 'THSarabunPSK'; src: local('TH SarabunPSK Bold'), local('THSarabunPSK-Bold'), url('${base}/templates/admin/fonts/THSarabunPSK-Bold.ttf') format('truetype'); font-weight: bold; }
  @page { size: A4 portrait; margin: 25mm 20mm 20mm 30mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f1f5f9; color: #000; font-family: 'THSarabunPSK', 'Sarabun', sans-serif; font-size: 16pt; line-height: 1.35; }
  .print-bar { position: sticky; top: 0; text-align: center; padding: 10px; background: #0f172a; z-index: 10; }
  .print-btn { background: #1e3a8a; color: #fff; border: 0; border-radius: 8px; padding: 8px 20px; font-size: 14px; font-weight: bold; cursor: pointer; font-family: inherit; }
  article { width: 210mm; min-height: 297mm; margin: 20px auto; padding: 25mm 20mm 20mm 30mm; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.08); }
  .doc-title { font-size: 20pt; font-weight: bold; text-align: center; margin: 0 0 2mm; }
  .doc-subtitle { text-align: center; margin: 0 0 4mm; }
  .doc-heading { font-size: 16pt; font-weight: bold; margin: 5mm 0 1mm; }
  .doc-line { margin: 0 0 1mm; }
  .doc-spacer { height: 4mm; }
  .body-para { text-indent: 25mm; text-align: justify; margin: 1.5mm 0; }
  @media print {
    body { background: #fff; }
    .print-bar { display: none; }
    article { margin: 0; width: auto; min-height: 0; padding: 0; box-shadow: none; }
  }
</style>
</head>
<body ${autoPrint ? 'onload="window.print();"' : ''}>
${autoPrint ? '' : '<div class="print-bar"><button class="print-btn" onclick="window.print();">พิมพ์เอกสาร / บันทึกเป็น PDF</button></div>'}
<article>
${documentPartsHtml(parts)}
</article>
</body>
</html>`;
}

export function openHtmlDocument(html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/[\\/:*?"<>|]/g, '-');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Word (.docx) จาก DocPart ชุดเดียวกับ HTML */
export async function buildPartsWord(parts: DocPart[]): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType, LineRuleType } = await import('docx');
  const font = 'TH SarabunPSK';
  const SINGLE = { line: 240, lineRule: LineRuleType.AUTO } as const;

  const run = (text: string, opts: { bold?: boolean; italics?: boolean; underline?: boolean; size?: number } = {}) =>
    new TextRun({
      text,
      font,
      size: opts.size ?? 32,
      sizeComplexScript: opts.size ?? 32,
      bold: opts.bold,
      italics: opts.italics,
      underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
      language: { value: 'th-TH' }
    });

  const textRuns = (text: string, opts: Parameters<typeof run>[1] = {}) =>
    text.split('\n').flatMap((line, i) => [
      ...(i ? [new TextRun({ break: 1, font, size: opts.size ?? 32 })] : []),
      ...(line ? [run(line, opts)] : [])
    ]);

  const align = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED
  } as const;

  const children = parts.flatMap(p => {
    switch (p.kind) {
      case 'title':
        return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 60 }, children: textRuns(p.text, { bold: true, size: 40 }) })];
      case 'subtitle':
        return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { ...SINGLE, after: 120 }, children: textRuns(p.text) })];
      case 'heading':
        return [new Paragraph({ spacing: { ...SINGLE, before: 240, after: 60 }, keepNext: true, children: textRuns(p.text, { bold: true }) })];
      case 'line':
        return [new Paragraph({ spacing: { ...SINGLE, after: 60 }, children: textRuns(p.text, { bold: p.bold }) })];
      case 'blocks':
        return p.blocks.map(
          b =>
            new Paragraph({
              alignment: align[b.align],
              indent: { firstLine: b.firstLine ? 1417 : 0, left: b.indent * INDENT_STEP_TWIPS },
              spacing: { ...SINGLE, before: 60, after: 60 },
              children: b.runs.length
                ? b.runs.flatMap(r => textRuns(r.text, { bold: r.bold, italics: r.italic, underline: r.underline }))
                : [run('')]
            })
        );
      default:
        return [new Paragraph({ children: [run('')] })];
    }
  });

  return Packer.toBlob(
    new Document({
      styles: { default: { document: { run: { font: { ascii: font, hAnsi: font, cs: font, eastAsia: font }, size: 32, sizeComplexScript: 32 } } } },
      sections: [
        {
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1417, right: 1134, bottom: 1134, left: 1701 } } },
          children
        }
      ]
    })
  );
}

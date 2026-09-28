const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = process.cwd();
const base = root.replaceAll('\\','/');
const sources = JSON.parse(fs.readFileSync('tmp/audit/sources.json','utf8').replace(/^\uFEFF/,''));
const esc = v => String(v || '').replaceAll('|','\\|').replace(/[\r\n]+/g,' ').trim();
const link = (name,p,line) => `[${esc(name)}](<${base}/${p.replaceAll('\\','/')}${line?':'+line:''}>)`;
const visualPdf = r => /^(แผนปฏิบัติราชการ 2569\.pdf|005 ระเบียบ|4-ระเบียบ)/.test(path.basename(r.path));
const visualImageHashes = new Set(sources.filter(r=>r.extension==='.jpg' && !r.path.includes('โครงการศาสตร์พระราชา') || r.extension==='.jpg' && r.path.includes('10-รายงาน')).map(r=>r.sha256));
const seen=new Map();
const counts = {};
for(const r of sources) counts[r.extension]=(counts[r.extension]||0)+1;
const doc=[];
doc.push('# บัญชีเอกสารต้นทางและความครอบคลุมการตรวจ', '', 'ตรวจ 28–29 กันยายน 2569 จำนวน 156 ไฟล์ รายการนี้ใช้หาต้นฉบับและวางงานนำเข้า ไม่ใช่การรับรองความถูกต้องของข้อมูลทุกหน้า', '',
  'สกัดข้อความ Word 56 ไฟล์, PDF 37 ไฟล์ และโครงสร้าง Excel 6 ไฟล์; PDF อีก 50 ไฟล์มีข้อความไม่เพียงพอ โดยตรวจภาพแผน 1 ไฟล์และระเบียบ 2 ชนิดแล้ว ส่วนโครงการสแกนรายฉบับต้องตรวจต่อ สถานะ “สกัดแล้ว” ไม่ได้หมายความว่าอ่านตรวจเนื้อหาทุกบรรทัด', '',
  'ภาพ JPG ตรวจภาพ 6 ไฟล์ที่แตกต่างกัน อีกไฟล์แนวปฏิบัติเงินยืมเปรียบเทียบ hash กับไฟล์ที่อ่านแล้ว ไฟล์ที่ hash ตรงกันเป็นเนื้อหาไบนารีซ้ำเท่านั้น ห้ามสรุปว่าชื่อเหมือนกันแล้วต้องเป็นรุ่นเดียวกัน', '',
  'ข้อสังเกตสำคัญ: แผนปฏิบัติราชการ 2569.pdf มีเพียง 1 หน้าสแกน (เลขหน้าพิมพ์ 26); สมุดคุมงบชื่อ 2568 มีหัวรายงาน 2569; แบบรายละเอียดค่าสอนมีตัวอย่างภาคเรียนเก่า; แม่แบบมีชื่อผู้ลงนามต่างกัน ต้องยืนยันฉบับใช้จริง', '',
  '| ID | ไฟล์ต้นฉบับ | สถานะตรวจ | ข้อมูลประกอบ/ซ้ำกับ |',
  '|---|---|---|---|');
sources.forEach((r,i)=>{
  const id='DOC-'+String(i+1).padStart(3,'0');
  const previous=seen.get(r.sha256); if(!previous)seen.set(r.sha256,id);
  const details=[];
  if(r.pages)details.push(`${r.pages} หน้า`);
  if(r.sheets)details.push(`${r.sheets.length} ชีต`);
  if(previous)details.push(`hash ตรง ${previous}`);
  let status=({extracted_ooxml:'สกัดข้อความ DOCX แล้ว',extracted_legacy_doc:'อ่าน DOC ด้วย Word แบบ read-only แล้ว',extracted_pdf:'สกัดข้อความ PDF แล้ว; ไม่รับรองครบทุกหน้า',extracted_spreadsheet:'อ่านโครงสร้าง/หัวตาราง/สูตรแล้ว',needs_ocr:'ต้อง OCR/ตรวจภาพเพิ่มเติม',image_needs_visual_review:'ยังไม่ตรวจภาพ'})[r.status]||r.status;
  if(r.extension==='.pdf' && visualPdf(r))status=previous?'ฉบับซ้ำของ PDF ที่ตรวจภาพแล้ว':'ตรวจภาพครบทุกหน้าในไฟล์นี้แล้ว';
  if(r.extension==='.jpg' && visualImageHashes.has(r.sha256))status=previous?'ภาพซ้ำ hash ตรงไฟล์ที่ตรวจแล้ว':'ตรวจภาพแล้ว';
  doc.push(`| ${id} | ${link(r.path,r.path)} | ${status} | ${details.join('; ')} |`);
});
doc.push('', '## โครงสร้างสมุดคุมงบที่ต้องนำมาออกแบบ schema', '',
  '| ชีต | ช่วงข้อมูลที่อ่าน | เซลล์สูตรที่พบ |', '|---|---|---|');
for(const s of sources.find(r=>r.path==='3.คุมรายการเงินงบรายได้ 2568.xlsx').sheets) doc.push(`| ${esc(s.name)} | ${s.range||'ว่าง'} | ${s.formulaCount} |`);
doc.push('', 'ค่าจำนวนสูตรมีไว้บอกลักษณะ workbook เท่านั้น ไม่ใช่ผลตรวจว่าทุกสูตรถูกต้องหรือยอดกระทบกันแล้ว', '',
  '## งานเอกสารที่ต้องทำก่อนนำข้อมูลจริงเข้า', '',
  '1. กำหนดเจ้าของเอกสารและรุ่นใช้งาน ทำทะเบียน template พร้อมวันมีผล',
  '2. OCR โครงการ PDF ที่ไม่มีข้อความ ทวนชื่อโครงการ รหัส ปี งบ วันที่ และผู้รับผิดชอบเทียบภาพจริง',
  '3. เลือกไฟล์หลักจากกลุ่มซ้ำและตรวจไฟล์ชื่อเหมือนกันแต่ hash ต่างกัน',
  '4. จัดหาแผนฉบับเต็ม ตาราง KPI และสายอนุมัติที่รับรอง',
  '5. นำเข้าผ่าน staging/preview พร้อม mapping และกระทบยอดก่อน commit ข้อมูลจริง',
  '6. เก็บ path/เลขหน้า/ชีต/เซลล์และรุ่นของต้นฉบับใน metadata เพื่อย้อนตรวจได้', '');
fs.writeFileSync('docs/audit/03-source-inventory.md',doc.join('\n'));

function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const pages=walk('app').filter(f=>f.endsWith('page.tsx')).sort();
const files=[...pages,'components/Navbar.tsx','components/Sidebar.tsx'];
const rows=[]; let total=0;
rows.push('# ทะเบียนปุ่ม ฟอร์ม และทางเข้าจาก source', '',
  'ตรวจจาก JSX ของ 22 หน้าและ Navbar/Sidebar ทุกไฟล์ เป็น static inspection ไม่ใช่ผลกดทดสอบในเบราว์เซอร์ แถวที่ render ผ่าน map จะมีหนึ่งแถวในทะเบียนนี้ แม้แสดงหลายปุ่มจริง', '',
  'ใช้เช็คลิสต์นี้ทวนหลังพัฒนา: เปิดหน้า → กรอกข้อมูลถูก/ผิด → กด action → ตรวจผลที่ UI และฐานข้อมูล → refresh → ตรวจสิทธิ → ตรวจไฟล์ export กรณีมีการส่งออก', '',
  'ลิงก์และ handler ที่พบยืนยันว่ามีการผูก event ใน source เท่านั้น ไม่ได้ยืนยันว่า workflow/save/download สมบูรณ์', '');
for(const f of files){
  const code=fs.readFileSync(f,'utf8');
  const sf=ts.createSourceFile(f,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const actions=[];
  const textOf=n=>{
    if(ts.isJsxText(n)) return n.text.trim();
    if(ts.isJsxExpression(n)) return n.expression?`{${n.expression.getText(sf)}}`:'';
    if(ts.isJsxElement(n))return n.children.map(textOf).filter(Boolean).join(' ');
    return '';
  };
  const visit=n=>{
    if(ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)){
      const opening=ts.isJsxElement(n)?n.openingElement:n;
      const tag=opening.tagName.getText(sf);
      if(['button','form','Link','a'].includes(tag)){
        const attrs={};
        opening.attributes.properties.forEach(a=>{if(ts.isJsxAttribute(a)) attrs[a.name.getText(sf)]=a.initializer?a.initializer.getText(sf):'true';});
        const label=tag==='form'?'ฟอร์ม':ts.isJsxElement(n)?n.children.map(textOf).filter(Boolean).join(' '):'';
        const action=attrs.onClick||attrs.onSubmit||attrs.href||(attrs.type==='"submit"'?'ส่งฟอร์มที่ครอบอยู่':'ไม่พบ handler/href ใน element นี้');
        const line=sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
        actions.push(`| ${tag} | ${esc((label||attrs.title||'ปุ่มไอคอน/ไม่มีข้อความ').slice(0,220))} | ${esc(action.slice(0,400))} | ${link(f+':'+line,f,line)} |`);
      }
    }
    ts.forEachChild(n,visit);
  }; visit(sf);
  const route=f.startsWith('app')?'/'+path.dirname(f).slice(3).replaceAll('\\','/').replace(/^\//,''):f;
  rows.push(`## ${route}`, '', `ต้นทาง: ${link(f,f)}`, '', '| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |','|---|---|---|---|',...actions,'');
  total+=actions.length;
}
fs.writeFileSync('docs/audit/04-menu-actions.md',rows.join('\n'));
console.log(JSON.stringify({sourceFiles:sources.length,uniqueHashes:seen.size,pageCount:pages.length,actionElements:total,types:counts}));

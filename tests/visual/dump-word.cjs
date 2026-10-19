// สร้างไฟล์ Word จากเอกสารตัวอย่างจริง 5 ฉบับใน test-runner.cjs แล้วเขียนลงโฟลเดอร์ที่ระบุ
// ใช้: node tests/visual/dump-word.cjs <outDir>
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests', 'visual', 'out'));
fs.mkdirSync(outDir, { recursive: true });

require.extensions['.ts'] = (m, f) => m._compile(
  ts.transpileModule(fs.readFileSync(f, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, f);
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'demo-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-faculty-erp';

const mod = require(path.join(root, 'lib', 'adminDocument.ts'));
const original = mod.buildAdminWord;
mod.buildAdminWord = async function (r) {
  const blob = await original(r);
  if (String(r.id).startsWith('real-')) {
    fs.writeFileSync(path.join(outDir, r.id + '.docx'), Buffer.from(await blob.arrayBuffer()));
  }
  return blob;
};
const originalHtml = mod.documentHtml;
const publicUrl = 'file:///' + path.join(root, 'public').split(path.sep).join('/');
mod.documentHtml = function (r, origin, autoPrint) {
  const html = originalHtml(r, origin, autoPrint);
  if (String(r.id).startsWith('real-')) {
    fs.writeFileSync(path.join(outDir, r.id + '.html'), originalHtml(r, publicUrl, false).split('src="/templates').join('src="' + publicUrl + '/templates'));
  }
  return html;
};
process.chdir(root);
require(path.join(root, 'tests', 'test-runner.cjs'));

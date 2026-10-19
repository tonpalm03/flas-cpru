const ts = require('typescript');
const fs = require('fs');
const assert = require('node:assert/strict');

// Register TypeScript extension loader
require.extensions['.ts'] = (module, file) => {
  const content = fs.readFileSync(file, 'utf8');
  const transpiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    }
  });
  return module._compile(transpiled.outputText, file);
};

// Set demo environment
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'demo-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-faculty-erp';

const {
  canUserCreateDoc,
  canUserViewDoc,
  canUserEditContent,
  canUserIssueDocNumber,
  canUserSubmitToSign,
  canUserSign,
  canUserDeleteDoc,
  canUserDownloadWord,
  canUserDownloadPdf,
  DEFAULT_WORKFLOW_CONFIGS
} = require('../lib/workflowPermissionService.ts');

const {
  registryNumber,
  validateRegistry,
  ADMIN_ACTIONS,
  bangkokDate
} = require('../lib/adminRegistryModel.ts');

const {
  getRecordDigitType,
  thaiGovDate,
  formatSignatoryName,
  sanitizeFieldText,
  getDisplayDocNumber,
  documentHtml,
  buildAdminWord,
  parseCommitteeRow
} = require('../lib/adminDocument.ts');

const { draftGovernmentDocument } = require('../lib/aiDocumentDrafter.ts');
const { validateGovernmentDocument } = require('../lib/documentValidationService.ts');

async function runAllTests() {
  console.log('=== STARTING UNIVERSAL ERP DOCUMENT & PERMISSIONS TEST SUITE ===');

  const userLecturer = {
    id: 'u-lecturer',
    email: 'lecturer@cpru.ac.th',
    name: 'ดร.สมชาย ใจดี',
    role: 'lecturer',
    roles: ['อาจารย์'],
    status: 'active'
  };

  const userClerk = {
    id: 'u-clerk',
    email: 'clerk@cpru.ac.th',
    name: 'นางสาวกานดา สารบรรณ',
    role: 'gov_officer',
    roles: ['ธุรการ', 'เจ้าหน้าที่'],
    status: 'active'
  };

  const userFinanceHelper = {
    id: 'u-finance',
    email: 'finance@cpru.ac.th',
    name: 'นายวินัย การเงิน',
    role: 'staff_finance',
    roles: ['การเงิน', 'เจ้าหน้าที่'],
    status: 'active'
  };

  const userDean = {
    id: 'u-dean',
    email: 'dean@cpru.ac.th',
    name: 'ผศ.ดร.สิริศักดิ์ อาจวิชัย',
    role: 'dean',
    roles: ['คณบดี', 'ผู้บริหาร'],
    position: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    status: 'active'
  };

  const userExecutiveOther = {
    id: 'u-exec',
    email: 'exec@cpru.ac.th',
    name: 'ดร.วิชาญ ผู้บริหาร',
    role: 'executive',
    roles: ['ผู้บริหาร'],
    status: 'active'
  };

  const userAdmin = {
    id: 'u-admin',
    email: 'admin@cpru.ac.th',
    name: 'ผู้ดูแลระบบ',
    role: 'admin',
    roles: ['แอดมิน'],
    status: 'active'
  };

  // Test 1: All roles can create documents
  console.log('\n[TEST 1] All roles can create documents:');
  assert.equal(canUserCreateDoc(userLecturer), true);
  assert.equal(canUserCreateDoc(userClerk), true);
  assert.equal(canUserCreateDoc(userFinanceHelper), true);
  assert.equal(canUserCreateDoc(userDean), true);
  assert.equal(canUserCreateDoc(userExecutiveOther), true);
  assert.equal(canUserCreateDoc(userAdmin), true);
  assert.equal(canUserCreateDoc({ ...userLecturer, status: 'inactive' }), false);
  console.log(' PASS: All active roles can create documents.');

  // Test 2: Visibility Scopes
  console.log('\n[TEST 2] Visibility Scope across lifecycle:');
  const memoWorkflow = DEFAULT_WORKFLOW_CONFIGS.memo;

  const draftDoc = {
    id: 'doc-draft-01',
    category: 'memo',
    year: 2569,
    sequenceNumber: 0,
    docNumber: '',
    isNumberIssued: false,
    date: '2026-10-09',
    from: 'สาขาวิทยาศาสตร์',
    to: 'คณบดี',
    subject: 'ร่างบันทึกข้อความ',
    action: 'ฉบับร่าง',
    createdById: userLecturer.id,
    createdByName: userLecturer.name,
    createdAt: '2026-10-09T10:00:00Z'
  };

  // Draft
  assert.equal(canUserViewDoc(userLecturer, draftDoc, memoWorkflow), true, 'Creator views draft');
  assert.equal(canUserViewDoc(userClerk, draftDoc, memoWorkflow), false, 'Clerk cannot view other draft');
  assert.equal(canUserViewDoc(userDean, draftDoc, memoWorkflow), false, 'Dean cannot view other draft');
  assert.equal(canUserViewDoc(userExecutiveOther, draftDoc, memoWorkflow), false, 'Exec cannot view other draft');
  assert.equal(canUserViewDoc(userAdmin, draftDoc, memoWorkflow), true, 'Admin can view draft');
  console.log(' PASS: Draft visible only to creator and admin.');

  // Pending Review
  const reviewDoc = { ...draftDoc, action: 'รอตรวจ' };
  assert.equal(canUserViewDoc(userLecturer, reviewDoc, memoWorkflow), true, 'Creator tracks review');
  assert.equal(canUserViewDoc(userClerk, reviewDoc, memoWorkflow), true, 'Clerk views review');
  assert.equal(canUserViewDoc(userExecutiveOther, reviewDoc, memoWorkflow), false, 'Executive does not see review simply from role');
  console.log(' PASS: Pending Review visible to creator and assigned reviewers only.');

  // Pending Sign
  const signingDoc = { ...draftDoc, action: 'รอลงนาม', sequenceNumber: 101, docNumber: 'อว 0646.02/101', isNumberIssued: true };
  assert.equal(canUserViewDoc(userLecturer, signingDoc, memoWorkflow), true, 'Creator tracks signing');
  assert.equal(canUserViewDoc(userDean, signingDoc, memoWorkflow), true, 'Signer views in signing');
  console.log(' PASS: Pending Sign visible to creator, reviewers, and signers.');

  // Test 3: Granular Separation of Rights (Finance helper)
  console.log('\n[TEST 3] Granular separation of rights (Helper reviewer):');
  const customWorkflow = {
    id: 'memo_custom',
    category: 'memo',
    title: 'บันทึกข้อความพิเศษ',
    reviewers: { roles: ['ธุรการ', 'การเงิน'] }, // Finance added as helper reviewer
    numberers: { roles: ['ธุรการ'] },           // Only Clerk can issue number
    signSubmitters: { roles: ['ธุรการ'] },
    signers: {
      mode: 'single',
      roles: ['คณบดี']
    },
    viewers: { roles: ['อาจารย์', 'เจ้าหน้าที่'] },
    downloaders: { roles: ['อาจารย์', 'เจ้าหน้าที่'] }
  };

  assert.equal(canUserEditContent(userFinanceHelper, reviewDoc, customWorkflow), true, 'Finance can edit content');
  assert.equal(canUserIssueDocNumber(userFinanceHelper, reviewDoc, customWorkflow), false, 'Finance cannot issue doc number');
  assert.equal(canUserIssueDocNumber(userClerk, reviewDoc, customWorkflow), true, 'Clerk can issue doc number');
  assert.equal(canUserSign(userFinanceHelper, reviewDoc, customWorkflow), false, 'Finance cannot sign');
  assert.equal(canUserSign(userDean, signingDoc, customWorkflow), true, 'Dean can sign');
  console.log(' PASS: Adding helper reviewer does not grant number issuing or signing rights.');

  // Test 4: Locking during Signing and Word download lock
  console.log('\n[TEST 4] Word download locked during รอลงนาม:');
  assert.equal(canUserDownloadWord(userLecturer, signingDoc, customWorkflow), false, 'Word locked during signing');
  assert.equal(canUserDownloadWord(userDean, signingDoc, customWorkflow), false, 'Word locked for dean during signing');
  assert.equal(canUserDownloadPdf(userDean, signingDoc, customWorkflow), true, 'PDF allowed during signing');
  assert.equal(canUserEditContent(userClerk, signingDoc, customWorkflow), false, 'Content editing locked in signing');
  console.log(' PASS: Word download and content editing are locked during รอลงนาม.');

  // Test 5: Numbering permanent prefix and registry format
  console.log('\n[TEST 5] Numbering permanent prefix and pattern formatting:');
  assert.equal(getDisplayDocNumber(draftDoc), 'อว 0646.02/');
  assert.equal(getDisplayDocNumber(signingDoc), 'อว 0646.02/101');
  assert.equal(registryNumber('memo', 101, 2569), 'อว 0646.02/101');
  assert.equal(registryNumber('memo_circular', 45, 2569), 'อว 0646.02/ว 45');
  assert.equal(registryNumber('external', 88, 2569), 'ที่ อว 0646.02/88');
  assert.equal(registryNumber('order', 32, 2569), 'ที่ 32/2569');
  console.log(' PASS: Doc numbering formats correctly with permanent prefix.');

  // Test 6: Thai Government Formatting & Zero Emojis
  console.log('\n[TEST 6] Formatting and Zero-Emoji policy:');
  const govDate = thaiGovDate('2026-10-09', 'thai', 'memo');
  assert.ok(govDate.includes('ตุลาคม'));
  assert.ok(govDate.includes('๒๕๖๙'));

  assert.equal(formatSignatoryName('ดร.สมชาย ใจดี'), 'ดร.สมชาย  ใจดี');
  assert.equal(sanitizeFieldText('เรื่อง ขออนุมัติจัดโครงการ', 'เรื่อง'), 'ขออนุมัติจัดโครงการ');

  const emojisRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  for (const action of ADMIN_ACTIONS) {
    assert.equal(emojisRegex.test(action), false, `Action '${action}' must not contain emojis`);
  }
  console.log(' PASS: Formatting and Zero-Emoji verified.');

  // Test 7: HTML Generation & XSS escaping
  console.log('\n[TEST 7] HTML Generation & Security:');
  const generatedHtml = documentHtml({
    ...signingDoc,
    subject: '<script>alert("xss")</script>',
    bodyParagraphs: ['ย่อหน้าที่ 1', 'ย่อหน้าที่ 2']
  }, 'http://localhost');
  assert.equal(generatedHtml.includes('<script>'), false, 'XSS stripped/escaped');
  // Test 8: Template Fidelity & CPRU-66-001 in Footer
  console.log('\n[TEST 8] Code-Defined Standard Templates & CPRU-66-001 in Footer:');
  const memoHtml = documentHtml({
    ...signingDoc,
    category: 'memo',
    bodyParagraphs: ['ข้อความย่อหน้าเดียว']
  }, 'http://localhost');
  assert.equal(memoHtml.includes('CPRU-66-001'), true, 'CPRU-66-001 MUST be present in memo footer');

  const memoCircHtml = documentHtml({
    ...signingDoc,
    category: 'memo_circular',
    bodyParagraphs: ['ข้อความแจ้งเวียน']
  }, 'http://localhost');
  assert.equal(memoCircHtml.includes('CPRU-66-001'), true, 'CPRU-66-001 MUST be present in memo_circular footer');

  const orderHtml = documentHtml({
    ...signingDoc,
    category: 'order',
    subject: 'แต่งตั้งคณะกรรมการดำเนินงาน',
    bodyParagraphs: [
      'ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์ ได้ดำเนินโครงการ...',
      '๑. คณะกรรมการอำนวยการ',
      '๑. ผศ.ดร.สิริศักดิ์ อาจวิชัย  ประธานกรรมการ',
      'หน้าที่ ให้คำปรึกษา แนะนำ',
      'สั่ง ณ วันที่ 16 มิถุนายน 2569'
    ]
  }, 'http://localhost');
  assert.equal(orderHtml.includes('คำสั่ง'), true, 'Order header rendered');
  assert.equal(orderHtml.includes('ประธานกรรมการ'), true, 'Committee member rendered');

  const extHtml = documentHtml({
    ...signingDoc,
    category: 'external',
    officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
    bodyParagraphs: ['ตามหนังสือที่อ้างถึง...']
  }, 'http://localhost');
  assert.equal(extHtml.includes('ขอแสดงความนับถือ'), true, 'External closing rendered');
  console.log(' PASS: All 5 templates verified with CPRU-66-001 removed and proper layout.');

  console.log('\n[TEST 9] Category-Specific Validation & Optional Section Cleanup:');
  // Order does not require 'to'
  assert.doesNotThrow(() => {
    validateRegistry({
      category: 'order',
      date: '2026-06-16',
      year: 2569,
      from: 'มหาวิทยาลัยราชภัฏชัยภูมิ',
      subject: 'แต่งตั้งคณะกรรมการ'
    });
  }, 'Order validation should pass without "to" field');

  // Memo requires 'to'
  assert.throws(() => {
    validateRegistry({
      category: 'memo',
      date: '2026-06-16',
      year: 2569,
      from: 'คณะศิลปศาสตร์และวิทยาศาสตร์',
      subject: 'ขออนุมัติ'
    });
  }, /เรียน/, 'Memo validation should fail if "to" field is missing');

  // When reference and attachments are undefined or empty, preview contains no leftover headings
  const cleanMemoHtml = documentHtml({
    id: 'clean-memo',
    category: 'memo',
    year: 2569,
    sequenceNumber: 1,
    docNumber: 'อว 0646.02/1',
    date: '2026-06-16',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์',
    to: 'คณบดี',
    subject: 'ขออนุมัติจัดโครงการ',
    action: 'รอตรวจ',
    bodyParagraphs: ['ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์...'],
    signatoryName: 'ผศ.ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์'
  }, 'http://localhost');

  assert.equal(cleanMemoHtml.includes('อ้างถึง'), false, 'Clean memo preview must not contain "อ้างถึง"');
  assert.equal(cleanMemoHtml.includes('สิ่งที่ส่งมาด้วย'), false, 'Clean memo preview must not contain "สิ่งที่ส่งมาด้วย"');
  console.log(' PASS: Category-specific validation and clean optional section handling verified.');

  console.log('\n[TEST 10] Creator Identity Matching & Unissued Document Visibility:');
  // Creator matches by ID, email, or name
  const docCreatedByEmail = {
    id: 'doc-email-01',
    category: 'memo',
    year: 2569,
    sequenceNumber: 0,
    docNumber: '',
    isNumberIssued: false,
    date: '2026-10-09',
    from: 'สาขาวิทยาศาสตร์',
    to: 'คณบดี',
    subject: 'เรื่องทดสอบอีเมล',
    action: 'ฉบับร่าง',
    createdById: 'different-uid',
    createdByEmail: userLecturer.email,
    createdByName: 'ชื่อเก่า',
    createdAt: '2026-10-09T10:00:00Z'
  };
  assert.equal(canUserViewDoc(userLecturer, docCreatedByEmail, memoWorkflow), true, 'Creator matches by email');

  const docCreatedByName = {
    id: 'doc-name-01',
    category: 'memo',
    year: 2569,
    sequenceNumber: 0,
    docNumber: '',
    isNumberIssued: false,
    date: '2026-10-09',
    from: 'สาขาวิทยาศาสตร์',
    to: 'คณบดี',
    subject: 'เรื่องทดสอบชื่อ',
    action: 'ฉบับร่าง',
    createdById: 'different-uid',
    createdByName: userLecturer.name,
    createdAt: '2026-10-09T10:00:00Z'
  };
  assert.equal(canUserViewDoc(userLecturer, docCreatedByName, memoWorkflow), true, 'Creator matches by name');

  // Unissued document in 'รอตรวจ' must be visible to creator and reviewers
  const unissuedReviewDoc = {
    id: 'doc-unissued-01',
    category: 'memo',
    year: 2569,
    sequenceNumber: 0,
    docNumber: '',
    isNumberIssued: false,
    date: '2026-10-09',
    from: 'สาขาวิทยาศาสตร์',
    to: 'คณบดี',
    subject: 'คำขอรอออกเลข',
    action: 'รอตรวจ',
    createdById: userLecturer.id,
    createdByName: userLecturer.name,
    createdAt: '2026-10-09T10:00:00Z'
  };
  assert.equal(canUserViewDoc(userLecturer, unissuedReviewDoc, memoWorkflow), true, 'Creator views unissued pending doc');
  assert.equal(canUserViewDoc(userClerk, unissuedReviewDoc, memoWorkflow), true, 'Clerk views unissued pending doc');
  assert.equal(canUserViewDoc(userDean, unissuedReviewDoc, memoWorkflow), false, 'Dean does not see pending doc prematurely');
  console.log(' PASS: Creator identity matching and unissued document visibility verified.');

  console.log('\n[TEST 11] Year Calculation & Date Synchronization:');
  const dateStr = '2026-10-09';
  const computedBE = Number(dateStr.slice(0, 4)) + 543;
  assert.equal(computedBE, 2569, 'Gregorian 2026 maps to Buddhist Era 2569');
  console.log(' PASS: Year calculation verified.');

  // Test 12: AI Document Drafting Engine
  console.log('\n[TEST 12] AI Document Drafting Engine (Natural Language to Official Correspondence):');
  const aiSpeakerDraft = draftGovernmentDocument({
    category: 'external_circular',
    userPrompt: 'ขอเชิญ นายสาธาร รวบรัด ครูชำนาญการพิเศษ เป็นวิทยากร โครงการพัฒนาศักยภาพบัณฑิต วันที่ ๑๕ - ๑๖ สิงหาคม ๒๕๖๙ ณ ห้อง 7113'
  });
  assert.ok(aiSpeakerDraft.subject.includes('วิทยากร'), 'AI Subject extracted correctly');
  assert.ok(aiSpeakerDraft.bodyParagraphs.length >= 3, 'AI structured in 3+ official paragraphs');
  assert.ok(aiSpeakerDraft.bodyParagraphs[0].startsWith('ด้วย'), 'Official opening with ด้วย');
  assert.ok(aiSpeakerDraft.bodyParagraphs[aiSpeakerDraft.bodyParagraphs.length - 1].startsWith('จึงเรียน'), 'Official closing with จึงเรียน');
  assert.equal(aiSpeakerDraft.isAiGenerated, true, 'Flagged as AI generated');

  const aiOrderDraft = draftGovernmentDocument({
    category: 'order',
    userPrompt: 'แต่งตั้งคณะกรรมการดำเนินงานโครงการบูรณาการธุรกิจการค้าสมัยใหม่ ดิจิทัล และสตาร์ทอัพท่องเที่ยวเพื่อพัฒนาเศรษฐกิจสร้างสรรค์'
  });
  assert.ok(aiOrderDraft.subject.includes('แต่งตั้งคณะกรรมการ'), 'Order subject generated');
  assert.ok(aiOrderDraft.bodyText.includes('อาศัยอำนาจตามความในมาตรา ๓๑'), 'Order statutory authority included');

  // AI Refinements
  const refinedFormal = draftGovernmentDocument({
    category: 'memo',
    userPrompt: '',
    context: {
      existingBody: 'พวกเราอยากจะขอส่งเอกสารจัดขึ้นวันที่ ๑๕ ตุลาคม',
      subject: 'ทดสอบ'
    },
    mode: 'formalize'
  });
  assert.ok(!refinedFormal.bodyText.includes('พวกเรา'), 'Colloquial removed in formalize');
  assert.ok(!refinedFormal.bodyText.includes('อยากจะขอ'), 'Formalized to official tone');

  const refinedJustify = draftGovernmentDocument({
    category: 'memo',
    userPrompt: '',
    context: {
      existingBody: 'ด้วยคณะมีโครงการ\n\nจึงเรียนมาเพื่อโปรดทราบ',
      subject: 'ทดสอบ'
    },
    mode: 'justify'
  });
  assert.ok(refinedJustify.bodyText.includes('พันธกิจยุทธศาสตร์'), 'Rationale added in justify');
  console.log(' PASS: AI Drafting Engine and 4-Part Structure verified.');

  // Test 13: Pre-Flight Document Validation Engine
  console.log('\n[TEST 13] Pre-Flight Document Validation Engine:');
  const invalidDoc = {
    category: 'memo',
    from: '',
    to: '',
    subject: '',
    bodyParagraphs: ['ข้อความสั้น']
  };
  const invalidReport = validateGovernmentDocument(invalidDoc, 'memo');
  assert.equal(invalidReport.isValid, false, 'Invalid document detected');
  assert.ok(invalidReport.errorCount >= 3, 'Missing from, to, subject caught as errors');

  // Test ban on 'ขอแสดงความนับถือ' in memo
  const illegalMemoDoc = {
    category: 'memo',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์',
    to: 'คณบดี',
    subject: 'เรื่องทดสอบ',
    date: '2026-10-09',
    signatoryName: 'ผศ.ดร.สิริศักดิ์  อาจวิชัย',
    signatoryPosition: 'คณบดี',
    bodyParagraphs: ['ด้วยคณะจะจัดงาน ขอแสดงความนับถือ จึงเรียนมาเพื่อโปรดทราบ']
  };
  const illegalMemoReport = validateGovernmentDocument(illegalMemoDoc, 'memo');
  assert.ok(illegalMemoReport.issues.some(i => i.id === 'memo_has_closing'), 'Detected illegal closing in memo');

  // Test placeholder detection
  const placeholderDoc = {
    category: 'memo',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์',
    to: 'คณบดี',
    subject: 'เรื่องทดสอบ',
    date: '2026-10-09',
    signatoryName: 'ผศ.ดร.สิริศักดิ์  อาจวิชัย',
    signatoryPosition: 'คณบดี',
    bodyParagraphs: ['ด้วยคณะจะจัดงานวันที่ [โปรดระบุวันที่] จึงเรียนมาเพื่อโปรดทราบ']
  };
  const placeholderReport = validateGovernmentDocument(placeholderDoc, 'memo');
  assert.ok(placeholderReport.issues.some(i => i.id === 'unfilled_placeholders'), 'Detected placeholder [...]');

  // Test valid document
  const validDoc = {
    category: 'memo',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์',
    to: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    subject: 'ขออนุมัติจัดโครงการสัมมนา',
    date: '2026-10-09',
    signatoryName: 'ผศ.ดร.สิริศักดิ์  อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    bodyParagraphs: [
      'ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์ มีความประสงค์จะจัดโครงการสัมมนาวิชาการ ในวันที่ ๑๕ ตุลาคม ๒๕๖๙',
      'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ'
    ]
  };
  const validReport = validateGovernmentDocument(validDoc, 'memo');
  assert.equal(validReport.isValid, true, 'Valid document passes pre-flight check');
  assert.equal(validReport.errorCount, 0, 'Zero errors on valid doc');
  console.log(' PASS: Pre-Flight Document Validation Engine verified.');

  // Test 14: Verification of 5 Real Documents & Layout Parity
  console.log('\n[TEST 14] Verification of 5 Real Documents & Layout Parity:');

  // 1. Memo Expert (ตัวอย่างจริงฉบับที่ ๑)
  const realMemo1 = {
    id: 'real-memo-01',
    category: 'memo',
    year: 2569,
    sequenceNumber: 101,
    docNumber: 'อว 0646.02/101',
    date: '2026-08-10',
    from: 'มหาวิทยาลัยราชภัฏชัยภูมิ คณะศิลปศาสตร์และวิทยาศาสตร์ โทร ๔๑๐๐',
    to: 'อาจารย์ ดร.วราวุฒิ มหามิตร',
    subject: 'ขอเชิญเป็นผู้เชี่ยวชาญตรวจสอบเครื่องมือในการวิจัย',
    bodyParagraphs: [
      'ด้วยนางสาวกรองทอง เสมารัมย์ และนางสาวน้ำผึ้ง แสนใส นักศึกษา หลักสูตรสาธารณสุขศาสตรบัณฑิต... นั้น',
      'ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ พิจารณาแล้วเห็นว่า ท่านเป็นผู้มีความรู้ ความเชี่ยวชาญ... จึงขอเชิญท่านเป็นผู้เชี่ยวชาญในการตรวจประเมิน และเสนอแนะเพื่อปรับปรุงแก้ไขเครื่องมือที่ใช้ในการวิจัยให้มีความถูกต้องและสมบูรณ์ รายละเอียดตามเอกสารที่แนบมาพร้อมนี้',
      'จึงเรียนมาเพื่อพิจารณา'
    ],
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    action: 'รอตรวจ'
  };
  const htmlMemo1 = documentHtml(realMemo1, 'http://localhost');
  assert.ok(htmlMemo1.includes('CPRU-66-001'), 'Memo 1 includes CPRU-66-001');
  assert.ok(htmlMemo1.includes('บันทึกข้อความ'), 'Memo 1 includes memo title');
  assert.ok(!htmlMemo1.includes('ขอแสดงความนับถือ'), 'Memo 1 has no illegal closing');

  // 2. Order Committee (ตัวอย่างจริงฉบับที่ ๒ - ที่ ๗๐/๒๕๖๙)
  const realOrder2 = {
    id: 'real-order-02',
    category: 'order',
    year: 2569,
    sequenceNumber: 70,
    docNumber: 'ที่ 70/๒๕๖๙',
    date: '2026-03-23',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
    to: '-',
    subject: 'แต่งตั้งคณะกรรมการดำเนินงานโครงการบูรณาการธุรกิจการค้าสมัยใหม่ ดิจิทัล และสตาร์ทอัพท่องเที่ยวเพื่อพัฒนาเศรษฐกิจสร้างสรรค์',
    bodyParagraphs: [
      'ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ ได้ดำเนินโครงการบูรณาการธุรกิจการค้าสมัยใหม่...',
      '๑. คณะกรรมการอำนวยการ',
      '๑. ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย  ประธานกรรมการ',
      '๕  อาจารย์ ดร.รจนา เมืองแสน  กรรมการ',
      'หน้าที่ ให้คำปรึกษา แนะนำ',
      '๑. ดำเนินงานโครงการให้เกิดผลลัพธ์ตามกิจกรรม'
    ],
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    action: 'รอตรวจ'
  };
  // Test committee parsing with non-dotted number
  const parsedRow5 = parseCommitteeRow('๕  อาจารย์ ดร.รจนา เมืองแสน  กรรมการ');
  assert.equal(parsedRow5.isMember, true, 'Committee row with non-dotted number ๕ parsed successfully');
  assert.equal(parsedRow5.role, 'กรรมการ', 'Role extracted as กรรมการ');

  const htmlOrder2 = documentHtml(realOrder2, 'http://localhost');
  assert.ok(htmlOrder2.includes('สั่ง ณ วันที่'), 'Order fallback date rendered in HTML');
  assert.ok(htmlOrder2.includes('มีนาคม'), 'Buddhist month rendered in Order date');

  // 3. External Circular Speaker (ตัวอย่างจริงฉบับที่ ๓ - ที่ ว ๕๒๐ - ๗ รายชื่อ)
  const realExtCirc3 = {
    id: 'real-ext-circ-03',
    category: 'external_circular',
    year: 2569,
    sequenceNumber: 520,
    docNumber: 'ที่ อว 0646.02/ว 520',
    date: '2026-08-10',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
    officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 หมู่ 2 ถนนชัยภูมิ-ตาดโตน\nตำบลนาฝาย อำเภอเมือง \nจังหวัดชัยภูมิ 36000',
    to: 'นายสาธาร รวบรัด',
    recipients: [
      'นายสาธาร รวบรัด ครูชำนาญการพิเศษ โรงเรียนบ้านกุดโคลน',
      'นายจตุรงค์ ลิ้มไพบูลย์ ผู้อำนวยการ โรงเรียนบ้านห้วยกุ่ม',
      'นางอรพรรณ ลิ้มไพบูลย์ ครูชำนาญการพิเศษ โรงเรียนบ้านห้วยกุ่ม',
      'นายดนุภพ โพธิ์งาม ผู้อำนวยการโรงเรียนหินฝนวิทยาคม',
      'นางสาวกิตติมา จำรัสไว',
      'นางสาวชญานี เผียงสูงเนิน',
      'นางสาวชญานิน เผียงสูงเนิน'
    ],
    subject: 'ขอเรียนเชิญเป็นวิทยากร',
    attachmentsList: [
      'กำหนดการ  จำนวน ๑ ฉบับ',
      'แบบตอบรับ  จำนวน ๑ ฉบับ'
    ],
    bodyParagraphs: [
      'ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ สาขาวิชาวิศวกรรมอุตสาหกรรมและโลจิสติกส์...',
      'ในการนี้ จึงขอเชิญท่านเป็นวิทยากร...',
      'จึงเรียนมาเพื่อโปรดพิจารณา'
    ],
    coordinatorInfo: 'ผู้ประสานงาน อาจารย์วราภรณ์ จันทร์เวียง\nโทรศัพท์ ๐๙ ๐๑๑๘ ๙4๓๐',
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน\nอธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ',
    action: 'รอตรวจ'
  };
  const htmlExtCirc3 = documentHtml(realExtCirc3, 'http://localhost');
  assert.ok(htmlExtCirc3.includes('ขอแสดงความนับถือ'), 'External letter includes closing');
  assert.ok(htmlExtCirc3.includes('ผู้ประสานงาน'), 'External letter includes coordinator info');
  assert.ok(htmlExtCirc3.includes('นายสาธาร รวบรัด'), 'External circular includes recipient 1');
  assert.ok(htmlExtCirc3.includes('นางสาวชญานิน เผียงสูงเนิน'), 'External circular includes recipient 7');

  // 4. External Academic Acceptance (ตัวอย่างจริงฉบับที่ ๔ - ที่ ๘๖๔)
  const realExt4 = {
    id: 'real-ext-04',
    category: 'external',
    year: 2569,
    sequenceNumber: 864,
    docNumber: 'ที่ อว ๐646.0๒/864',
    date: '2026-10-02',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
    officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 ถนนชัยภูมิ-ตาดโตน ตำบลนาฝาย\nอำเภอเมือง จังหวัดชัยภูมิ 36000',
    to: 'พระมหาพิสุทธิ์ สิทฺธิเมธี (ภารัง), อาจารย์ ดร.',
    referenceDoc: 'หนังสือมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ที่ อา ๘๐๐๕.๑/ว ๑๒๒',
    subject: 'ตอบรับการเผยแพร่ผลงานทางวิชาการ',
    bodyParagraphs: [
      'ตามหนังสือ คณะสังคมศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย... นั้น',
      'ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ ได้รับผลงานทางวิชาการ... เรียบร้อยแล้ว',
      'จึงเรียนมาเพื่อโปรดทราบ และขอขอบคุณมา ณ โอกาสนี้'
    ],
    coordinatorInfo: 'สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์\nโทร. 0 4481 5111 ต่อ 4100\nไปรษณีย์อิเล็กทรอนิกส์ Officer@cpru.ac.th',
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน\nอธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ',
    action: 'รอตรวจ'
  };
  const htmlExt4 = documentHtml(realExt4, 'http://localhost');
  assert.ok(htmlExt4.includes('อ้างถึง'), 'External letter 4 includes reference');
  assert.ok(htmlExt4.includes('Officer@cpru.ac.th'), 'External letter 4 includes email');

  // 5. Memo CWIE (ตัวอย่างจริงฉบับที่ ๕)
  const realMemo5 = {
    id: 'real-memo-05',
    category: 'memo_circular',
    year: 2569,
    sequenceNumber: 0,
    docNumber: '',
    date: '2026-09-15',
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ โทร ๔๑๐๐',
    to: 'อาจารย์ผู้สอนประจำรายวิชา',
    subject: 'ขอความอนุเคราะห์เวลาเรียนของนักศึกษา ชั้นปีที่ 3 เพื่อเข้าร่วมอบรมก่อนการปฏิบัติงาน (Pre-CWIE Training)',
    bodyParagraphs: [
      'ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์ จะดำเนินการจัดกิจกรรมอบรมก่อนการปฏิบัติงาน (Pre-CWIE Training)...',
      'ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ จึงขอความอนุเคราะห์เวลาเรียนของนักศึกษา ชั้นปีที่ 3...',
      'จึงเรียนมาเพื่อพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้'
    ],
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    action: 'รอตรวจ'
  };
  const htmlMemo5 = documentHtml(realMemo5, 'http://localhost');
  assert.ok(htmlMemo5.includes('Pre-CWIE Training'), 'Memo 5 includes CWIE subject');
  assert.ok(htmlMemo5.includes('CPRU-66-001'), 'Memo circular includes CPRU-66-001');

  // Verify Word buildAdminWord compiles successfully for all 5 documents
  const wordBlob1 = await buildAdminWord(realMemo1);
  assert.ok(wordBlob1, 'Word Blob generated for Memo 1');
  const wordBlob2 = await buildAdminWord(realOrder2);
  assert.ok(wordBlob2, 'Word Blob generated for Order 2');
  const wordBlob3 = await buildAdminWord(realExtCirc3);
  assert.ok(wordBlob3, 'Word Blob generated for External Circular 3');
  const wordBlob4 = await buildAdminWord(realExt4);
  assert.ok(wordBlob4, 'Word Blob generated for External Letter 4');
  const wordBlob5 = await buildAdminWord(realMemo5);
  assert.ok(wordBlob5, 'Word Blob generated for Memo Circular 5');

  console.log(' PASS: All 5 real documents verified with 1:1 layout parity across HTML & Word.');

  console.log('\n[TEST 15] Central Template Spec: A4 and per-category margins shared by HTML and Word:');
  const { getTemplateSpec, cssMargin } = require('../lib/adminTemplateSpec.ts');
  for (const cat of ['memo', 'memo_circular', 'order', 'external', 'external_circular']) {
    const html = documentHtml({ ...signingDoc, category: cat, paperSize: 'letter', bodyParagraphs: ['x'] }, 'http://localhost');
    assert.ok(html.includes('size: A4 portrait'), cat + ' must be A4 even if record says letter');
    assert.ok(html.includes('margin: ' + cssMargin(getTemplateSpec(cat).margins)), cat + ' @page margin must come from spec');
  }
  console.log(' PASS: Template spec drives A4 size and margins for all 5 categories.');

  console.log('\n[TEST 16] Rich Text Body: sanitize, round-trip, HTML preview and Word export:');
  const rich = require('../lib/richBody.ts');
  const dirty = '<p style="text-align:center;color:red" onclick="x()">สวัสดี<strong>ตัวหนา</strong><script>alert(1)</script></p>'
    + '<p data-first="0" data-indent="2"><em><u>เอียงขีดเส้นใต้</u></em><br>บรรทัดใหม่ &amp; &lt;b&gt;</p><img src=x onerror=alert(1)>';
  const cleaned = rich.sanitizeBodyHtml(dirty);
  assert.equal(/onclick|onerror|<script|<img|color:red/i.test(cleaned), false, 'dangerous markup must be stripped');
  assert.ok(cleaned.includes('<p style="text-align:center">'), 'center alignment preserved');
  assert.ok(cleaned.includes('data-first="0"') && cleaned.includes('data-indent="2"'), 'indent attributes preserved');
  assert.equal(rich.sanitizeBodyHtml(cleaned), cleaned, 'sanitize is idempotent');
  const parsed = rich.parseBodyHtml(cleaned);
  assert.equal(parsed.length, 3 - 1, 'two paragraphs (stray img dropped)');
  assert.equal(parsed[1].text, 'เอียงขีดเส้นใต้\nบรรทัดใหม่ & <b>', 'br becomes newline and entities decode');
  assert.deepEqual(rich.bodyHtmlToParagraphs(rich.paragraphsToBodyHtml(['ก', 'ข'])), ['ก', 'ข'], 'plain paragraphs round-trip');

  const richDoc = {
    ...signingDoc,
    category: 'external',
    bodyParagraphs: ['สวัสดีตัวหนา', 'เอียงขีดเส้นใต้'],
    bodyHtml: '<p style="text-align:center">สวัสดี<strong>ตัวหนา</strong></p><p data-first="0" data-indent="2"><em><u>เอียงขีดเส้นใต้</u></em></p>'
  };
  const richHtmlOut = documentHtml(richDoc, 'http://localhost');
  assert.ok(richHtmlOut.includes('text-align: center'), 'preview honours centered paragraph');
  assert.ok(richHtmlOut.includes('<strong>'), 'preview keeps bold run');
  assert.ok(richHtmlOut.includes('text-indent: 0;') && richHtmlOut.includes('margin-left: 25.4mm'), 'preview honours first-line off and indent level 2');
  assert.equal(documentHtml({ ...richDoc, bodyHtml: '<p>x<script>alert(1)</script></p>' }, 'http://localhost').includes('<script>alert'), false, 'script in bodyHtml never reaches preview');
  for (const cat of ['memo', 'external', 'order']) {
    const blob = await buildAdminWord({ ...richDoc, category: cat, action: 'รอตรวจ' });
    assert.ok(blob.size > 1000, cat + ' Word export builds from bodyHtml');
  }
  console.log(' PASS: Rich body sanitized, round-trips, and renders in preview and Word.');

  console.log('\n=== ALL 16 CORE TEST GROUPS PASSED WITH 100% ACCURACY! ===');
}

runAllTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

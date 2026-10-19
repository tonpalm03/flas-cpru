import assert from 'node:assert';
import { test, describe } from 'node:test';
import {
  canUserCreateDoc,
  canUserViewDoc,
  canUserEditContent,
  canUserIssueDocNumber,
  canUserSubmitToSign,
  canUserSign,
  canUserDeleteDoc,
  canUserDownloadWord,
  canUserDownloadPdf,
  getUserRoles,
  DEFAULT_WORKFLOW_CONFIGS
} from '../lib/workflowPermissionService.ts';
import {
  registryNumber,
  validateRegistry,
  ADMIN_ACTIONS,
  bangkokDate
} from '../lib/adminRegistryModel.ts';
import {
  getRecordDigitType,
  thaiGovDate,
  formatSignatoryName,
  sanitizeFieldText,
  getDisplayDocNumber,
  documentHtml,
  buildAdminWord
} from '../lib/adminDocument.ts';
import type { 
  UserProfile, 
  AdminDocRegistryRecord, 
  DocumentWorkflowConfig 
} from '../lib/types.ts';

// Mock Profiles
const userLecturer: UserProfile = {
  id: 'u-lecturer',
  email: 'lecturer@cpru.ac.th',
  name: 'ดร.สมชาย ใจดี',
  role: 'lecturer',
  roles: ['อาจารย์'],
  status: 'active',
  createdAt: '2026-01-01'
};

const userClerk: UserProfile = {
  id: 'u-clerk',
  email: 'clerk@cpru.ac.th',
  name: 'นางสาวกานดา สารบรรณ',
  role: 'gov_officer',
  roles: ['ธุรการ', 'เจ้าหน้าที่'],
  status: 'active',
  createdAt: '2026-01-01'
};

const userFinanceHelper: UserProfile = {
  id: 'u-finance',
  email: 'finance@cpru.ac.th',
  name: 'นายวินัย การเงิน',
  role: 'staff_finance',
  roles: ['การเงิน', 'เจ้าหน้าที่'],
  status: 'active',
  createdAt: '2026-01-01'
};

const userDean: UserProfile = {
  id: 'u-dean',
  email: 'dean@cpru.ac.th',
  name: 'ผศ.ดร.สิริศักดิ์ อาจวิชัย',
  role: 'dean',
  roles: ['คณบดี', 'ผู้บริหาร'],
  position: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
  status: 'active',
  createdAt: '2026-01-01'
};

const userExecutiveOther: UserProfile = {
  id: 'u-exec',
  email: 'exec@cpru.ac.th',
  name: 'ดร.วิชาญ ผู้บริหาร',
  role: 'executive',
  roles: ['ผู้บริหาร'],
  status: 'active',
  createdAt: '2026-01-01'
};

const userAdmin: UserProfile = {
  id: 'u-admin',
  email: 'admin@cpru.ac.th',
  name: 'ผู้ดูแลระบบ',
  role: 'admin',
  roles: ['แอดมิน'],
  status: 'active',
  createdAt: '2026-01-01'
};

describe('1. Permission Engine: All Roles Can Create Documents (Requirement 2)', () => {
  test('Every active role can create documents without needing a special Creator role', () => {
    assert.strictEqual(canUserCreateDoc(userLecturer), true, 'Lecturer can create doc');
    assert.strictEqual(canUserCreateDoc(userClerk), true, 'Clerk can create doc');
    assert.strictEqual(canUserCreateDoc(userFinanceHelper), true, 'Finance can create doc');
    assert.strictEqual(canUserCreateDoc(userDean), true, 'Dean can create doc');
    assert.strictEqual(canUserCreateDoc(userExecutiveOther), true, 'Executive can create doc');
    assert.strictEqual(canUserCreateDoc(userAdmin), true, 'Admin can create doc');
  });

  test('Inactive users cannot create documents', () => {
    const inactiveUser: UserProfile = { ...userLecturer, status: 'inactive' };
    assert.strictEqual(canUserCreateDoc(inactiveUser), false);
  });
});

describe('2. Visibility & Scoping per Lifecycle Stage (Requirement 4)', () => {
  const memoWorkflow = DEFAULT_WORKFLOW_CONFIGS['memo'];

  test('Draft Stage: ONLY creator (and admin) can view; Reviewers & Executives do NOT see it', () => {
    const draftDoc: AdminDocRegistryRecord = {
      id: 'doc-draft-01',
      category: 'memo',
      year: 2569,
      sequenceNumber: 0,
      docNumber: '',
      isNumberIssued: false,
      date: '2026-10-09',
      from: 'สาขาวิชาวิทยาศาสตร์',
      to: 'คณบดี',
      subject: 'ร่างบันทึกข้อความภายใน',
      action: 'ฉบับร่าง',
      createdById: userLecturer.id,
      createdByName: userLecturer.name,
      createdAt: '2026-10-09T10:00:00Z'
    };

    assert.strictEqual(canUserViewDoc(userLecturer, draftDoc, memoWorkflow), true, 'Creator views own draft');
    assert.strictEqual(canUserViewDoc(userClerk, draftDoc, memoWorkflow), false, 'Clerk cannot view draft of others');
    assert.strictEqual(canUserViewDoc(userDean, draftDoc, memoWorkflow), false, 'Dean cannot view draft of others');
    assert.strictEqual(canUserViewDoc(userExecutiveOther, draftDoc, memoWorkflow), false, 'Executive cannot view draft of others');
    assert.strictEqual(canUserViewDoc(userAdmin, draftDoc, memoWorkflow), true, 'Admin can view draft');
  });

  test('Pending Review (รอตรวจ): Creator can view/track; Reviewers can view; Executives do NOT see simply by executive role', () => {
    const reviewDoc: AdminDocRegistryRecord = {
      id: 'doc-review-01',
      category: 'memo',
      year: 2569,
      sequenceNumber: 0,
      docNumber: '',
      isNumberIssued: false,
      date: '2026-10-09',
      from: 'สาขาวิชาวิทยาศาสตร์',
      to: 'คณบดี',
      subject: 'ขออนุมัติจัดโครงการ',
      action: 'รอตรวจ',
      createdById: userLecturer.id,
      createdByName: userLecturer.name,
      createdAt: '2026-10-09T10:00:00Z'
    };

    assert.strictEqual(canUserViewDoc(userLecturer, reviewDoc, memoWorkflow), true, 'Creator tracks own doc');
    assert.strictEqual(canUserViewDoc(userClerk, reviewDoc, memoWorkflow), true, 'Clerk reviewer can view');
    assert.strictEqual(canUserViewDoc(userExecutiveOther, reviewDoc, memoWorkflow), false, 'Unassigned Executive cannot view in review stage');
  });

  test('Pending Sign (รอลงนาม): Creator tracks; Signers view PDF; Reviewers view scope', () => {
    const signingDoc: AdminDocRegistryRecord = {
      id: 'doc-sign-01',
      category: 'memo',
      year: 2569,
      sequenceNumber: 101,
      docNumber: 'อว 0646.02/101',
      isNumberIssued: true,
      date: '2026-10-09',
      from: 'สาขาวิชาวิทยาศาสตร์',
      to: 'คณบดี',
      subject: 'ขออนุมัติจัดโครงการ',
      action: 'รอลงนาม',
      createdById: userLecturer.id,
      createdByName: userLecturer.name,
      createdAt: '2026-10-09T10:00:00Z'
    };

    assert.strictEqual(canUserViewDoc(userLecturer, signingDoc, memoWorkflow), true, 'Creator tracks');
    assert.strictEqual(canUserViewDoc(userDean, signingDoc, memoWorkflow), true, 'Dean signer can view');
    assert.strictEqual(canUserViewDoc(userClerk, signingDoc, memoWorkflow), true, 'Clerk can view');
  });
});

describe('3. Granular Separation of Permissions (Requirement 3 & 4)', () => {
  const customWorkflow: DocumentWorkflowConfig = {
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

  const reviewDoc: AdminDocRegistryRecord = {
    id: 'doc-test-02',
    category: 'memo',
    year: 2569,
    sequenceNumber: 0,
    docNumber: '',
    isNumberIssued: false,
    date: '2026-10-09',
    from: 'สาขา',
    to: 'คณบดี',
    subject: 'เรื่องทดสอบ',
    action: 'รอตรวจ',
    createdById: userLecturer.id,
    createdByName: userLecturer.name,
    createdAt: '2026-10-09T10:00:00Z'
  };

  test('Adding Finance to Reviewers allows editing content but NOT issuing number, deleting, or signing', () => {
    // Content edit in review stage
    assert.strictEqual(canUserEditContent(userFinanceHelper, reviewDoc, customWorkflow), true, 'Finance can help edit content');
    // Issue doc number
    assert.strictEqual(canUserIssueDocNumber(userFinanceHelper, reviewDoc, customWorkflow), false, 'Finance cannot issue doc number');
    assert.strictEqual(canUserIssueDocNumber(userClerk, reviewDoc, customWorkflow), true, 'Clerk can issue doc number');
    // Sign
    assert.strictEqual(canUserSign(userFinanceHelper, reviewDoc, customWorkflow), false, 'Finance cannot sign');
    assert.strictEqual(canUserSign(userDean, { ...reviewDoc, action: 'รอลงนาม' }, customWorkflow), true, 'Dean can sign');
  });

  test('Content editing is STRICTLY LOCKED during รอลงนาม and ลงนามแล้ว', () => {
    const signingDoc: AdminDocRegistryRecord = { ...reviewDoc, action: 'รอลงนาม' };
    const signedDoc: AdminDocRegistryRecord = { ...reviewDoc, action: 'ลงนามแล้ว' };

    assert.strictEqual(canUserEditContent(userLecturer, signingDoc, customWorkflow), false, 'Creator cannot edit in signing');
    assert.strictEqual(canUserEditContent(userClerk, signingDoc, customWorkflow), false, 'Clerk cannot edit in signing');
    assert.strictEqual(canUserEditContent(userDean, signingDoc, customWorkflow), false, 'Dean cannot edit in signing');

    assert.strictEqual(canUserEditContent(userLecturer, signedDoc, customWorkflow), false, 'Creator cannot edit completed doc');
    assert.strictEqual(canUserEditContent(userClerk, signedDoc, customWorkflow), false, 'Clerk cannot edit completed doc');
  });

  test('Word download is STRICTLY PROHIBITED during รอลงนาม (PDF only)', () => {
    const signingDoc: AdminDocRegistryRecord = { ...reviewDoc, action: 'รอลงนาม' };
    assert.strictEqual(canUserDownloadWord(userLecturer, signingDoc, customWorkflow), false, 'Word locked during signing');
    assert.strictEqual(canUserDownloadWord(userDean, signingDoc, customWorkflow), false, 'Word locked during signing');
    assert.strictEqual(canUserDownloadPdf(userDean, signingDoc, customWorkflow), true, 'PDF allowed during signing');
  });
});

describe('4. Document Numbering & Sequence Controls (Requirement on Numbering)', () => {
  test('Pending numbering retains permanent prefix (e.g. อว 0646.02/) when unissued', () => {
    const unissuedDoc: Partial<AdminDocRegistryRecord> = {
      docNumber: '',
      isNumberIssued: false,
      sequenceNumber: 0
    };
    assert.strictEqual(getDisplayDocNumber(unissuedDoc), 'อว 0646.02/');

    const issuedDoc: Partial<AdminDocRegistryRecord> = {
      docNumber: 'อว 0646.02/101',
      isNumberIssued: true,
      sequenceNumber: 101
    };
    assert.strictEqual(getDisplayDocNumber(issuedDoc), 'อว 0646.02/101');
  });

  test('registryNumber formats properly for built-in categories', () => {
    assert.strictEqual(registryNumber('memo', 101, 2569), 'อว 0646.02/101');
    assert.strictEqual(registryNumber('memo_circular', 45, 2569), 'อว 0646.02/ว 45');
    assert.strictEqual(registryNumber('external', 88, 2569), 'ที่ อว 0646.02/88');
    assert.strictEqual(registryNumber('order', 32, 2569), 'ที่ 32/2569');
    assert.strictEqual(registryNumber('memo', 0, 2569), '');
  });

  test('Validation allows draft / unissued sequence number (0)', () => {
    assert.doesNotThrow(() => {
      validateRegistry({
        category: 'memo',
        year: 2569,
        sequenceNumber: 0,
        date: '2026-10-09',
        from: 'คณะศิลปศาสตร์',
        to: 'อธิการบดี',
        subject: 'ขออนุมัติ',
        action: 'ฉบับร่าง'
      });
    });
  });
});

describe('5. Divider Lines & Document Formatting (Requirement 6 & 8)', () => {
  test('Thai Government dates format properly', () => {
    const formatted = thaiGovDate('2026-10-09', 'thai', 'memo');
    assert.ok(formatted.includes('ตุลาคม'), 'Contains October month in Thai');
    assert.ok(formatted.includes('๒๕๖๙'), 'Contains 2569 in Thai digits');
  });

  test('Signatory name formats with 2 spaces between first and last name', () => {
    assert.strictEqual(formatSignatoryName('ดร.สมชาย ใจดี'), 'ดร.สมชาย  ใจดี');
    assert.strictEqual(formatSignatoryName('ผศ.ดร.สิริศักดิ์   อาจวิชัย'), 'ผศ.ดร.สิริศักดิ์  อาจวิชัย');
  });

  test('Sanitize field text strips duplicate prefix keyword', () => {
    assert.strictEqual(sanitizeFieldText('เรื่อง ขออนุมัติจัดโครงการ', 'เรื่อง'), 'ขออนุมัติจัดโครงการ');
    assert.strictEqual(sanitizeFieldText('อ้างถึง หนังสือ ที่ อว 123', 'อ้างถึง'), 'หนังสือ ที่ อว 123');
  });
});

describe('6. Zero-Emoji Compliance Test (Requirement 0 & 1)', () => {
  test('Ensure no forbidden emoji codes exist in standard status labels', () => {
    const emojisRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const action of ADMIN_ACTIONS) {
      assert.strictEqual(emojisRegex.test(action), false, `Action '${action}' must not contain emojis`);
    }
  });
});

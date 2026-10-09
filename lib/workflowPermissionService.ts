import { doc, getDoc, getDocs, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { 
  UserProfile, 
  AdminDocRegistryRecord, 
  DocumentWorkflowConfig, 
  SequentialSignerStep,
  StandardRole
} from './types';

const WORKFLOW_CACHE_KEY = 'faculty_erp_workflow_configs_cache_v1';

export const DEFAULT_WORKFLOW_CONFIGS: Record<string, DocumentWorkflowConfig> = {
  memo: {
    id: 'memo',
    category: 'memo',
    title: 'บันทึกข้อความ',
    reviewers: { roles: ['ธุรการ', 'แอดมิน'] },
    numberers: { roles: ['ธุรการ', 'แอดมิน'] },
    signSubmitters: { roles: ['ธุรการ', 'แอดมิน'] },
    signers: {
      mode: 'single',
      roles: ['คณบดี', 'รองคณบดี', 'ผู้บริหาร']
    },
    viewers: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    downloaders: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    allowCreatorSelfReview: false,
    allowCreatorSelfSign: false
  },
  memo_circular: {
    id: 'memo_circular',
    category: 'memo_circular',
    title: 'บันทึกข้อความ (ว)',
    reviewers: { roles: ['ธุรการ', 'แอดมิน'] },
    numberers: { roles: ['ธุรการ', 'แอดมิน'] },
    signSubmitters: { roles: ['ธุรการ', 'แอดมิน'] },
    signers: {
      mode: 'single',
      roles: ['คณบดี', 'รองคณบดี', 'ผู้บริหาร']
    },
    viewers: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    downloaders: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    allowCreatorSelfReview: false,
    allowCreatorSelfSign: false
  },
  external: {
    id: 'external',
    category: 'external',
    title: 'หนังสือภายนอก',
    reviewers: { roles: ['ธุรการ', 'แอดมิน'] },
    numberers: { roles: ['ธุรการ', 'แอดมิน'] },
    signSubmitters: { roles: ['ธุรการ', 'แอดมิน'] },
    signers: {
      mode: 'single',
      roles: ['คณบดี', 'รองคณบดี']
    },
    viewers: { roles: ['ธุรการ', 'แอดมิน'] },
    downloaders: { roles: ['ธุรการ', 'แอดมิน'] },
    allowCreatorSelfReview: false,
    allowCreatorSelfSign: false
  },
  external_circular: {
    id: 'external_circular',
    category: 'external_circular',
    title: 'หนังสือภายนอก (ว)',
    reviewers: { roles: ['ธุรการ', 'แอดมิน'] },
    numberers: { roles: ['ธุรการ', 'แอดมิน'] },
    signSubmitters: { roles: ['ธุรการ', 'แอดมิน'] },
    signers: {
      mode: 'single',
      roles: ['คณบดี', 'รองคณบดี']
    },
    viewers: { roles: ['ธุรการ', 'แอดมิน'] },
    downloaders: { roles: ['ธุรการ', 'แอดมิน'] },
    allowCreatorSelfReview: false,
    allowCreatorSelfSign: false
  },
  order: {
    id: 'order',
    category: 'order',
    title: 'คำสั่ง',
    reviewers: { roles: ['ธุรการ', 'แอดมิน'] },
    numberers: { roles: ['ธุรการ', 'แอดมิน'] },
    signSubmitters: { roles: ['ธุรการ', 'แอดมิน'] },
    signers: {
      mode: 'single',
      roles: ['คณบดี']
    },
    viewers: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    downloaders: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    allowCreatorSelfReview: false,
    allowCreatorSelfSign: false
  }
};

/**
 * Extract all roles from a user profile (multi-role + legacy fallback)
 */
export function getUserRoles(user: UserProfile | null): string[] {
  if (!user) return [];
  const set = new Set<string>();
  if (user.roles && Array.isArray(user.roles)) {
    user.roles.forEach(r => set.add(r));
  }
  if (user.role) {
    set.add(user.role);
    if (user.role === 'admin') { set.add('แอดมิน'); set.add('ธุรการ'); }
    if (user.role === 'dean') { set.add('คณบดี'); set.add('ผู้บริหาร'); }
    if (user.role === 'staff_finance') { set.add('การเงิน'); }
    if (user.role === 'staff_procurement') { set.add('พัสดุ'); }
    if (user.role === 'staff_hr') { set.add('บุคคล'); }
    if (user.role === 'staff_plan') { set.add('แผนงาน'); }
    if (user.role === 'lecturer') { set.add('อาจารย์'); }
    if (user.role === 'gov_officer') { set.add('เจ้าหน้าที่'); }
  }
  return Array.from(set);
}

/**
 * Check if a user matches a role list or specific user ID list
 */
export function isUserMatched(
  user: UserProfile | null, 
  group?: { roles: string[]; userIds?: string[] }
): boolean {
  if (!user || user.status !== 'active') return false;
  if (!group) return false;

  // Superadmin check
  const roles = getUserRoles(user);
  if (roles.includes('แอดมิน') || user.role === 'admin') return true;

  // Specific user ID match
  if (group.userIds && group.userIds.includes(user.id)) {
    return true;
  }

  // Role list match
  if (group.roles && group.roles.some(r => roles.includes(r))) {
    return true;
  }

  return false;
}

/**
 * Fetch a workflow config for a category from Firestore or local cache or defaults
 */
export async function getWorkflowConfig(categoryId: string): Promise<DocumentWorkflowConfig> {
  const cached = getCachedWorkflowConfig(categoryId);
  if (cached) return cached;

  const defaultConfig: DocumentWorkflowConfig = DEFAULT_WORKFLOW_CONFIGS[categoryId] || {
    id: categoryId,
    category: categoryId,
    title: categoryId,
    reviewers: { roles: ['ธุรการ', 'แอดมิน'] },
    numberers: { roles: ['ธุรการ', 'แอดมิน'] },
    signSubmitters: { roles: ['ธุรการ', 'แอดมิน'] },
    signers: {
      mode: 'single',
      roles: ['คณบดี', 'รองคณบดี', 'ผู้บริหาร']
    },
    viewers: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    downloaders: { roles: ['ธุรการ', 'แอดมิน', 'อาจารย์', 'เจ้าหน้าที่'] },
    allowCreatorSelfReview: false,
    allowCreatorSelfSign: false
  };

  if (!isConfigured || !db) {
    return defaultConfig;
  }

  try {
    const docRef = doc(db, 'system_workflows', categoryId);
    const snap = await Promise.race([
      getDoc(docRef),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);

    if (snap && snap.exists()) {
      const data = snap.data() as DocumentWorkflowConfig;
      setCachedWorkflowConfig(categoryId, data);
      return data;
    }
  } catch (err) {
    // Return default on error / timeout
  }

  return defaultConfig;
}

/**
 * Save a workflow configuration to Firestore and local cache
 */
export async function saveWorkflowConfig(
  config: DocumentWorkflowConfig, 
  actor: UserProfile
): Promise<DocumentWorkflowConfig> {
  const roles = getUserRoles(actor);
  if (!roles.includes('แอดมิน') && actor.role !== 'admin') {
    throw new Error('มีเฉพาะแอดมินเท่านั้นที่สามารถปรับแต่งขั้นตอนงานและสิทธิ์ได้');
  }

  const payload: DocumentWorkflowConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name || actor.email || actor.id
  };

  setCachedWorkflowConfig(config.id, payload);

  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'system_workflows', config.id);
      await setDoc(docRef, {
        ...JSON.parse(JSON.stringify(payload)),
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('saveWorkflowConfig cloud error:', err);
    }
  }

  return payload;
}

function getCachedWorkflowConfig(categoryId: string): DocumentWorkflowConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${WORKFLOW_CACHE_KEY}_${categoryId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function setCachedWorkflowConfig(categoryId: string, config: DocumentWorkflowConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${WORKFLOW_CACHE_KEY}_${categoryId}`, JSON.stringify(config));
  } catch {}
}

// ---------------------------------------------------------------------------
// GRANULAR PERMISSIONS EVALUATION ENGINE
// ---------------------------------------------------------------------------

/**
 * 2. Every role can create documents (Teachers, Staff, Admin, Dean, Deputy Dean, Finance, etc.)
 */
export function canUserCreateDoc(user: UserProfile | null): boolean {
  if (!user || user.status !== 'active') return false;
  return true;
}

/**
 * 4. Visibility Scope:
 * - Draft: ONLY creator (and Superadmin).
 * - Pending Review: Creator, Assigned Reviewers (by role or ID). (Executives do not see simply by role).
 * - Pending Sign: Creator, Assigned Reviewers (view-only), Assigned Signers (view PDF).
 * - Signed: Creator, Assigned Reviewers, Assigned Signers, Authorized Viewers.
 */
export function canUserViewDoc(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  if (!user || user.status !== 'active') return false;
  
  const roles = getUserRoles(user);
  const isSuperAdmin = roles.includes('แอดมิน') || user.role === 'admin';
  if (isSuperAdmin) return true;

  // Helper for creator matching
  const isCreator = record.createdById === user.id || 
                    (user.email && (record.createdById === user.email || record.createdByEmail === user.email)) ||
                    (user.name && record.createdByName === user.name);

  // Creator can always view and track their own document at any stage
  if (isCreator) return true;

  const currentAction = record.action || 'รอตรวจ';

  // DRAFT: ONLY creator and admin can view
  if (currentAction === 'ฉบับร่าง') {
    return false;
  }

  // PENDING REVIEW: Assigned Reviewers
  if (currentAction === 'รอตรวจ') {
    if (record.assignedReviewerIds && record.assignedReviewerIds.includes(user.id)) return true;
    if (config && isUserMatched(user, config.reviewers)) return true;
    return false;
  }

  // PENDING SIGN: Assigned Reviewers or Assigned Signers
  if (currentAction === 'รอลงนาม') {
    if (record.assignedReviewerIds && record.assignedReviewerIds.includes(user.id)) return true;
    if (record.assignedSignerIds && record.assignedSignerIds.includes(user.id)) return true;
    if (config && isUserMatched(user, config.reviewers)) return true;
    if (config && isUserMatched(user, config.signers)) return true;
    return false;
  }

  // SIGNED: Viewers / Relevant parties
  if (currentAction === 'ลงนามแล้ว') {
    if (record.assignedReviewerIds && record.assignedReviewerIds.includes(user.id)) return true;
    if (record.assignedSignerIds && record.assignedSignerIds.includes(user.id)) return true;
    if (config && isUserMatched(user, config.viewers)) return true;
    if (config && isUserMatched(user, config.reviewers)) return true;
    if (config && isUserMatched(user, config.signers)) return true;
    return false;
  }

  return false;
}

/**
 * Content Editing Permission:
 * - Draft: Creator can edit.
 * - Pending Review: Reviewers can edit content.
 * - Pending Sign: NO ONE can edit content (locked for signing).
 * - Signed: NO ONE can edit content (immutable).
 */
export function canUserEditContent(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  if (!user || user.status !== 'active') return false;

  const roles = getUserRoles(user);
  const isSuperAdmin = roles.includes('แอดมิน') || user.role === 'admin';

  const isCreator = record.createdById === user.id || 
                    (user.email && (record.createdById === user.email || record.createdByEmail === user.email)) ||
                    (user.name && record.createdByName === user.name);

  const currentAction = record.action || 'รอตรวจ';

  // Locked once in signing or completed
  if (currentAction === 'รอลงนาม' || currentAction === 'ลงนามแล้ว') {
    return false;
  }

  // Draft: creator (or superadmin)
  if (currentAction === 'ฉบับร่าง') {
    return isCreator || isSuperAdmin;
  }

  // Pending Review: Reviewers or creator if allowed
  if (currentAction === 'รอตรวจ') {
    if (isSuperAdmin) return true;
    if (record.assignedReviewerIds && record.assignedReviewerIds.includes(user.id)) return true;
    if (config && isUserMatched(user, config.reviewers)) return true;
    // Creator cannot edit while in review unless allowed
    if (isCreator && config?.allowCreatorSelfReview) return true;
    return false;
  }

  return false;
}

/**
 * Issue Document Number (ออกเลขหนังสือ):
 * - Separated from reviewing! Reviewers (like Finance helper) do NOT automatically get numbering rights.
 * - Only users matching `config.numberers` during `รอตรวจ` stage.
 * - Creator cannot issue doc number unless authorized as a numberer.
 */
export function canUserIssueDocNumber(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  if (!user || user.status !== 'active') return false;

  const roles = getUserRoles(user);
  const isSuperAdmin = roles.includes('แอดมิน') || user.role === 'admin';
  if (isSuperAdmin) return true;

  const currentAction = record.action || 'รอตรวจ';
  if (currentAction !== 'รอตรวจ') return false;

  // Creator cannot issue their own number unless explicitly allowed
  if (record.createdById === user.id && !config?.allowCreatorSelfReview) {
    // Check if user has specific numbering role
    return config ? isUserMatched(user, config.numberers) : false;
  }

  if (config && isUserMatched(user, config.numberers)) {
    return true;
  }

  return false;
}

/**
 * Submit to Sign (ส่งลงนาม):
 * - Allowed only in `รอตรวจ` stage.
 * - Number must be issued before submitting to sign.
 */
export function canUserSubmitToSign(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  if (!user || user.status !== 'active') return false;

  const roles = getUserRoles(user);
  const isSuperAdmin = roles.includes('แอดมิน') || user.role === 'admin';
  if (isSuperAdmin) return true;

  const currentAction = record.action || 'รอตรวจ';
  if (currentAction !== 'รอตรวจ') return false;

  if (config && isUserMatched(user, config.signSubmitters)) {
    return true;
  }
  if (config && isUserMatched(user, config.reviewers)) {
    return true;
  }

  return false;
}

/**
 * Sign (ลงนาม e-Signature):
 * - Allowed only in `รอลงนาม` stage.
 * - Single Signer vs Sequential Multi-Signers supported.
 */
export function canUserSign(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  if (!user || user.status !== 'active') return false;

  const currentAction = record.action || 'รอตรวจ';
  if (currentAction !== 'รอลงนาม') return false;

  // Creator cannot sign own doc unless explicitly allowed
  if (record.createdById === user.id && !config?.allowCreatorSelfSign) {
    const roles = getUserRoles(user);
    if (!roles.includes('คณบดี') && !roles.includes('รองคณบดี') && !roles.includes('ผู้บริหาร') && user.role !== 'dean') {
      return false;
    }
  }

  // Sequential Multi-Signers check
  if (record.signerSteps && record.signerSteps.length > 0) {
    const currentStepIndex = (record.currentSignerStep ?? 1) - 1;
    const currentStep = record.signerSteps[currentStepIndex];
    if (currentStep && currentStep.status === 'pending') {
      if (currentStep.assignedUserId && currentStep.assignedUserId === user.id) return true;
      if (currentStep.requiredRole) {
        const roles = getUserRoles(user);
        if (roles.includes(currentStep.requiredRole)) return true;
      }
    }
    return false;
  }

  // Single Signer check
  if (record.assignedSignerIds && record.assignedSignerIds.includes(user.id)) return true;
  if (config && isUserMatched(user, config.signers)) return true;

  // Default executive / dean check
  const roles = getUserRoles(user);
  return roles.includes('คณบดี') || roles.includes('รองคณบดี') || roles.includes('ผู้บริหาร') || user.role === 'dean';
}

/**
 * Delete Document:
 * - Draft: Creator or Admin.
 * - Review: Reviewers or Admin (for rejected/invalid documents without rejection stage).
 * - Signing / Signed: Only Super Admin.
 */
export function canUserDeleteDoc(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  if (!user || user.status !== 'active') return false;

  const roles = getUserRoles(user);
  const isSuperAdmin = roles.includes('แอดมิน') || user.role === 'admin';
  if (isSuperAdmin) return true;

  const currentAction = record.action || 'รอตรวจ';

  const isCreator = record.createdById === user.id || 
                    Boolean(user.email && (record.createdById === user.email || record.createdByEmail === user.email)) ||
                    Boolean(user.name && record.createdByName === user.name);

  if (currentAction === 'ฉบับร่าง') {
    return isCreator;
  }

  if (currentAction === 'รอตรวจ') {
    if (record.assignedReviewerIds && record.assignedReviewerIds.includes(user.id)) return true;
    if (config && isUserMatched(user, config.reviewers)) return true;
  }

  return false;
}

/**
 * Download Word (.docx):
 * - STRICTLY LOCKED during `รอลงนาม`!
 */
export function canUserDownloadWord(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  if (!user || user.status !== 'active') return false;

  const currentAction = record.action || 'รอตรวจ';
  if (currentAction === 'รอลงนาม') {
    return false; // Prohibited during signing
  }

  return canUserViewDoc(user, record, config);
}

/**
 * Download / View PDF:
 * - Allowed whenever user has view permission.
 */
export function canUserDownloadPdf(
  user: UserProfile | null, 
  record: AdminDocRegistryRecord, 
  config?: DocumentWorkflowConfig
): boolean {
  return canUserViewDoc(user, record, config);
}

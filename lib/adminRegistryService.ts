import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  runTransaction, 
  serverTimestamp, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage, isConfigured } from './firebase';
import type { 
  AdminDocCategory, 
  AdminDocRegistryRecord, 
  UserProfile, 
  DocumentAuditEntry,
  DocumentWorkflowConfig
} from './types';
import { 
  canManageAdmin, 
  registryNumber, 
  validateRegistry, 
  ADMIN_RESET_VERSION, 
  bangkokDate 
} from './adminRegistryModel';
import { getWorkflowConfig, canUserViewDoc } from './workflowPermissionService';

const CACHE_KEY = 'faculty_admin_doc_registry_records_v2';
const DELETED_CACHE_KEY = 'faculty_admin_deleted_ids_v2';

const INITIAL_SEED_RECORDS: AdminDocRegistryRecord[] = [
  {
    id: 'seed-memo-01',
    category: 'memo',
    year: 2569,
    sequenceNumber: 101,
    docNumber: 'อว 0646.02/101',
    isNumberIssued: true,
    numberIssuedAt: bangkokDate(),
    numberIssuedBy: 'เจ้าหน้าที่ธุรการ',
    date: bangkokDate(),
    from: 'สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์',
    to: 'อธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ',
    subject: 'ขออนุมัติจัดโครงการพัฒนาสมรรถนะดิจิทัลสำหรับบุคลากร ประจำปีงบประมาณ พ.ศ. 2569',
    action: 'ลงนามแล้ว',
    remarks: 'โครงการผ่านความเห็นชอบจากคณะกรรมการประจำคณะ',
    bodyParagraphs: [
      'ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์ มีความประสงค์จะดำเนินโครงการพัฒนาสมรรถนะดิจิทัลสำหรับคณาจารย์และบุคลากรสายสนับสนุน ประจำปีงบประมาณ พ.ศ. 2569 เพื่อส่งเสริมการใช้เทคโนโลยีสารสนเทศในการจัดการเรียนการสอนและการบริหารงานเอกสารอิเล็กทรอนิกส์ให้มีประสิทธิภาพสูงสุด',
      'ในการนี้ เพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย จึงใคร่ขออนุมัติจัดโครงการดังกล่าวในวันที่ 15-16 พฤศจิกายน 2569 ณ ห้องประชุม 1 คณะศิลปศาสตร์และวิทยาศาสตร์ โดยขอเบิกจ่ายงบประมาณจากงบพัฒนาบุคลากร จำนวน 25,000 บาท (สองหมื่นห้าพันบาทถ้วน)',
      'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ'
    ],
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    signatureUrl: '/templates/admin/garuda-memo.png',
    signedAt: bangkokDate(),
    signedById: 'u-dean',
    signedByName: 'ผศ.ดร.สานนท์ ด่านภักดี',
    signedByPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    digitType: 'thai',
    createdById: 'u-dean',
    createdByName: 'ผศ.ดร.สานนท์ ด่านภักดี',
    createdAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'seed-memo-circ-01',
    category: 'memo_circular',
    year: 2569,
    sequenceNumber: 45,
    docNumber: 'อว 0646.02/ว 45',
    isNumberIssued: true,
    numberIssuedAt: bangkokDate(),
    date: bangkokDate(),
    from: 'สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์',
    to: 'รองคณบดี ผู้ช่วยคณบดี ประธานสาขาวิชา และหัวหน้างานทุกฝ่าย',
    subject: 'แจ้งกำหนดการส่งแบบเสนอโครงการยุทธศาสตร์ ประจำภาคการศึกษาที่ 2/2569',
    action: 'รอลงนาม',
    remarks: 'เวียนแจ้งทุกสาขาวิชาและฝ่ายงานในสังกัดคณะ',
    bodyParagraphs: [
      'ตามที่คณะศิลปศาสตร์และวิทยาศาสตร์ ได้จัดทำแผนปฏิบัติการและแผนยุทธศาสตร์ ประจำปีงบประมาณ พ.ศ. 2569 นั้น เพื่อให้การจัดสรรงบประมาณและการขับเคลื่อนกิจกรรมตามตัวชี้วัดเป็นไปอย่างต่อเนื่องและมีประสิทธิภาพ',
      'สำนักงานคณบดี จึงขอแจ้งให้ทุกสาขาวิชาและทุกฝ่ายงาน จัดทำแบบเสนอโครงการ (แบบ ฟพ.01) พร้อมประมาณการค่าใช้จ่าย ส่งมายังงานแผนและยุทธศาสตร์ ภายในวันที่ 20 ตุลาคม 2569 เพื่อรวบรวมเสนอต่อที่ประชุมคณะกรรมการบริหารคณะต่อไป',
      'จึงเรียนมาเพื่อโปรดทราบและดำเนินการในส่วนที่เกี่ยวข้อง'
    ],
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    digitType: 'thai',
    createdById: 'u-staff-01',
    createdByName: 'เจ้าหน้าที่ธุรการ',
    createdAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'seed-ext-01',
    category: 'external',
    year: 2569,
    sequenceNumber: 0,
    docNumber: '',
    isNumberIssued: false,
    date: bangkokDate(),
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
    to: 'ผู้อำนวยการโรงเรียนเมืองพญาแลวิทยา',
    subject: 'ขอเชิญวิทยากรบรรยายพิเศษในโครงการแนะแนวการศึกษาต่อและอาชีพ',
    action: 'รอตรวจ',
    remarks: 'อยู่ระหว่างธุรการตรวจทานเนื้อหาและแนบกำหนดการ',
    bodyParagraphs: [
      'ด้วยคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ มีกำหนดจัดกิจกรรมแนะแนวการศึกษาต่อและเส้นทางอาชีพ ประจำปีการศึกษา 2569 สำหรับนักเรียนระดับมัธยมศึกษาตอนปลาย ในวันที่ 5 พฤศจิกายน 2569 เวลา 09.00 - 12.00 น.',
      'คณะฯ ได้พิจารณาเห็นว่า นายอนุชา พลอยประดับ เป็นผู้มีความรู้ความเชี่ยวชาญและประสบการณ์สูงในการแนะแนวการศึกษา จึงใคร่ขอความอนุเคราะห์จากท่านในการอนุญาตให้บุคคลดังกล่าวมาเป็นวิทยากรบรรยายพิเศษตามวันและเวลาดังกล่าวข้างต้น',
      'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้'
    ],
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    digitType: 'thai',
    createdById: 'u-lecturer-01',
    createdByName: 'อาจารย์ผู้ขอ',
    createdAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'seed-order-01',
    category: 'order',
    year: 2569,
    sequenceNumber: 32,
    docNumber: 'ที่ 32/2569',
    isNumberIssued: true,
    numberIssuedAt: bangkokDate(),
    date: bangkokDate(),
    from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
    to: 'ผู้มีรายนามตามคำสั่ง',
    subject: 'แต่งตั้งคณะกรรมการดำเนินงานจัดนิทรรศการวิชาการและผลงานนักศึกษา ประจำปี 2569',
    action: 'ลงนามแล้ว',
    remarks: 'คำสั่งคณะศิลปศาสตร์และวิทยาศาสตร์',
    bodyParagraphs: [
      'เพื่อให้การจัดนิทรรศการวิชาการและการนำเสนอผลงานวิจัยของนักศึกษา ประจำปีการศึกษา 2569 ดำเนินไปด้วยความเรียบร้อย มีประสิทธิภาพ และบรรลุวัตถุประสงค์ตามนโยบายของคณะ',
      'อาศัยอำนาจตามความในมาตรา 37 แห่งพระราชบัญญัติมหาวิทยาลัยราชภัฏ พ.ศ. 2547 จึงแต่งตั้งคณะกรรมการดำเนินงานจัดนิทรรศการวิชาการ ดังนี้\n1. รองคณบดีฝ่ายวิชาการ ประธานกรรมการ\n2. ประธานสาขาวิชาวิทยาศาสตร์ กรรมการ\n3. ประธานสาขาวิชาภาษาอังกฤษ กรรมการ\n4. หัวหน้างานบริการการศึกษา กรรมการและเลขานุการ',
      'ให้ผู้ที่ได้รับการแต่งตั้ง ปฏิบัติหน้าที่ด้วยความวิริยะอุตสาหะ เพื่อให้เกิดผลดีแก่ทางราชการสืบไป'
    ],
    signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
    signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    signatureUrl: '/templates/admin/garuda-order.png',
    signedAt: bangkokDate(),
    signedById: 'u-dean',
    signedByName: 'ผศ.ดร.สานนท์ ด่านภักดี',
    signedByPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
    digitType: 'thai',
    createdById: 'u-staff-01',
    createdByName: 'เจ้าหน้าที่ธุรการ',
    createdAt: new Date().toISOString(),
    syncStatus: 'synced'
  }
];

function getDeletedRecordIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

function addDeletedRecordId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedRecordIds();
    set.add(id);
    localStorage.setItem(DELETED_CACHE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function getCachedRecords(): AdminDocRegistryRecord[] {
  if (typeof window === 'undefined') return INITIAL_SEED_RECORDS;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const deleted = getDeletedRecordIds();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(r => !deleted.has(r.id));
      }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(INITIAL_SEED_RECORDS));
    return INITIAL_SEED_RECORDS;
  } catch {
    return INITIAL_SEED_RECORDS;
  }
}

export function setCachedRecords(records: AdminDocRegistryRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedRecordIds();
    const clean = records.filter(r => !deleted.has(r.id));
    localStorage.setItem(CACHE_KEY, JSON.stringify(clean));
  } catch {}
}

export function clearLegacyAdminCache() {
  if (typeof window === 'undefined') return;
  try {
    const marker = 'faculty_admin_reset_version';
    if (localStorage.getItem(marker) === ADMIN_RESET_VERSION) return;
    localStorage.setItem(marker, ADMIN_RESET_VERSION);
  } catch {}
}

/**
 * Get records with optional category, year, and actor visibility filtering
 */
export async function getAdminDocRegistry(
  category?: AdminDocCategory, 
  year?: number,
  actor?: UserProfile | null
): Promise<AdminDocRegistryRecord[]> {
  clearLegacyAdminCache();
  const localList = getCachedRecords();
  const deletedIds = getDeletedRecordIds();

  const filterFn = (r: AdminDocRegistryRecord) => 
    (!category || r.category === category) && 
    (!year || r.year === year) &&
    !deletedIds.has(r.id);

  let fullList = [...localList];

  // Fetch from Firestore with timeout and merge with local cache
  if (isConfigured && db) {
    try {
      let q = query(collection(db, 'admin_doc_registry'));
      if (category && year) {
        q = query(collection(db, 'admin_doc_registry'), where('category', '==', category), where('year', '==', year));
      } else if (category) {
        q = query(collection(db, 'admin_doc_registry'), where('category', '==', category));
      } else if (year) {
        q = query(collection(db, 'admin_doc_registry'), where('year', '==', year));
      }

      const snap = await Promise.race([
        getDocs(q),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000))
      ]);

      if (snap) {
        const cloudRecords = snap.docs
          .map(d => ({ ...d.data(), id: d.id } as AdminDocRegistryRecord))
          .filter(r => !deletedIds.has(r.id));

        const mergedMap = new Map<string, AdminDocRegistryRecord>();
        localList.forEach(r => mergedMap.set(r.id, r));
        cloudRecords.forEach(r => {
          const localItem = mergedMap.get(r.id);
          // Keep local if local has unsynced changes, otherwise use cloud record
          if (!localItem || (r.revision || 0) >= (localItem.revision || 0)) {
            mergedMap.set(r.id, { ...r, syncStatus: 'synced' });
          }
        });

        fullList = Array.from(mergedMap.values());
        setCachedRecords(fullList);
      }
    } catch (err) {
      console.warn('getAdminDocRegistry Cloud fallback to local cache:', err);
    }
  }

  // Apply workflow visibility scoping if actor is provided
  let filtered = fullList.filter(filterFn);

  if (actor) {
    let workflowConfig: DocumentWorkflowConfig | undefined;
    if (category) {
      try {
        workflowConfig = await getWorkflowConfig(category);
      } catch {}
    }
    filtered = filtered.filter(r => canUserViewDoc(actor, r, workflowConfig));
  }

  // Sort newest first by updated/created date so newly created records appear at the top
  return filtered.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Save / Update Admin Record (Supports Drafts, Review submissions, and Updates)
 */
export async function saveAdminRecord(
  data: Omit<AdminDocRegistryRecord, 'id' | 'createdAt' | 'updatedAt' | 'sequenceNumber' | 'docNumber'> & { 
    sequenceNumber?: number; 
    docNumber?: string; 
    id?: string;
    isNumberIssued?: boolean;
    createdByEmail?: string;
  },
  actor: UserProfile,
  requestId: string,
  existing?: AdminDocRegistryRecord
): Promise<AdminDocRegistryRecord> {
  validateRegistry(data);

  const localList = getCachedRecords();
  const isGenericTempId = !data.id || data.id === 'new-doc' || data.id === 'draft-preview' || data.id === 'preview-temp';
  const existingId = existing?.id || (isGenericTempId ? (requestId || crypto.randomUUID()) : data.id!);

  // Stale revision check
  if (existing && existing.revision !== undefined) {
    const cachedItem = localList.find(r => r.id === existingId);
    if (cachedItem && cachedItem.revision && cachedItem.revision > existing.revision) {
      throw new Error('ข้อมูลถูกแก้ไขจากที่อื่นแล้ว กรุณารีเฟรชก่อนบันทึกใหม่ (Stale Revision Conflict)');
    }
  }

  // Creator cannot specify doc number directly
  const isIssued = existing?.isNumberIssued || data.isNumberIssued || false;
  const seq = isIssued ? (data.sequenceNumber || existing?.sequenceNumber || 0) : 0;
  const docNum = isIssued ? (data.docNumber || existing?.docNumber || '') : '';

  const now = new Date().toISOString();
  const auditEntries: DocumentAuditEntry[] = [...(existing?.history || [])];

  let actionDesc = 'บันทึกเอกสาร';
  if (!existing) actionDesc = data.action === 'ฉบับร่าง' ? 'สร้างฉบับร่าง' : 'ส่งเรื่องเข้าสู่กระบวนการ (รอตรวจ)';
  else if (data.action !== existing.action) actionDesc = `เปลี่ยนสถานะเป็น ${data.action}`;

  auditEntries.push({
    id: crypto.randomUUID(),
    action: actionDesc,
    timestamp: now,
    actorId: actor?.id || auth.currentUser?.uid || 'guest',
    actorName: actor?.name || auth.currentUser?.displayName || 'ผู้ใช้งาน',
    details: data.subject
  });

  const effectiveCreatedById = existing?.createdById || data.createdById || actor?.id || (auth.currentUser ? auth.currentUser.uid : 'guest');
  const effectiveCreatedByName = existing?.createdByName || data.createdByName || actor?.name || (auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || 'ผู้ใช้งาน') : 'ผู้ใช้งาน');
  const effectiveCreatedByEmail = existing?.createdByEmail || data.createdByEmail || actor?.email || auth.currentUser?.email || undefined;

  const savedRecord: AdminDocRegistryRecord = {
    ...data,
    id: existingId,
    sequenceNumber: seq,
    docNumber: docNum,
    isNumberIssued: isIssued,
    createdById: effectiveCreatedById,
    createdByName: effectiveCreatedByName,
    createdByEmail: effectiveCreatedByEmail,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    revision: (existing?.revision || 0) + 1,
    syncStatus: 'syncing',
    history: auditEntries
  };

  // Instant local cache update
  const updatedLocal = localList.filter(r => r.id !== existingId);
  updatedLocal.unshift(savedRecord);
  setCachedRecords(updatedLocal);

  // Firestore sync
  if (isConfigured && db) {
    try {
      const recordRef = doc(db, 'admin_doc_registry', existingId);
      await Promise.race([
        setDoc(recordRef, {
          ...JSON.parse(JSON.stringify(savedRecord)),
          timestamp: serverTimestamp()
        }, { merge: true }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Cloud save timeout')), 4000))
      ]);
      savedRecord.syncStatus = 'synced';
    } catch (err: any) {
      console.error('Firestore saveAdminRecord error:', err);
      savedRecord.syncStatus = 'error';
      savedRecord.syncError = err.message || 'บันทึกใน Cloud ไม่สำเร็จ';
      
      // Update cache with error status
      const idx = updatedLocal.findIndex(r => r.id === existingId);
      if (idx >= 0) {
        updatedLocal[idx] = savedRecord;
        setCachedRecords(updatedLocal);
      }
      throw new Error(`บันทึกลง Cloud ไม่สำเร็จ: ${err.message || 'การเชื่อมต่อขัดข้องหรือสิทธิ์ไม่เพียงพอ'}`);
    }

    // Update cache with synced status
    const idx = updatedLocal.findIndex(r => r.id === existingId);
    if (idx >= 0) {
      updatedLocal[idx] = savedRecord;
      setCachedRecords(updatedLocal);
    }
  } else {
    savedRecord.syncStatus = 'local';
  }

  return savedRecord;
}

/**
 * 10. Atomic Document Numbering via Firestore Transaction (ออกเลขทะเบียนคุม)
 */
export async function issueAdminDocNumber(
  recordId: string,
  actor: UserProfile,
  pattern?: string,
  manualNumber?: string
): Promise<AdminDocRegistryRecord> {
  const localList = getCachedRecords();
  const record = localList.find(r => r.id === recordId);
  if (!record) throw new Error('ไม่พบเอกสารที่ต้องการออกเลขหนังสือ');

  if (record.isNumberIssued && record.docNumber && record.sequenceNumber > 0) {
    return record; // Already issued
  }

  const category = record.category;
  const year = record.year || (Number(bangkokDate().slice(0, 4)) + 543);
  let nextSeq = 1;
  let issuedDocNumber = '';

  const counterKey = `admin_registry_${category}_${year}`;

  if (isConfigured && db) {
    try {
      const counterRef = doc(db, 'system_counters', counterKey);
      const recordRef = doc(db, 'admin_doc_registry', recordId);

      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const currentSeq = counterDoc.exists() ? (counterDoc.data().currentSequence || 0) : 0;
        
        if (manualNumber) {
          issuedDocNumber = manualNumber.trim();
          nextSeq = currentSeq + 1; // Increment tracker
        } else {
          nextSeq = currentSeq + 1;
          issuedDocNumber = registryNumber(category, nextSeq, year, pattern);
        }

        // Set counter
        transaction.set(counterRef, {
          category,
          year,
          currentSequence: nextSeq,
          lastDocNumber: issuedDocNumber,
          lastRecordId: recordId,
          updatedAt: serverTimestamp(),
          updatedBy: actor.name || actor.id
        }, { merge: true });

        // Update record
        const now = new Date().toISOString();
        const audit = [...(record.history || []), {
          id: crypto.randomUUID(),
          action: `ออกเลขหนังสือ: ${issuedDocNumber}`,
          timestamp: now,
          actorId: actor.id,
          actorName: actor.name,
          details: `ลำดับที่ ${nextSeq}`
        }];

        transaction.set(recordRef, {
          sequenceNumber: nextSeq,
          docNumber: issuedDocNumber,
          isNumberIssued: true,
          numberIssuedAt: bangkokDate(),
          numberIssuedBy: actor.name,
          numberIssuedById: actor.id,
          updatedAt: now,
          revision: (record.revision || 0) + 1,
          history: audit,
          timestamp: serverTimestamp()
        }, { merge: true });
      });

      // Update in local cache
      const updatedRecord: AdminDocRegistryRecord = {
        ...record,
        sequenceNumber: nextSeq,
        docNumber: issuedDocNumber,
        isNumberIssued: true,
        numberIssuedAt: bangkokDate(),
        numberIssuedBy: actor.name,
        numberIssuedById: actor.id,
        updatedAt: new Date().toISOString(),
        revision: (record.revision || 0) + 1,
        syncStatus: 'synced'
      };

      const updatedLocal = localList.map(r => r.id === recordId ? updatedRecord : r);
      setCachedRecords(updatedLocal);
      return updatedRecord;
    } catch (err) {
      console.warn('Transaction error, fallback to safe local calculation:', err);
    }
  }

  // Local calculation fallback
  const sameCatYear = localList.filter(r => r.category === category && r.year === year && r.isNumberIssued);
  const maxSeq = sameCatYear.reduce((max, r) => Math.max(max, r.sequenceNumber || 0), 0);
  nextSeq = maxSeq + 1;
  issuedDocNumber = manualNumber ? manualNumber.trim() : registryNumber(category, nextSeq, year, pattern);

  const fallbackRecord: AdminDocRegistryRecord = {
    ...record,
    sequenceNumber: nextSeq,
    docNumber: issuedDocNumber,
    isNumberIssued: true,
    numberIssuedAt: bangkokDate(),
    numberIssuedBy: actor.name,
    numberIssuedById: actor.id,
    updatedAt: new Date().toISOString(),
    revision: (record.revision || 0) + 1,
    syncStatus: 'local'
  };

  const updatedLocal = localList.map(r => r.id === recordId ? fallbackRecord : r);
  setCachedRecords(updatedLocal);
  return fallbackRecord;
}

/**
 * Remove record with tombstone tracking
 */
export async function removeAdminRecord(record: AdminDocRegistryRecord, actor: UserProfile): Promise<void> {
  addDeletedRecordId(record.id);

  const localList = getCachedRecords();
  const updatedLocal = localList.filter(r => r.id !== record.id);
  setCachedRecords(updatedLocal);

  if (isConfigured && db) {
    try {
      const recordRef = doc(db, 'admin_doc_registry', record.id);
      await Promise.race([
        deleteDoc(recordRef),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Cloud delete timeout')), 2000))
      ]);
    } catch (err) {
      console.warn('Firestore background delete sync skipped:', err);
    }
  }

  if (record.filePath && storage && isConfigured) {
    try {
      await deleteObject(ref(storage, record.filePath));
    } catch {}
  }
}

/**
 * Secure file upload with storage fallback to base64
 */
export async function uploadAdminAttachment(
  file: File, 
  actor: UserProfile
): Promise<{ filePath: string; fileUrl: string; fileName: string; fileSize: number }> {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
  if (!allowed.includes(file.type) || file.size > 25 * 1024 * 1024 || file.size === 0) {
    throw new Error('รับไฟล์ PDF, DOCX, PNG, JPG ขนาดไม่เกิน 25 MB');
  }

  const filePath = `admin_registry_attachments/${actor?.id || 'guest'}/${crypto.randomUUID()}`;

  if (isConfigured && storage) {
    try {
      const target = ref(storage, filePath);
      await Promise.race([
        uploadBytes(target, file, { contentType: file.type, customMetadata: { originalName: file.name } }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Storage upload timeout')), 4000))
      ]);
      const fileUrl = await getDownloadURL(target);
      return { filePath, fileUrl, fileName: file.name, fileSize: file.size };
    } catch (err) {
      console.warn('Storage upload fallback:', err);
    }
  }

  // Safe fallback for offline demo: Base64 data URL (persists across reload and is valid everywhere)
  const base64Url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return { filePath, fileUrl: base64Url, fileName: file.name, fileSize: file.size };
}

export async function removeAdminAttachment(path: string): Promise<void> {
  if (path.startsWith('admin_registry_attachments/') && isConfigured && storage) {
    try {
      await deleteObject(ref(storage, path));
    } catch {}
  }
}

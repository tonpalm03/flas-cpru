import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { AdminDocCategoryConfig, UserProfile } from './types';
import rawTemplates from './adminTemplates.json';
import { canManageAdmin } from './adminRegistryModel';

export const BUILTIN_CATEGORIES: AdminDocCategoryConfig[] = [
  {
    id: 'memo',
    title: 'บันทึกข้อความ',
    subtitle: 'หนังสือติดต่อราชการภายในส่วนราชการ (กระดาษบันทึกข้อความ)',
    layoutType: 'memo',
    garudaPosition: 'left',
    prefix: 'อว 0646.02/',
    numberingPattern: 'อว 0646.02/{seq}',
    defaultDigitType: 'thai',
    paperSize: 'a4',
    headerLineStyle: 'dot_leader',
    lineVisibility: { govOrg: true, docDate: true, subject: true },
    orderIndex: 1,
    isBuiltIn: true,
    isActive: true,
    preset: (rawTemplates.find(t => t.category === 'memo')?.preset as any) || {
      from: 'มหาวิทยาลัยราชภัฏชัยภูมิ คณะศิลปศาสตร์และวิทยาศาสตร์ โทร ๔๑๐๐',
      to: '',
      subject: '',
      action: 'รอตรวจ',
      remarks: '',
      referenceDoc: '',
      attachmentsText: '',
      bodyText: 'ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มีความประสงค์...\n\nในการนี้ จึงขอเชิญ/ขออนุมัติ...\n\nจึงเรียนมาเพื่อโปรดพิจารณา',
      signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
      signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
      coordinatorInfo: '',
      recipients: [],
      officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 หมู่ 2 ถนนชัยภูมิ-ตาดโตน\nตำบลนาฝาย อำเภอเมือง จังหวัดชัยภูมิ 36000'
    }
  },
  {
    id: 'memo_circular',
    title: 'บันทึกข้อความ (ว)',
    subtitle: 'หนังสือเวียนภายในส่วนราชการ สำหรับแจ้งเวียนผู้รับหลายหน่วยงาน/หลายบุคคล',
    layoutType: 'memo',
    garudaPosition: 'left',
    prefix: 'อว 0646.02/ว ',
    numberingPattern: 'อว 0646.02/ว {seq}',
    defaultDigitType: 'thai',
    paperSize: 'a4',
    headerLineStyle: 'dot_leader',
    lineVisibility: { govOrg: true, docDate: true, subject: true },
    orderIndex: 2,
    isBuiltIn: true,
    isActive: true,
    preset: (rawTemplates.find(t => t.category === 'memo_circular')?.preset as any) || {
      from: 'มหาวิทยาลัยราชภัฏชัยภูมิ คณะศิลปศาสตร์และวิทยาศาสตร์ โทร ๔๑๐๐',
      to: 'อาจารย์ผู้สอนประจำรายวิชา / บุคลากรทุกท่าน',
      subject: '',
      action: 'รอตรวจ',
      remarks: '',
      referenceDoc: '',
      attachmentsText: '',
      bodyText: 'ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ ได้ดำเนินโครงการ...\n\nในการนี้ จึงขอความอนุเคราะห์แจ้งเวียน...\n\nจึงเรียนมาเพื่อพิจารณา',
      signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
      signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
      coordinatorInfo: '',
      recipients: ['อาจารย์ผู้สอนประจำรายวิชา'],
      officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 หมู่ 2 ถนนชัยภูมิ-ตาดโตน\nตำบลนาฝาย อำเภอเมือง จังหวัดชัยภูมิ 36000'
    }
  },
  {
    id: 'external',
    title: 'หนังสือภายนอก',
    subtitle: 'หนังสือติดต่อราชการที่เป็นแบบพิธี ใช้ติดต่อระหว่างกระทรวง ทบวง กรม หรือหน่วยงานภายนอก',
    layoutType: 'external',
    garudaPosition: 'center',
    prefix: 'ที่ อว 0646.02/',
    numberingPattern: 'ที่ อว 0646.02/{seq}',
    defaultDigitType: 'arabic',
    paperSize: 'a4',
    orderIndex: 3,
    isBuiltIn: true,
    isActive: true,
    preset: (rawTemplates.find(t => t.category === 'external')?.preset as any) || {
      from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
      to: '',
      subject: '',
      action: 'รอตรวจ',
      remarks: '',
      referenceDoc: '',
      attachmentsText: '',
      bodyText: 'ตามที่ หน่วยงานของท่านได้มีหนังสือ...\n\nคณะศิลปศาสตร์และวิทยาศาสตร์ พิจารณาแล้ว ยินดี...\n\nจึงเรียนมาเพื่อโปรดทราบ/พิจารณา',
      signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
      signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน\nอธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ',
      coordinatorInfo: 'สำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์\nโทรศัพท์ 044 815 111 ต่อ 4100\nไปรษณีย์อิเล็กทรอนิกส์ officer@cpru.ac.th',
      recipients: [],
      officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 ถนนชัยภูมิ-ตาดโตน ตำบลนาฝาย\nอำเภอเมือง จังหวัดชัยภูมิ 36000'
    }
  },
  {
    id: 'external_circular',
    title: 'หนังสือภายนอก (ว)',
    subtitle: 'หนังสือภายนอกประเภทเวียน ส่งถึงผู้รับภายนอกหลายแห่งด้วยเลขหนังสือเดียวกัน',
    layoutType: 'external',
    garudaPosition: 'center',
    prefix: 'ที่ อว 0646.02/ว ',
    numberingPattern: 'ที่ อว 0646.02/ว {seq}',
    defaultDigitType: 'arabic',
    paperSize: 'a4',
    orderIndex: 4,
    isBuiltIn: true,
    isActive: true,
    preset: (rawTemplates.find(t => t.category === 'external_circular')?.preset as any) || {
      from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
      to: '',
      subject: '',
      action: 'รอตรวจ',
      remarks: '',
      referenceDoc: '',
      attachmentsText: '๑. กำหนดการโครงการ  จำนวน ๑ ฉบับ',
      bodyText: 'ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ กำหนดจัดโครงการ...\n\nในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ จึงใคร่ขอเรียนเชิญท่าน...\n\nจึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์',
      signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
      signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์ ปฏิบัติราชการแทน\nอธิการบดีมหาวิทยาลัยราชภัฏชัยภูมิ',
      coordinatorInfo: 'สำนักงานคณบดีคณะศิลปศาสตร์และวิทยาศาสตร์\nโทรศัพท์ 044 815 111 ต่อ 4100\nไปรษณีย์อิเล็กทรอนิกส์ officer@cpru.ac.th',
      recipients: [],
      officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 ถนนชัยภูมิ-ตาดโตน ตำบลนาฝาย\nอำเภอเมือง จังหวัดชัยภูมิ 36000'
    }
  },
  {
    id: 'order',
    title: 'คำสั่ง',
    subtitle: 'คำสั่งแต่งตั้งคณะกรรมการ ประกาศ หรือมอบหมายหน้าที่ราชการของคณะ',
    layoutType: 'order',
    garudaPosition: 'center',
    prefix: 'ที่ ',
    numberingPattern: 'ที่ {seq}/{year}',
    defaultDigitType: 'thai',
    paperSize: 'a4',
    orderIndex: 5,
    isBuiltIn: true,
    isActive: true,
    preset: (rawTemplates.find(t => t.category === 'order')?.preset as any) || {
      from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
      to: 'คณะกรรมการดำเนินงานโครงการฯ',
      subject: 'แต่งตั้งคณะกรรมการดำเนินงาน...',
      action: 'รอตรวจ',
      remarks: '',
      referenceDoc: 'คำสั่งมหาวิทยาลัยราชภัฏชัยภูมิ ที่ ๓๔๒๗/๒๕๕๙',
      attachmentsText: '',
      bodyText: 'ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ ได้ดำเนินโครงการ...\n\nดังนั้น เพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย อาศัยอำนาจตามความในมาตรา ๓๑ แห่งพระราชบัญญัติมหาวิทยาลัยราชภัฏ พ.ศ. ๒๕๔๗ จึงแต่งตั้งคณะกรรมการดังต่อไปนี้\n\n๑. คณะกรรมการอำนวยการ\n๑. ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย  ประธานกรรมการ\n๒. อาจารย์ ดร.รัชวุธ สุทธิ  กรรมการ\n๓. อาจารย์ศศิธร ถีสูงเนิน  กรรมการและเลขานุการ\nหน้าที่ ให้คำปรึกษา แนะนำ วางแผนการดำเนินงาน\n\nทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป',
      signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
      signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
      coordinatorInfo: '',
      recipients: ['คณะกรรมการดำเนินงานโครงการฯ'],
      officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ\n167 หมู่ 2 ถนนชัยภูมิ-ตาดโตน\nตำบลนาฝาย อำเภอเมือง จังหวัดชัยภูมิ 36000'
    }
  }
];

const LOCAL_STORAGE_KEY = 'faculty_erp_admin_categories_cache';

export async function getAdminCategories(): Promise<AdminDocCategoryConfig[]> {
  const defaults = [...BUILTIN_CATEGORIES];
  if (!isConfigured) {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return defaults;
  }

  try {
    const snap = await getDocs(collection(db, 'admin_doc_categories'));
    if (snap.empty) {
      return defaults;
    }

    const cloudConfigs: Record<string, AdminDocCategoryConfig> = {};
    snap.docs.forEach(docSnap => {
      cloudConfigs[docSnap.id] = { ...(docSnap.data() as AdminDocCategoryConfig), id: docSnap.id };
    });

    // Merge: Built-ins overlaid with custom presets, plus any custom categories
    const mergedList: AdminDocCategoryConfig[] = defaults.map(def => {
      if (cloudConfigs[def.id]) {
        return {
          ...def,
          ...cloudConfigs[def.id],
          preset: {
            ...def.preset,
            ...(cloudConfigs[def.id].preset || {})
          }
        };
      }
      return def;
    });

    // Add custom non-builtin categories
    Object.keys(cloudConfigs).forEach(id => {
      if (!defaults.some(d => d.id === id)) {
        mergedList.push(cloudConfigs[id]);
      }
    });

    mergedList.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedList));
      } catch {}
    }

    return mergedList;
  } catch (err) {
    console.warn('getAdminCategories fallback to builtins/cache:', err);
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return defaults;
  }
}

export async function getCategoryById(categoryId: string): Promise<AdminDocCategoryConfig> {
  const all = await getAdminCategories();
  const found = all.find(c => c.id === categoryId);
  if (found) return found;

  const builtin = BUILTIN_CATEGORIES.find(c => c.id === categoryId);
  if (builtin) return builtin;

  // Fallback dynamic config
  return {
    id: categoryId,
    title: categoryId,
    layoutType: 'custom',
    garudaPosition: 'center',
    prefix: 'ที่ ',
    numberingPattern: 'ที่ {seq}/{year}',
    defaultDigitType: 'thai',
    paperSize: 'a4',
    orderIndex: 99,
    isActive: true,
    preset: {
      from: 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
      to: '',
      subject: '',
      action: 'รอตรวจ',
      bodyText: '',
      signatoryName: 'ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย',
      signatoryPosition: 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์',
      recipients: [],
      officeAddress: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ'
    }
  };
}

export async function saveAdminCategoryConfig(
  config: AdminDocCategoryConfig,
  actor: UserProfile
): Promise<AdminDocCategoryConfig> {
  if (!canManageAdmin(actor)) {
    throw new Error('ไม่มีสิทธิ์จัดการแม่แบบและประเภทเอกสาร');
  }

  const cleanId = config.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (!cleanId) throw new Error('รหัสประเภทเอกสารต้องไม่ว่าง');
  if (!config.title.trim()) throw new Error('กรุณาระบุชื่อประเภทเอกสาร');

  const payload: AdminDocCategoryConfig = {
    ...config,
    id: cleanId,
    title: config.title.trim(),
    subtitle: config.subtitle?.trim() || '',
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name || actor.email || actor.id
  };

  if (isConfigured) {
    const docRef = doc(db, 'admin_doc_categories', cleanId);
    await setDoc(docRef, { ...JSON.parse(JSON.stringify(payload)), timestamp: serverTimestamp() }, { merge: true });
  }

  // Update local cache
  if (typeof window !== 'undefined') {
    try {
      const all = await getAdminCategories();
      const idx = all.findIndex(c => c.id === cleanId);
      if (idx >= 0) all[idx] = payload;
      else all.push(payload);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch {}
  }

  return payload;
}

export async function resetAdminCategoryToDefault(
  categoryId: string,
  actor: UserProfile
): Promise<AdminDocCategoryConfig> {
  if (!canManageAdmin(actor)) {
    throw new Error('ไม่มีสิทธิ์จัดการแม่แบบเอกสาร');
  }

  const builtin = BUILTIN_CATEGORIES.find(c => c.id === categoryId);
  if (!builtin) {
    throw new Error('สามารถรีเซ็ตได้เฉพาะหมวดมาตรฐานเท่านั้น');
  }

  if (isConfigured) {
    const docRef = doc(db, 'admin_doc_categories', categoryId);
    await deleteDoc(docRef);
  }

  return builtin;
}

export async function deleteAdminCategoryConfig(
  categoryId: string,
  actor: UserProfile
): Promise<void> {
  if (!canManageAdmin(actor)) {
    throw new Error('ไม่มีสิทธิ์จัดการประเภทเอกสาร');
  }

  if (BUILTIN_CATEGORIES.some(c => c.id === categoryId)) {
    throw new Error('ไม่สามารถลบหมวดมาตรฐานหลัก 5 หมวดได้ (สามารถปิดการใช้งานแทนได้)');
  }

  if (isConfigured) {
    const docRef = doc(db, 'admin_doc_categories', categoryId);
    await deleteDoc(docRef);
  }

  if (typeof window !== 'undefined') {
    try {
      const all = (await getAdminCategories()).filter(c => c.id !== categoryId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch {}
  }
}

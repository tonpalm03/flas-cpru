import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { UserProfile, StandardRole } from './types';
import type { PortalBlock, PortalConfig, RoyalBannerData, HeroBannerData, QuickLinksData, NewsGridData } from './portalTypes';

export const DEFAULT_PORTAL_BLOCKS: PortalBlock[] = [
  {
    id: 'block_royal_banner_default',
    type: 'royal_banner',
    title: 'บล็อกถวายพระพรและวันสำคัญ',
    isActive: true,
    orderIndex: 1,
    data: {
      royalTitle: 'ขอพระองค์ทรงพระเจริญ',
      occasion: 'เนื่องในโอกาสวันเฉลิมพระชนมพรรษา',
      monarchName: 'พระบาทสมเด็จพระปรเมนทรรามาธิบดีศรีสินทรมหาวชิราลงกรณ พระวชิรเกล้าเจ้าอยู่หัว',
      imageUrl: '/templates/admin/garuda-external.png',
      prose: 'ขออัญเชิญคุณพระศรีรัตนตรัย และสิ่งศักดิ์สิทธิ์ทั้งหลายในสากลโลก\nโปรดอภิบาลประทานพรให้ใต้ฝ่าละอองธุลีพระบาท ทรงพระเจริญด้วยจตุรพิธพรชัย\nทรงพระเกษมสำราญ พระพลานามัยสมบูรณ์แข็งแรง สถิตเป็นมิ่งขวัญร่มเกล้าแก่ปวงข้าพระพุทธเจ้าตราบนานเท่านาน',
      signBy: 'ด้วยเกล้าด้วยกระหม่อม ขอเดชะ\nข้าพระพุทธเจ้า คณะผู้บริหาร คณาจารย์ บุคลากร และนักศึกษา\nคณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ',
      theme: 'gold',
      buttonText: 'ร่วมลงนามถวายพระพรออนไลน์',
      buttonUrl: 'https://cpru.ac.th',
      isBlessingActive: true
    } as RoyalBannerData,
    customStyles: {
      paddingY: 'normal',
      containerWidth: 'standard',
      rounded: '3xl',
      shadow: 'lg'
    }
  },
  {
    id: 'block_hero_banner_default',
    type: 'hero_banner',
    title: 'แบนเนอร์หลักประจำคณะ',
    isActive: true,
    orderIndex: 2,
    data: {
      badgeText: 'Faculty of Liberal Arts and Sciences • CPRU',
      headline: 'คณะศิลปศาสตร์และวิทยาศาสตร์\nมหาวิทยาลัยราชภัฏชัยภูมิ',
      subheadline: 'มุ่งมั่นจัดการศึกษา วิจัย บริการวิชาการ และพัฒนานวัตกรรมท้องถิ่นเพื่อความยั่งยืน ก้าวสู่ความเป็นเลิศทางวิชาการและวิชาชีพ',
      primaryCta: {
        label: 'เข้าสู่ระบบบริหารงานคณะ (ERP)',
        url: '/login'
      },
      secondaryCta: {
        label: 'ผังการทำงาน (System Flow)',
        url: '/flow'
      }
    } as HeroBannerData,
    customStyles: {
      paddingY: 'spacious',
      containerWidth: 'standard',
      rounded: '3xl',
      shadow: 'xl'
    }
  },
  {
    id: 'block_quick_links_default',
    type: 'quick_links',
    title: 'ทางลัดระบบงาน 6 ฝ่ายของคณะ',
    isActive: true,
    orderIndex: 3,
    data: {
      heading: 'ระบบงานและบริการภายในคณะ (Faculty Services)',
      subheading: 'เชื่อมโยงฐานข้อมูล Firebase ก้อนเดียวกัน ทำงานร่วมกันอย่างเป็นระบบและไร้รอยต่อ',
      columns: 3,
      items: [
        {
          id: 'ql-1',
          title: 'งานธุรการและสารบรรณ',
          desc: 'ออกเลขหนังสือ บันทึกข้อความตราครุฑมาตรฐาน และสมุดทะเบียนคุม',
          iconName: 'FileText',
          url: '/admin',
          color: 'blue',
          badge: 'สารบรรณ'
        },
        {
          id: 'ql-2',
          title: 'งานโครงการและกิจกรรม',
          desc: 'เสนอโครงการยุทธศาสตร์ 2569 ติดตาม KPI และรายงานผล SDGs',
          iconName: 'FolderKanban',
          url: '/projects',
          color: 'indigo',
          badge: 'ยุทธศาสตร์'
        },
        {
          id: 'ql-3',
          title: 'งานการเงินและงบประมาณ',
          desc: 'ทะเบียนคุมงบประมาณ สัญญายืมเงินทดรองจ่าย และเอกสารเบิกจ่าย',
          iconName: 'Wallet',
          url: '/finance',
          color: 'emerald',
          badge: 'งบประมาณ'
        },
        {
          id: 'ql-4',
          title: 'งานพัสดุและจัดซื้อ',
          desc: 'ใบขอซื้อ/ขอจ้าง (PR) ตรวจรับพัสดุ และคำนวณภาษี VAT 7%',
          iconName: 'Package',
          url: '/procurement',
          color: 'amber',
          badge: 'จัดซื้อจัดจ้าง'
        },
        {
          id: 'ql-5',
          title: 'งานบริหารงานบุคคล',
          desc: 'ยื่นใบลาอิเล็กทรอนิกส์ (e-Leave) ตรวจสอบโควตาวันลา และประวัติ SAR',
          iconName: 'Users',
          url: '/hr',
          color: 'purple',
          badge: 'e-Leave'
        },
        {
          id: 'ql-6',
          title: 'ตั้งค่าระบบ & แม่แบบ',
          desc: 'จัดการยศ ลายเซ็นดิจิทัล e-Signature และออกแบบแม่แบบ No-Code',
          iconName: 'Sliders',
          url: '/settings/users',
          color: 'slate',
          badge: 'ผู้ดูแล'
        }
      ]
    } as QuickLinksData,
    customStyles: {
      paddingY: 'normal',
      containerWidth: 'standard',
      rounded: '2xl'
    }
  },
  {
    id: 'block_news_default',
    type: 'news_grid',
    title: 'ข่าวสารและกิจกรรมประชาสัมพันธ์',
    isActive: true,
    orderIndex: 4,
    data: {
      heading: 'ข่าวสารและกิจกรรมคณะล่าสุด',
      subheading: 'ติดตามข่าวประชาสัมพันธ์ กิจกรรมวิชาการ และผลงานของคณาจารย์และนักศึกษา',
      categories: ['ทั้งหมด', 'ข่าววิชาการ', 'กิจกรรมนักศึกษา', 'ประกาศคณะ', 'ทุนการศึกษา'],
      items: [
        {
          id: 'news-1',
          title: 'ขอเชิญเข้าร่วมโครงการประชุมวิชาการระดับชาติด้านศิลปศาสตร์และวิทยาศาสตร์ ครั้งที่ 8',
          category: 'ข่าววิชาการ',
          date: '2026-10-05',
          excerpt: 'ขอเชิญคณาจารย์ นักวิจัย และนักศึกษาระดับบัณฑิตศึกษา ส่งบทความวิจัยและบทความวิชาการเพื่อนำเสนอในงานประชุม...',
          linkUrl: '#',
          isFeatured: true
        },
        {
          id: 'news-2',
          title: 'คณะศิลปศาสตร์และวิทยาศาสตร์ จัดกิจกรรมปฐมนิเทศนักศึกษาใหม่ ประจำปีการศึกษา 2569',
          category: 'กิจกรรมนักศึกษา',
          date: '2026-10-02',
          excerpt: 'ต้อนรับนักศึกษาใหม่สู่รั้วคณะฯ ด้วยกิจกรรมอบอุ่น แนะนำหลักสูตร คณาจารย์ และการใช้ชีวิตในมหาวิทยาลัย...',
          linkUrl: '#'
        },
        {
          id: 'news-3',
          title: 'ประกาศผลการพิจารณาทุนการศึกษาเพื่อการวิจัยและนวัตกรรมท้องถิ่น ประจำปีงบประมาณ 2569',
          category: 'ทุนการศึกษา',
          date: '2026-09-28',
          excerpt: 'คณะกรรมการพิจารณาทุนวิจัยได้ดำเนินการคัดเลือกข้อเสนอโครงการที่มีศักยภาพสูงเพื่อขับเคลื่อนยุทธศาสตร์...',
          linkUrl: '#'
        }
      ]
    } as NewsGridData,
    customStyles: {
      paddingY: 'normal',
      containerWidth: 'standard'
    }
  }
];

export const DEFAULT_ALLOWED_ROLES: StandardRole[] = ['แอดมิน', 'ธุรการ'];

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  id: 'homepage',
  title: 'หน้าหลักคณะศิลปศาสตร์และวิทยาศาสตร์',
  lastPublishedAt: new Date().toISOString(),
  lastPublishedBy: 'ระบบเริ่มต้น',
  allowedRoles: DEFAULT_ALLOWED_ROLES,
  blocks: DEFAULT_PORTAL_BLOCKS
};

const LOCAL_STORAGE_PORTAL_KEY = 'flas_cpru_portal_config_cache';

export function canEditPortal(user?: UserProfile | null, config?: PortalConfig): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'admin') return true;
  if (user.permissions?.includes('portal_editor') === true) return true;

  const allowed = config?.allowedRoles || DEFAULT_ALLOWED_ROLES;
  const userRoles = user.roles || [];
  return userRoles.some(r => allowed.includes(r as StandardRole) || r === 'แอดมิน' || r === 'ธุรการ');
}

export async function getPortalConfig(): Promise<PortalConfig> {
  // Check LocalStorage cache first for instant synchronous render
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_PORTAL_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as PortalConfig;
        if (parsed && Array.isArray(parsed.blocks)) {
          // Trigger async refresh in background without blocking
          refreshPortalFromFirestore().catch(() => {});
          return parsed;
        }
      }
    } catch {
      // LocalStorage fallback
    }
  }

  return refreshPortalFromFirestore();
}

async function refreshPortalFromFirestore(): Promise<PortalConfig> {
  if (!isConfigured) {
    return DEFAULT_PORTAL_CONFIG;
  }

  try {
    const docRef = doc(db, 'portal_config', 'homepage');
    // 1.5s timeout safety against hanging
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    const snap = await Promise.race([getDoc(docRef), timeoutPromise]);

    if (snap && 'exists' in snap && snap.exists()) {
      const data = snap.data() as PortalConfig;
      if (data && Array.isArray(data.blocks)) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_PORTAL_KEY, JSON.stringify(data));
          } catch {}
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('Load portal config from Firestore warning:', err);
  }

  // If not found in Firestore, save default
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_PORTAL_KEY, JSON.stringify(DEFAULT_PORTAL_CONFIG));
    } catch {}
  }
  return DEFAULT_PORTAL_CONFIG;
}

export async function saveAndPublishPortalConfig(
  config: PortalConfig,
  actor: UserProfile
): Promise<PortalConfig> {
  if (!canEditPortal(actor, config)) {
    throw new Error('ท่านไม่มีสิทธิ์แก้ไขหรือเผยแพร่หน้าเว็บคณะ (ต้องได้รับสิทธิ์จากแอดมิน)');
  }

  const payload: PortalConfig = {
    ...config,
    lastPublishedAt: new Date().toISOString(),
    lastPublishedBy: `${actor.name} (${actor.position || actor.role})`
  };

  // 1. Save to Local Storage immediately & broadcast event
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_PORTAL_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('flas_portal_config_updated', { detail: payload }));
    } catch {}
  }

  // 2. Save to Firestore
  if (isConfigured && db) {
    try {
      // Recursively strip undefined
      const cleanJson = (val: any): any => {
        if (val === undefined) return null;
        if (val === null) return null;
        if (typeof val !== 'object') return val;
        if (Array.isArray(val)) return val.map(cleanJson);
        const res: any = {};
        for (const [k, v] of Object.entries(val)) {
          if (v !== undefined) res[k] = cleanJson(v);
        }
        return res;
      };

      const docRef = doc(db, 'portal_config', 'homepage');
      await setDoc(docRef, cleanJson(payload));
    } catch (err: any) {
      console.warn('Firestore portal save warning (saved to localStorage):', err?.message || err);
    }
  }

  return payload;
}

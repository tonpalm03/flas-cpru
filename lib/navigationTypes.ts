// Navigation & Module Structure Types for FLAS-CPRU ERP
// Dynamic Navigation Studio Architecture (Zero Cloud Cost & Local Caching)

export interface NavItem {
  id: string;
  title: string;
  href: string;
  badge?: string;
  iconName?: string;
  isBuiltIn?: boolean;
  targetModule?: string;
}

export interface NavSection {
  id: string;
  key: string;
  label: string;
  iconName: string;
  orderIndex: number;
  isBuiltIn?: boolean;
  isVisible: boolean;
  subItems: NavItem[];
}

export interface NavigationLayoutConfig {
  version: number;
  updatedAt: string;
  updatedBy?: string;
  sections: NavSection[];
}

export interface NavIconOption {
  key: string;
  label: string;
  category: string;
}

export const AVAILABLE_NAV_ICONS: NavIconOption[] = [
  // General & Administration
  { key: "FileText", label: "เอกสาร / สารบรรณ", category: "ทั่วไปและธุรการ" },
  { key: "Inbox", label: "รับ-ส่งหนังสือ", category: "ทั่วไปและธุรการ" },
  { key: "Send", label: "ส่งต่อเอกสาร", category: "ทั่วไปและธุรการ" },
  { key: "BookmarkCheck", label: "ทะเบียนคุม / ตรวจรับ", category: "ทั่วไปและธุรการ" },
  { key: "FileCheck", label: "การอนุมัติ / ตรวจสอบ", category: "ทั่วไปและธุรการ" },
  { key: "ClipboardList", label: "รายการงาน / ติดตาม", category: "ทั่วไปและธุรการ" },

  // Projects & Planning
  { key: "FolderKanban", label: "โครงการและกิจกรรม", category: "โครงการและแผนงาน" },
  { key: "LineChart", label: "ตัวชี้วัด / ยุทธศาสตร์", category: "โครงการและแผนงาน" },
  { key: "BarChart3", label: "สถิติและรายงาน", category: "โครงการและแผนงาน" },
  { key: "Layers", label: "งานบูรณาการ / แผนงาน", category: "โครงการและแผนงาน" },

  // Finance & Procurement
  { key: "Wallet", label: "การเงินและงบประมาณ", category: "การเงินและพัสดุ" },
  { key: "Package", label: "พัสดุและจัดซื้อ", category: "การเงินและพัสดุ" },
  { key: "CheckSquare", label: "ตรวจรับพัสดุ", category: "การเงินและพัสดุ" },

  // HR & Academic
  { key: "Users", label: "บริหารงานบุคคล", category: "บุคคลและวิชาการ" },
  { key: "GraduationCap", label: "วิชาการ / หลักสูตร", category: "บุคคลและวิชาการ" },
  { key: "BookOpen", label: "วิจัยและตำรา", category: "บุคคลและวิชาการ" },
  { key: "Award", label: "ประกันคุณภาพ / รางวัล", category: "บุคคลและวิชาการ" },
  { key: "CalendarDays", label: "ตารางงาน / ปฏิทิน", category: "บุคคลและวิชาการ" },

  // Public Relations & Misc
  { key: "Megaphone", label: "ประชาสัมพันธ์ / ข่าวสาร", category: "สื่อสารและบริการ" },
  { key: "Globe", label: "วิเทศสัมพันธ์ / สากล", category: "สื่อสารและบริการ" },
  { key: "Building2", label: "อาคารสถานที่ / ห้องประชุม", category: "สื่อสารและบริการ" },
  { key: "ShieldCheck", label: "ธรรมาภิบาล / ข้อบังคับ", category: "สื่อสารและบริการ" },
  { key: "Sparkles", label: "นวัตกรรม / บริการวิชาการ", category: "สื่อสารและบริการ" },
  { key: "Settings", label: "ตั้งค่าระบบและสิทธิ์", category: "ระบบ" },
];

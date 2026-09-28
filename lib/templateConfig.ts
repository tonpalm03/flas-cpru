// Admin Template Customizer Storage & Types

export interface SystemTemplatesConfig {
  facultyName: string;
  universityName: string;
  officeName: string;
  telephone: string;
  deanName: string;
  deanPosition: string;
  defaultDocPrefix: string;
  defaultFiscalYear: number;
  vatRate: number;
  memoStandardParagraphs: {
    speakerInviteIntro: string;
    speakerInviteBody: string;
    classExemptionIntro: string;
    classExemptionBody: string;
    travelDutyIntro: string;
    travelDutyBody: string;
    closingStandard: string;
  };
}

export const DEFAULT_TEMPLATES_CONFIG: SystemTemplatesConfig = {
  facultyName: "คณะศิลปศาสตร์และวิทยาศาสตร์",
  universityName: "มหาวิทยาลัยราชภัฏชัยภูมิ",
  officeName: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์",
  telephone: "044-811-xxx",
  deanName: "ผู้ช่วยศาสตราจารย์ ดร.นฤมล อนันตโชค",
  deanPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
  defaultDocPrefix: "อว 0604.05",
  defaultFiscalYear: 2569,
  vatRate: 7,
  memoStandardParagraphs: {
    speakerInviteIntro: "ด้วย สาขาวิชามีกำหนดจัดโครงการพัฒนาศักยภาพนักศึกษา ประจำปีงบประมาณ พ.ศ. 2569",
    speakerInviteBody: "ในการนี้ สาขาวิชาพิจารณาเห็นว่าท่านเป็นผู้มีความรู้ ความสามารถ และประสบการณ์ในหัวข้อดังกล่าว จึงใคร่ขอเรียนเชิญท่านเป็นวิทยากรบรรยาย",
    classExemptionIntro: "ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ ได้จัดโครงการอบรมเชิงปฏิบัติการเพื่อพัฒนาทักษะวิชาชีพแก่นักศึกษา",
    classExemptionBody: "เพื่อให้การดำเนินโครงการบรรลุตามวัตถุประสงค์ จึงใคร่ขอความอนุเคราะห์เวลาเรียนของนักศึกษาเข้าร่วมกิจกรรมดังกล่าว",
    travelDutyIntro: "ด้วย ข้าพเจ้าและคณะมีความจำเป็นต้องเดินทางไปดำเนินงานโครงการยกระดับเศรษฐกิจฐานรากในพื้นที่เป้าหมาย",
    travelDutyBody: "ในการนี้ จึงขออนุมัติเดินทางไปปฏิบัติราชการ พร้อมขออนุมัติใช้ยานพาหนะส่วนกลางของคณะ และขออนุมัติเบิกจ่ายค่าใช้จ่ายตามระเบียบ",
    closingStandard: "จึงเรียนมาเพื่อโปรดพิจารณาและให้ความอนุเคราะห์"
  }
};

export function getSystemTemplates(): SystemTemplatesConfig {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES_CONFIG;
  const saved = localStorage.getItem("faculty_erp_templates_config");
  if (!saved) return DEFAULT_TEMPLATES_CONFIG;
  try {
    return { ...DEFAULT_TEMPLATES_CONFIG, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_TEMPLATES_CONFIG;
  }
}

export function saveSystemTemplates(config: SystemTemplatesConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem("faculty_erp_templates_config", JSON.stringify(config));
  }
}

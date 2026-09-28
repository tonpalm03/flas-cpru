import { getMasterSettings, saveMasterSettings } from "./firebaseService";
import { UserProfile } from "./types";

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
  deanName: "ผู้ช่วยศาสตราจารย์ ดร.สานนท์ ด่านภักดี",
  deanPosition: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
  defaultDocPrefix: "อว 0643.04/",
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

export async function fetchSystemTemplatesConfig(): Promise<SystemTemplatesConfig> {
  try {
    const master = await getMasterSettings();
    if (master) {
      return {
        facultyName: master.facultyName || DEFAULT_TEMPLATES_CONFIG.facultyName,
        universityName: master.universityName || DEFAULT_TEMPLATES_CONFIG.universityName,
        officeName: DEFAULT_TEMPLATES_CONFIG.officeName,
        telephone: DEFAULT_TEMPLATES_CONFIG.telephone,
        deanName: master.deanName || DEFAULT_TEMPLATES_CONFIG.deanName,
        deanPosition: master.deanPosition || DEFAULT_TEMPLATES_CONFIG.deanPosition,
        defaultDocPrefix: master.docPrefix || DEFAULT_TEMPLATES_CONFIG.defaultDocPrefix,
        defaultFiscalYear: master.fiscalYear || DEFAULT_TEMPLATES_CONFIG.defaultFiscalYear,
        vatRate: master.defaultVatRate || DEFAULT_TEMPLATES_CONFIG.vatRate,
        memoStandardParagraphs: (master as any).memoStandardParagraphs || DEFAULT_TEMPLATES_CONFIG.memoStandardParagraphs
      };
    }
  } catch (e) {
    console.warn("fetchSystemTemplatesConfig error:", e);
  }
  return getSystemTemplates();
}

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

export async function saveSystemTemplates(config: SystemTemplatesConfig, actor?: UserProfile | null) {
  if (typeof window !== "undefined") {
    localStorage.setItem("faculty_erp_templates_config", JSON.stringify(config));
  }
  try {
    await saveMasterSettings({
      facultyName: config.facultyName,
      universityName: config.universityName,
      deanName: config.deanName,
      deanPosition: config.deanPosition,
      docPrefix: config.defaultDocPrefix,
      fiscalYear: config.defaultFiscalYear,
      defaultVatRate: config.vatRate,
      ...({ memoStandardParagraphs: config.memoStandardParagraphs } as any)
    }, actor);
  } catch (e) {
    console.warn("saveSystemTemplates to Firestore error:", e);
  }
}

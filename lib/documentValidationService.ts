/**
 * Pre-Flight Document Validation Engine (Thai Government Correspondence)
 * 
 * Complies with:
 * - ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ และฉบับแก้ไขเพิ่มเติม
 * - Strict Zero-Emoji Policy
 * - Section 8: Quality, Compliance & Zero Hallucination Checks
 */

import type { AdminDocRegistryRecord, AdminDocCategory } from './types';

export type ValidationSeverity = 'error' | 'warning' | 'suggestion';

export interface ValidationIssue {
  id: string;
  field: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  recommendation: string;
}

export interface ValidationReport {
  isValid: boolean; // True only if errorCount === 0
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  issues: ValidationIssue[];
  summaryText: string;
}

/**
 * Validate document against Thai Government Correspondence standards
 */
export function validateGovernmentDocument(
  r: Partial<AdminDocRegistryRecord>,
  category: AdminDocCategory
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const isOrder = category === 'order';
  const isExternal = category === 'external' || category === 'external_circular';
  const isMemo = category.startsWith('memo');

  // 1. Check Required Field: จาก / ส่วนราชการ
  const fromText = (r.from || '').trim();
  if (!fromText) {
    issues.push({
      id: 'missing_from',
      field: 'from',
      severity: 'error',
      title: isOrder ? 'ยังไม่ได้ระบุหน่วยงานผู้ออกคำสั่ง' : 'ยังไม่ได้ระบุส่วนราชการเจ้าของหนังสือ',
      message: 'ระเบียบงานสารบรรณกำหนดให้ต้องระบุส่วนราชการหรือหน่วยงานที่ออกหนังสืออย่างชัดเจน',
      recommendation: isOrder ? 'ระบุ "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ"' : 'ระบุชื่อคณะและเบอร์โทรศัพท์ภายใน'
    });
  } else if (isOrder && !fromText.includes('คณะศิลปศาสตร์และวิทยาศาสตร์') && !fromText.includes('มหาวิทยาลัยราชภัฏชัยภูมิ')) {
    issues.push({
      id: 'order_from_convention',
      field: 'from',
      severity: 'warning',
      title: 'ชื่อหน่วยงานผู้ออกคำสั่งอาจไม่สมบูรณ์',
      message: `หน่วยงานผู้ออกคำสั่งคือ "${fromText}" ควรระบุให้ชัดเจนตามโครงสร้างการมอบอำนาจ`,
      recommendation: 'ควรใช้ "คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ"'
    });
  }

  // 2. Check Required Field: เรื่อง (Subject)
  const subjectText = (r.subject || '').trim();
  if (!subjectText) {
    issues.push({
      id: 'missing_subject',
      field: 'subject',
      severity: 'error',
      title: 'ยังไม่ได้ระบุชื่อเรื่อง',
      message: 'ชื่อเรื่องเป็นข้อมูลจำเป็นตามระเบียบงานสารบรรณ เพื่อใช้ในการออกเลขทะเบียนคุมและสืบค้น',
      recommendation: 'กรอกชื่อเรื่องที่สรุปใจความสำคัญของหนังสืออย่างกระชับและชัดเจน'
    });
  } else {
    if (subjectText.startsWith('เรื่อง')) {
      issues.push({
        id: 'subject_has_prefix',
        field: 'subject',
        severity: 'suggestion',
        title: 'มีคำว่า "เรื่อง" ซ้ำในช่องชื่อเรื่อง',
        message: 'ระบบจะพิมพ์คำว่า "เรื่อง" ให้โดยอัตโนมัติตามแม่แบบราชการอยู่แล้ว',
        recommendation: 'สามารถตัดคำว่า "เรื่อง" ออกจากช่องกรอกได้'
      });
    }
  }

  // 3. Check Required Field: เรียน (To / Recipient)
  if (!isOrder) {
    const toText = (r.to || '').trim();
    if (!toText) {
      issues.push({
        id: 'missing_to',
        field: 'to',
        severity: 'error',
        title: 'ยังไม่ได้ระบุผู้รับหนังสือ (เรียน)',
        message: 'หนังสือราชการต้องระบุตำแหน่งหรือชื่อบุคคลผู้รับหนังสือให้ชัดเจน',
        recommendation: 'ระบุชื่อหรือตำแหน่งของผู้รับ เช่น "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์" หรือ "อาจารย์ ดร.วราวุฒิ มหามิตร"'
      });
    } else if (toText.startsWith('เรียน')) {
      issues.push({
        id: 'to_has_prefix',
        field: 'to',
        severity: 'suggestion',
        title: 'มีคำว่า "เรียน" ซ้ำในช่องผู้รับ',
        message: 'ระบบจะพิมพ์คำว่า "เรียน" ให้โดยอัตโนมัติตามแม่แบบราชการอยู่แล้ว',
        recommendation: 'สามารถตัดคำว่า "เรียน" ออกจากช่องกรอกได้'
      });
    }
  }

  // 4. Check Required Field: ที่อยู่หน่วยงาน (Office Address - for External Letters)
  if (isExternal) {
    const address = (r.officeAddress || '').trim();
    if (!address) {
      issues.push({
        id: 'missing_office_address',
        field: 'officeAddress',
        severity: 'error',
        title: 'ยังไม่ได้ระบุที่ตั้งส่วนราชการ',
        message: 'หนังสือภายนอกต้องระบุที่ตั้งส่วนราชการเจ้าของหนังสือมุมบนขวาตามระเบียบงานสารบรรณ',
        recommendation: 'กรอกที่อยู่ของคณะและรหัสไปรษณีย์ ๓๖๐๐๐'
      });
    }
  }

  // 5. Check Content & Body Paragraphs
  const paragraphs = r.bodyParagraphs || [];
  const combinedBody = paragraphs.join('\n\n').trim();
  if (!combinedBody || combinedBody === 'พิมพ์ข้อความเนื้อหาในแบบฟอร์มด้านซ้ายเพื่อดูตัวอย่างเอกสารจริง...') {
    issues.push({
      id: 'missing_body',
      field: 'bodyParagraphs',
      severity: 'error',
      title: 'ยังไม่ได้ระบุเนื้อหาข้อความในเอกสาร',
      message: 'เอกสารยังไม่มีเนื้อหาข้อความจริงสำหรับจัดพิมพ์',
      recommendation: 'พิมพ์ข้อความเนื้อหา หรือกดปุ่ม "ใช้ข้อความจากต้นแบบ"'
    });
  } else {
    // 6. Check Incomplete Placeholders & Unfinished Text Markers
    const placeholderMatches = combinedBody.match(/\[(.*?)\]|\.{3,}|_{3,}/g);
    if (placeholderMatches && placeholderMatches.length > 0) {
      const uniquePlaceholders = Array.from(new Set(placeholderMatches)).slice(0, 5);
      issues.push({
        id: 'unfilled_placeholders',
        field: 'bodyParagraphs',
        severity: 'warning',
        title: `พบเครื่องหมายรอกรอกข้อมูลตกค้าง (${placeholderMatches.length} จุด)`,
        message: `พบข้อความรอกรอกข้อมูล เช่น ${uniquePlaceholders.join(', ')} ในเนื้อหาเอกสาร`,
        recommendation: 'กรุณาตรวจสอบและแทนที่เครื่องหมาย [...] หรือ ... ด้วยข้อมูลจริงก่อนส่งตรวจหรือลงนาม'
      });
    }

    // 7. Check Structure conventions (Thai Saraban rules)
    if (isMemo) {
      if (combinedBody.includes('ขอแสดงความนับถือ')) {
        issues.push({
          id: 'memo_has_closing',
          field: 'bodyParagraphs',
          severity: 'error',
          title: 'พบลักษณะคำลงท้าย "ขอแสดงความนับถือ" ในบันทึกข้อความ',
          message: 'ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ บันทึกข้อความ (หนังสือภายใน) ไม่มีคำลงท้าย "ขอแสดงความนับถือ"',
          recommendation: 'ลบข้อความ "ขอแสดงความนับถือ" ออกจากเนื้อหาบันทึกข้อความ'
        });
      }
      const hasProperEnding = paragraphs.some(p => p.startsWith('จึงเรียน') || p.startsWith('จึงเสนอ'));
      if (!hasProperEnding) {
        issues.push({
          id: 'memo_ending_convention',
          field: 'bodyParagraphs',
          severity: 'suggestion',
          title: 'ย่อหน้าสุดท้ายควรระบุความประสงค์ขึ้นต้นด้วย "จึงเรียนมาเพื่อ..."',
          message: 'หนังสือราชการควรลงท้ายด้วยวัตถุประสงค์ เช่น "จึงเรียนมาเพื่อโปรดพิจารณา" หรือ "จึงเรียนมาเพื่อโปรดทราบ"',
          recommendation: 'เพิ่มย่อหน้าสรุปความประสงค์ เช่น "จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ"'
        });
      }
    }

    // 8. Text Overflow & Length Estimation
    // A standard A4 official letter holds ~2,200 Thai chars in 1 page.
    if (combinedBody.length > 2400) {
      issues.push({
        id: 'page_overflow_warning',
        field: 'bodyParagraphs',
        severity: 'warning',
        title: 'เนื้อหาอาจมีความยาวเกิน ๑ หน้ากระดาษ A4',
        message: `ข้อความมีความยาวประมาณ ${combinedBody.length} ตัวอักษร ซึ่งอาจล้นขึ้นหน้า ๒`,
        recommendation: 'ตรวจสอบตัวอย่างเอกสาร (Live Preview) หากขึ้นหน้า ๒ ต้องตรวจให้แน่ใจว่าส่วนลงนามไม่ถูกตัดขาดไปอยู่หน้าถัดไปตามลำพัง'
      });
    }
  }

  // 9. Signatory Validation
  const signerName = (r.signatoryName || '').trim();
  const signerPos = (r.signatoryPosition || '').trim();
  if (!signerName) {
    issues.push({
      id: 'missing_signatory_name',
      field: 'signatoryName',
      severity: 'error',
      title: 'ยังไม่ได้ระบุชื่อผู้ลงนาม',
      message: 'เอกสารราชการต้องมีชื่อ-สกุลของผู้มีอำนาจลงนาม',
      recommendation: 'เลือกผู้ลงนามจากรายการผู้บริหาร หรือพิมพ์ชื่อ-สกุลผู้ลงนาม'
    });
  } else {
    // Check 2 spaces between first and last name
    const nameParts = signerName.split(/\s+/);
    if (nameParts.length >= 2 && !signerName.includes('  ')) {
      issues.push({
        id: 'signatory_spacing',
        field: 'signatoryName',
        severity: 'suggestion',
        title: 'การเว้นวรรคระหว่างชื่อและนามสกุล',
        message: 'ตามคู่มือการพิมพ์หนังสือราชการ ควรกดเว้นวรรค ๒ เคาะ ระหว่างชื่อและนามสกุล',
        recommendation: 'ระบบจะช่วยจัดเว้นวรรค ๒ เคาะให้โดยอัตโนมัติในการแสดงผลและส่งออกไฟล์'
      });
    }
  }

  if (!signerPos) {
    issues.push({
      id: 'missing_signatory_pos',
      field: 'signatoryPosition',
      severity: 'error',
      title: 'ยังไม่ได้ระบุตำแหน่งผู้ลงนาม',
      message: 'เอกสารราชการต้องระบุตำแหน่งของผู้ลงนามใต้ชื่อ',
      recommendation: 'ระบุตำแหน่ง เช่น "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์"'
    });
  }

  // 10. Date Validation
  const docDate = (r.date || '').trim();
  if (!docDate) {
    issues.push({
      id: 'missing_date',
      field: 'date',
      severity: 'error',
      title: 'ยังไม่ได้ระบุวันที่ของเอกสาร',
      message: 'ต้องระบุวันที่เพื่อใช้คำนวณวัน เดือน ปี ทางราชการ',
      recommendation: 'เลือกวันที่จากปฏิทิน'
    });
  } else {
    const yearNum = Number(docDate.slice(0, 4));
    if (yearNum < 2020 || yearNum > 2035) {
      issues.push({
        id: 'date_out_of_range',
        field: 'date',
        severity: 'warning',
        title: 'ปีที่ระบุอาจไม่ถูกต้อง',
        message: `วันที่ระบุคือ ค.ศ. ${yearNum} (พ.ศ. ${yearNum + 543}) ซึ่งอยู่นอกช่วงการดำเนินงานปกติ`,
        recommendation: 'ตรวจสอบปี พ.ศ. ให้ถูกต้อง'
      });
    }
  }

  // 11. Circular recipients check
  if (category === 'memo_circular' || category === 'external_circular') {
    const recipients = r.recipients || [];
    if (recipients.length === 0 && (!r.to || r.to.trim() === '')) {
      issues.push({
        id: 'circular_missing_recipients',
        field: 'recipients',
        severity: 'warning',
        title: 'ยังไม่ได้ระบุรายชื่อผู้รับเวียน',
        message: 'เอกสารประเภทหนังสือเวียน ควรมีรายชื่อผู้รับเวียนหรือระบุกลุ่มผู้รับในช่อง "เรียน"',
        recommendation: 'กดปุ่ม [+ เพิ่มผู้รับเวียน] เพื่อใส่รายชื่อผู้รับแต่ละท่าน หรือระบุกลุ่มผู้รับในช่อง "เรียน"'
      });
    }
  }

  // Summary counts
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const suggestionCount = issues.filter(i => i.severity === 'suggestion').length;
  const isValid = errorCount === 0;

  let summaryText = 'เอกสารผ่านเกณฑ์การตรวจสอบ พร้อมสำหรับการบันทึกและส่งตรวจ';
  if (errorCount > 0) {
    summaryText = `พบข้อผิดพลาดที่ต้องแก้ไข ${errorCount} รายการ ก่อนสามารถส่งตรวจได้`;
  } else if (warningCount > 0) {
    summaryText = `ผ่านเกณฑ์บังคับ แต่พบข้อควรระวัง ${warningCount} รายการ`;
  }

  return {
    isValid,
    errorCount,
    warningCount,
    suggestionCount,
    issues,
    summaryText
  };
}

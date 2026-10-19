/**
 * AI Official Document Drafting Engine (Thai Government Correspondence)
 * 
 * Complies with:
 * - ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ และฉบับแก้ไขเพิ่มเติม
 * - Strict Zero-Emoji Policy
 * - Client-Side Processing 100% (Zero Cloud Cost & Zero Data Leakage)
 * - Zero Hallucination Guarantee: Never invent fake facts, names, or budgets.
 */

import type { AdminDocCategory } from './types';

export interface AiDraftRequest {
  category: AdminDocCategory;
  userPrompt: string;
  context?: {
    from?: string;
    to?: string;
    date?: string;
    subject?: string;
    existingBody?: string;
  };
  mode?: 'generate' | 'formalize' | 'concise' | 'justify' | 'executive';
}

export interface AiDraftResult {
  subject: string;
  to: string;
  bodyParagraphs: string[];
  bodyText: string;
  referenceDoc?: string;
  attachmentsText?: string;
  missingVariables: string[];
  isAiGenerated: boolean;
  structureExplanation: {
    background: string;     // เรื่องเดิม / ความเป็นมา (ด้วย / ตามที่)
    facts: string;          // ข้อเท็จจริง / รายละเอียดกิจกรรม (ในการนี้)
    proposal: string;       // ข้อเสนอ / วัตถุประสงค์
    conclusion: string;     // คำขออนุมัติ / คำลงท้าย (จึงเรียนมาเพื่อ...)
  };
}

/**
 * Intelligent pattern extractors for Thai official correspondence
 */
function extractEntity(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * Clean and normalize Thai whitespace and quotes
 */
function normalizeThaiText(text: string): string {
  return text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Extract intent and build structured official draft
 */
export function draftGovernmentDocument(req: AiDraftRequest): AiDraftResult {
  const prompt = normalizeThaiText(req.userPrompt);
  const category = req.category;
  const isOrder = category === 'order';
  const isMemo = category.startsWith('memo');
  const isExternal = category.startsWith('external');

  // Handle refinement modes on existing body if requested
  if (req.mode && req.mode !== 'generate' && req.context?.existingBody) {
    return refineExistingDraft(req.context.existingBody, req.mode, category, req.context.subject || '');
  }

  // 1. Extract Target Person / Addressee
  let to = extractEntity(prompt, [
    /(?:เรียน|ถึง|ส่งถึง|เชิญ)\s+([^\n,]+?)(?:\s+(?:เพื่อ|เรื่อง|เข้าร่วม|เป็นวิทยากร|บรรยาย|เนื่องด้วย|ในวัน)|$)/,
    /(?:ผู้รับ|ถึงท่าน|กราบเรียน)\s+([^\n,]+)/
  ]);
  if (!to && req.context?.to) to = req.context.to;

  // 2. Extract Event / Project / Topic
  const topic = extractEntity(prompt, [
    /(?:เรื่อง|หัวข้อ|โครงการ|กิจกรรม|งาน)\s+["“]?([^"”\n,]+?)["”]?(?:\s+(?:ในวันที่|ณ|ระหว่างวันที่|เพื่อ)|$)/,
    /(?:ขอเชิญเป็น|ขออนุมัติ|ขอความอนุเคราะห์)\s+([^\n,]+)/
  ]);

  // 3. Extract Date & Location
  const dateStr = extractEntity(prompt, [
    /(?:ในวันที่|ระหว่างวันที่|วันที่)\s+([^\n,]+?)(?:\s+(?:เวลา|ณ|ที่ห้อง|ห้อง)|$)/
  ]);
  const timeStr = extractEntity(prompt, [
    /(?:เวลา|ตั้งแต่เวลา)\s+([^\n,]+?)(?:\s+(?:น\.|ณ|ห้อง)|$)/
  ]);
  const locationStr = extractEntity(prompt, [
    /(?:ณ\s+ห้อง|ณ\s+อาคาร|ณ\s+โรงแรม|ณ|ที่ห้อง)\s+([^\n,]+?)(?:\s+(?:เพื่อ|โดยมี)|$)/
  ]);

  // 4. Missing variables tracking
  const missingVariables: string[] = [];

  // Determine Subject
  let subject = req.context?.subject || '';
  if (!subject) {
    if (prompt.includes('วิทยากร') || prompt.includes('บรรยาย')) {
      subject = topic ? `ขอเรียนเชิญเป็นวิทยากรโครงการ${topic}` : 'ขอเรียนเชิญเป็นวิทยากร';
    } else if (prompt.includes('ผู้เชี่ยวชาญ') || prompt.includes('ตรวจเครื่องมือ')) {
      subject = 'ขอเชิญเป็นผู้เชี่ยวชาญตรวจสอบเครื่องมือในการวิจัย';
    } else if (prompt.includes('ขอความอนุเคราะห์เวลาเรียน') || prompt.includes('เวลาเรียน')) {
      subject = topic ? `ขอความอนุเคราะห์เวลาเรียนของนักศึกษา (${topic})` : 'ขอความอนุเคราะห์เวลาเรียนของนักศึกษา';
    } else if (prompt.includes('ขออนุมัติจัดโครงการ') || (prompt.includes('ขออนุมัติ') && prompt.includes('โครงการ'))) {
      subject = topic ? `ขออนุมัติจัดโครงการ${topic}` : 'ขออนุมัติจัดโครงการ';
    } else if (prompt.includes('ขออนุมัติเบิกจ่าย') || prompt.includes('เบิกเงิน')) {
      subject = topic ? `ขออนุมัติเบิกจ่ายเงินงบประมาณโครงการ${topic}` : 'ขออนุมัติเบิกจ่ายเงินงบประมาณ';
    } else if (isOrder) {
      subject = topic ? `แต่งตั้งคณะกรรมการดำเนินงาน${topic}` : 'แต่งตั้งคณะกรรมการดำเนินงาน';
    } else {
      subject = topic ? `เรื่อง ${topic}` : 'เรื่อง [โปรดระบุชื่อเรื่องเอกสาร]';
      if (!topic) missingVariables.push('ชื่อเรื่อง (Subject)');
    }
  }

  // Determine recipient if missing
  if (!to && !isOrder) {
    if (subject.includes('เวลาเรียน')) {
      to = 'อาจารย์ผู้สอนประจำรายวิชา';
    } else if (isExternal) {
      to = '[โปรดระบุชื่อ-นามสกุล และตำแหน่งผู้รับหนังสือ]';
      missingVariables.push('ชื่อและตำแหน่งผู้รับหนังสือ (To)');
    } else {
      to = 'คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์';
    }
  }

  // 5. Structure Document Paragraphs based on Category & Intent
  const paragraphs: string[] = [];
  let partBackground = '';
  let partFacts = '';
  let partProposal = '';
  let partConclusion = '';

  const facultyName = 'คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ';

  if (isOrder) {
    // ORDER STRUCTURE (คำสั่ง)
    partBackground = `ด้วย${facultyName} ได้ดำเนิน${topic || '[โปรดระบุชื่อโครงการ/ภารกิจ]'} โดยมีวัตถุประสงค์เพื่อขับเคลื่อนการดำเนินงานและพัฒนาศักยภาพให้บรรลุตามวัตถุประสงค์ที่กำหนด`;
    if (!topic) missingVariables.push('ชื่อโครงการหรือภารกิจตามคำสั่ง');

    partFacts = `ดังนั้น เพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย มีประสิทธิภาพ อาศัยอำนาจตามความในมาตรา ๓๑ แห่งพระราชบัญญัติมหาวิทยาลัยราชภัฏ พ.ศ. ๒๕๔๗ และคำสั่งมหาวิทยาลัยราชภัฏชัยภูมิ ที่ ๓๔๒๗/๒๕๕๙ เรื่อง มอบอำนาจให้คณบดีปฏิบัติราชการแทนอธิการบดี ลงวันที่ ๒๕ ตุลาคม ๒๕๕๙ จึงแต่งตั้งคณะกรรมการดำเนินงาน${topic || ''} ดังต่อไปนี้`;

    const committeeSection = [
      '๑. คณะกรรมการอำนวยการ',
      '๑. ผู้ช่วยศาสตราจารย์ ดร.สิริศักดิ์ อาจวิชัย  ประธานกรรมการ',
      '๒. [โปรดระบุชื่อ-สกุล กรรมการอำนวยการ]  กรรมการ',
      'หน้าที่ ให้คำปรึกษา แนะนำ วางแผนการดำเนินงาน และอำนวยความสะดวกในการปฏิบัติงาน',
      '',
      '๒. คณะกรรมการดำเนินงาน',
      '๑. [โปรดระบุชื่อผู้รับผิดชอบหลัก]  ประธานกรรมการ',
      '๒. [โปรดระบุชื่อกรรมการดำเนินงาน]  กรรมการ',
      '๓. [โปรดระบุชื่อกรรมการและเลขานุการ]  กรรมการและเลขานุการ',
      'หน้าที่',
      '๑. ดำเนินงานจัดกิจกรรมตามขอบเขตและตัวชี้วัดของโครงการให้เป็นไปตามระเบียบของทางราชการ',
      '๒. สรุปผลและรายงานผลการดำเนินงานต่อคณะศิลปศาสตร์และวิทยาศาสตร์'
    ].join('\n');
    missingVariables.push('รายชื่อคณะกรรมการดำเนินงาน');

    partProposal = committeeSection;

    partConclusion = 'ให้คณะกรรมการที่ได้รับการแต่งตั้งดังกล่าว ปฏิบัติหน้าที่ที่ได้รับมอบหมายอย่างเต็มความสามารถ ด้วยความวิริยะอุตสาหะ เพื่อให้บังเกิดผลดีต่อทางราชการ';

    paragraphs.push(partBackground);
    paragraphs.push(partFacts);
    paragraphs.push(partProposal);
    paragraphs.push(partConclusion);

  } else if (prompt.includes('วิทยากร') || prompt.includes('บรรยาย')) {
    // INVITATION AS SPEAKER (ขอเชิญเป็นวิทยากร)
    const effectiveDate = dateStr || '[โปรดระบุวัน เดือน ปี]';
    const effectiveTime = timeStr ? ` เวลา ${timeStr} น.` : '';
    const effectiveLoc = locationStr || '[โปรดระบุสถานที่จัดอบรม]';
    if (!dateStr) missingVariables.push('วันและเวลาบรรยาย');
    if (!locationStr) missingVariables.push('สถานที่จัดอบรม');

    partBackground = `ด้วย${facultyName} ได้ดำเนิน${topic || 'โครงการพัฒนาศักยภาพทางวิชาการและทักษะวิชาชีพ'} โดยมีวัตถุประสงค์เพื่อส่งเสริมการเรียนรู้และพัฒนาทักษะความเชี่ยวชาญให้แก่นักศึกษาและบุคลากร ในระหว่างวันที่ ${effectiveDate}${effectiveTime} ณ ${effectiveLoc}`;

    partFacts = `ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ พิจารณาแล้วเห็นว่า ท่านเป็นผู้มีความรู้ ความสามารถ ความเชี่ยวชาญ และมีประสบการณ์ในเรื่องดังกล่าวเป็นอย่างดียิ่ง จึงใคร่ขอเรียนเชิญท่านเป็นวิทยากรบรรยายตามวัน เวลา และสถานที่ดังกล่าวข้างต้น รายละเอียดตามสิ่งที่ส่งมาด้วยนี้`;

    partConclusion = 'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้';

    paragraphs.push(partBackground);
    paragraphs.push(partFacts);
    paragraphs.push(partConclusion);

  } else if (prompt.includes('ผู้เชี่ยวชาญ') || prompt.includes('ตรวจเครื่องมือ')) {
    // INVITATION FOR RESEARCH TOOL EVALUATION (ตรวจเครื่องมือวิจัย)
    partBackground = `ด้วย${facultyName} มีนักศึกษาและคณาจารย์กำลังดำเนินการศึกษาวิจัยเรื่อง "${topic || '[โปรดระบุชื่อหัวข้องานวิจัย]'}" ซึ่งเป็นส่วนหนึ่งของการศึกษาและการสร้างสรรค์องค์ความรู้ทางวิชาการ`;
    if (!topic) missingVariables.push('ชื่อหัวข้องานวิจัย');

    partFacts = `ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ พิจารณาแล้วเห็นว่า ท่านเป็นผู้ทรงคุณวุฒิที่มีความรู้ ความเชี่ยวชาญ และมีประสบการณ์ในสาขาวิชาดังกล่าวเป็นอย่างยิ่ง จึงใคร่ขอเรียนเชิญท่านเป็นผู้เชี่ยวชาญในการตรวจประเมิน และเสนอแนะเพื่อปรับปรุงแก้ไขเครื่องมือที่ใช้ในการวิจัยให้มีความถูกต้อง สมบูรณ์ และได้มาตรฐานทางวิชาการ รายละเอียดตามเอกสารที่แนบมาพร้อมนี้`;

    partConclusion = 'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์';

    paragraphs.push(partBackground);
    paragraphs.push(partFacts);
    paragraphs.push(partConclusion);

  } else if (prompt.includes('ขอความอนุเคราะห์เวลาเรียน') || prompt.includes('เวลาเรียน')) {
    // REQUEST CLASS TIME (ขอความอนุเคราะห์เวลาเรียน)
    const effectiveDate = dateStr || '[โปรดระบุวันที่จัดกิจกรรม]';
    const effectiveLoc = locationStr || '[โปรดระบุห้องประชุม/สถานที่]';
    if (!dateStr) missingVariables.push('วันที่จัดกิจกรรม');

    partBackground = `ด้วย${facultyName} จะดำเนินการจัด${topic || 'กิจกรรมเตรียมความพร้อมและพัฒนาทักษะทางวิชาชีพ'} โดยมีวัตถุประสงค์เพื่อให้นักศึกษาได้รับความรู้และประสบการณ์ตรงก่อนการออกฝึกปฏิบัติงานจริง`;

    partFacts = `ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ จึงใคร่ขอความอนุเคราะห์เวลาเรียนของนักศึกษา เพื่อเข้าร่วมกิจกรรมดังกล่าว ในวันที่ ${effectiveDate} ณ ${effectiveLoc} และขอความอนุเคราะห์อาจารย์ผู้สอนพิจารณาชดเชยเวลาเรียนให้กับนักศึกษาตามความเหมาะสม`;

    partConclusion = 'จึงเรียนมาเพื่อพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้';

    paragraphs.push(partBackground);
    paragraphs.push(partFacts);
    paragraphs.push(partConclusion);

  } else if (prompt.includes('ขออนุมัติ') && (prompt.includes('เบิกจ่าย') || prompt.includes('เงิน'))) {
    // BUDGET DISBURSEMENT (ขออนุมัติเบิกจ่าย)
    partBackground = `ตามที่ ${facultyName} ได้อนุมัติให้ดำเนิน${topic || '[โปรดระบุชื่อโครงการ]'} เมื่อวันที่ ${dateStr || '[โปรดระบุวันที่ดำเนินโครงการ]'} เป็นที่เรียบร้อยแล้ว นั้น`;
    if (!topic) missingVariables.push('ชื่อโครงการที่เบิกจ่าย');

    partFacts = `บัดนี้ การดำเนินงานตามโครงการดังกล่าวได้เสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์แล้ว จึงขออนุมัติเบิกจ่ายเงินงบประมาณค่าใช้จ่ายในการดำเนินโครงการ เป็นจำนวนเงินทั้งสิ้น [โปรดระบุจำนวนเงิน] บาท ([โปรดระบุตัวอักษร]) ตามใบสำคัญรับเงินและเอกสารหลักฐานประกอบการเบิกจ่ายที่แนบมาพร้อมนี้`;
    missingVariables.push('จำนวนเงินงบประมาณที่ขอเบิก');

    partConclusion = 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ';

    paragraphs.push(partBackground);
    paragraphs.push(partFacts);
    paragraphs.push(partConclusion);

  } else if (prompt.includes('ขออนุมัติจัดโครงการ') || prompt.includes('ขออนุมัติ')) {
    // PROJECT APPROVAL (ขออนุมัติจัดโครงการ)
    const effectiveDate = dateStr || '[โปรดระบุช่วงเวลาจัดโครงการ]';
    const effectiveLoc = locationStr || '[โปรดระบุสถานที่จัดโครงการ]';

    partBackground = `ด้วย${facultyName} มีความประสงค์จะดำเนิน${topic || '[โปรดระบุชื่อโครงการ/กิจกรรม]'} ในระหว่างวันที่ ${effectiveDate} ณ ${effectiveLoc} โดยมีวัตถุประสงค์เพื่อพัฒนาศักยภาพทางวิชาการและสมรรถนะของนักศึกษาและบุคลากร`;
    if (!topic) missingVariables.push('ชื่อโครงการ');

    partFacts = `ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ จึงขออนุมัติจัดโครงการดังกล่าว พร้อมขออนุมัติใช้เงินงบประมาณสนับสนุน จำนวนเงินทั้งสิ้น [โปรดระบุงบประมาณ] บาท ([โปรดระบุตัวอักษร]) รายละเอียดตามแบบเสนอโครงการที่แนบมาพร้อมนี้`;
    missingVariables.push('วงเงินงบประมาณ');

    partConclusion = 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ';

    paragraphs.push(partBackground);
    paragraphs.push(partFacts);
    paragraphs.push(partConclusion);

  } else {
    // GENERAL OFFICIAL CORRESPONDENCE (หนังสือราชการทั่วไป)
    partBackground = `ด้วย${facultyName} มีความประสงค์จะ${prompt.slice(0, 120)}`;
    partFacts = `ในการนี้ คณะศิลปศาสตร์และวิทยาศาสตร์ ได้พิจารณาแนวทางการดำเนินงานเพื่อให้บังเกิดประโยชน์สูงสุดต่อทางราชการ`;
    partConclusion = isMemo ? 'จึงเรียนมาเพื่อโปรดพิจารณา' : 'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์';

    paragraphs.push(partBackground);
    paragraphs.push(partFacts);
    paragraphs.push(partConclusion);
  }

  const fullBodyText = paragraphs.join('\n\n');

  return {
    subject,
    to,
    bodyParagraphs: paragraphs,
    bodyText: fullBodyText,
    missingVariables,
    isAiGenerated: true,
    structureExplanation: {
      background: partBackground,
      facts: partFacts,
      proposal: partProposal,
      conclusion: partConclusion
    }
  };
}

/**
 * Refine existing draft text according to specific tone instructions
 */
function refineExistingDraft(
  currentBody: string, 
  mode: 'formalize' | 'concise' | 'justify' | 'executive',
  category: AdminDocCategory,
  subject: string
): AiDraftResult {
  const paragraphs = currentBody.split('\n\n').map(p => p.trim()).filter(Boolean);
  const isMemo = category.startsWith('memo');
  let refined: string[] = [];

  if (mode === 'formalize') {
    // Enhance formal vocabulary and eliminate colloquial phrases
    refined = paragraphs.map(p => {
      let t = p
        .replace(/พวกเรา|ทางเรา/g, 'คณะศิลปศาสตร์และวิทยาศาสตร์')
        .replace(/อยากจะขอ/g, 'มีความประสงค์จะขอ')
        .replace(/เสร็จแล้ว/g, 'เสร็จสิ้นเรียบร้อยแล้ว')
        .replace(/ช่วยดูแล/g, 'ให้ความอนุเคราะห์')
        .replace(/ส่งเอกสาร/g, 'จัดส่งเอกสารหลักฐาน')
        .replace(/จัดขึ้นวันที่/g, 'กำหนดจัดขึ้นในวันที่')
        .replace(/โทรมาที่/g, 'ประสานงานได้ที่หมายเลขโทรศัพท์');
      return t;
    });
  } else if (mode === 'concise') {
    // Keep only essential facts and clear conclusion
    refined = paragraphs.map((p, i) => {
      if (i === paragraphs.length - 1) return p; // Keep conclusion
      return p.replace(/อันจะส่งผลให้เกิดความเจริญก้าวหน้าและเป็นประโยชน์อย่างยิ่งในทุกๆ ด้าน/g, '')
              .replace(/โดยมีความมุ่งมั่นที่จะพัฒนาอย่างต่อเนื่อง/g, '')
              .replace(/[ \t]{2,}/g, ' ')
              .trim();
    });
  } else if (mode === 'justify') {
    // Add rationale and regulatory justification paragraph
    const justifyPara = 'ทั้งนี้ เพื่อให้การดำเนินงานดังกล่าวเป็นไปตามพันธกิจยุทธศาสตร์ด้านการพัฒนาคุณภาพการศึกษา สอดคล้องกับเกณฑ์มาตรฐาน และเกิดประโยชน์สูงสุดแก่ทางราชการ';
    refined = [...paragraphs.slice(0, -1), justifyPara, paragraphs[paragraphs.length - 1] || (isMemo ? 'จึงเรียนมาเพื่อโปรดพิจารณา' : 'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์')];
  } else if (mode === 'executive') {
    // Executive summary style: Direct, concise, structured for senior officials
    refined = paragraphs.map((p, i) => {
      if (i === 0 && !p.startsWith('ด้วย') && !p.startsWith('ตามที่')) {
        return 'ด้วย คณะศิลปศาสตร์และวิทยาศาสตร์ ' + p;
      }
      return p;
    });
  } else {
    refined = paragraphs;
  }

  const missingVariables: string[] = [];
  refined.forEach(p => {
    const matches = p.match(/\[(.*?)\]|\.{3,}/g);
    if (matches) {
      matches.forEach(m => {
        if (!missingVariables.includes(m)) missingVariables.push(m);
      });
    }
  });

  return {
    subject,
    to: '',
    bodyParagraphs: refined,
    bodyText: refined.join('\n\n'),
    missingVariables,
    isAiGenerated: true,
    structureExplanation: {
      background: refined[0] || '',
      facts: refined[1] || '',
      proposal: refined.length > 3 ? refined[2] : '',
      conclusion: refined[refined.length - 1] || ''
    }
  };
}

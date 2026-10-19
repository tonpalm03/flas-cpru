# Universal No-Code Document & ERP Architecture Specification
**คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยราชภัฏชัยภูมิ (FLAS-CPRU ERP)**
*บันทึกสถาปัตยกรรมระบบ วันที่ 8 ตุลาคม 2569*

---

## 1. บทนำและบริบทความต้องการ (Context & Problem Statement)

ในการบริหารงานคณะ ระบบสารบรรณและเอกสารราชการมีความสำคัญสูงสุด แต่ในอดีตมักพบปัญหาหลัก 3 ประการ:
1. **แบบฟอร์มแข็งเกินไป (Rigid Forms):** การกรอกผ่านช่อง Input Textbox ไม่สามารถสะท้อนการเคาะวรรค (2 เคาะ), ระยะเยื้องย่อหน้า (2.5 ซม.), หรือการตัดคำที่ถูกต้องตามระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖ ได้อย่างสมบูรณ์
2. **ภาระการบำรุงรักษาโค้ด (High Maintenance):** เมื่อหน่วยงานต้องการปรับเปลี่ยนข้อความแม่แบบ หรือต้องการเพิ่มเอกสารชนิดใหม่ (เช่น ประกาศคณะ, หนังสือมอบอำนาจ, ใบขอซื้อพัสดุ) ต้องตามโปรแกรมเมอร์มาแก้โค้ดทุกครั้ง
3. **ความกระจัดกระจายของเอกสารในแต่ละฝ่าย:** ฝ่ายพัสดุ การเงิน โครงการ และบุคคล ต่างออกเอกสารในรูปแบบของตนเอง ขาดเลขทะเบียนคุมและมาตรฐานแม่แบบกลาง

ระบบ **Universal No-Code Document & Registry Engine** ถูกสร้างขึ้นเพื่อแก้ปัญหานี้อย่างถาวร

---

## 2. เสาหลักทางสถาปัตยกรรม (Architectural Pillars)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 UNIVERSAL NO-CODE DOCUMENT & REGISTRY ENGINE                │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Word-like Live Canvas  │ 2. Dynamic Categories │ 3. Unified Registry   │
│     - ContentEditable 100% │    - No-Code Creator  │    - Auto-Sequence    │
│     - TH SarabunPSK 16pt   │    - Custom Numbering │    - Firestore Audit  │
│     - Garuda Customizer    │    - Module Linking   │    - Word & PDF Export│
└─────────────────────────────────────────────────────────────────────────────┘
```

### เสาหลักที่ 1: Word-Like Interactive Live Canvas
- ผู้ใช้คลิกพิมพ์บนแผ่นกระดาษ A4 / Letter เสมือนจริงได้โดยตรง
- ทุกตัวอักษรบนกระดาษ (รวมถึงคำว่า "ที่", "วันที่", "ส่วนราชการ", "เรื่อง", "เรียน", "ขอแสดงความนับถือ") สามารถแก้ไข ลบ หรือพิมพ์ใหม่ได้อย่างอิสระ
- ตราครุฑสามารถปรับตำแหน่ง (ซ้าย/กลาง/ซ่อน), ปรับขนาด (Pixel Slider), หรืออัปโหลดตราสัญลักษณ์ประจำคณะได้ทันที

### เสาหลักที่ 2: Dynamic Category & Master Template Storage
- ข้อมูลแม่แบบและโครงสร้างประเภทเอกสารเก็บใน Firestore Collection `admin_doc_categories`
- ผู้ดูแลระบบสามารถกด `+ เพิ่มประเภทเอกสารใหม่` แล้วกำหนดรูปแบบเลขรัน (เช่น `ประกาศที่ {seq}/{year}`) ได้เองจากหน้าเว็บ
- เมื่อบันทึกแล้ว เมนูใน Sidebar และหน้าสมุดทะเบียนออกเลขจะถูกสร้างขึ้นอัตโนมัติ

### เสาหลักที่ 3: Client-Side Processing & Zero Cloud Cost
- การแปลงและสร้างไฟล์ Word (`.docx`) ใช้ไลบรารี `docx` ฝั่ง Browser
- การพรีวิวและพิมพ์ PDF ใช้ CSS Print Engine ของ Browser
- ประหยัดค่าใช้จ่าย Cloud Server 100% และทำงานได้รวดเร็วทันใจ

---

## 3. แผนที่การนำไปใช้งานในแต่ละโมดูลของคณะ (Cross-Module Integration)

| ฝ่าย / โมดูล | รหัสหมวด (Category ID) | เอกสารที่ระบบรองรับ | รูปแบบเลขที่เริ่มต้น |
| :--- | :--- | :--- | :--- |
| **สารบรรณ (Admin)** | `memo`, `memo_circular`, `external`, `external_circular`, `order` | บันทึกข้อความ, หนังสือภายนอก, คำสั่ง | `อว ๐๖๔๖.๐๒/{seq}`, `ที่ {seq}/{year}` |
| **พัสดุ (Procurement)** | `procurement_pr`, `procurement_inspection` | ใบขอซื้อ/ขอจ้าง (PR), รายงานตรวจรับพัสดุ | `พสด. {seq}/{year}` |
| **การเงิน (Finance)** | `finance_loan`, `finance_receipt` | สัญญายืมเงินทดรองราชการ, ใบสำคัญรับเงิน | `กง. {seq}/{year}` |
| **โครงการ (Projects)** | `project_proposal`, `project_approval` | แบบเสนอโครงการยุทธศาสตร์, บันทึกขออนุมัติ | `กจ. {seq}/{year}` |
| **บุคคล (HR)** | `hr_leave_request`, `hr_employment_cert` | แบบใบลาพักผ่อน/ป่วย, หนังสือรับรองการทำงาน | `บค. {seq}/{year}` |

---

## 4. แหล่งอ้างอิงโค้ดและเครื่องมือ (Codebase References)

- **ตัวแก้ไขเสมือนจริง (Word Canvas):** [app/admin/templates/page.tsx](file:///d:/Faculty%20of%20Liberal%20Arts%20and%20Sciences/app/admin/templates/page.tsx)
- **เซอร์วิสจัดการแม่แบบและ Firestore:** [lib/adminCategoryService.ts](file:///d:/Faculty%20of%20Liberal%20Arts%20and%20Sciences/lib/adminCategoryService.ts)
- **เครื่องยนต์ส่งออก Word & พิมพ์ PDF:** [lib/adminDocument.ts](file:///d:/Faculty%20of%20Liberal%20Arts%20and%20Sciences/lib/adminDocument.ts)
- **สมุดทะเบียนและแบบฟอร์มออกเลข:** [components/AdminRegistryTable.tsx](file:///d:/Faculty%20of%20Liberal%20Arts%20and%20Sciences/components/AdminRegistryTable.tsx)
- **Dynamic Route Runner:** [app/admin/doc/[category]/page.tsx](file:///d:/Faculty%20of%20Liberal%20Arts%20and%20Sciences/app/admin/doc/[category]/page.tsx)

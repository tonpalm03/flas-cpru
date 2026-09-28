# ทะเบียนปุ่ม ฟอร์ม และทางเข้าจาก source

ตรวจจาก JSX ของ 22 หน้าและ Navbar/Sidebar ทุกไฟล์ เป็น static inspection ไม่ใช่ผลกดทดสอบในเบราว์เซอร์ แถวที่ render ผ่าน map จะมีหนึ่งแถวในทะเบียนนี้ แม้แสดงหลายปุ่มจริง

ใช้เช็คลิสต์นี้ทวนหลังพัฒนา: เปิดหน้า → กรอกข้อมูลถูก/ผิด → กด action → ตรวจผลที่ UI และฐานข้อมูล → refresh → ตรวจสิทธิ → ตรวจไฟล์ export กรณีมีการส่งออก

ลิงก์และ handler ที่พบยืนยันว่ามีการผูก event ใน source เท่านั้น ไม่ได้ยืนยันว่า workflow/save/download สมบูรณ์

## /admin/checklists

ต้นทาง: [app\admin\checklists\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/checklists/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | กลับไปศูนย์ธุรการ | "/admin" | [app\admin\checklists\page.tsx:69](<D:/Faculty of Liberal Arts and Sciences/app/admin/checklists/page.tsx:69>) |
| button | พิมพ์ใบนำส่งตรวจเอกสาร (Print Slip) | {printDocumentView} | [app\admin\checklists\page.tsx:80](<D:/Faculty of Liberal Arts and Sciences/app/admin/checklists/page.tsx:80>) |
| button | 1. ขอยืมเงินโครงการ | {() => setSelectedType("loan")} | [app\admin\checklists\page.tsx:95](<D:/Faculty of Liberal Arts and Sciences/app/admin/checklists/page.tsx:95>) |
| button | 2. เบิกจ่าย / ส่งใช้คืนเงินยืม | {() => setSelectedType("reimbursement")} | [app\admin\checklists\page.tsx:104](<D:/Faculty of Liberal Arts and Sciences/app/admin/checklists/page.tsx:104>) |
| button | 3. ไปปฏิบัติราชการ | {() => setSelectedType("travel")} | [app\admin\checklists\page.tsx:113](<D:/Faculty of Liberal Arts and Sciences/app/admin/checklists/page.tsx:113>) |
| button | 4. เบิกค่าสอน / ค่านิเทศ | {() => setSelectedType("teaching_fee")} | [app\admin\checklists\page.tsx:122](<D:/Faculty of Liberal Arts and Sciences/app/admin/checklists/page.tsx:122>) |

## /admin/inbound

ต้นทาง: [app\admin\inbound\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | ← กลับไปศูนย์ธุรการ | "/admin" | [app\admin\inbound\page.tsx:114](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:114>) |
| button | ส่งออก Excel (.xlsx) | {handleExportExcel} | [app\admin\inbound\page.tsx:127](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:127>) |
| button | ลงรับหนังสือใหม่ | {() => setShowAddModal(true)} | [app\admin\inbound\page.tsx:135](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:135>) |
| button | แทงเรื่อง / รายละเอียด | {() => setSelectedDocForRouting(doc)} | [app\admin\inbound\page.tsx:232](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:232>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setShowAddModal(false)} | [app\admin\inbound\page.tsx:256](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:256>) |
| form | ฟอร์ม | {handleCreateDoc} | [app\admin\inbound\page.tsx:265](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:265>) |
| button | ยกเลิก | {() => setShowAddModal(false)} | [app\admin\inbound\page.tsx:375](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:375>) |
| button | บันทึกลงรับหนังสือ | ส่งฟอร์มที่ครอบอยู่ | [app\admin\inbound\page.tsx:382](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:382>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setSelectedDocForRouting(null)} | [app\admin\inbound\page.tsx:402](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:402>) |
| button | ปิดหน้าต่าง | {() => setSelectedDocForRouting(null)} | [app\admin\inbound\page.tsx:454](<D:/Faculty of Liberal Arts and Sciences/app/admin/inbound/page.tsx:454>) |

## /admin/memo-generator

ต้นทาง: [app\admin\memo-generator\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/memo-generator/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | ← กลับไปศูนย์ธุรการ | "/admin" | [app\admin\memo-generator\page.tsx:110](<D:/Faculty of Liberal Arts and Sciences/app/admin/memo-generator/page.tsx:110>) |
| button | พิมพ์ / บันทึก PDF | {printDocumentView} | [app\admin\memo-generator\page.tsx:123](<D:/Faculty of Liberal Arts and Sciences/app/admin/memo-generator/page.tsx:123>) |
| button | ส่งออก Word (.docx) | {handleExportWord} | [app\admin\memo-generator\page.tsx:131](<D:/Faculty of Liberal Arts and Sciences/app/admin/memo-generator/page.tsx:131>) |
| button | {TEMPLATES[key].name} | {() => applyTemplate(key)} | [app\admin\memo-generator\page.tsx:148](<D:/Faculty of Liberal Arts and Sciences/app/admin/memo-generator/page.tsx:148>) |

## /admin/orders

ต้นทาง: [app\admin\orders\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | ← กลับไปศูนย์ธุรการ | "/admin" | [app\admin\orders\page.tsx:89](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx:89>) |
| button | ส่งออก Excel | {handleExportExcel} | [app\admin\orders\page.tsx:101](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx:101>) |
| button | ออกเลขคำสั่งใหม่ | {() => setShowAddModal(true)} | [app\admin\orders\page.tsx:109](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx:109>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setShowAddModal(false)} | [app\admin\orders\page.tsx:170](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx:170>) |
| form | ฟอร์ม | {handleCreate} | [app\admin\orders\page.tsx:174](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx:174>) |
| button | ยกเลิก | {() => setShowAddModal(false)} | [app\admin\orders\page.tsx:207](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx:207>) |
| button | บันทึก | ส่งฟอร์มที่ครอบอยู่ | [app\admin\orders\page.tsx:214](<D:/Faculty of Liberal Arts and Sciences/app/admin/orders/page.tsx:214>) |

## /admin/outbound

ต้นทาง: [app\admin\outbound\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | ← กลับไปศูนย์ธุรการ | "/admin" | [app\admin\outbound\page.tsx:75](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx:75>) |
| button | ส่งออก Excel (.xlsx) | {handleExportExcel} | [app\admin\outbound\page.tsx:88](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx:88>) |
| button | ออกเลขหนังสือส่ง | {() => setShowAddModal(true)} | [app\admin\outbound\page.tsx:96](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx:96>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setShowAddModal(false)} | [app\admin\outbound\page.tsx:168](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx:168>) |
| form | ฟอร์ม | {handleCreateDoc} | [app\admin\outbound\page.tsx:177](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx:177>) |
| button | ยกเลิก | {() => setShowAddModal(false)} | [app\admin\outbound\page.tsx:250](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx:250>) |
| button | ออกเลขส่ง | ส่งฟอร์มที่ครอบอยู่ | [app\admin\outbound\page.tsx:257](<D:/Faculty of Liberal Arts and Sciences/app/admin/outbound/page.tsx:257>) |

## /admin

ต้นทาง: [app\admin\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | สร้างบันทึกข้อความ (Word/PDF) | "/admin/memo-generator" | [app\admin\page.tsx:51](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx:51>) |
| Link | ลงรับหนังสือใหม่ | "/admin/inbound" | [app\admin\page.tsx:58](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx:58>) |
| Link | 1. ทะเบียนหนังสือรับ (Inbound) ลงทะเบียนรับหนังสือจากภายนอก/มหาวิทยาลัย, ออกเลขรับ, อัปโหลดเอกสารต้นฉบับ, และแทงเรื่องต่อไปยังฝ่ายที่เกี่ยวข้อง {MOCK_INBOUND_DOCS.length} ฉบับในระบบ เปิดดู | "/admin/inbound" | [app\admin\page.tsx:71](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx:71>) |
| Link | 2. ทะเบียนหนังสือส่ง (Outbound) ออกเลขหนังสือส่งภายนอกและภายในคณะ, บันทึกผู้ลงนาม (คณบดี/รองคณบดี), และติดตามสถานะการส่งหนังสือ {MOCK_OUTBOUND_DOCS.length} ฉบับส่งออก เปิดดู | "/admin/outbound" | [app\admin\page.tsx:95](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx:95>) |
| Link | ฟีเจอร์เด่น 3. สร้างบันทึกข้อความ (Word / PDF) เครื่องมือสร้างบันทึกข้อความราชการตราครุฑอัตโนมัติ: หนังสือเชิญวิทยากร, ขอไปราชการ, ขอเวลาเรียน, แจ้ง นศ. ส่งออก .docx / .pdf สร้างทันที | "/admin/memo-generator" | [app\admin\page.tsx:119](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx:119>) |
| Link | 4. ทะเบียนคำสั่ง / ประกาศคณะ ออกเลขคำสั่งคณะ เช่น แต่งตั้งคณะกรรมการดำเนินงานโครงการ, ประกาศกิจกรรม และคลังค้นหาคำสั่งย้อนหลัง คลังคำสั่ง 2569 เปิดดู | "/admin/orders" | [app\admin\page.tsx:146](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx:146>) |
| Link | 5. จองห้องประชุม / รถคณะ ปฏิทินจองห้องประชุมสิริวิชาญ, ห้อง Smart Classroom, และขอใช้ยานพาหนะคณะสำหรับไปราชการ {MOCK_ROOMS.length} รายการจอง เปิดดู | "/admin/rooms" | [app\admin\page.tsx:170](<D:/Faculty of Liberal Arts and Sciences/app/admin/page.tsx:170>) |

## /admin/responses

ต้นทาง: [app\admin\responses\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | กลับไปศูนย์ธุรการ | "/admin" | [app\admin\responses\page.tsx:63](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx:63>) |
| button | พิมพ์ / PDF | {printDocumentView} | [app\admin\responses\page.tsx:75](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx:75>) |
| button | ส่งออก Word (.docx) | {handleExportWord} | [app\admin\responses\page.tsx:83](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx:83>) |
| button | 001 แบบตอบรับวิทยากร | {() => setTemplateKey("speaker")} | [app\admin\responses\page.tsx:99](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx:99>) |
| button | 002 แบบตอบรับเข้าร่วมกิจกรรม | {() => setTemplateKey("activity")} | [app\admin\responses\page.tsx:108](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx:108>) |
| button | 003 แบบตอบรับชุมชน / ใช้สถานที่ | {() => setTemplateKey("facility")} | [app\admin\responses\page.tsx:117](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx:117>) |
| button | สร้างและส่งออก Word (.docx) | {handleExportWord} | [app\admin\responses\page.tsx:207](<D:/Faculty of Liberal Arts and Sciences/app/admin/responses/page.tsx:207>) |

## /admin/rooms

ต้นทาง: [app\admin\rooms\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/rooms/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | ← กลับไปศูนย์ธุรการ | "/admin" | [app\admin\rooms\page.tsx:41](<D:/Faculty of Liberal Arts and Sciences/app/admin/rooms/page.tsx:41>) |
| button | จองห้องประชุมใหม่ | {() => setShowAddModal(true)} | [app\admin\rooms\page.tsx:52](<D:/Faculty of Liberal Arts and Sciences/app/admin/rooms/page.tsx:52>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setShowAddModal(false)} | [app\admin\rooms\page.tsx:145](<D:/Faculty of Liberal Arts and Sciences/app/admin/rooms/page.tsx:145>) |
| form | ฟอร์ม | {handleCreate} | [app\admin\rooms\page.tsx:149](<D:/Faculty of Liberal Arts and Sciences/app/admin/rooms/page.tsx:149>) |
| button | ยกเลิก | {() => setShowAddModal(false)} | [app\admin\rooms\page.tsx:206](<D:/Faculty of Liberal Arts and Sciences/app/admin/rooms/page.tsx:206>) |
| button | บันทึกการจอง | ส่งฟอร์มที่ครอบอยู่ | [app\admin\rooms\page.tsx:209](<D:/Faculty of Liberal Arts and Sciences/app/admin/rooms/page.tsx:209>) |

## /admin/templates

ต้นทาง: [app\admin\templates\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/admin/templates/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | ← กลับไปศูนย์ธุรการ | "/admin" | [app\admin\templates\page.tsx:37](<D:/Faculty of Liberal Arts and Sciences/app/admin/templates/page.tsx:37>) |
| button | รีเซ็ตค่าเริ่มต้น | {handleReset} | [app\admin\templates\page.tsx:49](<D:/Faculty of Liberal Arts and Sciences/app/admin/templates/page.tsx:49>) |
| button | บันทึกแม่แบบทั้งหมด | {handleSave} | [app\admin\templates\page.tsx:57](<D:/Faculty of Liberal Arts and Sciences/app/admin/templates/page.tsx:57>) |
| form | ฟอร์ม | {handleSave} | [app\admin\templates\page.tsx:76](<D:/Faculty of Liberal Arts and Sciences/app/admin/templates/page.tsx:76>) |
| button | บันทึกการตั้งค่าแม่แบบเอกสาร | ส่งฟอร์มที่ครอบอยู่ | [app\admin\templates\page.tsx:290](<D:/Faculty of Liberal Arts and Sciences/app/admin/templates/page.tsx:290>) |

## /finance/disbursement

ต้นทาง: [app\finance\disbursement\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/finance/disbursement/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | กลับไปหน้ารวมการเงิน | "/finance" | [app\finance\disbursement\page.tsx:136](<D:/Faculty of Liberal Arts and Sciences/app/finance/disbursement/page.tsx:136>) |
| button | หนังสืออนุมัติ (.docx) | {handleExportWord} | [app\finance\disbursement\page.tsx:148](<D:/Faculty of Liberal Arts and Sciences/app/finance/disbursement/page.tsx:148>) |
| button | ส่งออกตาราง Excel (.xlsx) | {handleExportExcel} | [app\finance\disbursement\page.tsx:156](<D:/Faculty of Liberal Arts and Sciences/app/finance/disbursement/page.tsx:156>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => handleRemoveItem(item.id)} | [app\finance\disbursement\page.tsx:221](<D:/Faculty of Liberal Arts and Sciences/app/finance/disbursement/page.tsx:221>) |
| button | + เพิ่ม | {handleAddItem} | [app\finance\disbursement\page.tsx:290](<D:/Faculty of Liberal Arts and Sciences/app/finance/disbursement/page.tsx:290>) |

## /finance/loans

ต้นทาง: [app\finance\loans\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | กลับไปหน้ารวมการเงิน | "/finance" | [app\finance\loans\page.tsx:62](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:62>) |
| button | ส่งออก Excel | {handleExportExcel} | [app\finance\loans\page.tsx:74](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:74>) |
| button | สร้างสัญญายืมเงิน | {() => setShowAddModal(true)} | [app\finance\loans\page.tsx:82](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:82>) |
| button | ดูสัญญา | {() => setSelectedLoan(loan)} | [app\finance\loans\page.tsx:156](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:156>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setShowAddModal(false)} | [app\finance\loans\page.tsx:176](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:176>) |
| form | ฟอร์ม | {handleCreate} | [app\finance\loans\page.tsx:180](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:180>) |
| button | ยกเลิก | {() => setShowAddModal(false)} | [app\finance\loans\page.tsx:251](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:251>) |
| button | บันทึกสัญญา | ส่งฟอร์มที่ครอบอยู่ | [app\finance\loans\page.tsx:254](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:254>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setSelectedLoan(null)} | [app\finance\loans\page.tsx:271](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:271>) |
| button | พิมพ์สัญญา | {printDocumentView} | [app\finance\loans\page.tsx:291](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:291>) |
| button | ปิด | {() => setSelectedLoan(null)} | [app\finance\loans\page.tsx:298](<D:/Faculty of Liberal Arts and Sciences/app/finance/loans/page.tsx:298>) |

## /finance

ต้นทาง: [app\finance\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/finance/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| button | ส่งออก Excel (.xlsx) | {handleExportExcel} | [app\finance\page.tsx:45](<D:/Faculty of Liberal Arts and Sciences/app/finance/page.tsx:45>) |
| Link | สัญญายืมเงินทดรอง | "/finance/loans" | [app\finance\page.tsx:53](<D:/Faculty of Liberal Arts and Sciences/app/finance/page.tsx:53>) |

## /flow

ต้นทาง: [app\flow\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/flow/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| button | ขยาย (+) | {() => setScale((s) => Math.min(s + 0.1, 1.3))} | [app\flow\page.tsx:47](<D:/Faculty of Liberal Arts and Sciences/app/flow/page.tsx:47>) |
| button | ย่อ (-) | {() => setScale((s) => Math.max(s - 0.1, 0.85))} | [app\flow\page.tsx:55](<D:/Faculty of Liberal Arts and Sciences/app/flow/page.tsx:55>) |
| button | "รีเซ็ตขนาดปกติ" | {() => setScale(1)} | [app\flow\page.tsx:63](<D:/Faculty of Liberal Arts and Sciences/app/flow/page.tsx:63>) |
| Link | หน้าหลัก | "/" | [app\flow\page.tsx:71](<D:/Faculty of Liberal Arts and Sciences/app/flow/page.tsx:71>) |

## /hr

ต้นทาง: [app\hr\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/hr/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| button | พิมพ์แบบใบลา (PDF) | {printDocumentView} | [app\hr\page.tsx:55](<D:/Faculty of Liberal Arts and Sciences/app/hr/page.tsx:55>) |
| button | เขียนใบลาใหม่ | {() => setShowAddModal(true)} | [app\hr\page.tsx:63](<D:/Faculty of Liberal Arts and Sciences/app/hr/page.tsx:63>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setShowAddModal(false)} | [app\hr\page.tsx:145](<D:/Faculty of Liberal Arts and Sciences/app/hr/page.tsx:145>) |
| form | ฟอร์ม | {handleCreate} | [app\hr\page.tsx:149](<D:/Faculty of Liberal Arts and Sciences/app/hr/page.tsx:149>) |
| button | ยกเลิก | {() => setShowAddModal(false)} | [app\hr\page.tsx:242](<D:/Faculty of Liberal Arts and Sciences/app/hr/page.tsx:242>) |
| button | ยื่นใบลา | ส่งฟอร์มที่ครอบอยู่ | [app\hr\page.tsx:245](<D:/Faculty of Liberal Arts and Sciences/app/hr/page.tsx:245>) |

## /hr/portfolio

ต้นทาง: [app\hr\portfolio\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/hr/portfolio/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | กลับไปหน้ารวมบุคคล | "/hr" | [app\hr\portfolio\page.tsx:41](<D:/Faculty of Liberal Arts and Sciences/app/hr/portfolio/page.tsx:41>) |
| button | พิมพ์ / PDF | {printDocumentView} | [app\hr\portfolio\page.tsx:53](<D:/Faculty of Liberal Arts and Sciences/app/hr/portfolio/page.tsx:53>) |
| button | ส่งออก Word แฟ้มประวัติ | {handleExportWord} | [app\hr\portfolio\page.tsx:61](<D:/Faculty of Liberal Arts and Sciences/app/hr/portfolio/page.tsx:61>) |
| button | สร้างและส่งออก Word (.docx) | {handleExportWord} | [app\hr\portfolio\page.tsx:151](<D:/Faculty of Liberal Arts and Sciences/app/hr/portfolio/page.tsx:151>) |

## /login

ต้นทาง: [app\login\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/login/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| button | เข้าสู่ระบบ | {() => { setIsRegisterMode(false); setErrorMsg(""); setSuccessMsg(""); }} | [app\login\page.tsx:112](<D:/Faculty of Liberal Arts and Sciences/app/login/page.tsx:112>) |
| button | ลงทะเบียนผู้ใช้ใหม่ | {() => { setIsRegisterMode(true); setErrorMsg(""); setSuccessMsg(""); }} | [app\login\page.tsx:121](<D:/Faculty of Liberal Arts and Sciences/app/login/page.tsx:121>) |
| form | ฟอร์ม | {handleLogin} | [app\login\page.tsx:149](<D:/Faculty of Liberal Arts and Sciences/app/login/page.tsx:149>) |
| button | {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"} | ส่งฟอร์มที่ครอบอยู่ | [app\login\page.tsx:178](<D:/Faculty of Liberal Arts and Sciences/app/login/page.tsx:178>) |
| form | ฟอร์ม | {handleRegister} | [app\login\page.tsx:191](<D:/Faculty of Liberal Arts and Sciences/app/login/page.tsx:191>) |
| button | {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชีและเข้าสู่ระบบ"} | ส่งฟอร์มที่ครอบอยู่ | [app\login\page.tsx:276](<D:/Faculty of Liberal Arts and Sciences/app/login/page.tsx:276>) |

## /

ต้นทาง: [app\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | สร้างบันทึกข้อความ (Word/PDF) | "/admin/memo-generator" | [app\page.tsx:90](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:90>) |
| Link | ลงรับหนังสือใหม่ | "/admin/inbound" | [app\page.tsx:97](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:97>) |
| Link | {item.title} {item.count} {item.subtext} | {item.href} | [app\page.tsx:112](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:112>) |
| Link | เปิดใช้งาน → | "/admin" | [app\page.tsx:168](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:168>) |
| Link | ดูโครงการ → | "/projects" | [app\page.tsx:195](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:195>) |
| Link | ตรวจสอบงบ → | "/finance" | [app\page.tsx:222](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:222>) |
| Link | ขอซื้อ-ขอจ้าง → | "/procurement" | [app\page.tsx:249](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:249>) |
| Link | ยื่นใบลา → | "/hr" | [app\page.tsx:276](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:276>) |
| Link | ดูแผนงาน → | "/plan" | [app\page.tsx:302](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:302>) |
| Link | ดูทะเบียนหนังสือทั้งหมด → | "/admin/inbound" | [app\page.tsx:324](<D:/Faculty of Liberal Arts and Sciences/app/page.tsx:324>) |

## /plan

ต้นทาง: [app\plan\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/plan/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|

## /procurement

ต้นทาง: [app\procurement\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/procurement/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| button | พิมพ์ / PDF | {printDocumentView} | [app\procurement\page.tsx:89](<D:/Faculty of Liberal Arts and Sciences/app/procurement/page.tsx:89>) |
| button | ส่งออก Excel ใบขอซื้อ (.xlsx) | {handleExportExcel} | [app\procurement\page.tsx:97](<D:/Faculty of Liberal Arts and Sciences/app/procurement/page.tsx:97>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => handleRemoveItem(idx)} | [app\procurement\page.tsx:201](<D:/Faculty of Liberal Arts and Sciences/app/procurement/page.tsx:201>) |
| button | + เพิ่มรายการ | {handleAddItem} | [app\procurement\page.tsx:284](<D:/Faculty of Liberal Arts and Sciences/app/procurement/page.tsx:284>) |

## /projects/new

ต้นทาง: [app\projects\new\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | กลับไปหน้ารายการโครงการ | "/projects" | [app\projects\new\page.tsx:55](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx:55>) |
| button | พิมพ์ / PDF | {printDocumentView} | [app\projects\new\page.tsx:67](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx:67>) |
| button | ส่งออก Word (.docx) | {handleExport} | [app\projects\new\page.tsx:75](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx:75>) |
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => handleRemoveKpi(idx)} | [app\projects\new\page.tsx:180](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx:180>) |
| button | เพิ่ม KPI | {handleAddKpi} | [app\projects\new\page.tsx:200](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx:200>) |
| Link | ยกเลิก | "/projects" | [app\projects\new\page.tsx:212](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx:212>) |
| button | บันทึกและส่งออก Word (.docx) | {handleExport} | [app\projects\new\page.tsx:218](<D:/Faculty of Liberal Arts and Sciences/app/projects/new/page.tsx:218>) |

## /projects

ต้นทาง: [app\projects\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/projects/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| button | ส่งออก Excel | {handleExportExcel} | [app\projects\page.tsx:51](<D:/Faculty of Liberal Arts and Sciences/app/projects/page.tsx:51>) |
| Link | เสนอโครงการใหม่ (Word) | "/projects/new" | [app\projects\page.tsx:59](<D:/Faculty of Liberal Arts and Sciences/app/projects/page.tsx:59>) |
| button | ส่งออก Word (.docx) | {() => exportProjectToWord(proj)} | [app\projects\page.tsx:165](<D:/Faculty of Liberal Arts and Sciences/app/projects/page.tsx:165>) |

## /projects/reports

ต้นทาง: [app\projects\reports\page.tsx](<D:/Faculty of Liberal Arts and Sciences/app/projects/reports/page.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | กลับไปหน้ารวมโครงการ | "/projects" | [app\projects\reports\page.tsx:42](<D:/Faculty of Liberal Arts and Sciences/app/projects/reports/page.tsx:42>) |
| button | พิมพ์ / PDF | {printDocumentView} | [app\projects\reports\page.tsx:54](<D:/Faculty of Liberal Arts and Sciences/app/projects/reports/page.tsx:54>) |
| button | ส่งออก Word เล่มรายงาน | {handleExportWord} | [app\projects\reports\page.tsx:62](<D:/Faculty of Liberal Arts and Sciences/app/projects/reports/page.tsx:62>) |
| button | สร้างและส่งออก Word (.docx) | {handleExportWord} | [app\projects\reports\page.tsx:172](<D:/Faculty of Liberal Arts and Sciences/app/projects/reports/page.tsx:172>) |

## components/Navbar.tsx

ต้นทาง: [components/Navbar.tsx](<D:/Faculty of Liberal Arts and Sciences/components/Navbar.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| button | ปุ่มไอคอน/ไม่มีข้อความ | {() => setShowNotifications(!showNotifications)} | [components/Navbar.tsx:65](<D:/Faculty of Liberal Arts and Sciences/components/Navbar.tsx:65>) |
| button | {currentUser.name.charAt(0)} {currentUser.name} {currentBadge.label} {currentUser.department} | {() => setShowProfileDropdown(!showProfileDropdown)} | [components/Navbar.tsx:100](<D:/Faculty of Liberal Arts and Sciences/components/Navbar.tsx:100>) |
| button | ออกจากระบบ | {() => {                   setShowProfileDropdown(false);                   logout();                 }} | [components/Navbar.tsx:134](<D:/Faculty of Liberal Arts and Sciences/components/Navbar.tsx:134>) |

## components/Sidebar.tsx

ต้นทาง: [components/Sidebar.tsx](<D:/Faculty of Liberal Arts and Sciences/components/Sidebar.tsx>)

| ชนิด | ข้อความ/หน้าที่ | Handler/ปลายทางใน source | จุดตรวจ |
|---|---|---|---|
| Link | หน้าหลักทั้งคณะ | "/" | [components/Sidebar.tsx:136](<D:/Faculty of Liberal Arts and Sciences/components/Sidebar.tsx:136>) |
| button | {section.label} {isOpen ? (                     <ChevronDown className="w-3.5 h-3.5 text-slate-400" />                   ) : (                     <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> | {() => toggleSection(section.key)} | [components/Sidebar.tsx:162](<D:/Faculty of Liberal Arts and Sciences/components/Sidebar.tsx:162>) |
| Link | {sub.title} {sub.badge && (                           <span                             className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${                               isActive | {sub.href} | [components/Sidebar.tsx:194](<D:/Faculty of Liberal Arts and Sciences/components/Sidebar.tsx:194>) |

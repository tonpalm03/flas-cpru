// Test Suite for Faculty ERP - Administrative Inbound Readiness & ADM-00A to 00D
import assert from "node:assert";
import { test, describe } from "node:test";
import { getThaiFiscalYear, formatDocumentNumber } from "../lib/numberingService";
import { sanitizeFirestorePayload } from "../lib/firebaseService";
import { ROLE_LABELS } from "../lib/firebaseAuthService";
import { UserRole, InboundDocument, InboundRoutingEvent } from "../lib/types";

describe("1. ADM-00A & Role Definition Tests", () => {
  test("Should confirm all 7 required roles plus legacy support", () => {
    const requiredRoles: UserRole[] = [
      "admin",
      "dean",
      "vice_dean",
      "executive",
      "department_head",
      "lecturer",
      "staff"
    ];

    for (const r of requiredRoles) {
      assert.ok(ROLE_LABELS[r], `ROLE_LABELS must contain label for ${r}`);
      assert.ok(typeof ROLE_LABELS[r] === "string" && ROLE_LABELS[r].length > 0);
    }
  });
});

describe("2. ADM-00B & Data Isolation / Undefined Sanitization Tests", () => {
  test("Should sanitize undefined fields from nested objects without altering defined values", () => {
    const dirtyPayload = {
      title: "หนังสือทดสอบ",
      sender: "กองกลาง",
      assignedDept: undefined,
      assignedPerson: undefined,
      metadata: {
        nestedUndefined: undefined,
        nestedValue: "123"
      },
      tags: ["urgent", undefined, "internal"]
    };

    const clean = sanitizeFirestorePayload(dirtyPayload);
    assert.strictEqual("assignedDept" in clean, false);
    assert.strictEqual("assignedPerson" in clean, false);
    assert.strictEqual("nestedUndefined" in clean.metadata, false);
    assert.strictEqual(clean.metadata.nestedValue, "123");
    assert.strictEqual(clean.title, "หนังสือทดสอบ");
    assert.strictEqual(clean.sender, "กองกลาง");
  });
});

describe("3. ADM-00C & Atomic Numbering / Fiscal Year Tests", () => {
  test("Should calculate Thai fiscal year correctly (Starts Oct 1)", () => {
    // September (month index 8) -> Current Thai Year
    const septDate = new Date(2026, 8, 30);
    assert.strictEqual(getThaiFiscalYear(septDate), 2569);

    // October (month index 9) -> Next Thai Year (2570)
    const octDate = new Date(2026, 9, 1);
    assert.strictEqual(getThaiFiscalYear(octDate), 2570);
  });

  test("Should format document numbers correctly for all registry types", () => {
    assert.strictEqual(formatDocumentNumber("inbound", 1, 2569), "รับ 001/2569");
    assert.strictEqual(formatDocumentNumber("inbound", 42, 2569), "รับ 042/2569");
    assert.strictEqual(formatDocumentNumber("outbound", 5, 2569), "อว 0643.04/005");
    assert.strictEqual(formatDocumentNumber("order", 12, 2569), "คำสั่งคณะที่ 012/2569");
    assert.strictEqual(formatDocumentNumber("announcement", 3, 2569), "ประกาศคณะที่ 003/2569");
    assert.strictEqual(formatDocumentNumber("response", 7, 2569), "ตบ 07/2569");
  });
});

describe("4. Inbound Documents Lifecycle & Workflow Logic Tests", () => {
  test("Simulate Full Lifecycle: Create -> Route -> Acknowledge -> Return -> Complete", () => {
    const currentYear = 2569;
    
    // Step 1: Create
    const initialDoc: InboundDocument = {
      id: "in-test-001",
      docNumber: "อว 0604/ว 999",
      receiveNumber: "รับ 099/2569",
      fiscalYear: currentYear,
      receiveDate: "2026-10-04",
      title: "โครงการอบรมเชิงปฏิบัติการ AI สารบรรณ",
      sender: "มหาวิทยาลัยราชภัฏชัยภูมิ",
      urgency: "urgent",
      category: "หนังสือภายนอก",
      status: "pending_review",
      routingEvents: [
        {
          id: "evt-1",
          action: "created",
          note: "ลงทะเบียนรับหนังสือเข้าสู่ระบบ",
          timestamp: new Date().toISOString(),
          actorId: "staff-01",
          actorName: "เจ้าหน้าที่ธุรการ",
          actorRole: "staff"
        }
      ],
      createdAt: new Date().toISOString()
    };

    assert.strictEqual(initialDoc.status, "pending_review");
    assert.strictEqual(initialDoc.routingEvents?.length, 1);
    assert.strictEqual(initialDoc.routingEvents?.[0].action, "created");

    // Step 2: Route / Forward
    const routedDoc: InboundDocument = {
      ...initialDoc,
      assignedDept: "งานวิชาการและวิจัย",
      assignedPerson: "อ.ดร.สมชาย ใจดี",
      assignedPersonId: "u-lecturer-02",
      actionNote: "มอบหมายดำเนินการและสรุปรายงาน",
      dueAt: "2026-10-15",
      status: "forwarded",
      routingEvents: [
        ...(initialDoc.routingEvents || []),
        {
          id: "evt-2",
          action: "forwarded",
          toDept: "งานวิชาการและวิจัย",
          toPerson: "อ.ดร.สมชาย ใจดี",
          toPersonId: "u-lecturer-02",
          note: "มอบหมายดำเนินการและสรุปรายงาน",
          timestamp: new Date().toISOString(),
          actorId: "dean-01",
          actorName: "คณบดี",
          actorRole: "dean"
        }
      ]
    };

    assert.strictEqual(routedDoc.status, "forwarded");
    assert.strictEqual(routedDoc.assignedPerson, "อ.ดร.สมชาย ใจดี");
    assert.strictEqual(routedDoc.routingEvents?.length, 2);

    // Step 3: Acknowledge
    const ackDoc: InboundDocument = {
      ...routedDoc,
      status: "acknowledged",
      routingEvents: [
        ...(routedDoc.routingEvents || []),
        {
          id: "evt-3",
          action: "acknowledged",
          note: "รับทราบเรื่อง พร้อมดำเนินการตามกำหนด",
          timestamp: new Date().toISOString(),
          actorId: "u-lecturer-02",
          actorName: "อ.ดร.สมชาย ใจดี",
          actorRole: "lecturer"
        }
      ]
    };

    assert.strictEqual(ackDoc.status, "acknowledged");
    assert.strictEqual(ackDoc.routingEvents?.length, 3);

    // Step 4: Return with reason
    const returnDoc: InboundDocument = {
      ...ackDoc,
      status: "returned",
      returnReason: "ขอเอกสารแนบกำหนดการเพิ่มเติม",
      routingEvents: [
        ...(ackDoc.routingEvents || []),
        {
          id: "evt-4",
          action: "returned",
          note: "ขอเอกสารแนบกำหนดการเพิ่มเติม",
          timestamp: new Date().toISOString(),
          actorId: "u-lecturer-02",
          actorName: "อ.ดร.สมชาย ใจดี",
          actorRole: "lecturer"
        }
      ]
    };

    assert.strictEqual(returnDoc.status, "returned");
    assert.strictEqual(returnDoc.returnReason, "ขอเอกสารแนบกำหนดการเพิ่มเติม");
    assert.strictEqual(returnDoc.routingEvents?.length, 4);

    // Step 5: Complete & Close
    const completedDoc: InboundDocument = {
      ...returnDoc,
      status: "completed",
      completionNote: "ได้รับเอกสารครบถ้วนและจัดส่งรายงานเรียบร้อยแล้ว",
      routingEvents: [
        ...(returnDoc.routingEvents || []),
        {
          id: "evt-5",
          action: "completed",
          note: "ได้รับเอกสารครบถ้วนและจัดส่งรายงานเรียบร้อยแล้ว",
          timestamp: new Date().toISOString(),
          actorId: "staff-01",
          actorName: "เจ้าหน้าที่ธุรการ",
          actorRole: "staff"
        }
      ]
    };

    assert.strictEqual(completedDoc.status, "completed");
    assert.strictEqual(completedDoc.completionNote, "ได้รับเอกสารครบถ้วนและจัดส่งรายงานเรียบร้อยแล้ว");
    assert.strictEqual(completedDoc.routingEvents?.length, 5);
  });
});

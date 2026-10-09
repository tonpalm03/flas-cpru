"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Template Studio ถูกถอดออกตาม AGENTS.md
 * แม่แบบเอกสารทั้ง 5 ประเภทถูกกำหนดคงที่ในโค้ด (lib/adminDocument.ts)
 * ผู้ใช้แก้ไขข้อมูลผ่านแบบฟอร์มในหน้าทะเบียนแต่ละประเภทแทน
 */
export default function TemplatesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
      <p>กำลังนำทางไปยังศูนย์ธุรการ...</p>
    </div>
  );
}

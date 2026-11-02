"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import PlanWizard from "@/components/plan/PlanWizard";
import { getPlanProject } from "@/lib/planService";
import { canEditPlan, type PlanProject } from "@/lib/planModel";

function EditInner() {
  const id = useSearchParams().get("id");
  const { currentUser } = useRole();
  const [project, setProject] = useState<PlanProject | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "locked">(id ? "loading" : "ready");
  // โครงการที่เพิ่งสร้างในหน้านี้: URL ได้ id แล้ว แต่ไม่ต้องโหลดใหม่ (ไม่ให้ฟอร์มกลับไปขั้นที่ 1)
  const createdHere = useRef<string | null>(null);

  useEffect(() => {
    if (id && id === createdHere.current) return;
    if (!id) {
      setProject(null);
      setState("ready");
      return;
    }
    let alive = true;
    setState("loading");
    getPlanProject(id, currentUser).then(p => {
      if (!alive) return;
      setProject(p);
      setState(!p ? "missing" : canEditPlan(currentUser, p) ? "ready" : "locked");
    });
    return () => {
      alive = false;
    };
    // โหลดใหม่เมื่อเปลี่ยนผู้ใช้เท่านั้น ไม่ใช่ทุกครั้งที่โปรไฟล์รีเฟรช (ฟอร์มที่กำลังกรอกจะหาย)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser?.id]);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>กำลังโหลดโครงการ...</span>
      </div>
    );
  }
  if (state === "missing" || state === "locked") {
    return (
      <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <p className="text-sm text-slate-700">
          {state === "missing" ? "ไม่พบโครงการนี้ หรือคุณไม่มีสิทธิ์เปิด" : "โครงการนี้แก้ไขไม่ได้ในสถานะปัจจุบัน"}
        </p>
        <Link href={project ? `/projects/view/?id=${project.id}` : "/projects/"} className="text-xs font-semibold text-blue-900 hover:underline">
          กลับไปหน้าโครงการ
        </Link>
      </div>
    );
  }
  return (
    <PlanWizard
      key={project?.id || "new"}
      project={project}
      onCreated={newId => {
        createdHere.current = newId;
        window.history.replaceState(null, "", `/projects/edit/?id=${newId}`);
      }}
    />
  );
}

export default function PlanEditPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลด...</div>}>
      <EditInner />
    </Suspense>
  );
}

"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DynamicAdminDocClient from "./[category]/DynamicAdminDocClient";

function DocPageInner() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category") || "memo";
  return <DynamicAdminDocClient categoryId={categoryId} />;
}

export default function GenericDocPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลด...</div>}>
      <DocPageInner />
    </Suspense>
  );
}

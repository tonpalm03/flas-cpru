"use client";

import React from "react";
import AdminRegistryTable from "@/components/AdminRegistryTable";

export default function AdminMemoCircularPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AdminRegistryTable
        category="memo_circular"
        categoryTitle="บันทึกข้อความ (ว)"
        categorySubtitle="สมุดทะเบียนคุมบันทึกข้อความเวียนภายในคณะและสาขาวิชา"
        badgeColor="emerald"
      />
    </div>
  );
}

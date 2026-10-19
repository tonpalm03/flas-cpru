"use client";

import React from "react";
import AdminRegistryTable from "@/components/AdminRegistryTable";

export default function AdminMemoPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AdminRegistryTable
        category="memo"
        categoryTitle="บันทึกข้อความ"
        categorySubtitle="สมุดทะเบียนคุมบันทึกข้อความภายในคณะศิลปศาสตร์และวิทยาศาสตร์"
        badgeColor="sky"
      />
    </div>
  );
}

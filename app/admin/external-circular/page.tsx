"use client";

import React from "react";
import AdminRegistryTable from "@/components/AdminRegistryTable";

export default function AdminExternalCircularPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AdminRegistryTable
        category="external_circular"
        categoryTitle="หนังสือภายนอก (ว)"
        categorySubtitle="สมุดทะเบียนคุมหนังสือส่งออกภายนอกแบบเวียนหลายหน่วยงาน/ผู้รับ"
        badgeColor="purple"
      />
    </div>
  );
}

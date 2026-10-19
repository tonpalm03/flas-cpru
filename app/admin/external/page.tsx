"use client";

import React from "react";
import AdminRegistryTable from "@/components/AdminRegistryTable";

export default function AdminExternalPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AdminRegistryTable
        category="external"
        categoryTitle="หนังสือภายนอก"
        categorySubtitle="สมุดทะเบียนคุมหนังสือส่งออกภายนอกคณะศิลปศาสตร์และวิทยาศาสตร์"
        badgeColor="blue"
      />
    </div>
  );
}

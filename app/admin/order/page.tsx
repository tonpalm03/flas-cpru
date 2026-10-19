"use client";

import React from "react";
import AdminRegistryTable from "@/components/AdminRegistryTable";

export default function AdminOrderPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AdminRegistryTable
        category="order"
        categoryTitle="คำสั่ง"
        categorySubtitle="สมุดทะเบียนคุมคำสั่งคณะศิลปศาสตร์และวิทยาศาสตร์"
        badgeColor="emerald"
      />
    </div>
  );
}

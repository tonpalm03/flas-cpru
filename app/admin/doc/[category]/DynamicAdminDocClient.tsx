"use client";

import React, { useEffect, useState } from "react";
import AdminRegistryTable from "@/components/AdminRegistryTable";
import { getCategoryById } from "@/lib/adminCategoryService";
import type { AdminDocCategoryConfig } from "@/lib/types";

export default function DynamicAdminDocClient({ categoryId }: { categoryId: string }) {
  const [config, setConfig] = useState<AdminDocCategoryConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const cfg = await getCategoryById(categoryId);
        setConfig(cfg);
      } catch (e) {
        console.error("Failed to load category:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400 text-sm">
        กำลังโหลดสมุดทะเบียน...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AdminRegistryTable
        category={categoryId}
        categoryTitle={config?.title || categoryId}
        categorySubtitle={config?.subtitle || `สมุดทะเบียนคุม${config?.title || categoryId}`}
        badgeColor="indigo"
      />
    </div>
  );
}

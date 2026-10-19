"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ChevronDown, 
  ChevronRight, 
  GraduationCap
} from "lucide-react";
import { useRole } from "./RoleContext";
import { ADMIN_MODULES } from "@/lib/modulePermissionService";
import { DynamicNavIcon } from "./DynamicNavIcon";
import { getNavigationLayout, DEFAULT_NAVIGATION_SECTIONS } from "@/lib/navigationService";
import { getAdminCategories } from "@/lib/adminCategoryService";
import { NavSection, NavItem } from "@/lib/navigationTypes";
import type { AdminDocCategoryConfig } from "@/lib/types";

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useRole();
  const [sections, setSections] = useState<NavSection[]>(DEFAULT_NAVIGATION_SECTIONS);
  const [customCategories, setCustomCategories] = useState<AdminDocCategoryConfig[]>([]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    admin: true,
    projects: true,
    finance: true,
    procurement: false,
    hr: false,
    settings: true
  });

  // Load layout and subscribe to updates
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const layout = await getNavigationLayout();
        if (mounted) setSections(layout);
      } catch (err) {
        console.error("Sidebar load navigation error:", err);
      }
    };

    loadData();

    // Listen for instant cross-component updates from Navigation Studio
    const handleNavUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<NavSection[]>;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setSections(customEvt.detail);
      } else {
        loadData();
      }
    };

    window.addEventListener("flas_navigation_updated", handleNavUpdated);
    window.addEventListener("storage", loadData);

    return () => {
      mounted = false;
      window.removeEventListener("flas_navigation_updated", handleNavUpdated);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  // Load dynamic document categories
  useEffect(() => {
    getAdminCategories()
      .then((cats) => {
        const customOnes = cats.filter((c) => !c.isBuiltIn && c.isActive);
        setCustomCategories(customOnes);
      })
      .catch(() => {});
  }, [pathname]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-sm flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-blue-100" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-semibold text-sm text-slate-900 truncate leading-tight">
            คณะศิลปศาสตร์ฯ
          </h1>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            ระบบบริหารงานคณะ (ERP)
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {/* Main Portal Dashboard Link */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/"
              ? "bg-blue-50 text-blue-900 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Home className={`w-4 h-4 ${pathname === "/" ? "text-blue-700" : "text-slate-400"}`} />
          <span>หน้าหลักทั้งคณะ</span>
        </Link>

        <div className="pt-2 pb-1 px-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            โมดูลงานในคณะ
          </p>
        </div>

        {/* Dynamic Modules List */}
        {sections
          .filter((section) => section.isVisible)
          .map((section) => {
            const isOpen = openSections[section.key] ?? false;

            // Merge dynamic custom categories into the admin section if present
            let subItemsToRender: Array<{ id?: string; title: string; href: string; badge?: string }> = [
              ...(section.subItems || [])
            ];

            // เมนูโมดูลธุรการที่กำหนดในโค้ด: แสดงเสมอแม้ผังเมนูที่บันทึกไว้เดิมยังไม่มี
            if (section.key === "admin") {
              for (const mod of ADMIN_MODULES) {
                if (!subItemsToRender.some((s) => s.href === mod.href)) {
                  subItemsToRender.push({ id: `mod_${mod.key}`, title: mod.title, href: mod.href });
                }
              }
            }

            if (section.key === "admin" && customCategories.length > 0) {
              const customCategoryLinks = customCategories.map((c) => ({
                id: `dyn_${c.id}`,
                title: c.title,
                href: `/admin/doc/${c.id}`,
                badge: "ใหม่"
              }));
              subItemsToRender.push(...customCategoryLinks);
            }

            const hasActiveChild = subItemsToRender.some((sub) => pathname === sub.href);

            return (
              <div key={section.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasActiveChild
                      ? "bg-blue-50/70 text-blue-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DynamicNavIcon
                      name={section.iconName}
                      className={`w-4 h-4 flex-shrink-0 ${
                        hasActiveChild ? "text-blue-700" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{section.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Sub items */}
                {isOpen && (
                  <div className="pl-6 pr-1 space-y-0.5">
                    {subItemsToRender.map((sub, idx) => {
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.id || `${sub.href}_${idx}`}
                          href={sub.href}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-blue-900 text-white shadow-sm font-medium"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <span className="truncate">{sub.title}</span>
                          {sub.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                                isActive
                                  ? "bg-white text-blue-900"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            เชื่อมต่อ Cloud Firestore
          </span>
          <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
}

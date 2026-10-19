"use client";

import React from "react";
import {
  FileText,
  Inbox,
  Send,
  BookmarkCheck,
  FileCheck,
  ClipboardList,
  FolderKanban,
  LineChart,
  BarChart3,
  Layers,
  Wallet,
  Package,
  CheckSquare,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  CalendarDays,
  Megaphone,
  Globe,
  Building2,
  ShieldCheck,
  Sparkles,
  Settings,
  Home,
  FileEdit,
  Folder,
  Briefcase,
  LayoutGrid
} from "lucide-react";

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Inbox,
  Send,
  BookmarkCheck,
  FileCheck,
  ClipboardList,
  FolderKanban,
  LineChart,
  BarChart3,
  Layers,
  Wallet,
  Package,
  CheckSquare,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  CalendarDays,
  Megaphone,
  Globe,
  Building2,
  ShieldCheck,
  Sparkles,
  Settings,
  Home,
  FileEdit,
  Folder,
  Briefcase,
  LayoutGrid
};

interface DynamicNavIconProps {
  name?: string;
  className?: string;
  fallback?: React.ComponentType<{ className?: string }>;
}

export function DynamicNavIcon({ name, className = "w-4 h-4", fallback: Fallback = Layers }: DynamicNavIconProps) {
  if (!name) return <Fallback className={className} />;
  const IconComponent = ICON_MAP[name] || Fallback;
  return <IconComponent className={className} />;
}

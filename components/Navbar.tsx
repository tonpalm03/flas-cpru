"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Calendar,
  LogOut,
  User,
  Building2,
  Mail,
  FileText,
  FolderKanban,
  Wallet,
  Package,
  CalendarDays,
  Check,
  X,
  Clock,
  ExternalLink
} from "lucide-react";
import { useRole } from "./RoleContext";
import { 
  UserRole, 
  AppNotification, 
  InboundDocument, 
  ProjectProposal, 
  LoanContract, 
  PurchaseRequisition, 
  LeaveRequest 
} from "@/lib/types";
import { 
  getAppNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getInboundDocs,
  getProjects,
  getFinanceLoans,
  getProcurementPRs,
  getHRLeaves
} from "@/lib/firebaseService";

interface SearchResultItem {
  id: string;
  category: "admin" | "projects" | "finance" | "procurement" | "hr";
  categoryLabel: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function Navbar() {
  const router = useRouter();
  const { currentUser, logout } = useRole();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const list = await getAppNotifications(currentUser.id, currentUser.role);
      setNotifications(list);
    } catch (e) {
      console.warn("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle Mark Read
  const handleMarkAsRead = async (id: string, href?: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (href) {
      setShowNotifications(false);
      router.push(href);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(currentUser?.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle Global Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [inbound, projects, loans, prs, leaves] = await Promise.all([
          getInboundDocs(),
          getProjects(),
          getFinanceLoans(),
          getProcurementPRs(),
          getHRLeaves()
        ]);

        const query = searchQuery.toLowerCase();
        const results: SearchResultItem[] = [];

        // Search in Inbound Docs
        inbound.forEach(doc => {
          if (doc.title.toLowerCase().includes(query) || doc.docNumber.toLowerCase().includes(query) || (doc.sender && doc.sender.toLowerCase().includes(query))) {
            results.push({
              id: doc.id,
              category: "admin",
              categoryLabel: "หนังสือราชการ",
              title: `${doc.docNumber} - ${doc.title}`,
              subtitle: `จาก: ${doc.sender || "ไม่ระบุ"} (${doc.receiveDate})`,
              href: `/admin/inbound`
            });
          }
        });

        // Search in Projects
        projects.forEach(proj => {
          if (proj.title.toLowerCase().includes(query) || proj.code.toLowerCase().includes(query) || proj.leader.toLowerCase().includes(query)) {
            results.push({
              id: proj.id,
              category: "projects",
              categoryLabel: "โครงการยุทธศาสตร์",
              title: `${proj.code} : ${proj.title}`,
              subtitle: `หัวหน้า: ${proj.leader} (${proj.budgetApproved.toLocaleString()} บาท)`,
              href: `/projects`
            });
          }
        });

        // Search in Loans
        loans.forEach(loan => {
          if (loan.contractNumber.toLowerCase().includes(query) || loan.borrowerName.toLowerCase().includes(query) || loan.purpose.toLowerCase().includes(query)) {
            results.push({
              id: loan.id,
              category: "finance",
              categoryLabel: "สัญญายืมเงิน",
              title: `${loan.contractNumber} : ${loan.borrowerName}`,
              subtitle: `${loan.purpose} (${loan.amount.toLocaleString()} บาท)`,
              href: `/finance/loans`
            });
          }
        });

        // Search in PRs
        prs.forEach(pr => {
          if (pr.prNumber.toLowerCase().includes(query) || pr.projectName.toLowerCase().includes(query) || pr.requesterName.toLowerCase().includes(query)) {
            results.push({
              id: pr.id,
              category: "procurement",
              categoryLabel: "ขอซื้อขอจ้าง",
              title: `${pr.prNumber} : ${pr.projectName}`,
              subtitle: `ผู้ขอ: ${pr.requesterName} (${pr.netTotalAmount.toLocaleString()} บาท)`,
              href: `/procurement`
            });
          }
        });

        // Search in Leaves
        leaves.forEach(lv => {
          if (lv.staffName.toLowerCase().includes(query) || (lv.requestNumber && lv.requestNumber.toLowerCase().includes(query)) || lv.reason.toLowerCase().includes(query)) {
            results.push({
              id: lv.id,
              category: "hr",
              categoryLabel: "การลาบุคลากร",
              title: `${lv.requestNumber || "ใบลา"} : ${lv.staffName}`,
              subtitle: `${lv.reason} (${lv.startDate} ถึง ${lv.endDate})`,
              href: `/hr`
            });
          }
        });

        setSearchResults(results.slice(0, 8)); // Top 8 results
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return { label: "แอดมิน / ธุรการ", style: "bg-blue-100 text-blue-900 border-blue-200 font-bold" };
      case "dean":
        return { label: "คณบดี", style: "bg-indigo-100 text-indigo-900 border-indigo-200 font-bold" };
      case "lecturer":
        return { label: "อาจารย์", style: "bg-slate-100 text-slate-800 border-slate-300" };
      case "staff_finance":
        return { label: "เจ้าหน้าที่การเงิน", style: "bg-amber-100 text-amber-900 border-amber-200" };
      case "staff_procurement":
        return { label: "เจ้าหน้าที่พัสดุ", style: "bg-orange-100 text-orange-900 border-orange-200" };
      case "staff_hr":
        return { label: "เจ้าหน้าที่บุคคล", style: "bg-purple-100 text-purple-900 border-purple-200" };
      case "staff_plan":
        return { label: "เจ้าหน้าที่แผน", style: "bg-emerald-100 text-emerald-900 border-emerald-200" };
      case "gov_officer":
        return { label: "พนักงานราชการ", style: "bg-slate-100 text-slate-800 border-slate-300" };
      default:
        return { label: "บุคลากร", style: "bg-slate-100 text-slate-800 border-slate-300" };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search Input */}
      <div className="flex items-center gap-3 w-80 md:w-96 relative" ref={searchRef}>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาด่วน (หนังสือ, โครงการ, เงินยืม, พัสดุ, การลา)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-11 left-0 w-full md:w-[480px] bg-white border border-slate-200 rounded-2xl shadow-float p-2 z-50 animate-in fade-in zoom-in-95 max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">ผลการค้นหา ({searchResults.length} รายการ)</span>
              {isSearching && <span className="text-[10px] text-blue-900 animate-pulse">กำลังค้นหา...</span>}
            </div>

            {searchResults.length === 0 && !isSearching ? (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่พบข้อมูลที่ตรงกับคำค้นหา "{searchQuery}"
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {searchResults.map((item) => (
                  <button
                    key={`${item.category}-${item.id}`}
                    type="button"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      setSearchQuery("");
                      router.push(item.href);
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex items-start gap-2.5 group"
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-900 transition-colors">
                      {item.category === "admin" ? <FileText className="w-3.5 h-3.5" /> :
                       item.category === "projects" ? <FolderKanban className="w-3.5 h-3.5" /> :
                       item.category === "finance" ? <Wallet className="w-3.5 h-3.5" /> :
                       item.category === "procurement" ? <Package className="w-3.5 h-3.5" /> :
                       <CalendarDays className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded">
                          {item.categoryLabel}
                        </span>
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-900 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Fiscal Year Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-blue-900" />
          <span>ปีงบประมาณ พ.ศ. 2569</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2 h-2 bg-blue-900 rounded-full absolute top-2 right-2 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-float p-3 z-50 animate-in fade-in zoom-in-95 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">
                  การแจ้งเตือน ({unreadCount} รายการใหม่)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-900 hover:underline font-semibold"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 py-1 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    ไม่มีการแจ้งเตือนในขณะนี้
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id, notif.linkHref)}
                      className={`p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                        !notif.read ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !notif.read ? "bg-blue-900" : "bg-transparent"
                      }`} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${!notif.read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-900 hover:bg-slate-50 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser.name}
                </p>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentBadge.style}`}>
                  {currentBadge.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[160px]">
                {currentUser.department}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-float p-3 z-50 animate-in fade-in zoom-in-95 space-y-3 text-xs">
              <div className="pb-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.roleTitle}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{currentUser.email}</p>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileDropdown(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

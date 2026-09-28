"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserProfile, UserRole } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mockData";
import { logoutUser } from "@/lib/firebaseAuthService";

export type ViewMode = "admin_only" | "full_suite";

interface RoleContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  switchRole: (role: UserRole) => void;
  allUsers: UserProfile[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>("full_suite");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local session
    const savedUser = localStorage.getItem("faculty_erp_current_user");
    const savedMode = localStorage.getItem("faculty_erp_view_mode") as ViewMode;

    if (savedMode) {
      setViewModeState(savedMode);
    }

    if (savedUser) {
      try {
        setCurrentUserState(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("faculty_erp_current_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Auth Guard: If not logged in and on a protected internal route, redirect to /login
  useEffect(() => {
    if (!isLoading) {
      const isPublic = 
        pathname === "/" || 
        pathname === "" || 
        pathname === "/index.html" || 
        pathname === "/login" || 
        pathname === "/login/" || 
        pathname?.startsWith("/login") || 
        pathname === "/flow" || 
        pathname === "/flow/" || 
        pathname?.startsWith("/flow");

      if (!currentUser && !isPublic) {
        router.replace("/login");
      }
    }
  }, [currentUser, pathname, isLoading, router]);

  const setCurrentUser = (user: UserProfile | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("faculty_erp_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("faculty_erp_current_user");
    }
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem("faculty_erp_view_mode", mode);
  };

  const toggleViewMode = () => {
    const next = viewMode === "admin_only" ? "full_suite" : "admin_only";
    setViewMode(next);
  };

  const switchRole = (role: UserRole) => {
    const found = MOCK_USERS.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    router.replace("/login");
  };

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        allUsers: MOCK_USERS,
        viewMode,
        setViewMode,
        toggleViewMode,
        logout,
        isLoggedIn: Boolean(currentUser),
        isLoading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mockData";

export type ViewMode = "admin_only" | "full_suite";

interface RoleContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  allUsers: UserProfile[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  // Default to Admin / ธุรการ
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]);
  const [viewMode, setViewModeState] = useState<ViewMode>("full_suite");

  useEffect(() => {
    const savedMode = localStorage.getItem("faculty_erp_view_mode") as ViewMode;
    if (savedMode) {
      setViewModeState(savedMode);
    }
  }, []);

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

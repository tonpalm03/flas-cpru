"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserProfile, UserRole } from "@/lib/types";
import { logoutUser, subscribeToAuthChanges } from "@/lib/firebaseAuthService";

interface RoleContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isDean: boolean;
  isFinance: boolean;
  isProcurement: boolean;
  isHR: boolean;
  isPlan: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Subscribe to Firebase Auth State (True Source of Truth)
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((profile) => {
      setCurrentUserState(profile);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Auth Guard: If not logged in and navigating to a protected internal route, redirect to /login
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
  };

  const logout = async () => {
    setIsLoading(true);
    await logoutUser();
    setCurrentUserState(null);
    setIsLoading(false);
    router.replace("/login");
  };

  const role = currentUser?.role;
  const isAdmin = role === "admin";
  const isDean = role === "dean" || isAdmin;
  const isFinance = role === "staff_finance" || isAdmin;
  const isProcurement = role === "staff_procurement" || isAdmin;
  const isHR = role === "staff_hr" || isAdmin;
  const isPlan = role === "staff_plan" || isAdmin;

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        logout,
        isLoggedIn: !!currentUser,
        isLoading,
        isAdmin,
        isDean,
        isFinance,
        isProcurement,
        isHR,
        isPlan,
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

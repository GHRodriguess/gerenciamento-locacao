"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/sidebar";
import { Castle } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 animate-bounce items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30">
            <Castle className="h-8 w-8" />
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full animate-pulse bg-indigo-600" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Carregando sistema...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-64 md:shrink-0">
        <div className="fixed inset-y-0 z-50 flex w-64 flex-col">
          <Sidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

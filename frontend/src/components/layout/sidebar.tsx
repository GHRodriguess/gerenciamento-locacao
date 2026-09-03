"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  CalendarDays,
  MapPin,
  Users,
  Castle,
  UserCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    title: "Início & Agenda",
    href: "/",
    icon: Home,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Locações",
    href: "/locacoes",
    icon: CalendarDays,
  },
  {
    title: "Mapa de Entregas",
    href: "/mapa",
    icon: MapPin,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Brinquedos",
    href: "/brinquedos",
    icon: Castle,
  },
  {
    title: "Colaboradores",
    href: "/colaboradores",
    icon: UserCheck,
  },
];

interface SidebarProps {
  onItemClick?: () => void;
}

export function Sidebar({ onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, username, logout } = useAuth();

  const userInitial = (username || "U").charAt(0).toUpperCase();

  return (
    <aside className="flex h-full w-full flex-col justify-between border-r border-border/70 bg-card p-4 backdrop-blur-2xl">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Castle className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm sm:text-base font-black tracking-tight text-foreground truncate">
              Gerenciamento Locação
            </h1>
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Painel Administrativo
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="border-t border-border/70 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3 border border-border/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 border border-border shrink-0">
              <AvatarFallback className="bg-indigo-600/10 text-indigo-500 font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="truncate text-xs font-bold text-foreground">
                {username || "Usuário"}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.email || "Conectado"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Sair da conta"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

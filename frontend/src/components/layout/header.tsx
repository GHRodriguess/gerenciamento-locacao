"use client";

import React, { useState } from "react";
import { Menu, Castle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-8 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-2xl h-10 w-10 shrink-0"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu lateral"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {title ? (
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-foreground line-clamp-1">
              {title}
            </h1>
            {description && (
              <p className="hidden text-xs text-muted-foreground sm:block">
                {description}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Castle className="h-4 w-4" />
            </div>
            <span className="text-sm font-black text-foreground">Gerenciamento Locação</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>

      {/* Mobile Sidebar Sheet / Drawer Lateral Esquerdo */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 max-w-[85vw] border-r border-border/80">
          <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}

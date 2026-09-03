"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const DynamicLocationPickerMap = dynamic(
  () => import("./location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full rounded-2xl bg-muted/40 border border-border/80 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        Carregando mapa interativo...
      </div>
    ),
  }
);

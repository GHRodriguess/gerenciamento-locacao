"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const DynamicDeliveryMap = dynamic(
  () => import("./delivery-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[400px] w-full rounded-3xl bg-muted/40 border border-border/80 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs font-medium">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        Carregando mapa de entregas...
      </div>
    ),
  }
);

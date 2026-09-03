"use client";

import React from "react";
import { Navigation, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getGoogleMapsUrl,
  getWazeUrl,
  getAppleMapsUrl,
  formatFullAddress,
} from "@/lib/geo";
import { Endereco } from "@/types";

interface RouteButtonProps {
  endereco?: Endereco | null;
  variant?: "default" | "outline" | "secondary" | "ghost" | "indigo" | "emerald";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function RouteButton({
  endereco,
  variant = "outline",
  size = "sm",
  className,
  showText = true,
}: RouteButtonProps) {
  if (!endereco || !endereco.rua) return null;

  const addressText = formatFullAddress(endereco);
  const lat = endereco.latitude;
  const lng = endereco.longitude;

  const googleMapsUrl = getGoogleMapsUrl(lat, lng, addressText);
  const wazeUrl = getWazeUrl(lat, lng, addressText);
  const appleMapsUrl = getAppleMapsUrl(lat, lng, addressText);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          title="Abrir rota no mapa / GPS"
        >
          <Navigation className="h-4 w-4 text-indigo-500 shrink-0" />
          {showText && <span className="ml-1.5 font-bold text-xs">Traçar Rota</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-2">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <MapPin className="h-3 w-3 text-rose-500" /> Abrir no GPS / Rotas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs font-semibold hover:text-indigo-600 cursor-pointer py-2"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Google Maps
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs font-semibold hover:text-indigo-600 cursor-pointer py-2"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Waze
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs font-semibold hover:text-indigo-600 cursor-pointer py-2"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              Apple Maps
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

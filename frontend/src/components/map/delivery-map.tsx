"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Locacao } from "@/types";
import { formatCurrency, formatDateTimeBR, formatTitleCase } from "@/lib/utils";
import { getGoogleMapsUrl, getWazeUrl, getAppleMapsUrl, formatFullAddress } from "@/lib/geo";

interface DeliveryMapProps {
  locacoes: Locacao[];
  selectedLocacaoId?: number | null;
  onSelectLocacao?: (locacao: Locacao) => void;
  height?: string;
}

// Function to classify delivery timing
function getDeliveryType(loc: Locacao): "montagem_hoje" | "devolucao_hoje" | "futura" | "passada" {
  const hojeStr = new Date().toISOString().slice(0, 10);
  const montagemStr = loc.data_montagem ? new Date(loc.data_montagem).toISOString().slice(0, 10) : "";
  const devolucaoStr = loc.data_devolucao ? new Date(loc.data_devolucao).toISOString().slice(0, 10) : "";

  if (montagemStr === hojeStr) return "montagem_hoje";
  if (devolucaoStr === hojeStr) return "devolucao_hoje";

  const dataDevolucao = loc.data_devolucao ? new Date(loc.data_devolucao) : null;
  const agora = new Date();
  if (dataDevolucao && dataDevolucao < agora) return "passada";

  return "futura";
}

const colorMap = {
  montagem_hoje: { bg: "#10b981", text: "Montagem Hoje", shadow: "rgba(16, 185, 129, 0.4)" },
  devolucao_hoje: { bg: "#f59e0b", text: "Devolução Hoje", shadow: "rgba(245, 158, 11, 0.4)" },
  futura: { bg: "#4f46e5", text: "Próximos Dias", shadow: "rgba(79, 70, 229, 0.4)" },
  passada: { bg: "#64748b", text: "Finalizada", shadow: "rgba(100, 116, 139, 0.3)" },
};

const createColoredPinIcon = (type: keyof typeof colorMap, isSelected: boolean) => {
  const config = colorMap[type];
  const size = isSelected ? 44 : 36;
  const pinSize = isSelected ? 22 : 18;

  return L.divIcon({
    className: "custom-delivery-pin",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background: ${config.bg};
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px ${config.shadow};
        border: ${isSelected ? "3.5px solid #ffffff" : "2px solid #ffffff"};
        transition: transform 0.2s ease, width 0.2s ease;
      ">
        <svg style="transform: rotate(45deg); width: ${pinSize}px; height: ${pinSize}px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export default function DeliveryMap({
  locacoes,
  selectedLocacaoId,
  onSelectLocacao,
  height = "100%",
}: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: number]: L.Marker }>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center Maringá
    const defaultCenter: [number, number] = [-23.420999, -51.933056];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Update Markers when locacoes change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const validBounds: L.LatLng[] = [];

    locacoes.forEach((loc) => {
      const lat = loc.endereco?.latitude ? Number(loc.endereco.latitude) : null;
      const lng = loc.endereco?.longitude ? Number(loc.endereco.longitude) : null;

      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

      const latLng = L.latLng(lat, lng);
      validBounds.push(latLng);

      const type = getDeliveryType(loc);
      const isSelected = loc.id === selectedLocacaoId;
      const icon = createColoredPinIcon(type, isSelected);

      const marker = L.marker(latLng, { icon }).addTo(map);

      const fullAddr = formatFullAddress(loc.endereco);
      const gMapsUrl = getGoogleMapsUrl(lat, lng, fullAddr);
      const wazeUrl = getWazeUrl(lat, lng, fullAddr);

      const toysList = loc.brinquedos?.map((b) => formatTitleCase(b.tipo.replaceAll("-", " "))).join(", ") || "Nenhum brinquedo";

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1e293b; min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 13px; color: #0f172a;">${loc.cliente?.nome || "Cliente"}</span>
            <span style="font-weight: 700; font-size: 12px; color: #10b981;">${formatCurrency(loc.valor_total)}</span>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;"><strong>Montagem:</strong> ${formatDateTimeBR(loc.data_montagem)}</p>
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;"><strong>Devolução:</strong> ${formatDateTimeBR(loc.data_devolucao)}</p>
            <p style="margin: 0; font-size: 11px; color: #64748b;"><strong>Brinquedos:</strong> ${toysList}</p>
          </div>

          <p style="margin: 0 0 10px 0; font-size: 11px; color: #475569;">📍 ${fullAddr}</p>

          <div style="display: flex; gap: 6px;">
            <a href="${gMapsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #4f46e5; color: white; padding: 6px 10px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 11px;">Google Maps</a>
            <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #0284c7; color: white; padding: 6px 10px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 11px;">Waze</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on("click", () => {
        if (onSelectLocacao) onSelectLocacao(loc);
      });

      markersRef.current[loc.id] = marker;
    });

    if (validBounds.length > 0) {
      const bounds = L.latLngBounds(validBounds);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [locacoes]);

  // Focus on selected location when selectedLocacaoId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocacaoId) return;

    const marker = markersRef.current[selectedLocacaoId];
    if (marker) {
      map.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    }
  }, [selectedLocacaoId]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-border/80 shadow-md">
      <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />
    </div>
  );
}

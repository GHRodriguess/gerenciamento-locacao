"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapPin, Navigation, Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reverseGeocode } from "@/lib/geo";

interface LocationPickerMapProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  onChangeLocation: (coords: {
    latitude: number;
    longitude: number;
    reverseAddress?: {
      rua?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
    };
  }) => void;
  height?: string;
}

// Custom modern SVG pin icon for Leaflet
const createPinIcon = () => {
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: #4f46e5;
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

export default function LocationPickerMap({
  latitude,
  longitude,
  onChangeLocation,
  height = "280px",
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loadingReverse, setLoadingReverse] = useState(false);

  // Default coordinate (Maringá / Paraná region as standard central fallback)
  const defaultLat = -23.420999;
  const defaultLng = -51.933056;

  const currentLat =
    latitude && !isNaN(Number(latitude)) ? Number(latitude) : defaultLat;
  const currentLng =
    longitude && !isNaN(Number(longitude)) ? Number(longitude) : defaultLng;

  const hasCoordinates =
    latitude !== undefined &&
    latitude !== null &&
    latitude !== "" &&
    longitude !== undefined &&
    longitude !== null &&
    longitude !== "";

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: hasCoordinates ? 16 : 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = createPinIcon();
    const marker = L.marker([currentLat, currentLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);

    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      setLoadingReverse(true);
      const addr = await reverseGeocode(pos.lat, pos.lng);
      setLoadingReverse(false);
      onChangeLocation({
        latitude: pos.lat,
        longitude: pos.lng,
        reverseAddress: addr || undefined,
      });
    });

    map.on("click", async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLoadingReverse(true);
      const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      setLoadingReverse(false);
      onChangeLocation({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        reverseAddress: addr || undefined,
      });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker & map position when latitude/longitude props change
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      markerRef.current &&
      latitude &&
      longitude &&
      !isNaN(Number(latitude)) &&
      !isNaN(Number(longitude))
    ) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const currentPos = markerRef.current.getLatLng();

      if (
        Math.abs(currentPos.lat - lat) > 0.0001 ||
        Math.abs(currentPos.lng - lng) > 0.0001
      ) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
      }
    }
  }, [latitude, longitude]);

  // Handle Current User GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
        }
        setLoadingReverse(true);
        const addr = await reverseGeocode(lat, lng);
        setLoadingReverse(false);
        onChangeLocation({
          latitude: lat,
          longitude: lng,
          reverseAddress: addr || undefined,
        });
      },
      (err) => {
        console.error("Erro ao obter geolocalização:", err);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-inner bg-muted/20">
        <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />

        {/* GPS Action Overlay */}
        <div className="absolute top-3 right-3 z-10 flex gap-1.5 bg-background/90 backdrop-blur-md p-1 rounded-xl border border-border/70 shadow-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUseCurrentLocation}
            className="h-8 px-2.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-600 gap-1.5"
            title="Usar minha localização atual"
          >
            <Crosshair className="h-3.5 w-3.5" /> Meu GPS
          </Button>
        </div>

        {/* Indicator info pill */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/70 shadow-md flex items-center gap-2 pointer-events-auto text-[11px] font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            {loadingReverse ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Identificando endereço...
              </span>
            ) : hasCoordinates ? (
              <span className="truncate">
                Lat: {Number(latitude).toFixed(5)}, Lng: {Number(longitude).toFixed(5)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Clique no mapa ou arraste o pin para definir o ponto
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

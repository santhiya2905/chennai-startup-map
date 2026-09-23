"use client";

import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import type { Startup } from "./types";

type StartupMapProps = {
  startups: Startup[];
  selected: Startup | null;
  onSelect: (startup: Startup) => void;
};

const CHENNAI_CENTER: [number, number] = [13.0475, 80.209];

function FlyToSelection({ selected }: { selected: Startup | null }) {
  const map = useMap();

  useEffect(() => {
    if (selected?.lat != null && selected.lng != null) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, [map, selected]);

  return null;
}

export default function StartupMap({ startups, selected, onSelect }: StartupMapProps) {
  return (
    <MapContainer
      center={CHENNAI_CENTER}
      zoom={11}
      minZoom={9}
      maxZoom={18}
      zoomControl={false}
      preferCanvas
      className="map-canvas"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapPoints startups={startups} selected={selected} onSelect={onSelect} />
      <FlyToSelection selected={selected} />
    </MapContainer>
  );
}

type PointGroup = { key: string; lat: number; lng: number; startups: Startup[] };

function MapPoints({ startups, selected, onSelect }: StartupMapProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const groups = useMemo<PointGroup[]>(() => {
    const precision = zoom <= 10 ? 0.07 : zoom === 11 ? 0.035 : zoom === 12 ? 0.018 : zoom === 13 ? 0.009 : 0;
    const buckets = new Map<string, Startup[]>();
    startups.forEach((startup) => {
      if (startup.lat == null || startup.lng == null) return;
      const key = precision
        ? `${Math.round(startup.lat / precision)}:${Math.round(startup.lng / precision)}`
        : startup.id;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(startup);
      else buckets.set(key, [startup]);
    });
    return [...buckets.entries()].map(([key, items]) => ({
      key,
      startups: items,
      lat: items.reduce((sum, item) => sum + (item.lat ?? 0), 0) / items.length,
      lng: items.reduce((sum, item) => sum + (item.lng ?? 0), 0) / items.length,
    }));
  }, [startups, zoom]);

  return groups.map((group) => {
    if (group.startups.length > 1) {
      const representative = group.startups.find((item) => item.logoUrl) ?? group.startups[0];
      const size = group.startups.length > 99 ? 52 : group.startups.length > 19 ? 48 : 44;
      const logoMarkup = representative.logoUrl
        ? `<img class="map-marker-logo" src="${escapeAttribute(representative.logoUrl)}" alt="" />`
        : `<b>${escapeText(representative.company.charAt(0).toUpperCase())}</b>`;
      return (
        <Marker
          key={group.key}
          position={[group.lat, group.lng]}
          icon={divIcon({
            className: "startup-cluster-wrap",
            html: `<span class="startup-cluster" style="width:${size}px;height:${size}px"><span class="map-marker-logo-frame">${logoMarkup}</span><i>${group.startups.length}</i></span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            tooltipAnchor: [0, -size / 2],
          })}
          eventHandlers={{ click: () => map.flyTo([group.lat, group.lng], Math.min(zoom + 2, 15), { duration: 0.65 }) }}
        >
          <Tooltip direction="top" offset={[0, -5]} opacity={1}>
            <strong>{representative.company}</strong>
            <span>and {group.startups.length - 1} more nearby</span>
          </Tooltip>
        </Marker>
      );
    }

    const startup = group.startups[0];
    const active = startup.id === selected?.id;
    const size = active ? 44 : zoom >= 14 ? 38 : 34;
    const logoMarkup = startup.logoUrl
      ? `<img class="map-marker-logo" src="${escapeAttribute(startup.logoUrl)}" alt="" />`
      : `<b>${escapeText(startup.company.charAt(0).toUpperCase())}</b>`;
    return (
      <Marker
        key={startup.id}
        position={[group.lat, group.lng]}
        icon={divIcon({
          className: `company-map-marker-wrap${active ? " is-active" : ""}`,
          html: `<span class="company-map-marker" style="width:${size}px;height:${size}px"><span class="map-marker-logo-frame">${logoMarkup}</span></span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          tooltipAnchor: [0, -size / 2],
        })}
        eventHandlers={{ click: () => onSelect(startup) }}
      >
        <Tooltip direction="top" offset={[0, -4]} opacity={1}>
          <strong>{startup.company}</strong>
          <span>{startup.area || "Chennai"}</span>
        </Tooltip>
      </Marker>
    );
  });
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeText(value: string) {
  return escapeAttribute(value).replaceAll("'", "&#39;");
}

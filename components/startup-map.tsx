"use client";

import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Startup } from "./types";

type StartupMapProps = {
  startups: Startup[];
  selected: Startup | null;
  onSelect: (startup: Startup) => void;
};

type StartupMarker = L.Marker & { startupData?: Startup };

const CHENNAI_CENTER: [number, number] = [13.0475, 80.209];

export default function StartupMap({ startups, selected, onSelect }: StartupMapProps) {
  return (
    <MapContainer
      center={CHENNAI_CENTER}
      zoom={11}
      minZoom={9}
      maxZoom={20}
      zoomControl={false}
      zoomAnimation
      markerZoomAnimation
      fadeAnimation
      zoomAnimationThreshold={8}
      easeLinearity={0.18}
      className="map-canvas"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={20}
      />
      <ClusteredMarkers startups={startups} selected={selected} onSelect={onSelect} />
    </MapContainer>
  );
}

function ClusteredMarkers({ startups, selected, onSelect }: StartupMapProps) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef(new Map<string, StartupMarker>());
  const previousSelectedRef = useRef<string | null>(null);
  const mapClickedMarkerRef = useRef<string | null>(null);

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 45,
      disableClusteringAtZoom: 16,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: false,
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 10,
      iconCreateFunction: createClusterIcon,
    });

    cluster.addTo(map);
    clusterRef.current = cluster;

    return () => {
      cluster.clearLayers();
      map.removeLayer(cluster);
      clusterRef.current = null;
      markersRef.current.clear();
    };
  }, [map]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();
    markersRef.current.clear();

    const markers: StartupMarker[] = [];
    for (const startup of startups) {
      if (startup.lat == null || startup.lng == null) continue;

      const marker = L.marker([startup.lat, startup.lng], {
        icon: createCompanyIcon(startup),
        keyboard: true,
        riseOnHover: true,
        title: startup.company,
      }) as StartupMarker;

      marker.startupData = startup;
      marker.bindTooltip(
        `<strong>${escapeText(startup.company)}</strong><span>${escapeText(startup.area || "Chennai")}</span>`,
        { direction: "top", offset: L.point(0, -19), opacity: 1 },
      );
      marker.on("click", () => {
        mapClickedMarkerRef.current = startup.id;
        onSelect(startup);
      });
      markersRef.current.set(startup.id, marker);
      markers.push(marker);
    }

    cluster.addLayers(markers);
  }, [onSelect, startups]);

  useEffect(() => {
    const previousId = previousSelectedRef.current;
    const previousMarker = previousId ? markersRef.current.get(previousId) : null;
    if (previousMarker) {
      previousMarker.closeTooltip();
      previousMarker.setZIndexOffset(0);
      previousMarker.getElement()?.classList.remove("is-active");
    }

    previousSelectedRef.current = selected?.id ?? null;
    if (!selected || selected.lat == null || selected.lng == null) return;

    const marker = markersRef.current.get(selected.id);
    if (!marker) return;
    const selectedFromMap = mapClickedMarkerRef.current === selected.id;
    mapClickedMarkerRef.current = null;

    const revealMarker = () => {
      marker.setZIndexOffset(1000);
      marker.getElement()?.classList.add("is-active");
      marker.openTooltip();
    };

    const currentZoom = map.getZoom();
    const targetZoom = selectedFromMap
      ? (currentZoom < 16 ? Math.min(currentZoom + 1, 16) : currentZoom)
      : Math.max(currentZoom, 16);
    const companyPoint = map.project([selected.lat, selected.lng], targetZoom);
    const panelOffset = window.innerWidth >= 768 ? 155 : 0;
    const cameraCenter = map.unproject(companyPoint.add([panelOffset, 0]), targetZoom);
    const needsCameraMove = map.getCenter().distanceTo(cameraCenter) > 12 || targetZoom !== currentZoom;

    if (needsCameraMove) {
      map.stop();
      map.once("moveend", revealMarker);
      map.flyTo(cameraCenter, targetZoom, {
        duration: selectedFromMap ? 0.72 : Math.min(1.18, 0.76 + Math.abs(targetZoom - currentZoom) * 0.08),
      });
      return () => {
        map.off("moveend", revealMarker);
      };
    }

    revealMarker();
  }, [map, selected]);

  return null;
}

function createCompanyIcon(startup: Startup) {
  const logo = startup.logoUrl
    ? `<img class="map-marker-logo" src="${escapeAttribute(startup.logoUrl)}" alt="" loading="lazy" decoding="async" onerror="this.remove()" />`
    : `<b>${escapeText(startup.company.charAt(0).toUpperCase())}</b>`;

  return L.divIcon({
    className: "company-map-marker-wrap",
    html: `<span class="company-map-marker"><span class="map-marker-logo-frame">${logo}</span></span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    tooltipAnchor: [0, -19],
  });
}

function createClusterIcon(cluster: L.MarkerCluster) {
  const children = cluster.getAllChildMarkers() as StartupMarker[];
  const representative = children.find((marker) => marker.startupData?.logoUrl)?.startupData ?? children[0]?.startupData;
  const count = cluster.getChildCount();
  const size = count > 99 ? 52 : count > 19 ? 48 : 44;
  const logo = representative?.logoUrl
    ? `<img class="map-marker-logo" src="${escapeAttribute(representative.logoUrl)}" alt="" loading="lazy" decoding="async" onerror="this.remove()" />`
    : `<b>${escapeText(representative?.company.charAt(0).toUpperCase() || "?")}</b>`;

  return L.divIcon({
    className: "startup-cluster-wrap",
    html: `<span class="startup-cluster"><span class="map-marker-logo-frame">${logo}</span><i>${count}</i></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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

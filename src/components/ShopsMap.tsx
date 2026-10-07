import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyShop } from "@/lib/places.functions";

type Props = {
  center: { lat: number; lon: number };
  shops: NearbyShop[];
  focusId?: string | null;
};

/** Browser-only map showing the farmer's position and every nearby farm-supply shop. */
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char] ?? char;
  });
}

export default function ShopsMap({ center, shops, focusId }: Props) {
  const holder = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!holder.current || map.current) return;
    const instance = L.map(holder.current, { zoomControl: true, attributionControl: true }).setView(
      [center.lat, center.lon],
      13,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      markers.current = {};
    };
  }, [center.lat, center.lon]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    Object.values(markers.current).forEach((m) => m.remove());
    markers.current = {};

    const youIcon = L.divIcon({
      className: "",
      html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2f6f3e;box-shadow:0 0 0 4px rgba(47,111,62,.25)"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const shopIcon = L.divIcon({
      className: "",
      html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:9999px;background:#e4a93c;color:#3a2b19;font:700 14px/1 sans-serif;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)">₹</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    L.marker([center.lat, center.lon], { icon: youIcon, title: "You" }).addTo(instance);

    const bounds = L.latLngBounds([[center.lat, center.lon]]);
    shops.forEach((shop) => {
      const marker = L.marker([shop.lat, shop.lon], { icon: shopIcon }).addTo(instance);
      const safeName = escapeHtml(shop.name);
      const safeAddress = escapeHtml(shop.address);
      const safePhone = escapeHtml(shop.phone);
      const phone = safePhone
        ? `<a href="tel:${safePhone}" style="color:#2f6f3e;font-weight:600">${safePhone}</a><br/>`
        : "";
      marker.bindPopup(
        `<strong>${safeName}</strong><br/>${shop.distanceKm} km${safeAddress ? ` · ${safeAddress}` : ""}<br/>${phone}<a href="https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}" target="_blank" rel="noreferrer" style="color:#2f6f3e;font-weight:600">Directions</a>`,
      );
      markers.current[shop.id] = marker;
      bounds.extend([shop.lat, shop.lon]);
    });

    if (shops.length) instance.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    else instance.setView([center.lat, center.lon], 13);
  }, [center.lat, center.lon, shops]);

  useEffect(() => {
    if (!focusId) return;
    const marker = markers.current[focusId];
    if (!marker || !map.current) return;
    map.current.flyTo(marker.getLatLng(), 16, { duration: 0.6 });
    marker.openPopup();
  }, [focusId]);

  return <div ref={holder} className="h-72 w-full rounded-2xl ring-1 ring-black/10" />;
}

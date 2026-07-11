import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import { scoreColor } from "@/lib/score";
import type { MapBusiness } from "./IomMap";

export default function LeafletMap({
  businesses,
  height,
}: {
  businesses: MapBusiness[];
  height: number;
}) {
  const points = businesses.filter((b) => b.latitude != null && b.longitude != null);
  return (
    <MapContainer
      center={[54.2, -4.55]}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height, width: "100%", borderRadius: 16, zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((b) => (
        <CircleMarker
          key={b.slug}
          center={[Number(b.latitude), Number(b.longitude)]}
          radius={10}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: scoreColor(b.biosphere_score == null ? null : Number(b.biosphere_score)),
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{b.name}</p>
              <p style={{ margin: "2px 0", fontSize: 12, color: "#666" }}>
                {b.parish ?? ""} · Score{" "}
                <strong>{b.biosphere_score == null ? "–" : Math.round(Number(b.biosphere_score))}</strong>
              </p>
              <Link
                to="/business/$slug"
                params={{ slug: b.slug }}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                View profile →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

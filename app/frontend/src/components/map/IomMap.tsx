import { lazy, Suspense, useEffect, useState } from "react";

export interface MapBusiness {
  slug: string;
  name: string;
  parish: string | null;
  latitude: number | null;
  longitude: number | null;
  biosphere_score: number | null;
  verified: boolean;
}

const LeafletMap = lazy(() => import("./LeafletMap"));

/** Client-only wrapper: Leaflet touches `window`, so never render during SSR. */
export function IomMap({ businesses, height = 480 }: { businesses: MapBusiness[]; height?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground"
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div
          className="flex w-full items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground"
          style={{ height }}
        >
          Loading map…
        </div>
      }
    >
      <LeafletMap businesses={businesses} height={height} />
    </Suspense>
  );
}

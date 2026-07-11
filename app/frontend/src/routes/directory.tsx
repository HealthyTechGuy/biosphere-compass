import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LayoutGrid, List, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { businessesQuery, homeQuery } from "@/lib/queries";
import { BusinessCard } from "@/components/business/BusinessCard";
import { ScoreChip } from "@/components/score/ScoreRing";
import { IomMap } from "@/components/map/IomMap";
import { Link } from "@tanstack/react-router";

interface DirectorySearch {
  q?: string;
  category?: string;
  parish?: string;
  min?: number;
  verified?: boolean;
  cia?: boolean;
  renewable?: boolean;
  circular?: boolean;
  community?: boolean;
  accessible?: boolean;
  tourism?: boolean;
  view?: "grid" | "list" | "map";
}

export const Route = createFileRoute("/directory")({
  validateSearch: (search: Record<string, unknown>): DirectorySearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    parish: typeof search.parish === "string" ? search.parish : undefined,
    min: typeof search.min === "number" ? search.min : undefined,
    verified: search.verified === true || undefined,
    cia: search.cia === true || undefined,
    renewable: search.renewable === true || undefined,
    circular: search.circular === true || undefined,
    community: search.community === true || undefined,
    accessible: search.accessible === true || undefined,
    tourism: search.tourism === true || undefined,
    view: search.view === "list" || search.view === "map" ? search.view : "grid",
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(businessesQuery);
    context.queryClient.prefetchQuery(homeQuery);
  },
  head: () => ({
    meta: [
      { title: "Business Directory — Isle of Man Biosphere" },
      { name: "description", content: "Search and filter sustainable Isle of Man businesses by category, location, Biosphere Score and more." },
      { property: "og:title", content: "Business Directory — Isle of Man Biosphere" },
      { property: "og:description", content: "Search and filter sustainable Isle of Man businesses." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => <div className="px-4 py-20 text-center">Directory unavailable.</div>,
  component: DirectoryPage,
});

const FLAGS: { key: keyof DirectorySearch; label: string }[] = [
  { key: "verified", label: "Verified" },
  { key: "cia", label: "Climate Impact Assessment" },
  { key: "renewable", label: "Renewable energy" },
  { key: "circular", label: "Circular economy" },
  { key: "community", label: "Community contribution" },
  { key: "accessible", label: "Accessibility" },
  { key: "tourism", label: "Sustainable tourism" },
];

function DirectoryPage() {
  const { data: businesses } = useSuspenseQuery(businessesQuery);
  const { data: home } = useSuspenseQuery(homeQuery);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const parishes = Array.from(new Set(businesses.map((b) => b.parish).filter(Boolean))).sort() as string[];

  const filtered = businesses.filter((b) => {
    if (search.q) {
      const q = search.q.toLowerCase();
      const hay = `${b.name} ${b.tagline ?? ""} ${b.parish ?? ""} ${b.category?.name ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (search.category && b.category?.slug !== search.category) return false;
    if (search.parish && b.parish !== search.parish) return false;
    if (search.min != null && Number(b.biosphere_score ?? 0) < search.min) return false;
    if (search.verified && !b.verified) return false;
    if (search.cia && !b.cia_completed) return false;
    if (search.renewable && !b.renewable_energy) return false;
    if (search.circular && !b.circular_economy) return false;
    if (search.community && !b.community_contribution) return false;
    if (search.accessible && !b.accessible) return false;
    if (search.tourism && !b.sustainable_tourism) return false;
    return true;
  });

  function set(patch: Partial<DirectorySearch>) {
    navigate({ search: (prev: DirectorySearch) => ({ ...prev, ...patch }) });
  }

  const view = search.view ?? "grid";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">Business directory</h1>
          <p className="mt-1 text-muted-foreground">
            {filtered.length} of {businesses.length} sustainable Manx businesses
          </p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="View options">
          {(
            [
              { v: "grid", icon: LayoutGrid, label: "Grid view" },
              { v: "list", icon: List, label: "List view" },
              { v: "map", icon: MapIcon, label: "Map view" },
            ] as const
          ).map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              aria-label={label}
              aria-pressed={view === v}
              onClick={() => set({ view: v })}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                view === v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="card-soft mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={search.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            placeholder="Search name, town, keyword…"
            aria-label="Search businesses"
            className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <select
            value={search.category ?? ""}
            onChange={(e) => set({ category: e.target.value || undefined })}
            aria-label="Filter by category"
            className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All categories</option>
            {home.categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={search.parish ?? ""}
            onChange={(e) => set({ parish: e.target.value || undefined })}
            aria-label="Filter by location"
            className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All locations</option>
            {parishes.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={search.min ?? ""}
            onChange={(e) => set({ min: e.target.value ? Number(e.target.value) : undefined })}
            aria-label="Minimum Biosphere Score"
            className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Any Biosphere Score</option>
            <option value="90">90+ Outstanding</option>
            <option value="75">75+ Excellent</option>
            <option value="60">60+ Good</option>
            <option value="40">40+ Developing</option>
          </select>
        </div>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> More filters
        </button>
        {filtersOpen && (
          <div className="mt-3 flex flex-wrap gap-2">
            {FLAGS.map((f) => {
              const active = !!search[f.key];
              return (
                <button
                  key={f.key}
                  aria-pressed={active}
                  onClick={() => set({ [f.key]: active ? undefined : true } as Partial<DirectorySearch>)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-8">
        {view === "map" ? (
          <IomMap businesses={filtered} height={560} />
        ) : view === "list" ? (
          <ul className="space-y-3">
            {filtered.map((b) => (
              <li key={b.slug}>
                <Link
                  to="/business/$slug"
                  params={{ slug: b.slug }}
                  className="card-soft card-lift flex items-center gap-4 p-4"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{b.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {b.category?.name}{b.parish ? ` · ${b.parish}` : ""}
                    </span>
                  </span>
                  {b.verified && (
                    <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground sm:inline">
                      Verified
                    </span>
                  )}
                  <ScoreChip score={b.biosphere_score == null ? null : Number(b.biosphere_score)} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <BusinessCard key={b.slug} business={b} />
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No businesses match those filters yet. Try widening your search.
          </p>
        )}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Gauge, Leaf, HeartHandshake } from "lucide-react";
import { analyticsQuery } from "@/lib/queries";

export const Route = createFileRoute("/analytics")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(analyticsQuery);
  },
  head: () => ({
    meta: [
      { title: "Island Analytics — Isle of Man Biosphere Beacons" },
      { name: "description", content: "Live sustainability analytics: participating businesses, average Biosphere Score, businesses by parish and sector, and impact estimates." },
      { property: "og:title", content: "Island Analytics — Isle of Man Biosphere Beacons" },
      { property: "og:description", content: "Live sustainability analytics for the Isle of Man business community." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => <div className="px-4 py-20 text-center">Analytics unavailable.</div>,
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data } = useSuspenseQuery(analyticsQuery);

  // Simple transparent estimates for illustration
  const carbonEstimate = Math.round(data.renewable * 8.4 + data.circular * 3.2);
  const communityHours = data.community * 120;

  const stats = [
    { icon: Building2, label: "Participating businesses", value: String(data.count) },
    { icon: Gauge, label: "Average Biosphere Score", value: String(data.avg) },
    { icon: Leaf, label: "Est. CO₂e saved / year", value: `${carbonEstimate} t` },
    { icon: HeartHandshake, label: "Est. community hours / year", value: communityHours.toLocaleString() },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">Island analytics</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Transparency for residents, government and organisations — how the Island's business
        community is progressing on the Biosphere journey.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card-soft p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="card-soft p-6">
          <h2 className="font-display text-xl font-semibold">Businesses by parish</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byParish} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-soft p-6">
          <h2 className="font-display text-xl font-semibold">Businesses by sector</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bySector} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Carbon and community figures are indicative estimates derived from participating
        businesses' sustainability flags, shown for illustration until measured data is
        collected through annual Compass reassessments.
      </p>
    </div>
  );
}

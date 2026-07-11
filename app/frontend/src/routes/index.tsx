import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, CalendarCheck, Compass, Sprout } from "lucide-react";
import { homeQuery, businessesQuery } from "@/lib/queries";
import { BusinessCard } from "@/components/business/BusinessCard";
import { ScoreChip } from "@/components/score/ScoreRing";
import { IomMap } from "@/components/map/IomMap";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { scoreBand } from "@/lib/score";
import heroImg from "@/assets/hero-iom.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(homeQuery);
    context.queryClient.prefetchQuery(businessesQuery);
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="px-4 py-20 text-center">Nothing here.</div>,
  component: HomePage,
});

const SCORE_BANDS = [
  { range: "90–100", label: "Outstanding", token: "--score-outstanding" },
  { range: "75–89", label: "Excellent", token: "--score-excellent" },
  { range: "60–74", label: "Good", token: "--score-good" },
  { range: "40–59", label: "Developing", token: "--score-developing" },
  { range: "Below 40", label: "Beginning", token: "--score-beginning" },
];

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const { data: allBusinesses } = useSuspenseQuery(businessesQuery);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Aerial view of the Isle of Man coastline"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl text-white">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur">
              <Sprout className="h-3.5 w-3.5" aria-hidden /> UNESCO Biosphere Isle of Man
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
              Meet the communities building our island's UNESCO Biosphere
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              {data.stats.count} Manx businesses measured with the Biosphere Compass — an average
              Biosphere Score of {data.stats.avg}. Shop, stay and buy from people making real
              environmental and social progress.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full max-w-md rounded-2xl bg-white/95 p-1.5 shadow-lg">
                <GlobalSearch />
              </div>
              <Link
                to="/directory"
                className="btn-hero inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold"
              >
                Browse the directory <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold">Across the Island</h2>
            <p className="mt-1 text-muted-foreground">
              Pins are coloured by Biosphere Score. Click one to preview the business.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {SCORE_BANDS.map((b) => (
              <span key={b.label} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: `var(${b.token})` }}
                  aria-hidden
                />
                {b.label}
              </span>
            ))}
          </div>
        </div>
        <IomMap businesses={allBusinesses} height={440} />
      </section>

      {/* Featured */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold">Featured businesses</h2>
              <p className="mt-1 text-muted-foreground">
                Standout performers on the Biosphere Compass.
              </p>
            </div>
            <Link
              to="/directory"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
            >
              View all <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.featured.map((b) => (
              <BusinessCard key={b.slug} business={b} />
            ))}
          </div>
        </div>
      </section>

      {/* Top scores + recently assessed */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
            <BadgeCheck className="h-6 w-6 text-primary" aria-hidden /> Highest Biosphere Scores
          </h2>
          <ol className="mt-5 space-y-3">
            {data.top.map((b, i) => (
              <li key={b.slug}>
                <Link
                  to="/business/$slug"
                  params={{ slug: b.slug }}
                  className="card-soft card-lift flex items-center gap-4 p-4"
                >
                  <span className="w-6 font-display text-lg font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{b.name}</span>
                    <span className="text-xs text-muted-foreground">{b.parish}</span>
                  </span>
                  <ScoreChip score={b.biosphere_score == null ? null : Number(b.biosphere_score)} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
            <CalendarCheck className="h-6 w-6 text-primary" aria-hidden /> Recently assessed
          </h2>
          <ol className="mt-5 space-y-3">
            {data.recent.map((b) => (
              <li key={b.slug}>
                <Link
                  to="/business/$slug"
                  params={{ slug: b.slug }}
                  className="card-soft card-lift flex items-center gap-4 p-4"
                >
                  <span className="flex-1">
                    <span className="block font-semibold">{b.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Assessed{" "}
                      {b.last_assessed_at
                        ? new Date(b.last_assessed_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "recently"}
                    </span>
                  </span>
                  <ScoreChip score={b.biosphere_score == null ? null : Number(b.biosphere_score)} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">Browse by category</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {data.categories.map((c) => (
              <Link
                key={c.slug}
                to="/directory"
                search={{ category: c.slug }}
                className="card-soft card-lift px-5 py-3 text-sm font-semibold"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Score explainer */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="card-soft grid gap-8 p-8 sm:p-10 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 font-display text-3xl font-semibold">
              <Compass className="h-7 w-7 text-primary" aria-hidden /> What is the Biosphere Score?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every business is assessed with the{" "}
              <strong className="text-foreground">Biosphere Compass</strong> — a framework inspired
              by the Isle of Man's Climate Impact Assessment. It measures performance across
              dimensions like climate impact, energy, waste, nature, community and sustainable
              tourism, then combines them into one weighted score out of 100.
            </p>
            <Link
              to="/score"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              How scoring works <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-3">
            {SCORE_BANDS.map((b) => (
              <li
                key={b.label}
                className="flex items-center gap-4 rounded-xl bg-muted/60 px-4 py-3"
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: `var(${b.token})` }}
                  aria-hidden
                />
                <span className="w-24 text-sm font-semibold">{b.range}</span>
                <span className="text-sm text-muted-foreground">{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Run a Manx business? Show the Island your progress.
          </h2>
          <p className="mt-4 text-primary-foreground/85">
            Complete the Biosphere Compass assessment, upload your evidence and earn your Biosphere
            Score. Verification by the Biosphere team builds trust with customers, visitors and
            procurement teams.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Join the directory <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Award,
  ShieldCheck,
} from "lucide-react";
import { businessQuery } from "@/lib/queries";
import { ScoreRing } from "@/components/score/ScoreRing";
import { CompassRadar } from "@/components/business/CompassRadar";
import { IomMap } from "@/components/map/IomMap";
import { businessImage } from "@/lib/images";
import { scoreBand } from "@/lib/score";

export const Route = createFileRoute("/business/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(businessQuery(params.slug));
    if (!data) throw notFound();
    return { name: data.business.name, tagline: data.business.tagline };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Business not found — Isle of Man Biosphere" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} — Isle of Man Biosphere Directory`;
    const desc = loaderData.tagline ?? "A sustainable Isle of Man business with a Biosphere Score.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Business not found</h1>
      <p className="mt-2 text-muted-foreground">It may have been removed or the link is wrong.</p>
      <Link to="/directory" className="mt-6 inline-block font-semibold text-primary hover:underline">
        Back to the directory
      </Link>
    </div>
  ),
  component: BusinessPage,
});

function BusinessPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(businessQuery(slug));
  if (!data) return null;
  const { business, assessment, dimensionScores } = data;
  const score = business.biosphere_score == null ? null : Number(business.biosphere_score);
  const band = scoreBand(score);
  const hours = (business.opening_hours ?? {}) as Record<string, string>;
  const social = (business.social_links ?? {}) as Record<string, string>;

  return (
    <div>
      {/* Cover */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        <img
          src={businessImage(business.image_key)}
          alt={business.name}
          width={1024}
          height={768}
          className="h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
            <Link to="/directory" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-white/85 hover:text-white">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Directory
            </Link>
            <h1 className="flex flex-wrap items-center gap-3 font-display text-3xl font-semibold text-white sm:text-5xl">
              {business.name}
              {business.verified && (
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <BadgeCheck className="h-4 w-4" aria-hidden /> Verified
                </span>
              )}
            </h1>
            {business.tagline && <p className="mt-2 max-w-2xl text-white/85">{business.tagline}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {/* Description */}
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="font-display text-2xl font-semibold">About</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{business.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {business.category?.name && (
                <span className="rounded-full bg-secondary px-3 py-1.5 font-semibold text-secondary-foreground">
                  {business.category.name}
                </span>
              )}
              {business.cia_completed && (
                <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-semibold text-secondary-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Climate Impact Assessment completed
                </span>
              )}
            </div>
          </section>

          {/* Compass breakdown */}
          {dimensionScores.length > 0 && (
            <section className="mt-12" aria-labelledby="compass-heading">
              <h2 id="compass-heading" className="font-display text-2xl font-semibold">Biosphere Compass breakdown</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Performance across every dimension of the Biosphere Compass.
              </p>
              <div className="card-soft mt-6 p-4 sm:p-6">
                <CompassRadar scores={dimensionScores} />
                <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {dimensionScores.map((d) => (
                    <div key={d.slug}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{d.name}</span>
                        <span className="font-semibold" style={{ color: scoreBand(d.score).hex }}>{d.score}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={d.score} aria-valuemin={0} aria-valuemax={100} aria-label={d.name}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${d.score}%`, backgroundColor: scoreBand(d.score).hex }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Services / awards / certifications */}
          {(business.services.length > 0 || business.awards.length > 0 || business.certifications.length > 0) && (
            <section className="mt-12 grid gap-6 sm:grid-cols-2">
              {business.services.length > 0 && (
                <div className="card-soft p-6">
                  <h3 className="font-display text-lg font-semibold">Services</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {business.services.map((s) => (
                      <li key={s} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(business.awards.length > 0 || business.certifications.length > 0) && (
                <div className="card-soft p-6">
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Award className="h-5 w-5 text-primary" aria-hidden /> Awards & certifications
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {[...business.awards, ...business.certifications].map((a) => (
                      <li key={a} className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Location */}
          {business.latitude != null && business.longitude != null && (
            <section className="mt-12" aria-labelledby="location-heading">
              <h2 id="location-heading" className="font-display text-2xl font-semibold">Location</h2>
              <div className="mt-4">
                <IomMap
                  businesses={[{
                    slug: business.slug,
                    name: business.name,
                    parish: business.parish,
                    latitude: Number(business.latitude),
                    longitude: Number(business.longitude),
                    biosphere_score: score,
                    verified: business.verified,
                  }]}
                  height={320}
                />
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="card-soft flex flex-col items-center p-8 text-center">
            <h2 className="font-display text-lg font-semibold">Biosphere Score</h2>
            <div className="mt-4">
              <ScoreRing score={score} />
            </div>
            {business.last_assessed_at && (
              <p className="mt-4 text-xs text-muted-foreground">
                Last assessed {new Date(business.last_assessed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                {assessment?.status === "verified" ? " · Verified by the Biosphere team" : " · Awaiting verification"}
              </p>
            )}
          </div>

          <div className="card-soft space-y-4 p-6 text-sm">
            <h2 className="font-display text-lg font-semibold">Contact & details</h2>
            {business.address && (
              <p className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {business.address}
              </p>
            )}
            {business.website && (
              <p className="flex items-center gap-3">
                <Globe className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-primary hover:underline">
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
            {business.email && (
              <p className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href={`mailto:${business.email}`} className="truncate hover:text-foreground">{business.email}</a>
              </p>
            )}
            {business.phone && (
              <p className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href={`tel:${business.phone}`} className="hover:text-foreground">{business.phone}</a>
              </p>
            )}
            {(social.instagram || social.facebook) && (
              <div className="flex items-center gap-3 pt-1">
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-primary">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {Object.keys(hours).length > 0 && (
            <div className="card-soft p-6 text-sm">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Clock className="h-4 w-4 text-primary" aria-hidden /> Opening hours
              </h2>
              <dl className="mt-3 space-y-2">
                {Object.entries(hours).map(([day, time]) => (
                  <div key={day} className="flex justify-between text-muted-foreground">
                    <dt className="font-medium text-foreground">{day}</dt>
                    <dd>{time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck } from "lucide-react";
import { ScoreChip } from "@/components/score/ScoreRing";
import { businessImage } from "@/lib/images";

export interface BusinessCardData {
  slug: string;
  name: string;
  tagline: string | null;
  parish: string | null;
  image_key: string | null;
  biosphere_score: number | null;
  verified: boolean;
  category?: { name: string } | null;
}

export function BusinessCard({ business, compact }: { business: BusinessCardData; compact?: boolean }) {
  return (
    <Link
      to="/business/$slug"
      params={{ slug: business.slug }}
      className="card-soft card-lift group block overflow-hidden"
    >
      {!compact && (
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={businessImage(business.image_key)}
            alt={business.name}
            loading="lazy"
            width={1024}
            height={640}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <ScoreChip score={business.biosphere_score == null ? null : Number(business.biosphere_score)} />
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 font-semibold leading-snug">
              {business.name}
              {business.verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified business" />
              )}
            </p>
            {business.tagline && !compact && (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{business.tagline}</p>
            )}
          </div>
          {compact && <ScoreChip score={business.biosphere_score == null ? null : Number(business.biosphere_score)} />}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {business.category?.name && <span>{business.category.name}</span>}
          {business.parish && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden /> {business.parish}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

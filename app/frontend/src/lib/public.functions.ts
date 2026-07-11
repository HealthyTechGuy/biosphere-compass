import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const BUSINESS_CARD_COLUMNS =
  "id,slug,name,tagline,parish,image_key,biosphere_score,verified,last_assessed_at,latitude,longitude,renewable_energy,circular_economy,community_contribution,accessible,sustainable_tourism,cia_completed,featured,category:categories(name,slug)";

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [featured, top, recent, categories, stats] = await Promise.all([
    supabase.from("businesses").select(BUSINESS_CARD_COLUMNS).eq("published", true).eq("featured", true).order("biosphere_score", { ascending: false }).limit(6),
    supabase.from("businesses").select(BUSINESS_CARD_COLUMNS).eq("published", true).order("biosphere_score", { ascending: false }).limit(5),
    supabase.from("businesses").select(BUSINESS_CARD_COLUMNS).eq("published", true).order("last_assessed_at", { ascending: false }).limit(5),
    supabase.from("categories").select("id,slug,name,icon,display_order").order("display_order"),
    supabase.from("businesses").select("biosphere_score").eq("published", true),
  ]);
  const scores = (stats.data ?? []).map((b) => Number(b.biosphere_score ?? 0));
  return {
    featured: featured.data ?? [],
    top: top.data ?? [],
    recent: recent.data ?? [],
    categories: categories.data ?? [],
    stats: {
      count: scores.length,
      avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    },
  };
});

export const listBusinesses = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_CARD_COLUMNS)
    .eq("published", true)
    .order("biosphere_score", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getBusinessBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*, category:categories(name,slug)")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!business) return null;

    const { data: assessment } = await supabase
      .from("assessments")
      .select("id,status,overall_score,verified_at,submitted_at")
      .eq("business_id", business.id)
      .in("status", ["published", "verified"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let dimensionScores: { name: string; slug: string; score: number }[] = [];
    if (assessment) {
      const { data: scores } = await supabase
        .from("assessment_dimension_scores")
        .select("score, dimension:compass_dimensions(name,slug,display_order)")
        .eq("assessment_id", assessment.id);
      dimensionScores = (scores ?? [])
        .filter((s) => s.dimension)
        .sort((a, b) => (a.dimension!.display_order ?? 0) - (b.dimension!.display_order ?? 0))
        .map((s) => ({ name: s.dimension!.name, slug: s.dimension!.slug, score: Number(s.score) }));
    }
    return { business, assessment, dimensionScores };
  });

export const getAnalyticsData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("parish,biosphere_score,renewable_energy,circular_economy,community_contribution,category:categories(name)")
    .eq("published", true);
  const rows = businesses ?? [];
  const byParish: Record<string, number> = {};
  const bySector: Record<string, number> = {};
  let renewable = 0;
  let circular = 0;
  let community = 0;
  for (const b of rows) {
    if (b.parish) byParish[b.parish] = (byParish[b.parish] ?? 0) + 1;
    const sector = b.category?.name ?? "Other";
    bySector[sector] = (bySector[sector] ?? 0) + 1;
    if (b.renewable_energy) renewable++;
    if (b.circular_economy) circular++;
    if (b.community_contribution) community++;
  }
  const scores = rows.map((b) => Number(b.biosphere_score ?? 0));
  return {
    count: rows.length,
    avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    byParish: Object.entries(byParish).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    bySector: Object.entries(bySector).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    renewable,
    circular,
    community,
  };
});

export const getCompassDimensions = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("compass_dimensions")
    .select("id,slug,name,description,weight,display_order")
    .eq("active", true)
    .order("display_order");
  return data ?? [];
});

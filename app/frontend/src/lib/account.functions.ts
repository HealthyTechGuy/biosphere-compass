import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeDimensionScores, computeOverallScore } from "@/lib/scoring";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) || "business"
  );
}

/** Everything the business dashboard needs in one call. */
export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    const [dims, questions] = await Promise.all([
      supabase.from("compass_dimensions").select("id,slug,name,description,weight,display_order").eq("active", true).order("display_order"),
      supabase.from("compass_questions").select("id,dimension_id,prompt,help_text,max_points,display_order").eq("active", true).order("display_order"),
    ]);

    let assessment = null;
    let responses: { question_id: string; points: number; notes: string | null }[] = [];
    let evidence: { id: string; file_path: string; label: string | null }[] = [];
    if (business) {
      const { data: a } = await supabase
        .from("assessments")
        .select("id,status,overall_score,review_notes,submitted_at,verified_at,created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      assessment = a;
      if (a) {
        const [{ data: r }, { data: ev }] = await Promise.all([
          supabase.from("assessment_responses").select("question_id,points,notes").eq("assessment_id", a.id),
          supabase.from("evidence_files").select("id,file_path,label").eq("assessment_id", a.id),
        ]);
        responses = r ?? [];
        evidence = ev ?? [];
      }
    }
    return {
      business,
      assessment,
      responses,
      evidence,
      dimensions: dims.data ?? [],
      questions: questions.data ?? [],
    };
  });

const businessInput = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(160).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  category_id: z.string().uuid().nullable().optional(),
  parish: z.string().trim().max(60).optional().default(""),
  address: z.string().trim().max(200).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  latitude: z.number().min(53.9).max(54.5).nullable().optional(),
  longitude: z.number().min(-5).max(-4).nullable().optional(),
});

export const upsertMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => businessInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("businesses").update(data).eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: created, error } = await supabase
      .from("businesses")
      .insert({ ...data, slug, owner_id: userId, published: true })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const ensureDraftAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!business) throw new Error("Create your business profile first.");

    const { data: existing } = await supabase
      .from("assessments")
      .select("id,status")
      .eq("business_id", business.id)
      .in("status", ["draft"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return { id: existing.id };

    const { data: created, error } = await supabase
      .from("assessments")
      .insert({ business_id: business.id, status: "draft", created_by: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const saveResponses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        assessmentId: z.string().uuid(),
        responses: z
          .array(
            z.object({
              question_id: z.string().uuid(),
              points: z.number().int().min(0).max(10),
              notes: z.string().max(1000).nullable().optional(),
            }),
          )
          .max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const rows = data.responses.map((r) => ({
      assessment_id: data.assessmentId,
      question_id: r.question_id,
      points: r.points,
      notes: r.notes ?? null,
    }));
    const { error } = await supabase
      .from("assessment_responses")
      .upsert(rows, { onConflict: "assessment_id,question_id" });
    if (error) throw new Error(error.message);
    return { saved: rows.length };
  });

export const addEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        assessmentId: z.string().uuid(),
        filePath: z.string().min(1).max(400),
        label: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("evidence_files").insert({
      assessment_id: data.assessmentId,
      file_path: data.filePath,
      label: data.label ?? null,
      uploaded_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Submit for verification. Scores are computed by the modular scoring engine
 * from configurable questions/weights; the score publishes immediately as
 * "unverified" and an admin verifies it afterwards.
 */
export const submitAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ assessmentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id,business_id,status")
      .eq("id", data.assessmentId)
      .maybeSingle();
    if (!assessment) throw new Error("Assessment not found.");

    const [dims, questions, responses] = await Promise.all([
      supabase.from("compass_dimensions").select("id,weight").eq("active", true),
      supabase.from("compass_questions").select("id,dimension_id,max_points").eq("active", true),
      supabase.from("assessment_responses").select("question_id,points").eq("assessment_id", assessment.id),
    ]);

    const dimensions = (dims.data ?? []).map((d) => ({ id: d.id, weight: Number(d.weight) }));
    const dimScores = computeDimensionScores(dimensions, questions.data ?? [], responses.data ?? []);
    const overall = computeOverallScore(dimScores, dimensions);

    await supabase.from("assessment_dimension_scores").delete().eq("assessment_id", assessment.id);
    const scoreRows = Object.entries(dimScores).map(([dimension_id, score]) => ({
      assessment_id: assessment.id,
      dimension_id,
      score,
    }));
    if (scoreRows.length) {
      const { error } = await supabase.from("assessment_dimension_scores").insert(scoreRows);
      if (error) throw new Error(error.message);
    }

    const { error: aErr } = await supabase
      .from("assessments")
      .update({ status: "published", overall_score: overall, submitted_at: new Date().toISOString() })
      .eq("id", assessment.id);
    if (aErr) throw new Error(aErr.message);

    const { error: bErr } = await supabase
      .from("businesses")
      .update({
        biosphere_score: overall,
        last_assessed_at: new Date().toISOString().slice(0, 10),
        cia_completed: true,
        verified: false,
      })
      .eq("id", assessment.business_id);
    if (bErr) throw new Error(bErr.message);

    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: "assessment.submitted",
      entity_type: "assessment",
      entity_id: assessment.id,
      detail: { overall },
    });

    return { overall };
  });

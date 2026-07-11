import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const [businesses, queue, dimensions, questions, audit, users] = await Promise.all([
      supabase
        .from("businesses")
        .select("id,slug,name,parish,biosphere_score,verified,published,featured,last_assessed_at,category:categories(name)")
        .order("name"),
      supabase
        .from("assessments")
        .select("id,status,overall_score,submitted_at,review_notes,business:businesses(id,name,slug,parish)")
        .in("status", ["published", "submitted"])
        .order("submitted_at", { ascending: false }),
      supabase.from("compass_dimensions").select("*").order("display_order"),
      supabase.from("compass_questions").select("*").order("display_order"),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id,display_name,email,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    return {
      businesses: businesses.data ?? [],
      queue: queue.data ?? [],
      dimensions: dimensions.data ?? [],
      questions: questions.data ?? [],
      audit: audit.data ?? [],
      users: users.data ?? [],
    };
  });

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: !!data };
  });

export const reviewAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        assessmentId: z.string().uuid(),
        decision: z.enum(["verify", "reject"]),
        notes: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id,business_id")
      .eq("id", data.assessmentId)
      .maybeSingle();
    if (!assessment) throw new Error("Assessment not found");

    if (data.decision === "verify") {
      await supabase
        .from("assessments")
        .update({ status: "verified", verified_at: new Date().toISOString(), review_notes: data.notes ?? null })
        .eq("id", assessment.id);
      await supabase.from("businesses").update({ verified: true }).eq("id", assessment.business_id);
    } else {
      await supabase
        .from("assessments")
        .update({ status: "rejected", review_notes: data.notes ?? null })
        .eq("id", assessment.id);
      await supabase.from("businesses").update({ verified: false }).eq("id", assessment.business_id);
    }

    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: `assessment.${data.decision}`,
      entity_type: "assessment",
      entity_id: assessment.id,
      detail: { notes: data.notes ?? null },
    });
    return { ok: true };
  });

export const updateDimension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        weight: z.number().min(0).max(10).optional(),
        name: z.string().min(1).max(120).optional(),
        description: z.string().max(500).optional(),
        active: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const { error } = await context.supabase.from("compass_dimensions").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: "dimension.updated",
      entity_type: "compass_dimension",
      entity_id: id,
      detail: fields,
    });
    return { ok: true };
  });

export const upsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        dimension_id: z.string().uuid(),
        prompt: z.string().min(3).max(500),
        help_text: z.string().max(500).optional(),
        max_points: z.number().int().min(1).max(10),
        active: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;
    const { id, ...fields } = data;
    if (id) {
      const { error } = await supabase.from("compass_questions").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("compass_questions").insert(fields);
      if (error) throw new Error(error.message);
    }
    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: id ? "question.updated" : "question.created",
      entity_type: "compass_question",
      entity_id: id ?? null,
      detail: { prompt: fields.prompt },
    });
    return { ok: true };
  });

export const updateBusinessFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        featured: z.boolean().optional(),
        published: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const { error } = await context.supabase.from("businesses").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: "business.flags_updated",
      entity_type: "business",
      entity_id: id,
      detail: fields,
    });
    return { ok: true };
  });

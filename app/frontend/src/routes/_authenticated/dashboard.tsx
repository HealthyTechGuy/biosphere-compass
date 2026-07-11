import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getWorkspace, upsertMyBusiness } from "@/lib/account.functions";
import { getHomeData } from "@/lib/public.functions";
import { isAdmin } from "@/lib/admin.functions";
import { Link } from "@tanstack/react-router";
import { ScoreRing } from "@/components/score/ScoreRing";
import { BiosphereAssessment } from "@/components/assessment/BiosphereAssessment";
import { isDemoMode } from "@/lib/demo-mode";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Biosphere Directory" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  if (isDemoMode()) return <DemoDashboard />;
  return <SupabaseDashboard />;
}

function DemoDashboard() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Business dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Demo Business{" "}
            <span className="ml-2 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-secondary-foreground">
              Demo mode
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section className="card-soft p-6" aria-labelledby="assessment-heading">
          <h2 id="assessment-heading" className="font-display text-xl font-semibold">
            Biosphere Compass assessment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a sector, work through the 21 impact criteria, and get an instant
            sector-weighted 0–100 Compass score with a priority-action list. Results
            aren't saved in demo mode.
          </p>
          <div className="mt-6">
            <BiosphereAssessment businessName="Demo Business" />
          </div>
        </section>
      </div>
    </div>
  );
}

function SupabaseDashboard() {
  const queryClient = useQueryClient();
  const fetchWorkspace = useServerFn(getWorkspace);
  const fetchHome = useServerFn(getHomeData);
  const fetchIsAdmin = useServerFn(isAdmin);

  const { data: ws, isLoading } = useQuery({ queryKey: ["workspace"], queryFn: () => fetchWorkspace() });
  const { data: home } = useQuery({ queryKey: ["home-cats"], queryFn: () => fetchHome() });
  const { data: adminCheck } = useQuery({ queryKey: ["is-admin"], queryFn: () => fetchIsAdmin() });

  if (isLoading || !ws) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">Loading your workspace…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Business dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            {ws.business ? ws.business.name : "Set up your business profile to begin."}
          </p>
        </div>
        {adminCheck?.admin && (
          <Link to="/admin" className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-accent">
            Admin dashboard →
          </Link>
        )}
      </div>

      {!ws.business ? (
        <BusinessForm
          categories={home?.categories ?? []}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["workspace"] })}
        />
      ) : (
        <div className="mt-8 space-y-8">
          <StatusCard ws={ws} />
          <section className="card-soft p-6" aria-labelledby="assessment-heading">
            <h2 id="assessment-heading" className="font-display text-xl font-semibold">
              Biosphere Compass assessment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a sector, work through the 21 impact criteria, and get an
              instant sector-weighted 0–100 Compass score with a priority-action list.
            </p>
            <div className="mt-6">
              <BiosphereAssessment businessName={ws.business.name} />
            </div>
          </section>
          <details className="card-soft p-6">
            <summary className="cursor-pointer font-display text-lg font-semibold">Edit business details</summary>
            <BusinessForm
              categories={home?.categories ?? []}
              existing={ws.business}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ["workspace"] })}
            />
          </details>
        </div>
      )}
    </div>
  );
}

type Workspace = NonNullable<Awaited<ReturnType<typeof getWorkspace>>>;

function StatusCard({ ws }: { ws: Workspace }) {
  const b = ws.business!;
  const a = ws.assessment;
  const statusLabel =
    !a ? "Not started"
    : a.status === "draft" ? "Draft in progress"
    : a.status === "published" ? "Published — awaiting verification"
    : a.status === "verified" ? "Verified"
    : a.status === "rejected" ? "Changes requested"
    : a.status;

  return (
    <div className="card-soft flex flex-wrap items-center gap-8 p-6">
      <ScoreRing score={b.biosphere_score == null ? null : Number(b.biosphere_score)} size={120} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Assessment status</p>
        <p className="mt-1 font-display text-xl font-semibold">{statusLabel}</p>
        {a?.review_notes && a.status === "rejected" && (
          <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Reviewer notes: {a.review_notes}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Your score publishes as self-assessed the moment you submit, then the Biosphere team
          verifies your evidence. Reassess annually to keep it current.
        </p>
        <Link to="/business/$slug" params={{ slug: b.slug }} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          View your public profile →
        </Link>
      </div>
    </div>
  );
}

function BusinessForm({
  categories,
  existing,
  onSaved,
}: {
  categories: { id: string; name: string }[];
  existing?: Workspace["business"];
  onSaved: () => void;
}) {
  const saveFn = useServerFn(upsertMyBusiness);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    tagline: existing?.tagline ?? "",
    description: existing?.description ?? "",
    category_id: existing?.category_id ?? "",
    parish: existing?.parish ?? "",
    address: existing?.address ?? "",
    website: existing?.website ?? "",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
  });
  const mutation = useMutation({
    mutationFn: () =>
      saveFn({ data: { ...form, category_id: form.category_id || null } }),
    onSuccess: onSaved,
  });

  const input = "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <form
      className="card-soft mt-8 grid gap-4 p-6 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="sm:col-span-2">
        <h2 className="font-display text-xl font-semibold">{existing ? "Business details" : "Create your business profile"}</h2>
      </div>
      <div>
        <label htmlFor="b-name" className="text-sm font-medium">Business name *</label>
        <input id="b-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="b-category" className="text-sm font-medium">Category</label>
        <select id="b-category" value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={input}>
          <option value="">Choose a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="b-tagline" className="text-sm font-medium">Tagline</label>
        <input id="b-tagline" value={form.tagline ?? ""} maxLength={160} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="b-desc" className="text-sm font-medium">Description</label>
        <textarea id="b-desc" rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="b-parish" className="text-sm font-medium">Town / parish</label>
        <input id="b-parish" value={form.parish ?? ""} onChange={(e) => setForm({ ...form, parish: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="b-address" className="text-sm font-medium">Address</label>
        <input id="b-address" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="b-website" className="text-sm font-medium">Website</label>
        <input id="b-website" type="url" placeholder="https://" value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="b-email" className="text-sm font-medium">Public email</label>
        <input id="b-email" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="b-phone" className="text-sm font-medium">Phone</label>
        <input id="b-phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
      </div>
      <div className="flex items-end sm:col-span-2">
        <button type="submit" disabled={mutation.isPending} className="btn-hero rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-60">
          {mutation.isPending ? "Saving…" : existing ? "Save changes" : "Create profile"}
        </button>
        {mutation.isError && <p role="alert" className="ml-4 text-sm text-destructive">{(mutation.error as Error).message}</p>}
      </div>
    </form>
  );
}

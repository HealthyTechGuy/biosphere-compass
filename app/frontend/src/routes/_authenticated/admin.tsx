import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getAdminData, reviewAssessment, updateDimension, updateBusinessFlags } from "@/lib/admin.functions";
import { ScoreChip } from "@/components/score/ScoreRing";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Biosphere Beacons" }] }),
  component: AdminPage,
});

const TABS = ["Verification", "Businesses", "Compass", "Users", "Audit log"] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  const queryClient = useQueryClient();
  const fetchAdmin = useServerFn(getAdminData);
  const reviewFn = useServerFn(reviewAssessment);
  const dimFn = useServerFn(updateDimension);
  const flagsFn = useServerFn(updateBusinessFlags);
  const [tab, setTab] = useState<Tab>("Verification");

  const { data, isLoading, error } = useQuery({ queryKey: ["admin"], queryFn: () => fetchAdmin() });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });
  const review = useMutation({
    mutationFn: (v: { assessmentId: string; decision: "verify" | "reject"; notes?: string }) => reviewFn({ data: v }),
    onSuccess: refresh,
  });
  const saveDim = useMutation({
    mutationFn: (v: { id: string; weight: number }) => dimFn({ data: v }),
    onSuccess: refresh,
  });
  const flags = useMutation({
    mutationFn: (v: { id: string; featured?: boolean; published?: boolean }) => flagsFn({ data: v }),
    onSuccess: refresh,
  });

  if (isLoading) return <div className="px-4 py-20 text-center text-muted-foreground">Loading admin data…</div>;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account doesn't have the admin role yet. Ask the platform owner to grant it.
        </p>
      </div>
    );
  }

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Name", "Parish", "Category", "Biosphere Score", "Verified", "Published", "Last assessed"],
      ...data.businesses.map((b: any) => [
        b.name, b.parish ?? "", b.category?.name ?? "", b.biosphere_score ?? "", b.verified, b.published, b.last_assessed_at ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c: unknown) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "biosphere-directory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Admin dashboard</h1>
        <button onClick={exportCsv} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
          Export CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent border border-border"
            }`}
          >
            {t}
            {t === "Verification" && data.queue.length > 0 && (
              <span className="ml-2 rounded-full bg-white/25 px-1.5 text-xs">{data.queue.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Verification" && (
          <div className="space-y-3">
            {data.queue.length === 0 && <p className="text-muted-foreground">No assessments awaiting verification. 🎉</p>}
            {data.queue.map((a: any) => (
              <div key={a.id} className="card-soft flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <Link to="/business/$slug" params={{ slug: a.business.slug }} className="font-semibold text-primary hover:underline">
                    {a.business.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {a.business.parish} · submitted {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("en-GB") : "—"}
                  </p>
                </div>
                <ScoreChip score={a.overall_score == null ? null : Number(a.overall_score)} />
                <div className="flex gap-2">
                  <button
                    onClick={() => review.mutate({ assessmentId: a.id, decision: "verify" })}
                    disabled={review.isPending}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      const notes = window.prompt("Feedback for the business (optional):") ?? undefined;
                      review.mutate({ assessmentId: a.id, decision: "reject", notes });
                    }}
                    disabled={review.isPending}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-60"
                  >
                    Request changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Businesses" && (
          <div className="card-soft overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Parish</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Published</th>
                </tr>
              </thead>
              <tbody>
                {data.businesses.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.parish}</td>
                    <td className="px-4 py-3">{b.biosphere_score == null ? "–" : Math.round(Number(b.biosphere_score))}</td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={b.featured}
                        aria-label={`Feature ${b.name}`}
                        onChange={(e) => flags.mutate({ id: b.id, featured: e.target.checked })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={b.published}
                        aria-label={`Publish ${b.name}`}
                        onChange={(e) => flags.mutate({ id: b.id, published: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Compass" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Adjust dimension weights — the scoring engine recalculates future submissions automatically.
            </p>
            {data.dimensions.map((d: any) => (
              <div key={d.id} className="card-soft flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  Weight
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="10"
                    defaultValue={Number(d.weight)}
                    aria-label={`Weight for ${d.name}`}
                    onBlur={(e) => {
                      const w = Number(e.target.value);
                      if (!Number.isNaN(w) && w !== Number(d.weight)) saveDim.mutate({ id: d.id, weight: w });
                    }}
                    className="w-24 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {data.questions.length} assessment questions are configured. Replace the example questions
              with the official Compass question set when ready.
            </p>
          </div>
        )}

        {tab === "Users" && (
          <div className="card-soft overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">{u.display_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Audit log" && (
          <ul className="space-y-2">
            {data.audit.length === 0 && <p className="text-muted-foreground">No audit entries yet.</p>}
            {data.audit.map((e: any) => (
              <li key={e.id} className="card-soft flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="font-medium">{e.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("en-GB")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Result {
  slug: string;
  name: string;
  parish: string | null;
  biosphere_score: number | null;
}

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const term = `%${q.trim()}%`;
      const { data } = await supabase
        .from("businesses")
        .select("slug,name,parish,biosphere_score")
        .or(`name.ilike.${term},parish.ilike.${term},description.ilike.${term},tagline.ilike.${term}`)
        .eq("published", true)
        .order("biosphere_score", { ascending: false })
        .limit(6);
      setResults(data ?? []);
      setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full sm:w-64">
      <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setOpen(false);
              navigate({ to: "/directory", search: { q } });
            }
          }}
          placeholder="Search businesses, towns…"
          aria-label="Search the directory"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {results.map((r) => (
            <li key={r.slug}>
              <button
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setOpen(false);
                  setQ("");
                  navigate({ to: "/business/$slug", params: { slug: r.slug } });
                }}
              >
                <span>
                  <span className="font-medium">{r.name}</span>
                  {r.parish && <span className="ml-2 text-xs text-muted-foreground">{r.parish}</span>}
                </span>
                {r.biosphere_score != null && (
                  <span className="text-xs font-semibold text-primary">{Math.round(r.biosphere_score)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

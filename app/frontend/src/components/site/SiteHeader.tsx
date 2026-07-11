import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { isDemoMode, setDemoMode, subscribeDemoMode } from "@/lib/demo-mode";

const NAV = [
  { to: "/directory", label: "Directory" },
  { to: "/score", label: "The Biosphere Score" },
  { to: "/analytics", label: "Analytics" },
] as const;

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const refresh = () => {
      if (isDemoMode()) {
        setSignedIn(true);
        return;
      }
      supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    };
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isDemoMode()) return; // demo overrides real Supabase events
      setSignedIn(!!session);
    });
    const unsubDemo = subscribeDemoMode(refresh);
    return () => {
      sub.subscription.unsubscribe();
      unsubDemo();
    };
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    if (isDemoMode()) {
      setDemoMode(false);
    } else {
      await supabase.auth.signOut();
    }
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Biosphere Directory home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="hidden font-display text-lg font-semibold leading-tight sm:block">
            Biosphere Directory
            <span className="block text-[11px] font-normal tracking-wide text-muted-foreground">
              Isle of Man · UNESCO Biosphere
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "rounded-lg px-3 py-2 text-sm font-medium bg-accent text-accent-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <GlobalSearch />
          </div>
          {signedIn ? (
            <>
              <Link
                to="/dashboard"
                className="hidden rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent md:inline-flex"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="btn-hero hidden rounded-xl px-4 py-2 text-sm font-semibold md:inline-flex"
            >
              For businesses
            </Link>
          )}
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-foreground md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="pb-2">
            <GlobalSearch />
          </div>
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            {signedIn ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-primary hover:bg-accent"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="rounded-lg px-3 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                For businesses — join the directory
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

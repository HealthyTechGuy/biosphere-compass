// Client-side demo login flag. Purely local — bypasses Supabase so the
// dashboard can render for a demo user without any backend account.

const KEY = "biosphere-demo-mode";
const EVENT = "biosphere-demo-mode-changed";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "true";
}

export function setDemoMode(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(KEY, "true");
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeDemoMode(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/demo-mode";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Client-side demo bypass — no backend call.
    if (isDemoMode()) {
      return { user: { id: "demo-user", email: "test@test.com" } as unknown as Awaited<
        ReturnType<typeof supabase.auth.getUser>
      >["data"]["user"] };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});

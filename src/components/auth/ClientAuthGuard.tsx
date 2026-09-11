import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { claimPendingTripComposerSession } from "@/lib/tripComposerClaim";

type GuardState = "checking" | "allowed" | "denied";

export function ClientAuthGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuardState>("checking");
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const validate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) setState("denied");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (roleError || roleData?.role !== "user") {
        if (roleData?.role === "admin") await supabase.auth.signOut();
        if (active) setState("denied");
        return;
      }

      try {
        await claimPendingTripComposerSession();
      } catch (error) {
        console.warn("Trip Composer claim deferred", error);
      }

      if (active) setState("allowed");
    };

    void validate();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && active) setState("denied");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (state === "checking") {
    return (
      <div className="min-h-screen bg-background grid place-items-center" aria-label="Validando acesso">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/cliente" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

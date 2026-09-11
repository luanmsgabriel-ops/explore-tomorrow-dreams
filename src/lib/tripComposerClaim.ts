import { supabase } from "@/integrations/supabase/client";

const ACCESS_TOKEN_KEY = "tomorrow_trip_composer_access_token";

export type TripComposerClaimResult = {
  claimed: boolean;
  status?: "claimed" | "already_claimed";
  sessionId?: string;
};

export async function claimPendingTripComposerSession(): Promise<TripComposerClaimResult> {
  if (typeof window === "undefined") return { claimed: false };
  const accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return { claimed: false };

  const { data, error } = await supabase.functions.invoke("trip-composer-claim", {
    body: { access_token: accessToken },
  });

  if (error) throw error;
  if (!data?.ok) {
    if (data?.error === "session_not_found") {
      window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      return { claimed: false };
    }
    throw new Error(String(data?.error || "trip_composer_claim_failed"));
  }

  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  return {
    claimed: true,
    status: data.status,
    sessionId: data.session_id,
  };
}

import { supabase } from "@/integrations/supabase/client";

export type RadarAlertType = "new_match" | "offer_changed";
export type RadarAlert = {
  id: string;
  radar_id: string;
  match_id: string | null;
  offer_id: string;
  alert_type: RadarAlertType;
  match_class: "exact" | "flexible" | "discovery" | null;
  score: number | null;
  offer_snapshot: Record<string, unknown>;
  reason: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export async function listMyRadarAlerts(limit = 100) {
  const { data, error } = await supabase
    .from("travel_radar_alerts")
    .select("id,radar_id,match_id,offer_id,alert_type,match_class,score,offer_snapshot,reason,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RadarAlert[];
}

export async function countUnreadRadarAlerts() {
  const { count, error } = await supabase
    .from("travel_radar_alerts")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markRadarAlertRead(alertId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase.from("travel_radar_alerts").update({ read_at: now, updated_at: now }).eq("id", alertId).is("read_at", null);
  if (error) throw error;
}

export async function markAllRadarAlertsRead() {
  const now = new Date().toISOString();
  const { error } = await supabase.from("travel_radar_alerts").update({ read_at: now, updated_at: now }).is("read_at", null);
  if (error) throw error;
}

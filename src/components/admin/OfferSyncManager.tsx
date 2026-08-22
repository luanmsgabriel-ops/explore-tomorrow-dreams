import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TravelOfferCurationManager } from "@/components/admin/TravelOfferCurationManager";

type SyncLog = {
  started_at: string;
  status: string;
  offers_created: number | null;
  offers_updated: number | null;
  offers_found: number | null;
  offers_deactivated: number | null;
};

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Erro desconhecido";

export const OfferSyncManager = () => {
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLastSync = async () => {
    const { data, error } = await supabase
      .from("travel_sync_logs")
      .select("started_at, status, offers_created, offers_updated, offers_found, offers_deactivated")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) setLastSync(data as SyncLog | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchLastSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("travel-offers-sync");

      if (error) throw error;

      toast.success(`Sincronização concluída: ${data.found} ofertas encontradas!`);
      fetchLastSync();
    } catch (error: unknown) {
      console.error("Sync trigger error:", error);
      toast.error(`Falha na sincronização: ${errorMessage(error)}`);
      fetchLastSync();
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-black/40 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
            Coletor de Ofertas
          </CardTitle>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-primary hover:bg-primary/80 text-primary-foreground"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
          </Button>
        </CardHeader>
        <CardContent>
          {lastSync ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Última Execução</p>
                  <p className="text-sm font-medium text-white">
                    {format(new Date(lastSync.started_at), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                {lastSync.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium text-white capitalize">
                    {lastSync.status === 'success' ? 'Sucesso' : lastSync.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Novas / Atualizadas</p>
                  <p className="text-sm font-medium text-white">
                    {lastSync.offers_created ?? 0} / {lastSync.offers_updated ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Encontradas / Desativadas</p>
                  <p className="text-sm font-medium text-white">
                    {lastSync.offers_found ?? 0} / {lastSync.offers_deactivated ?? 0}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhuma sincronização realizada ainda.</p>
          )}
        </CardContent>
      </Card>

      <TravelOfferCurationManager />
    </div>
  );
};
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Users, 
  FileText,
  Image,
  Map,
  Phone,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsData {
  totalPageViews: number;
  uniqueSessions: number;
  topPages: { page_path: string; count: number }[];
  topDestinations: { name: string; views: number; quotes: number }[];
  eventCounts: Record<string, number>;
  dailyViews: { date: string; views: number; sessions: number }[];
  conversionFunnel: { step: string; count: number; rate: number }[];
}

export const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7); // days

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), dateRange)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      // Fetch all events in date range
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!events || events.length === 0) {
        setData({
          totalPageViews: 0,
          uniqueSessions: 0,
          topPages: [],
          topDestinations: [],
          eventCounts: {},
          dailyViews: [],
          conversionFunnel: [],
        });
        return;
      }

      // Calculate metrics
      const pageViews = events.filter(e => e.event_type === 'page_view');
      const uniqueSessions = new Set(events.map(e => e.session_id)).size;

      // Top pages
      const pageCountMap: Record<string, number> = {};
      pageViews.forEach(e => {
        const path = e.page_path || '/';
        pageCountMap[path] = (pageCountMap[path] || 0) + 1;
      });
      const topPages = Object.entries(pageCountMap)
        .map(([page_path, count]) => ({ page_path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top destinations (from destination_view and quote events)
      const destinationMap: Record<string, { views: number; quotes: number }> = {};
      events.forEach(e => {
        if (e.event_type === 'destination_view' || e.event_type === 'quote_submit') {
          const eventData = e.event_data as Record<string, unknown>;
          const name = (eventData?.destination_name as string) || 'Desconhecido';
          if (!destinationMap[name]) destinationMap[name] = { views: 0, quotes: 0 };
          if (e.event_type === 'destination_view') destinationMap[name].views++;
          if (e.event_type === 'quote_submit') destinationMap[name].quotes++;
        }
      });
      const topDestinations = Object.entries(destinationMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => (b.views + b.quotes) - (a.views + a.quotes))
        .slice(0, 10);

      // Event counts by type
      const eventCounts: Record<string, number> = {};
      events.forEach(e => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });

      // Daily views
      const dailyMap: Record<string, { views: number; sessions: string[] }> = {};
      pageViews.forEach(e => {
        const day = format(new Date(e.created_at), 'yyyy-MM-dd');
        if (!dailyMap[day]) dailyMap[day] = { views: 0, sessions: [] };
        dailyMap[day].views++;
        if (e.session_id && !dailyMap[day].sessions.includes(e.session_id)) {
          dailyMap[day].sessions.push(e.session_id);
        }
      });
      const dailyViews = Object.entries(dailyMap)
        .map(([date, stats]) => ({ date, views: stats.views, sessions: stats.sessions.length }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Conversion funnel
      const funnelSteps = [
        { step: 'Visitantes', count: uniqueSessions },
        { step: 'Viram Destino', count: eventCounts['destination_view'] || 0 },
        { step: 'Iniciaram Cotação', count: eventCounts['quote_start'] || 0 },
        { step: 'Enviaram Cotação', count: eventCounts['quote_submit'] || 0 },
        { step: 'Clicaram WhatsApp', count: eventCounts['whatsapp_click'] || 0 },
      ];
      const conversionFunnel = funnelSteps.map((step, i) => ({
        ...step,
        rate: i === 0 ? 100 : funnelSteps[0].count > 0 ? Math.round((step.count / funnelSteps[0].count) * 100) : 0
      }));

      setData({
        totalPageViews: pageViews.length,
        uniqueSessions,
        topPages,
        topDestinations,
        eventCounts,
        dailyViews,
        conversionFunnel,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view': return <Eye className="w-4 h-4" />;
      case 'destination_view': return <Map className="w-4 h-4" />;
      case 'quote_start': return <FileText className="w-4 h-4" />;
      case 'quote_submit': return <FileText className="w-4 h-4 text-primary" />;
      case 'whatsapp_click': return <Phone className="w-4 h-4 text-primary" />;
      case 'offer_view': return <TrendingUp className="w-4 h-4" />;
      case 'search': return <MousePointer className="w-4 h-4" />;
      case 'itinerary_generate': return <Map className="w-4 h-4" />;
      case 'image_generate': return <Image className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      page_view: 'Visualizações',
      destination_view: 'Destinos Vistos',
      quote_start: 'Cotações Iniciadas',
      quote_submit: 'Cotações Enviadas',
      whatsapp_click: 'Cliques WhatsApp',
      offer_view: 'Ofertas Vistas',
      search: 'Buscas',
      itinerary_generate: 'Roteiros Gerados',
      image_generate: 'Imagens Geradas',
    };
    return labels[eventType] || eventType;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Erro ao carregar analytics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Analytics & Insights
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={14}>Últimos 14 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.totalPageViews.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs">Visualizações</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.uniqueSessions.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs">Sessões Únicas</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-light/20 to-teal-light/5 border border-teal-light/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-light/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-light" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.eventCounts['quote_submit'] || 0}</p>
              <p className="text-muted-foreground text-xs">Cotações Enviadas</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.eventCounts['whatsapp_click'] || 0}</p>
              <p className="text-muted-foreground text-xs">Cliques WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="p-4 bg-secondary border-b border-border">
          <h2 className="font-serif text-xl font-bold text-foreground">Funil de Conversão</h2>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {data.conversionFunnel.map((step, index) => (
              <div key={step.step} className="flex items-center gap-4">
                <div className="w-32 text-sm text-muted-foreground">{step.step}</div>
                <div className="flex-1">
                  <div className="h-8 bg-secondary rounded-lg overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                      style={{ width: `${step.rate}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-sm font-medium text-foreground">{step.count}</span>
                      <span className="text-sm text-muted-foreground">{step.rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-secondary border-b border-border">
            <h2 className="font-serif text-xl font-bold text-foreground">Páginas Mais Visitadas</h2>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {data.topPages.length > 0 ? (
              data.topPages.map((page, index) => (
                <div key={page.page_path} className="p-3 flex items-center justify-between hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground truncate max-w-48">{page.page_path}</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{page.count}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-secondary border-b border-border">
            <h2 className="font-serif text-xl font-bold text-foreground">Destinos Mais Procurados</h2>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {data.topDestinations.length > 0 ? (
              data.topDestinations.map((dest, index) => (
                <div key={dest.name} className="p-3 flex items-center justify-between hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-medium text-accent">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground">{dest.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{dest.views} views</span>
                    {dest.quotes > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary">
                        {dest.quotes} cotações
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Events */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="p-4 bg-secondary border-b border-border">
          <h2 className="font-serif text-xl font-bold text-foreground">Todos os Eventos</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.eventCounts).map(([eventType, count]) => (
            <div key={eventType} className="p-3 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                {getEventIcon(eventType)}
                <span className="text-lg font-semibold text-foreground">{count}</span>
              </div>
              <p className="text-xs text-muted-foreground">{getEventLabel(eventType)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Chart */}
      {data.dailyViews.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-secondary border-b border-border">
            <h2 className="font-serif text-xl font-bold text-foreground">Visualizações Diárias</h2>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-1 h-40">
              {data.dailyViews.map((day) => {
                const maxViews = Math.max(...data.dailyViews.map(d => d.views));
                const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="w-full max-w-8 bg-gradient-to-t from-primary/60 to-primary rounded-t transition-all group-hover:from-primary/80 group-hover:to-primary"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <div className="absolute -top-8 bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {day.views} views • {day.sessions} sessões
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(day.date), 'dd/MM', { locale: ptBR })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
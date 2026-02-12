import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, Eye, MousePointer, TrendingUp, Users, FileText,
  Image, Map, Phone, Loader2, RefreshCw, Tag, ArrowRight,
  Clock, Globe, Smartphone, Monitor, Search, Sparkles, MapPin
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RawEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  referrer: string | null;
  user_agent: string | null;
  session_id: string | null;
  ip_hash: string | null;
  user_id: string | null;
  created_at: string;
}

interface SessionFlow {
  sessionId: string;
  events: RawEvent[];
  startTime: string;
  endTime: string;
  duration: number;
  pageCount: number;
  device: string;
  referrer: string;
  city: string;
  converted: boolean;
  offersViewed: string[];
  offersClicked: string[];
  destinationsViewed: string[];
  searchQueries: string[];
}

interface OfferStats {
  offerId: string;
  offerTitle: string;
  destinationName: string;
  views: number;
  clicks: number;
  ctr: number;
  sources: Record<string, number>;
}

export const AnalyticsDashboard = () => {
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), dateRange)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setEvents((data as RawEvent[]) || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [dateRange]);

  // === Computed Data ===

  const pageViews = events.filter(e => e.event_type === 'page_view');
  const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean));
  const eventCounts: Record<string, number> = {};
  events.forEach(e => { eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1; });

  // Session flows
  const sessionFlows: SessionFlow[] = (() => {
    const sessionMap: Record<string, RawEvent[]> = {};
    events.forEach(e => {
      if (!e.session_id) return;
      if (!sessionMap[e.session_id]) sessionMap[e.session_id] = [];
      sessionMap[e.session_id].push(e);
    });

    return Object.entries(sessionMap).map(([sessionId, evts]) => {
      const sorted = [...evts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const startTime = sorted[0].created_at;
      const endTime = sorted[sorted.length - 1].created_at;
      const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
      
      const ua = sorted[0].user_agent || '';
      const device = /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
      const referrer = sorted[0].referrer || 'Direto';
      const firstData = sorted[0].event_data as Record<string, unknown> | null;
      const city = [(firstData?.geo_city as string) || '', (firstData?.geo_region as string) || ''].filter(Boolean).join(', ') || 'Desconhecido';

      const offersViewed: string[] = [];
      const offersClicked: string[] = [];
      const destinationsViewed: string[] = [];
      const searchQueries: string[] = [];
      let converted = false;

      sorted.forEach(e => {
        const data = e.event_data as Record<string, unknown> | null;
        if (e.event_type === 'offer_view' && data?.offer_title) {
          const title = data.offer_title as string;
          if (!offersViewed.includes(title)) offersViewed.push(title);
        }
        if (e.event_type === 'offer_click' && data?.offer_title) {
          const title = data.offer_title as string;
          if (!offersClicked.includes(title)) offersClicked.push(title);
        }
        if (e.event_type === 'destination_view' && data?.destination_name) {
          const name = data.destination_name as string;
          if (!destinationsViewed.includes(name)) destinationsViewed.push(name);
        }
        if (e.event_type === 'search' && data?.query) {
          searchQueries.push(data.query as string);
        }
        if (e.event_type === 'quote_submit' || e.event_type === 'whatsapp_click') {
          converted = true;
        }
      });

      return {
        sessionId,
        events: sorted,
        startTime, endTime, duration,
        pageCount: sorted.filter(e => e.event_type === 'page_view').length,
        device, referrer, city, converted,
        offersViewed, offersClicked, destinationsViewed, searchQueries,
      };
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  })();

  // Offer stats
  const offerStats: OfferStats[] = (() => {
    const offerMap: Record<string, OfferStats> = {};
    events.forEach(e => {
      if (e.event_type !== 'offer_view' && e.event_type !== 'offer_click') return;
      const data = e.event_data as Record<string, unknown> | null;
      if (!data?.offer_id) return;
      const id = data.offer_id as string;
      if (!offerMap[id]) {
        offerMap[id] = {
          offerId: id,
          offerTitle: (data.offer_title as string) || 'Sem título',
          destinationName: (data.destination_name as string) || 'N/A',
          views: 0, clicks: 0, ctr: 0,
          sources: {},
        };
      }
      if (e.event_type === 'offer_view') {
        offerMap[id].views++;
        const source = (data.source as string) || 'unknown';
        offerMap[id].sources[source] = (offerMap[id].sources[source] || 0) + 1;
      }
      if (e.event_type === 'offer_click') offerMap[id].clicks++;
    });

    return Object.values(offerMap).map(o => ({
      ...o,
      ctr: o.views > 0 ? Math.round((o.clicks / o.views) * 100) : 0,
    })).sort((a, b) => b.views - a.views);
  })();

  // Top pages
  const topPages = (() => {
    const map: Record<string, number> = {};
    pageViews.forEach(e => { const p = e.page_path || '/'; map[p] = (map[p] || 0) + 1; });
    return Object.entries(map).map(([page_path, count]) => ({ page_path, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  })();

  // Top destinations
  const topDestinations = (() => {
    const map: Record<string, { views: number; quotes: number }> = {};
    events.forEach(e => {
      if (e.event_type !== 'destination_view' && e.event_type !== 'quote_submit') return;
      const data = e.event_data as Record<string, unknown> | null;
      const name = (data?.destination_name as string) || 'Desconhecido';
      if (!map[name]) map[name] = { views: 0, quotes: 0 };
      if (e.event_type === 'destination_view') map[name].views++;
      if (e.event_type === 'quote_submit') map[name].quotes++;
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => (b.views + b.quotes) - (a.views + a.quotes)).slice(0, 10);
  })();

  // Top searches
  const topSearches = (() => {
    const map: Record<string, number> = {};
    events.filter(e => e.event_type === 'search').forEach(e => {
      const data = e.event_data as Record<string, unknown> | null;
      const q = (data?.query as string) || '';
      if (q) map[q.toLowerCase()] = (map[q.toLowerCase()] || 0) + 1;
    });
    return Object.entries(map).map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  })();

  // Daily views
  const dailyViews = (() => {
    const map: Record<string, { views: number; sessions: Set<string> }> = {};
    pageViews.forEach(e => {
      const day = format(new Date(e.created_at), 'yyyy-MM-dd');
      if (!map[day]) map[day] = { views: 0, sessions: new Set() };
      map[day].views++;
      if (e.session_id) map[day].sessions.add(e.session_id);
    });
    return Object.entries(map).map(([date, s]) => ({ date, views: s.views, sessions: s.sessions.size })).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Conversion funnel
  const conversionFunnel = (() => {
    const steps = [
      { step: 'Visitantes', count: uniqueSessions.size },
      { step: 'Viram Destino', count: eventCounts['destination_view'] || 0 },
      { step: 'Viram Oferta', count: eventCounts['offer_view'] || 0 },
      { step: 'Clicaram Oferta', count: eventCounts['offer_click'] || 0 },
      { step: 'Iniciaram Cotação', count: eventCounts['quote_start'] || 0 },
      { step: 'Enviaram Cotação', count: eventCounts['quote_submit'] || 0 },
      { step: 'WhatsApp', count: eventCounts['whatsapp_click'] || 0 },
    ];
    return steps.map((s, i) => ({
      ...s,
      rate: i === 0 ? 100 : steps[0].count > 0 ? Math.round((s.count / steps[0].count) * 100) : 0,
    }));
  })();

  // Device breakdown
  const deviceBreakdown = (() => {
    let mobile = 0, desktop = 0;
    const seen = new Set<string>();
    events.forEach(e => {
      if (!e.session_id || seen.has(e.session_id)) return;
      seen.add(e.session_id);
      const ua = e.user_agent || '';
      if (/Mobile|Android|iPhone/i.test(ua)) mobile++; else desktop++;
    });
    return { mobile, desktop };
  })();

  // Referrer breakdown
  const referrerBreakdown = (() => {
    const map: Record<string, number> = {};
    const seen = new Set<string>();
    events.forEach(e => {
      if (!e.session_id || seen.has(e.session_id)) return;
      seen.add(e.session_id);
      let ref = e.referrer || '';
      if (!ref || ref === '') ref = 'Direto';
      else {
        try { ref = new URL(ref).hostname; } catch { /* keep as is */ }
      }
      map[ref] = (map[ref] || 0) + 1;
    });
    return Object.entries(map).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  })();

  // City breakdown
  const cityBreakdown = (() => {
    const map: Record<string, { count: number; region: string; country: string }> = {};
    const seen = new Set<string>();
    events.forEach(e => {
      if (!e.session_id || seen.has(e.session_id)) return;
      seen.add(e.session_id);
      const data = e.event_data as Record<string, unknown> | null;
      const city = (data?.geo_city as string) || '';
      if (!city) return;
      const region = (data?.geo_region as string) || '';
      const country = (data?.geo_country as string) || '';
      const key = `${city}-${region}`;
      if (!map[key]) map[key] = { count: 0, region, country };
      map[key].count++;
    });
    return Object.entries(map).map(([key, v]) => ({ 
      city: key.split('-')[0], 
      region: v.region, 
      country: v.country, 
      count: v.count 
    })).sort((a, b) => b.count - a.count);
  })();

  // Filtered events for log
  const filteredEvents = eventFilter === 'all' ? events : events.filter(e => e.event_type === eventFilter);
  const uniqueEventTypes = [...new Set(events.map(e => e.event_type))].sort();

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, React.ReactNode> = {
      page_view: <Eye className="w-3.5 h-3.5" />,
      destination_view: <Map className="w-3.5 h-3.5" />,
      quote_start: <FileText className="w-3.5 h-3.5" />,
      quote_submit: <FileText className="w-3.5 h-3.5 text-primary" />,
      whatsapp_click: <Phone className="w-3.5 h-3.5 text-green-400" />,
      offer_view: <Tag className="w-3.5 h-3.5 text-accent" />,
      offer_click: <MousePointer className="w-3.5 h-3.5 text-accent" />,
      search: <Search className="w-3.5 h-3.5" />,
      itinerary_generate: <Sparkles className="w-3.5 h-3.5" />,
      image_generate: <Image className="w-3.5 h-3.5" />,
    };
    return icons[eventType] || <BarChart3 className="w-3.5 h-3.5" />;
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      page_view: 'Visualização', destination_view: 'Destino Visto', quote_start: 'Cotação Iniciada',
      quote_submit: 'Cotação Enviada', whatsapp_click: 'WhatsApp', offer_view: 'Oferta Vista',
      offer_click: 'Oferta Clicada', search: 'Busca', itinerary_generate: 'Roteiro IA',
      image_generate: 'Imagem IA',
    };
    return labels[eventType] || eventType;
  };

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      page_view: 'bg-muted text-muted-foreground',
      destination_view: 'bg-primary/10 text-primary',
      quote_start: 'bg-blue-500/10 text-blue-400',
      quote_submit: 'bg-green-500/10 text-green-400',
      whatsapp_click: 'bg-green-500/10 text-green-400',
      offer_view: 'bg-accent/10 text-accent',
      offer_click: 'bg-accent/20 text-accent',
      search: 'bg-purple-500/10 text-purple-400',
      itinerary_generate: 'bg-pink-500/10 text-pink-400',
      image_generate: 'bg-indigo-500/10 text-indigo-400',
    };
    return colors[eventType] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const avgSessionDuration = sessionFlows.length > 0 
    ? Math.round(sessionFlows.reduce((sum, s) => sum + s.duration, 0) / sessionFlows.length) 
    : 0;
  const conversionRate = uniqueSessions.size > 0 
    ? Math.round((sessionFlows.filter(s => s.converted).length / uniqueSessions.size) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Analytics Completo</h1>
        <div className="flex items-center gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm">
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button onClick={fetchAnalytics} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Visualizações', value: pageViews.length, icon: Eye, color: 'from-primary/20 to-primary/5 border-primary/20' },
          { label: 'Sessões', value: uniqueSessions.size, icon: Users, color: 'from-accent/20 to-accent/5 border-accent/20' },
          { label: 'Cotações', value: eventCounts['quote_submit'] || 0, icon: FileText, color: 'from-green-500/20 to-green-500/5 border-green-500/20' },
          { label: 'WhatsApp', value: eventCounts['whatsapp_click'] || 0, icon: Phone, color: 'from-green-500/20 to-green-500/5 border-green-500/20' },
          { label: 'Tempo Médio', value: formatDuration(avgSessionDuration), icon: Clock, color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20' },
          { label: 'Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: 'from-pink-500/20 to-pink-500/5 border-pink-500/20' },
        ].map(kpi => (
          <div key={kpi.label} className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} border`}>
            <div className="flex items-center gap-2">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Device, Referrer & City stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Dispositivos
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">{deviceBreakdown.desktop} Desktop</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">{deviceBreakdown.mobile} Mobile</span>
            </div>
          </div>
          {(deviceBreakdown.desktop + deviceBreakdown.mobile) > 0 && (
            <div className="mt-2 h-3 bg-secondary rounded-full overflow-hidden flex">
              <div className="bg-primary h-full" style={{ width: `${Math.round((deviceBreakdown.desktop / (deviceBreakdown.desktop + deviceBreakdown.mobile)) * 100)}%` }} />
              <div className="bg-accent h-full flex-1" />
            </div>
          )}
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Origens de Tráfego
          </h3>
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {referrerBreakdown.map(r => (
              <div key={r.source} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[200px]">{r.source}</span>
                <span className="font-medium text-foreground">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Cidades dos Visitantes
          </h3>
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {cityBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground">Dados de cidade serão coletados nos próximos acessos.</p>
            ) : (
              cityBreakdown.slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[180px]">{c.city}, {c.region}</span>
                  <span className="font-medium text-foreground">{c.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
          <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="offers" className="text-xs">Ofertas</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">Sessões / Fluxo</TabsTrigger>
          <TabsTrigger value="events" className="text-xs">Log de Eventos</TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Conversion Funnel */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-secondary border-b border-border">
              <h2 className="font-serif text-lg font-bold text-foreground">Funil de Conversão</h2>
            </div>
            <div className="p-4 space-y-2">
              {conversionFunnel.map(step => (
                <div key={step.step} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-muted-foreground">{step.step}</div>
                  <div className="flex-1">
                    <div className="h-7 bg-secondary rounded-lg overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500" style={{ width: `${step.rate}%` }} />
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        <span className="text-xs font-medium text-foreground">{step.count}</span>
                        <span className="text-xs text-muted-foreground">{step.rate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Pages */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="p-3 bg-secondary border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Páginas Mais Visitadas</h3>
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {topPages.map((page, i) => (
                  <div key={page.page_path} className="p-2.5 flex items-center justify-between hover:bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">{i + 1}</span>
                      <span className="text-xs text-foreground truncate max-w-[180px]">{page.page_path}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{page.count}</span>
                  </div>
                ))}
                {topPages.length === 0 && <div className="p-6 text-center text-muted-foreground text-xs">Sem dados</div>}
              </div>
            </div>

            {/* Top Destinations */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="p-3 bg-secondary border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Destinos Mais Procurados</h3>
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {topDestinations.map((dest, i) => (
                  <div key={dest.name} className="p-2.5 flex items-center justify-between hover:bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-medium text-accent">{i + 1}</span>
                      <span className="text-xs text-foreground">{dest.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{dest.views} views</span>
                      {dest.quotes > 0 && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary">{dest.quotes} cot.</span>}
                    </div>
                  </div>
                ))}
                {topDestinations.length === 0 && <div className="p-6 text-center text-muted-foreground text-xs">Sem dados</div>}
              </div>
            </div>
          </div>

          {/* Top Searches */}
          {topSearches.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="p-3 bg-secondary border-b border-border">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Search className="w-4 h-4" /> Buscas Mais Realizadas</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {topSearches.map(s => (
                  <span key={s.query} className="px-2.5 py-1 rounded-full bg-secondary border border-border text-xs text-foreground">
                    "{s.query}" <span className="text-muted-foreground ml-1">({s.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Daily Chart */}
          {dailyViews.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="p-3 bg-secondary border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Visualizações Diárias</h3>
              </div>
              <div className="p-4">
                <div className="flex items-end gap-1 h-36">
                  {dailyViews.map(day => {
                    const maxViews = Math.max(...dailyViews.map(d => d.views));
                    const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative w-full flex justify-center">
                          <div className="w-full max-w-8 bg-gradient-to-t from-primary/60 to-primary rounded-t transition-all group-hover:from-primary/80"
                            style={{ height: `${Math.max(height, 4)}%` }} />
                          <div className="absolute -top-8 bg-card border border-border rounded px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {day.views} views • {day.sessions} sessões
                          </div>
                        </div>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(day.date), 'dd/MM', { locale: ptBR })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* All Event Counts */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-3 bg-secondary border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Todos os Eventos</h3>
            </div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(eventCounts).map(([type, count]) => (
                <div key={type} className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {getEventIcon(type)}
                    <span className="text-base font-semibold text-foreground">{count}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{getEventLabel(type)}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ===== OFFERS TAB ===== */}
        <TabsContent value="offers" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-secondary border-b border-border">
              <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Tag className="w-5 h-5 text-accent" /> Performance das Ofertas
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Visualizações, cliques e taxa de conversão por oferta</p>
            </div>
            {offerStats.length > 0 ? (
              <div className="divide-y divide-border">
                {offerStats.map(offer => (
                  <div key={offer.offerId} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{offer.offerTitle}</h4>
                        <p className="text-xs text-muted-foreground">{offer.destinationName}</p>
                      </div>
                      <div className="flex items-center gap-4 text-center shrink-0">
                        <div>
                          <p className="text-lg font-bold text-foreground">{offer.views}</p>
                          <p className="text-[10px] text-muted-foreground">Views</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-accent">{offer.clicks}</p>
                          <p className="text-[10px] text-muted-foreground">Cliques</p>
                        </div>
                        <div>
                          <p className={`text-lg font-bold ${offer.ctr > 10 ? 'text-green-400' : 'text-foreground'}`}>{offer.ctr}%</p>
                          <p className="text-[10px] text-muted-foreground">CTR</p>
                        </div>
                      </div>
                    </div>
                    {/* Sources */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(offer.sources).map(([source, count]) => (
                        <span key={source} className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[10px] text-muted-foreground">
                          {source === 'popup_carousel' ? '🎠 Pop-up' : source === 'inline_carousel' ? '📋 Carrossel' : source === 'detail_page' ? '📄 Página' : source} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground text-sm">
                Nenhuma interação com ofertas nesse período
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== SESSIONS / FLOW TAB ===== */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-secondary border-b border-border">
              <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" /> Fluxo de Sessões
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {sessionFlows.length} sessões • Clique para ver o fluxo completo
              </p>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {sessionFlows.map(session => (
                <div key={session.sessionId}>
                  <button
                    onClick={() => setSelectedSession(selectedSession === session.sessionId ? null : session.sessionId)}
                    className="w-full p-3 hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {session.device === 'mobile' ? <Smartphone className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                        <span className="text-xs text-foreground font-medium">
                          {format(new Date(session.startTime), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{session.pageCount} pgs</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{formatDuration(session.duration)}</span>
                        {session.city !== 'Desconhecido' && (
                          <>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{session.city}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {session.converted && <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-medium">Converteu</span>}
                        {session.offersViewed.length > 0 && <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[10px]">{session.offersViewed.length} ofertas</span>}
                        {session.destinationsViewed.length > 0 && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{session.destinationsViewed.length} dest.</span>}
                        <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${selectedSession === session.sessionId ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {/* Quick tags */}
                    {(session.searchQueries.length > 0 || session.offersClicked.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {session.searchQueries.map((q, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">🔍 {q}</span>
                        ))}
                        {session.offersClicked.map((o, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[10px]">🖱️ {o}</span>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Expanded flow */}
                  {selectedSession === session.sessionId && (
                    <div className="bg-secondary/20 border-t border-border p-3">
                      <div className="text-[10px] text-muted-foreground mb-2">
                        Origem: <span className="text-foreground">{session.referrer}</span>
                      </div>
                      <div className="relative pl-4 space-y-0">
                        {session.events.map((evt, i) => {
                          const data = evt.event_data as Record<string, unknown> | null;
                          let detail = '';
                          if (evt.event_type === 'page_view') detail = evt.page_path || '/';
                          else if (evt.event_type === 'destination_view') detail = (data?.destination_name as string) || '';
                          else if (evt.event_type === 'offer_view') detail = `${(data?.offer_title as string) || ''} (${(data?.source as string) || ''})`;
                          else if (evt.event_type === 'offer_click') detail = (data?.offer_title as string) || '';
                          else if (evt.event_type === 'search') detail = `"${(data?.query as string) || ''}"`;
                          else if (evt.event_type === 'quote_submit') detail = (data?.destination_name as string) || '';
                          else if (evt.event_type === 'whatsapp_click') detail = (data?.context as string) || '';
                          else if (data) detail = JSON.stringify(data).slice(0, 60);

                          return (
                            <div key={evt.id} className="flex items-start gap-2 py-1 relative">
                              {/* Timeline line */}
                              {i < session.events.length - 1 && (
                                <div className="absolute left-[-8px] top-4 bottom-0 w-px bg-border" />
                              )}
                              <div className={`absolute left-[-12px] top-1.5 w-2 h-2 rounded-full border ${
                                evt.event_type === 'quote_submit' || evt.event_type === 'whatsapp_click' 
                                  ? 'bg-green-400 border-green-400' 
                                  : 'bg-secondary border-border'
                              }`} />
                              <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                                {format(new Date(evt.created_at), 'HH:mm')}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${getEventColor(evt.event_type)}`}>
                                {getEventIcon(evt.event_type)}
                                {getEventLabel(evt.event_type)}
                              </span>
                              {detail && <span className="text-[10px] text-muted-foreground truncate">{detail}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sessionFlows.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm">Nenhuma sessão registrada</div>}
            </div>
          </div>
        </TabsContent>

        {/* ===== EVENT LOG TAB ===== */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-secondary border-b border-border flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-serif text-lg font-bold text-foreground">Log de Eventos Detalhado</h2>
              <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}
                className="px-2 py-1 rounded bg-muted border border-border text-xs text-foreground">
                <option value="all">Todos ({events.length})</option>
                {uniqueEventTypes.map(t => (
                  <option key={t} value={t}>{getEventLabel(t)} ({eventCounts[t]})</option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filteredEvents.slice(0, 100).map(evt => {
                const data = evt.event_data as Record<string, unknown> | null;
                return (
                  <div key={evt.id} className="p-2.5 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground w-28 shrink-0">
                        {format(new Date(evt.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${getEventColor(evt.event_type)}`}>
                        {getEventIcon(evt.event_type)}
                        {getEventLabel(evt.event_type)}
                      </span>
                      {evt.page_path && <span className="text-[10px] text-muted-foreground">{evt.page_path}</span>}
                    </div>
                    {data && Object.keys(data).length > 0 && (
                      <div className="mt-1 ml-28 flex flex-wrap gap-1.5">
                        {Object.entries(data).map(([key, value]) => (
                          <span key={key} className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground">
                            <span className="text-foreground/60">{key}:</span> {String(value).slice(0, 40)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredEvents.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm">Nenhum evento encontrado</div>}
              {filteredEvents.length > 100 && <div className="p-3 text-center text-muted-foreground text-xs">Mostrando 100 de {filteredEvents.length} eventos</div>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

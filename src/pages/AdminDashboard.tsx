import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { DestinationManager } from '@/components/admin/DestinationManager';
import { ChatConversationsManager } from '@/components/admin/ChatConversationsManager';
import { PromotionalOffersManager } from '@/components/admin/PromotionalOffersManager';
import { ClientsManager } from '@/components/admin/ClientsManager';
import { TripManager } from '@/components/admin/TripManager';
import { DefaultChecklistManager } from '@/components/admin/DefaultChecklistManager';
import { StandaloneBannerGenerator } from '@/components/admin/StandaloneBannerGenerator';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ManualQuoteForm } from '@/components/admin/ManualQuoteForm';
import { QuoteEditForm } from '@/components/admin/QuoteEditForm';
import { SalesManager } from '@/components/admin/SalesManager';
import { Edit } from 'lucide-react';
import { 
  LayoutDashboard, 
  FileText, 
  Map, 
  Image, 
  LogOut, 
  Users,
  Mail,
  Phone,
  Clock,
  Eye,
  Loader2,
  UserPlus,
  Trash2,
  CheckCircle,
  Send,
  Globe,
  Download,
  Maximize2,
  X,
  MessageSquare,
  Tag,
  Heart,
  Sparkles,
  Plane,
  ListChecks,
  BarChart3,
  MessageCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'overview' | 'analytics' | 'sales' | 'quotes' | 'itineraries' | 'images' | 'users' | 'destinations' | 'conversations' | 'offers' | 'clients' | 'trips' | 'checklist' | 'banner-generator';

interface QuoteRequest {
  id: string;
  email: string;
  whatsapp: string;
  destination_name: string | null;
  destination_id: string | null;
  travel_date: string | null;
  num_people: string | null;
  travel_type: string | null;
  preferred_airport: string | null;
  flight_time_preference: string | null;
  traveling_with_children: boolean | null;
  special_requests: string | null;
  travel_word: string | null;
  preferred_contact_time: string | null;
  preferred_contact_channel: string | null;
  status: string;
  created_at: string;
  // New fields for manual quotes
  client_name: string | null;
  source_channel: string | null;
  follow_up_date: string | null;
  notes: string | null;
  is_manual: boolean | null;
}

interface SelectedActivity {
  day: string;
  title: string;
  description?: string;
}

interface AIItinerary {
  id: string;
  destination_name: string;
  user_email: string;
  user_whatsapp: string;
  created_at: string;
  status: string;
  quote_requested: boolean;
  quote_requested_at: string | null;
  preferences: string | null;
  itinerary_content: string;
  travel_mood: string | null;
  selected_activities: SelectedActivity[] | null;
}

interface AIImage {
  id: string;
  destination_name: string;
  prompt: string;
  image_url: string;
  created_at: string;
  user_email: string | null;
  user_whatsapp: string | null;
  status: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface UpcomingTrip {
  id: string;
  destination_name: string;
  departure_date: string;
  return_date: string;
  trip_status: string;
  flight_locator: string | null;
  client_name: string | null;
  client_email: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [itineraries, setItineraries] = useState<AIItinerary[]>([]);
  const [images, setImages] = useState<AIImage[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<AIItinerary | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [editingQuote, setEditingQuote] = useState<QuoteRequest | null>(null);
  const [selectedImage, setSelectedImage] = useState<AIImage | null>(null);
  
  // Overview stats
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [activeDestinations, setActiveDestinations] = useState(0);
  const [activeOffers, setActiveOffers] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  
  // New user form state
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
      return;
    }

    // Verify user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (roleData?.role !== 'admin') {
      toast.error('Acesso negado. Área exclusiva para administradores.');
      await supabase.auth.signOut();
      navigate('/cliente');
      return;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [quotesRes, itinerariesRes, imagesRes, usersRes, tripsRes, destinationsRes, offersRes, clientsRes] = await Promise.all([
        supabase.from('quote_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_itineraries').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_generated_images').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('client_trips').select(`
          id,
          destination_name,
          departure_date,
          return_date,
          trip_status,
          flight_locator,
          user_id
        `).gte('departure_date', today).order('departure_date', { ascending: true }).limit(10),
        supabase.from('destinations').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('promotional_offers').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('client_trips').select('id', { count: 'exact' }),
      ]);

      if (quotesRes.data) {
        setQuotes(quotesRes.data);
        setPendingQuotes(quotesRes.data.filter(q => q.status === 'pending').length);
      }
      if (itinerariesRes.data) {
        const typedItineraries = itinerariesRes.data.map(item => ({
          ...item,
          selected_activities: Array.isArray(item.selected_activities) 
            ? (item.selected_activities as unknown as SelectedActivity[])
            : null,
        }));
        setItineraries(typedItineraries);
      }
      if (imagesRes.data) setImages(imagesRes.data);
      if (usersRes.data) {
        setAdminUsers(usersRes.data);
        // Filter out admins to count only clients
        const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
        const adminUserIds = adminRoles?.map(r => r.user_id) || [];
        const clientCount = usersRes.data.filter(u => !adminUserIds.includes(u.user_id)).length;
        setTotalClients(clientCount);
      }
      
      // Fetch upcoming trips with client info
      if (tripsRes.data && tripsRes.data.length > 0) {
        const userIds = [...new Set(tripsRes.data.map(t => t.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds);
        
        const tripsWithClients: UpcomingTrip[] = tripsRes.data.map(trip => {
          const profile = profiles?.find(p => p.user_id === trip.user_id);
          return {
            id: trip.id,
            destination_name: trip.destination_name,
            departure_date: trip.departure_date,
            return_date: trip.return_date,
            trip_status: trip.trip_status,
            flight_locator: trip.flight_locator,
            client_name: profile?.full_name || null,
            client_email: profile?.email || 'Email não encontrado',
          };
        });
        setUpcomingTrips(tripsWithClients);
      }
      
      if (destinationsRes.count !== null) setActiveDestinations(destinationsRes.count);
      if (offersRes.count !== null) setActiveOffers(offersRes.count);
      if (clientsRes.count !== null) setTotalTrips(clientsRes.count);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/admin');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado');
        return;
      }

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserName,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Usuário criado com sucesso!');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setShowNewUserForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateItineraryStatus = async (itineraryId: string, newStatus: string) => {
    try {
      await supabase.from('ai_itineraries').update({ status: newStatus }).eq('id', itineraryId);
      toast.success('Status atualizado com sucesso!');
      fetchData();
      setSelectedItinerary(null);
    } catch (error) {
      console.error('Error updating itinerary status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      await supabase.from('quote_requests').update({ status: newStatus }).eq('id', quoteId);
      toast.success('Status atualizado com sucesso!');
      fetchData();
      setSelectedQuote(null);
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleUpdateImageStatus = async (imageId: string, newStatus: string) => {
    try {
      await supabase.from('ai_generated_images').update({ status: newStatus }).eq('id', imageId);
      toast.success('Status atualizado com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error updating image status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cotação?')) return;
    
    try {
      const { error } = await supabase.from('quote_requests').delete().eq('id', quoteId);
      if (error) throw error;
      toast.success('Cotação excluída com sucesso!');
      setSelectedQuote(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Erro ao excluir cotação');
    }
  };

  const handleDeleteItinerary = async (itineraryId: string) => {
    if (!confirm('Tem certeza que deseja excluir este roteiro?')) return;
    
    try {
      const { error } = await supabase.from('ai_itineraries').delete().eq('id', itineraryId);
      if (error) throw error;
      toast.success('Roteiro excluído com sucesso!');
      setSelectedItinerary(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast.error('Erro ao excluir roteiro');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;
    
    try {
      const { error } = await supabase.from('ai_generated_images').delete().eq('id', imageId);
      if (error) throw error;
      toast.success('Imagem excluída com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erro ao excluir imagem');
    }
  };

  const handleDownloadImage = async (imageUrl: string, destinationName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${destinationName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Erro ao baixar imagem');
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'sales' as TabType, label: 'Vendas', icon: DollarSign },
    { id: 'clients' as TabType, label: 'Clientes', icon: Users },
    { id: 'trips' as TabType, label: 'Viagens', icon: Plane },
    { id: 'checklist' as TabType, label: 'Checklist Padrão', icon: ListChecks },
    { id: 'destinations' as TabType, label: 'Destinos', icon: Globe },
    { id: 'offers' as TabType, label: 'Ofertas', icon: Tag },
    { id: 'banner-generator' as TabType, label: 'Gerar Banner', icon: Image },
    { id: 'quotes' as TabType, label: 'Cotações', icon: FileText },
    { id: 'itineraries' as TabType, label: 'Roteiros IA', icon: Map },
    { id: 'images' as TabType, label: 'Imagens IA', icon: Image },
    { id: 'conversations' as TabType, label: 'Conversas IA', icon: MessageSquare },
    { id: 'users' as TabType, label: 'Admins', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <div className="glass rounded-2xl p-4 sticky top-24">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="border-t border-border mt-4 pt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <h1 className="font-serif text-3xl font-bold text-foreground">
                        Visão Geral
                      </h1>

                      {/* Main Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button 
                          onClick={() => setActiveTab('clients')}
                          className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                              <p className="text-muted-foreground text-xs">Clientes</p>
                            </div>
                          </div>
                        </button>

                        <button 
                          onClick={() => setActiveTab('trips')}
                          className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plane className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{totalTrips}</p>
                              <p className="text-muted-foreground text-xs">Viagens</p>
                            </div>
                          </div>
                        </button>

                        <button 
                          onClick={() => setActiveTab('destinations')}
                          className="p-4 rounded-2xl bg-gradient-to-br from-teal-light/20 to-teal-light/5 border border-teal-light/20 hover:border-teal-light/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-light/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Globe className="w-5 h-5 text-teal-light" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{activeDestinations}</p>
                              <p className="text-muted-foreground text-xs">Destinos Ativos</p>
                            </div>
                          </div>
                        </button>

                        <button 
                          onClick={() => setActiveTab('offers')}
                          className="p-4 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border hover:border-accent/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Tag className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{activeOffers}</p>
                              <p className="text-muted-foreground text-xs">Ofertas Ativas</p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Secondary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button 
                          onClick={() => setActiveTab('quotes')}
                          className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <div>
                              <p className="text-lg font-semibold text-foreground">{quotes.length}</p>
                              <p className="text-muted-foreground text-xs">Cotações</p>
                            </div>
                          </div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('quotes')}
                          className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-accent/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                            <div>
                              <p className="text-lg font-semibold text-foreground">{pendingQuotes}</p>
                              <p className="text-muted-foreground text-xs">Pendentes</p>
                            </div>
                          </div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('itineraries')}
                          className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-teal-light/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <Map className="w-5 h-5 text-teal-light group-hover:scale-110 transition-transform" />
                            <div>
                              <p className="text-lg font-semibold text-foreground">{itineraries.length}</p>
                              <p className="text-muted-foreground text-xs">Roteiros IA</p>
                            </div>
                          </div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('images')}
                          className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <Image className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <div>
                              <p className="text-lg font-semibold text-foreground">{images.length}</p>
                              <p className="text-muted-foreground text-xs">Imagens IA</p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Analytics CTA */}
                      <button 
                        onClick={() => setActiveTab('analytics')}
                        className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-teal-light/10 border border-primary/20 hover:border-primary/40 transition-all text-left cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <BarChart3 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Analytics & Insights</p>
                              <p className="text-muted-foreground text-xs">Visualize comportamento dos clientes, funil de conversão e métricas</p>
                            </div>
                          </div>
                          <Eye className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>

                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="p-4 bg-secondary border-b border-border flex items-center justify-between">
                          <h2 className="font-serif text-xl font-bold text-foreground">Próximas Viagens</h2>
                          <span className="text-sm text-muted-foreground">{upcomingTrips.length} viagens</span>
                        </div>
                        <div className="divide-y divide-border">
                          {upcomingTrips.map((trip) => {
                            const departureDate = new Date(trip.departure_date + 'T12:00:00');
                            const now = new Date();
                            const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                            const isCheckinWindow = hoursUntilDeparture <= 48 && hoursUntilDeparture > 0;
                            const daysUntilDeparture = Math.ceil(hoursUntilDeparture / 24);
                            
                            return (
                              <div key={trip.id} className={`p-4 transition-colors ${isCheckinWindow ? 'bg-primary/5' : 'hover:bg-secondary/50'}`}>
                                {isCheckinWindow && (
                                  <div className="mb-3 px-3 py-2 rounded-lg bg-primary/20 border border-primary/30 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-xs font-medium text-primary">
                                      🎫 Check-in disponível! Voo em {Math.round(hoursUntilDeparture)}h - Localizador: {trip.flight_locator || 'N/A'}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCheckinWindow ? 'bg-primary/20' : 'bg-accent/10'}`}>
                                      <Plane className={`w-5 h-5 ${isCheckinWindow ? 'text-primary' : 'text-accent'}`} />
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">{trip.client_name || trip.client_email}</p>
                                      <p className="text-sm text-muted-foreground">{trip.destination_name}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-foreground">
                                        {new Date(trip.departure_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {daysUntilDeparture <= 0 ? 'Hoje' : daysUntilDeparture === 1 ? 'Amanhã' : `Em ${daysUntilDeparture} dias`}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      trip.trip_status === 'confirmed' ? 'bg-primary/20 text-primary' : 
                                      trip.trip_status === 'pending' ? 'bg-accent/20 text-accent' :
                                      trip.trip_status === 'completed' ? 'bg-muted text-muted-foreground' :
                                      'bg-secondary text-foreground'
                                    }`}>
                                      {trip.trip_status === 'confirmed' ? 'Confirmada' : 
                                       trip.trip_status === 'pending' ? 'Pendente' :
                                       trip.trip_status === 'completed' ? 'Concluída' :
                                       trip.trip_status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {upcomingTrips.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                              Nenhuma viagem próxima
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recent quotes */}
                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="p-4 bg-secondary border-b border-border">
                          <h2 className="font-serif text-xl font-bold text-foreground">Cotações Recentes</h2>
                        </div>
                        <div className="divide-y divide-border">
                          {quotes.slice(0, 5).map((quote) => {
                            // Check if follow-up is due or overdue
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const hasFollowUp = !!quote.follow_up_date;
                            const followUpDate = hasFollowUp ? new Date(quote.follow_up_date + 'T12:00:00') : null;
                            const isFollowUpToday = followUpDate && followUpDate.toDateString() === today.toDateString();
                            const isFollowUpOverdue = followUpDate && followUpDate < today;
                            const needsAlert = (isFollowUpToday || isFollowUpOverdue) && quote.status !== 'completed';
                            
                            return (
                              <div key={quote.id} className={`p-4 transition-colors ${needsAlert ? 'bg-destructive/5' : 'hover:bg-secondary/50'}`}>
                                {needsAlert && (
                                  <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/20 border border-destructive/30 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                    <span className="text-xs font-medium text-destructive">
                                      {isFollowUpOverdue ? '⚠️ Retorno vencido!' : '📅 Retornar hoje!'}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${needsAlert ? 'bg-destructive/20' : 'bg-primary/10'}`}>
                                      <Mail className={`w-5 h-5 ${needsAlert ? 'text-destructive' : 'text-primary'}`} />
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">{quote.client_name || quote.email.split('@')[0]}</p>
                                      <p className="text-sm text-muted-foreground">{quote.destination_name || 'Destino não especificado'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {hasFollowUp && (
                                      <div className="text-right">
                                        <p className={`text-xs ${needsAlert ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                          Retorno: {followUpDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </p>
                                      </div>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      quote.status === 'pending' ? 'bg-accent/20 text-accent' : 
                                      quote.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                      quote.status === 'quoted' ? 'bg-purple-500/20 text-purple-400' :
                                      quote.status === 'completed' ? 'bg-primary/20 text-primary' :
                                      'bg-muted text-muted-foreground'
                                    }`}>
                                      {quote.status === 'pending' ? 'Pendente' : 
                                       quote.status === 'in_progress' ? 'Em andamento' :
                                       quote.status === 'quoted' ? 'Cotado' :
                                       quote.status === 'completed' ? 'Finalizado' :
                                       quote.status}
                                    </span>
                                    <span className="text-sm text-muted-foreground">{formatDate(quote.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {quotes.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                              Nenhuma cotação recebida ainda
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <AnalyticsDashboard />
                  )}

                  {activeTab === 'sales' && (
                    <SalesManager />
                  )}

                  {activeTab === 'destinations' && (
                    <DestinationManager />
                  )}

                  {activeTab === 'offers' && (
                    <PromotionalOffersManager />
                  )}

{activeTab === 'quotes' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h1 className="font-serif text-3xl font-bold text-foreground">
                          Cotações
                        </h1>
                        <ManualQuoteForm onSuccess={fetchData} />
                      </div>

                      {/* Alertas de Follow-up */}
                      {quotes.filter(q => {
                        if (!q.follow_up_date) return false;
                        const followUp = new Date(q.follow_up_date + 'T12:00:00');
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return followUp <= today && q.status !== 'completed';
                      }).length > 0 && (
                        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                          <div className="flex items-center gap-2 text-accent font-medium mb-2">
                            <AlertCircle className="w-5 h-5" />
                            Retornos pendentes para hoje
                          </div>
                          <div className="space-y-2">
                            {quotes.filter(q => {
                              if (!q.follow_up_date) return false;
                              const followUp = new Date(q.follow_up_date + 'T12:00:00');
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return followUp <= today && q.status !== 'completed';
                            }).map(q => (
                              <div key={q.id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                <div>
                                  <span className="font-medium">{q.client_name || q.email}</span>
                                  <span className="text-muted-foreground"> - {q.destination_name}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const cleanPhone = q.whatsapp.replace(/\D/g, '');
                                    const message = encodeURIComponent(`Olá${q.client_name ? ` ${q.client_name}` : ''}! Tudo bem?\n\nEstou retornando sobre sua cotação para ${q.destination_name || 'sua viagem'}. Posso te ajudar com mais informações?`);
                                    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  WhatsApp
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Destino</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Canal</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data Viagem</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Retorno</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {quotes.map((quote) => {
                                const isFollowUpDue = quote.follow_up_date && (() => {
                                  const followUp = new Date(quote.follow_up_date + 'T12:00:00');
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return followUp <= today && quote.status !== 'completed';
                                })();
                                
                                const getChannelLabel = (channel: string | null) => {
                                  const channels: Record<string, string> = {
                                    website: 'Site',
                                    instagram: 'Instagram',
                                    facebook: 'Facebook',
                                    whatsapp_direct: 'WhatsApp',
                                    phone: 'Telefone',
                                    walk_in: 'Presencial',
                                    referral: 'Indicação',
                                    email: 'E-mail',
                                    other: 'Outro',
                                  };
                                  return channels[channel || 'website'] || channel || 'Site';
                                };

                                return (
                                  <tr key={quote.id} className={`hover:bg-secondary/30 ${isFollowUpDue ? 'bg-accent/5' : ''}`}>
                                    <td className="px-4 py-4">
                                      <div>
                                        <p className="font-medium text-foreground">
                                          {quote.client_name || quote.email}
                                          {quote.is_manual && (
                                            <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">Manual</span>
                                          )}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{quote.whatsapp}</p>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 text-foreground">{quote.destination_name || '-'}</td>
                                    <td className="px-4 py-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        quote.source_channel === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                                        quote.source_channel === 'facebook' ? 'bg-blue-600/20 text-blue-400' :
                                        quote.source_channel === 'whatsapp_direct' ? 'bg-green-500/20 text-green-400' :
                                        quote.source_channel === 'phone' ? 'bg-yellow-500/20 text-yellow-400' :
                                        quote.source_channel === 'referral' ? 'bg-purple-500/20 text-purple-400' :
                                        'bg-muted text-muted-foreground'
                                      }`}>
                                        {getChannelLabel(quote.source_channel)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-foreground">{quote.travel_date || '-'}</td>
                                    <td className="px-4 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        quote.status === 'pending' ? 'bg-accent/20 text-accent' : 
                                        quote.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                        quote.status === 'quoted' ? 'bg-purple-500/20 text-purple-400' :
                                        quote.status === 'completed' ? 'bg-primary/20 text-primary' :
                                        'bg-muted text-muted-foreground'
                                      }`}>
                                        {quote.status === 'pending' ? 'Pendente' : 
                                         quote.status === 'in_progress' ? 'Em andamento' :
                                         quote.status === 'quoted' ? 'Cotado' :
                                         quote.status === 'completed' ? 'Finalizado' :
                                         quote.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      {quote.follow_up_date ? (
                                        <span className={isFollowUpDue ? 'text-accent font-medium' : 'text-muted-foreground'}>
                                          {isFollowUpDue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                                          {formatDate(quote.follow_up_date)}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => {
                                            const cleanPhone = quote.whatsapp.replace(/\D/g, '');
                                            const message = encodeURIComponent(`Olá${quote.client_name ? ` ${quote.client_name}` : ''}! Tudo bem?\n\nSou da Tomorrow Travel e gostaria de falar sobre sua viagem para ${quote.destination_name || 'seu destino dos sonhos'}!`);
                                            window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
                                          }}
                                          className="p-2 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors"
                                          title="WhatsApp"
                                        >
                                          <MessageCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setEditingQuote(quote)}
                                          className="p-2 rounded-lg hover:bg-accent/10 text-accent transition-colors"
                                          title="Editar"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setSelectedQuote(quote)}
                                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                          title="Visualizar"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteQuote(quote.id)}
                                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {quotes.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                              Nenhuma cotação recebida ainda
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'itineraries' && (
                    <div className="space-y-6">
                      <h1 className="font-serif text-3xl font-bold text-foreground">
                        Roteiros Gerados com IA
                      </h1>

                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Destino</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Clima</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Seleções</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cotação</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {itineraries.map((itinerary) => (
                                <tr key={itinerary.id} className="hover:bg-secondary/30">
                                  <td className="px-4 py-4">
                                    <div>
                                      <p className="font-medium text-foreground">{itinerary.user_email}</p>
                                      <p className="text-sm text-muted-foreground">{itinerary.user_whatsapp}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-foreground">{itinerary.destination_name}</td>
                                  <td className="px-4 py-4">
                                    {itinerary.travel_mood ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-400">
                                        <Heart className="w-3 h-3" />
                                        {itinerary.travel_mood === 'romantica' ? 'Romântica' :
                                         itinerary.travel_mood === 'relaxante' ? 'Relaxante' :
                                         itinerary.travel_mood === 'aventura' ? 'Aventura' :
                                         itinerary.travel_mood === 'gastronomica' ? 'Gastronômica' :
                                         itinerary.travel_mood === 'cultural' ? 'Cultural' :
                                         itinerary.travel_mood === 'fotografica' ? 'Fotográfica' :
                                         itinerary.travel_mood}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    {itinerary.selected_activities && itinerary.selected_activities.length > 0 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                        <Sparkles className="w-3 h-3" />
                                        {itinerary.selected_activities.length} passeios
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Nenhum</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    {itinerary.quote_requested ? (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
                                        <Send className="w-3 h-3" />
                                        Solicitada
                                      </span>
                                    ) : (
                                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                        Não solicitada
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      itinerary.status === 'pending' 
                                        ? 'bg-accent/20 text-accent' 
                                        : itinerary.status === 'contacted'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-primary/20 text-primary'
                                    }`}>
                                      {itinerary.status === 'pending' ? 'Pendente' : 
                                       itinerary.status === 'contacted' ? 'Contatado' : 
                                       itinerary.status === 'completed' ? 'Concluído' : itinerary.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(itinerary.created_at)}</td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setSelectedItinerary(itinerary)}
                                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                        title="Visualizar"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItinerary(itinerary.id)}
                                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {itineraries.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                              Nenhum roteiro gerado ainda
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'images' && (
                    <div className="space-y-6">
                      <h1 className="font-serif text-3xl font-bold text-foreground">
                        Imagens Geradas com IA
                      </h1>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {images.map((image) => (
                          <div key={image.id} className="rounded-2xl border border-border overflow-hidden bg-card hover:border-primary/30 transition-colors">
                            <div className="aspect-square relative group cursor-pointer" onClick={() => setSelectedImage(image)}>
                              <img src={image.image_url} alt={image.destination_name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(image);
                                  }}
                                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                  title="Expandir"
                                >
                                  <Maximize2 className="w-5 h-5 text-white" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image_url, image.destination_name);
                                  }}
                                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-5 h-5 text-white" />
                                </button>
                              </div>
                            </div>
                            <div className="p-4 space-y-3">
                              <div>
                                <h3 className="font-medium text-foreground mb-1">{image.destination_name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{image.prompt}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(image.created_at)}</p>
                              </div>

                              {/* Contact Info */}
                              <div className="pt-2 border-t border-border space-y-1">
                                {image.user_email && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                    <a href={`mailto:${image.user_email}`} className="text-primary hover:underline truncate">
                                      {image.user_email}
                                    </a>
                                  </div>
                                )}
                                {image.user_whatsapp && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    <a href={`https://wa.me/${image.user_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                      {image.user_whatsapp}
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Status Badge and Download */}
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  image.status === 'pending' ? 'bg-accent/20 text-accent' : 
                                  image.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                  image.status === 'completed' ? 'bg-primary/20 text-primary' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {image.status === 'pending' ? 'Pendente' : 
                                   image.status === 'in_progress' ? 'Em andamento' :
                                   image.status === 'completed' ? 'Finalizado' :
                                   image.status}
                                </span>
                                <button
                                  onClick={() => handleDownloadImage(image.image_url, image.destination_name)}
                                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  title="Baixar imagem"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Status Actions */}
                              <div className="flex flex-wrap gap-2">
                                {image.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateImageStatus(image.id, 'in_progress')}
                                    className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Clock className="w-3 h-3" />
                                    Em Andamento
                                  </button>
                                )}
                                {(image.status === 'pending' || image.status === 'in_progress') && (
                                  <button
                                    onClick={() => handleUpdateImageStatus(image.id, 'completed')}
                                    className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Finalizado
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteImage(image.id)}
                                  className="px-2 py-1.5 text-xs rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Excluir
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {images.length === 0 && (
                          <div className="col-span-3 p-8 text-center text-muted-foreground rounded-2xl border border-border">
                            Nenhuma imagem gerada ainda
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'conversations' && (
                    <ChatConversationsManager />
                  )}

                  {activeTab === 'clients' && (
                    <ClientsManager />
                  )}

                  {activeTab === 'trips' && (
                    <TripManager />
                  )}

                  {activeTab === 'checklist' && (
                    <DefaultChecklistManager />
                  )}

                  {activeTab === 'banner-generator' && (
                    <StandaloneBannerGenerator />
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h1 className="font-serif text-3xl font-bold text-foreground">
                          Usuários Administradores
                        </h1>
                        <button
                          onClick={() => setShowNewUserForm(true)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Novo Usuário
                        </button>
                      </div>

                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nome</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">E-mail</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Criado em</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {adminUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-secondary/30">
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                      </div>
                                      <span className="font-medium text-foreground">{user.full_name || 'Sem nome'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-foreground">{user.email}</td>
                                  <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {adminUsers.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                              Nenhum usuário cadastrado
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

{/* Quote detail modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedQuote(null)}>
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
              Detalhes da Cotação
              {selectedQuote.is_manual && (
                <span className="ml-3 px-2 py-1 text-sm rounded bg-blue-500/20 text-blue-400">Manual</span>
              )}
            </h2>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Nome do Cliente (se manual) */}
              {selectedQuote.client_name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome do Cliente</p>
                  <p className="text-foreground font-medium text-lg">{selectedQuote.client_name}</p>
                </div>
              )}

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                  <p className="text-foreground font-medium">
                    {selectedQuote.is_manual && selectedQuote.email.includes('@manual.local') 
                      ? '-' 
                      : selectedQuote.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">WhatsApp</p>
                  <p className="text-foreground font-medium">{selectedQuote.whatsapp}</p>
                </div>
              </div>

              {/* Destino e Canal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Destino Principal</p>
                  <p className="text-foreground font-medium">{selectedQuote.destination_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Canal de Origem</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedQuote.source_channel === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                    selectedQuote.source_channel === 'facebook' ? 'bg-blue-600/20 text-blue-400' :
                    selectedQuote.source_channel === 'whatsapp_direct' ? 'bg-green-500/20 text-green-400' :
                    selectedQuote.source_channel === 'phone' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedQuote.source_channel === 'referral' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {(() => {
                      const channels: Record<string, string> = {
                        website: 'Site',
                        instagram: 'Instagram',
                        facebook: 'Facebook',
                        whatsapp_direct: 'WhatsApp Direto',
                        phone: 'Telefone',
                        walk_in: 'Presencial',
                        referral: 'Indicação',
                        email: 'E-mail',
                        other: 'Outro',
                      };
                      return channels[selectedQuote.source_channel || 'website'] || selectedQuote.source_channel || 'Site';
                    })()}
                  </span>
                </div>
              </div>

              {/* Data da Viagem e Retorno */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data da Viagem</p>
                  <p className="text-foreground font-medium">{selectedQuote.travel_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Alerta de Retorno</p>
                  {selectedQuote.follow_up_date ? (
                    <p className={`font-medium ${(() => {
                      const followUp = new Date(selectedQuote.follow_up_date + 'T12:00:00');
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return followUp <= today && selectedQuote.status !== 'completed' ? 'text-accent' : 'text-foreground';
                    })()}`}>
                      {formatDate(selectedQuote.follow_up_date)}
                      {(() => {
                        const followUp = new Date(selectedQuote.follow_up_date + 'T12:00:00');
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return followUp <= today && selectedQuote.status !== 'completed' ? ' ⚠️' : '';
                      })()}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
              </div>

              {/* Viajantes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantidade de Pessoas</p>
                  <p className="text-foreground font-medium">{selectedQuote.num_people || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Viaja com Crianças?</p>
                  <p className="text-foreground font-medium">
                    {selectedQuote.traveling_with_children === null ? '-' : selectedQuote.traveling_with_children ? 'Sim' : 'Não'}
                  </p>
                </div>
              </div>

              {/* Tipo de Viagem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo de Viagem</p>
                  <p className="text-foreground font-medium">{selectedQuote.travel_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Palavra que Representa</p>
                  <p className="text-foreground font-medium">{selectedQuote.travel_word || '-'}</p>
                </div>
              </div>

              {/* Voo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Aeroporto Preferido</p>
                  <p className="text-foreground font-medium">{selectedQuote.preferred_airport || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horário de Voo Preferido</p>
                  <p className="text-foreground font-medium">{selectedQuote.flight_time_preference || '-'}</p>
                </div>
              </div>

              {/* Contato Preferido */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horário para Contato</p>
                  <p className="text-foreground font-medium">{selectedQuote.preferred_contact_time || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Canal de Contato Preferido</p>
                  <p className="text-foreground font-medium">{selectedQuote.preferred_contact_channel || '-'}</p>
                </div>
              </div>

              {/* Pedidos Especiais */}
              {selectedQuote.special_requests && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pedidos Especiais / Outros Destinos</p>
                  <p className="text-foreground font-medium whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg">
                    {selectedQuote.special_requests}
                  </p>
                </div>
              )}

              {/* Observações (para cotações manuais) */}
              {selectedQuote.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-foreground font-medium whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg">
                    {selectedQuote.notes}
                  </p>
                </div>
              )}

              {/* Data de Recebimento e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Recebido em</p>
                  <p className="text-foreground font-medium">{formatDate(selectedQuote.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedQuote.status === 'pending' ? 'bg-accent/20 text-accent' : 
                    selectedQuote.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    selectedQuote.status === 'quoted' ? 'bg-purple-500/20 text-purple-400' :
                    selectedQuote.status === 'completed' ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {selectedQuote.status === 'pending' ? 'Pendente' : 
                     selectedQuote.status === 'in_progress' ? 'Em andamento' :
                     selectedQuote.status === 'quoted' ? 'Cotado' :
                     selectedQuote.status === 'completed' ? 'Finalizado' :
                     selectedQuote.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <a 
                href={`mailto:${selectedQuote.email}`}
                className="btn-outline flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                E-mail
              </a>
              <a 
                href={`https://wa.me/${selectedQuote.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
            </div>

            {/* Status Actions */}
            <div className="flex flex-wrap gap-3 mt-4">
              {selectedQuote.status === 'pending' && (
                <button
                  onClick={() => handleUpdateQuoteStatus(selectedQuote.id, 'in_progress')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Em Andamento
                </button>
              )}
              
              {(selectedQuote.status === 'pending' || selectedQuote.status === 'in_progress') && (
                <button
                  onClick={() => handleUpdateQuoteStatus(selectedQuote.id, 'quoted')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Cotado
                </button>
              )}

              {(selectedQuote.status === 'quoted' || selectedQuote.status === 'in_progress') && (
                <button
                  onClick={() => handleUpdateQuoteStatus(selectedQuote.id, 'completed')}
                  className="btn-gold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalizado
                </button>
              )}
              
              <button
                onClick={() => {
                  setEditingQuote(selectedQuote);
                  setSelectedQuote(null);
                }}
                className="px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 flex items-center gap-2 transition-all"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              
              <button
                onClick={() => handleDeleteQuote(selectedQuote.id)}
                className="ml-auto px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>

            <button
              onClick={() => setSelectedQuote(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Itinerary detail modal */}
      {selectedItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedItinerary(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <Map className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">{selectedItinerary.destination_name}</h2>
                <p className="text-muted-foreground">Roteiro gerado em {formatDate(selectedItinerary.created_at)}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                  <p className="text-foreground font-medium">{selectedItinerary.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">WhatsApp</p>
                  <p className="text-foreground font-medium">{selectedItinerary.user_whatsapp}</p>
                </div>
              </div>

              {/* Status da Cotação */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cotação Solicitada</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedItinerary.quote_requested 
                      ? 'bg-accent/20 text-accent' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {selectedItinerary.quote_requested ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedItinerary.status === 'pending' 
                      ? 'bg-accent/20 text-accent' 
                      : selectedItinerary.status === 'contacted'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {selectedItinerary.status === 'pending' ? 'Pendente' : 
                     selectedItinerary.status === 'contacted' ? 'Contatado' : 
                     selectedItinerary.status === 'completed' ? 'Concluído' : selectedItinerary.status}
                  </span>
                </div>
              </div>

              {selectedItinerary.quote_requested_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cotação Solicitada em</p>
                  <p className="text-foreground font-medium">{formatDate(selectedItinerary.quote_requested_at)}</p>
                </div>
              )}

              {/* Clima da Viagem */}
              {selectedItinerary.travel_mood && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Clima da Viagem</p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 rounded-xl font-medium">
                    <Heart className="w-4 h-4" />
                    {selectedItinerary.travel_mood === 'romantica' ? 'Romântica' :
                     selectedItinerary.travel_mood === 'relaxante' ? 'Relaxante' :
                     selectedItinerary.travel_mood === 'aventura' ? 'Aventura Radical' :
                     selectedItinerary.travel_mood === 'gastronomica' ? 'Gastronômica' :
                     selectedItinerary.travel_mood === 'cultural' ? 'Cultural' :
                     selectedItinerary.travel_mood === 'fotografica' ? 'Fotográfica' :
                     selectedItinerary.travel_mood}
                  </span>
                </div>
              )}

              {/* Passeios Selecionados pelo Cliente */}
              {selectedItinerary.selected_activities && selectedItinerary.selected_activities.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Passeios Selecionados pelo Cliente ({selectedItinerary.selected_activities.length})
                  </p>
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-xl p-4 space-y-2">
                    {selectedItinerary.selected_activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-background/50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            <span className="text-primary">{activity.day}</span> - {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferências */}
              {selectedItinerary.preferences && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Preferências do Cliente</p>
                  <p className="text-foreground font-medium whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg">
                    {selectedItinerary.preferences}
                  </p>
                </div>
              )}

              {/* Roteiro Gerado */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Roteiro Gerado</p>
                <div className="text-foreground whitespace-pre-wrap bg-secondary/50 p-4 rounded-lg max-h-64 overflow-y-auto text-sm">
                  {selectedItinerary.itinerary_content.substring(0, 1000)}
                  {selectedItinerary.itinerary_content.length > 1000 && '...'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              <a 
                href={`mailto:${selectedItinerary.user_email}`}
                className="btn-outline flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                E-mail
              </a>
              <a 
                href={`https://wa.me/${selectedItinerary.user_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
              
              {selectedItinerary.status === 'pending' && (
                <button
                  onClick={() => handleUpdateItineraryStatus(selectedItinerary.id, 'contacted')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Marcar como Contatado
                </button>
              )}
              
              {selectedItinerary.status !== 'completed' && (
                <button
                  onClick={() => handleUpdateItineraryStatus(selectedItinerary.id, 'completed')}
                  className="btn-gold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Cotação Realizada
                </button>
              )}
              
              <button
                onClick={() => handleDeleteItinerary(selectedItinerary.id)}
                className="ml-auto px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>

            <button
              onClick={() => setSelectedItinerary(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* New user modal */}
      {showNewUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setShowNewUserForm(false)}>
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Novo Administrador</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nome do administrador"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewUserForm(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Criar Usuário
                    </>
                  )}
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowNewUserForm(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Image detail modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.destination_name} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            {/* Image details */}
            <div className="bg-card rounded-2xl p-6 mt-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">{selectedImage.destination_name}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{formatDate(selectedImage.created_at)}</p>
                </div>
                <button
                  onClick={() => handleDownloadImage(selectedImage.image_url, selectedImage.destination_name)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Prompt utilizado:</p>
                <p className="text-foreground bg-secondary/50 p-3 rounded-lg">{selectedImage.prompt}</p>
              </div>

              {/* Contact Info */}
              {(selectedImage.user_email || selectedImage.user_whatsapp) && (
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                  {selectedImage.user_email && (
                    <a 
                      href={`mailto:${selectedImage.user_email}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Mail className="w-4 h-4" />
                      {selectedImage.user_email}
                    </a>
                  )}
                  {selectedImage.user_whatsapp && (
                    <a 
                      href={`https://wa.me/${selectedImage.user_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {selectedImage.user_whatsapp}
                    </a>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedImage.status === 'pending' ? 'bg-accent/20 text-accent' : 
                  selectedImage.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  selectedImage.status === 'completed' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {selectedImage.status === 'pending' ? 'Pendente' : 
                   selectedImage.status === 'in_progress' ? 'Em andamento' :
                   selectedImage.status === 'completed' ? 'Finalizado' :
                   selectedImage.status}
                </span>
                <div className="flex gap-2">
                  {selectedImage.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleUpdateImageStatus(selectedImage.id, 'in_progress');
                        setSelectedImage({ ...selectedImage, status: 'in_progress' });
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      Em Andamento
                    </button>
                  )}
                  {(selectedImage.status === 'pending' || selectedImage.status === 'in_progress') && (
                    <button
                      onClick={() => {
                        handleUpdateImageStatus(selectedImage.id, 'completed');
                        setSelectedImage({ ...selectedImage, status: 'completed' });
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Finalizado
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDeleteImage(selectedImage.id);
                      setSelectedImage(null);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Edit Form */}
      {editingQuote && (
        <QuoteEditForm
          quote={editingQuote}
          open={!!editingQuote}
          onOpenChange={(open) => !open && setEditingQuote(null)}
          onSuccess={() => {
            fetchData();
            setEditingQuote(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

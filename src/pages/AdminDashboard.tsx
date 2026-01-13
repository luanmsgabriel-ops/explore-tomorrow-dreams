import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { 
  LayoutDashboard, 
  FileText, 
  Map, 
  Image, 
  LogOut, 
  Users,
  Calendar,
  Mail,
  Phone,
  Clock,
  Eye,
  Loader2,
  UserPlus,
  Trash2,
  CheckCircle,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'overview' | 'quotes' | 'itineraries' | 'images' | 'users';

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
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [quotesRes, itinerariesRes, imagesRes, usersRes] = await Promise.all([
        supabase.from('quote_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_itineraries').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_generated_images').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);

      if (quotesRes.data) setQuotes(quotesRes.data);
      if (itinerariesRes.data) setItineraries(itinerariesRes.data);
      if (imagesRes.data) setImages(imagesRes.data);
      if (usersRes.data) setAdminUsers(usersRes.data);
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

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'quotes' as TabType, label: 'Cotações', icon: FileText },
    { id: 'itineraries' as TabType, label: 'Roteiros IA', icon: Map },
    { id: 'images' as TabType, label: 'Imagens IA', icon: Image },
    { id: 'users' as TabType, label: 'Usuários', icon: Users },
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-foreground">{quotes.length}</p>
                              <p className="text-muted-foreground text-sm">Cotações</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                              <Map className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-foreground">{itineraries.length}</p>
                              <p className="text-muted-foreground text-sm">Roteiros Gerados</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-light/20 to-teal-light/5 border border-teal-light/20">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-light/20 flex items-center justify-center">
                              <Image className="w-6 h-6 text-teal-light" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-foreground">{images.length}</p>
                              <p className="text-muted-foreground text-sm">Imagens Geradas</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                              <Users className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-foreground">{adminUsers.length}</p>
                              <p className="text-muted-foreground text-sm">Administradores</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent quotes */}
                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="p-4 bg-secondary border-b border-border">
                          <h2 className="font-serif text-xl font-bold text-foreground">Cotações Recentes</h2>
                        </div>
                        <div className="divide-y divide-border">
                          {quotes.slice(0, 5).map((quote) => (
                            <div key={quote.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{quote.email}</p>
                                  <p className="text-sm text-muted-foreground">{quote.destination_name || 'Destino não especificado'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  quote.status === 'pending' ? 'bg-accent/20 text-accent' : 
                                  quote.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                  quote.status === 'quoted' ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-primary/20 text-primary'
                                }`}>
                                  {quote.status === 'pending' ? 'Pendente' : 
                                   quote.status === 'in_progress' ? 'Em andamento' :
                                   quote.status === 'quoted' ? 'Cotado' :
                                   quote.status}
                                </span>
                                <span className="text-sm text-muted-foreground">{formatDate(quote.created_at)}</span>
                              </div>
                            </div>
                          ))}
                          {quotes.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                              Nenhuma cotação recebida ainda
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'quotes' && (
                    <div className="space-y-6">
                      <h1 className="font-serif text-3xl font-bold text-foreground">
                        Cotações
                      </h1>

                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Destino</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data Viagem</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Recebido</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {quotes.map((quote) => (
                                <tr key={quote.id} className="hover:bg-secondary/30">
                                  <td className="px-4 py-4">
                                    <div>
                                      <p className="font-medium text-foreground">{quote.email}</p>
                                      <p className="text-sm text-muted-foreground">{quote.whatsapp}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-foreground">{quote.destination_name || '-'}</td>
                                  <td className="px-4 py-4 text-foreground">{quote.travel_date || '-'}</td>
                                  <td className="px-4 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      quote.status === 'pending' ? 'bg-accent/20 text-accent' : 
                                      quote.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                      quote.status === 'quoted' ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-primary/20 text-primary'
                                    }`}>
                                      {quote.status === 'pending' ? 'Pendente' : 
                                       quote.status === 'in_progress' ? 'Em andamento' :
                                       quote.status === 'quoted' ? 'Cotado' :
                                       quote.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(quote.created_at)}</td>
                                  <td className="px-4 py-4">
                                    <button
                                      onClick={() => setSelectedQuote(quote)}
                                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
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
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setSelectedItinerary(itinerary)}
                                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                        title="Visualizar"
                                      >
                                        <Eye className="w-4 h-4" />
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
                            <div className="aspect-square">
                              <img src={image.image_url} alt={image.destination_name} className="w-full h-full object-cover" />
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

                              {/* Status Badge */}
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
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Detalhes da Cotação</h2>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                  <p className="text-foreground font-medium">{selectedQuote.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">WhatsApp</p>
                  <p className="text-foreground font-medium">{selectedQuote.whatsapp}</p>
                </div>
              </div>

              {/* Destino */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Destino Principal</p>
                  <p className="text-foreground font-medium">{selectedQuote.destination_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data da Viagem</p>
                  <p className="text-foreground font-medium">{selectedQuote.travel_date || '-'}</p>
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

              {/* Data de Recebimento */}
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
                    'bg-primary/20 text-primary'
                  }`}>
                    {selectedQuote.status === 'pending' ? 'Pendente' : 
                     selectedQuote.status === 'in_progress' ? 'Em andamento' :
                     selectedQuote.status === 'quoted' ? 'Cotado' :
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
    </div>
  );
};

export default AdminDashboard;

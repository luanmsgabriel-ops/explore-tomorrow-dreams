import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ClientFlightInfo } from '@/components/client/ClientFlightInfo';
import { ClientAccommodationInfo } from '@/components/client/ClientAccommodationInfo';
import { ClientChecklist } from '@/components/client/ClientChecklist';
import { ClientTripTips } from '@/components/client/ClientTripTips';
import { ClientItineraryGenerator } from '@/components/client/ClientItineraryGenerator';
import { ClientImageGenerator } from '@/components/client/ClientImageGenerator';
import { 
  Plane, 
  LogOut, 
  Loader2, 
  Hotel, 
  CheckSquare, 
  Info,
  Bell,
  Map,
  Image
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'flight' | 'accommodation' | 'checklist' | 'info' | 'itinerary' | 'image';

interface ClientTrip {
  id: string;
  destination_name: string;
  destination_id: string | null;
  departure_date: string;
  return_date: string;
  flight_number: string | null;
  flight_departure_time: string | null;
  flight_return_time: string | null;
  flight_locator: string | null;
  hotel_name: string | null;
  hotel_address: string | null;
  hotel_link: string | null;
  hotel_checkin_time: string | null;
  hotel_checkout_time: string | null;
  trip_status: string;
  trip_tips: string | null;
  notes: string | null;
  created_at: string;
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('flight');
  const [trips, setTrips] = useState<ClientTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<ClientTrip | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [upcomingFlightAlert, setUpcomingFlightAlert] = useState<ClientTrip | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/cliente');
        return;
      }

      // Check if user is admin - if so, redirect them
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (roleData?.role === 'admin') {
        toast.error('Área exclusiva para clientes');
        await supabase.auth.signOut();
        navigate('/admin');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      }
      if (profile?.email) {
        setUserEmail(profile.email);
      }

      // Fetch user's trips
      const { data: tripsData, error } = await supabase
        .from('client_trips')
        .select('*')
        .eq('user_id', session.user.id)
        .order('departure_date', { ascending: true });

      if (error) throw error;

      setTrips(tripsData || []);

      // Check for upcoming flights (within 48 hours)
      const now = new Date();
      const upcomingTrip = tripsData?.find(trip => {
        if (!trip.flight_departure_time) return false;
        const flightTime = new Date(trip.flight_departure_time);
        const hoursUntilFlight = (flightTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilFlight > 0 && hoursUntilFlight <= 48;
      });

      if (upcomingTrip) {
        setUpcomingFlightAlert(upcomingTrip);
      }

      // Auto-select first upcoming trip
      const upcomingOrCurrent = tripsData?.find(trip => 
        new Date(trip.return_date) >= now && trip.trip_status !== 'cancelled'
      );
      if (upcomingOrCurrent) {
        setSelectedTrip(upcomingOrCurrent);
      } else if (tripsData && tripsData.length > 0) {
        setSelectedTrip(tripsData[0]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/cliente');
  };

  const tabs = [
    { id: 'flight' as TabType, label: 'Aéreo', icon: Plane },
    { id: 'accommodation' as TabType, label: 'Hospedagem', icon: Hotel },
    { id: 'checklist' as TabType, label: 'Checklist', icon: CheckSquare },
    { id: 'info' as TabType, label: 'Informações', icon: Info },
    { id: 'itinerary' as TabType, label: 'Roteiro IA', icon: Map },
    { id: 'image' as TabType, label: 'Imagem IA', icon: Image },
  ];

  const getHoursUntilFlight = (flightTime: string) => {
    const now = new Date();
    const flight = new Date(flightTime);
    return Math.round((flight.getTime() - now.getTime()) / (1000 * 60 * 60));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Flight Alert Banner */}
          {upcomingFlightAlert && upcomingFlightAlert.flight_departure_time && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 animate-pulse-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    ✈️ Lembrete: Seu voo está próximo!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Voo para <strong>{upcomingFlightAlert.destination_name}</strong> em{' '}
                    <strong>{getHoursUntilFlight(upcomingFlightAlert.flight_departure_time)} horas</strong>.
                    Não esqueça de fazer o check-in online!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                Olá, <span className="gradient-text-teal">{userName || 'Viajante'}</span>!
              </h1>
              <p className="text-muted-foreground mt-1">
                Bem-vindo à sua área exclusiva
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <div className="glass rounded-2xl p-4 sticky top-24">
                {/* Trip Selector */}
                {trips.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Viagem Selecionada
                    </label>
                    <select
                      value={selectedTrip?.id || ''}
                      onChange={(e) => {
                        const trip = trips.find(t => t.id === e.target.value);
                        setSelectedTrip(trip || null);
                      }}
                      className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    >
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.destination_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* AI Tabs - Always show even without trips */}
              {(activeTab === 'itinerary' || activeTab === 'image') ? (
                <div className="glass rounded-2xl p-6">
                  {activeTab === 'itinerary' && (
                    <ClientItineraryGenerator 
                      userName={userName || 'Viajante'}
                      userEmail={userEmail}
                      userWhatsapp={userWhatsapp}
                    />
                  )}
                  {activeTab === 'image' && (
                    <ClientImageGenerator 
                      userName={userName || 'Viajante'}
                      userEmail={userEmail}
                      userWhatsapp={userWhatsapp}
                    />
                  )}
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12 glass rounded-2xl">
                  <Plane className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                    Nenhuma viagem cadastrada
                  </h2>
                  <p className="text-muted-foreground">
                    Seu consultor de viagens irá cadastrar sua próxima aventura em breve!
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Enquanto isso, explore as abas de <strong>Roteiro IA</strong> e <strong>Imagem IA</strong>!
                  </p>
                </div>
              ) : selectedTrip && (
                <div className="glass rounded-2xl p-6">
                  {activeTab === 'flight' && (
                    <ClientFlightInfo 
                      tripId={selectedTrip.id} 
                      tripData={selectedTrip}
                    />
                  )}
                  {activeTab === 'accommodation' && (
                    <ClientAccommodationInfo 
                      tripId={selectedTrip.id} 
                      tripData={selectedTrip}
                    />
                  )}
                  {activeTab === 'checklist' && (
                    <ClientChecklist 
                      tripId={selectedTrip.id} 
                      tripName={selectedTrip.destination_name}
                    />
                  )}
                  {activeTab === 'info' && (
                    <ClientTripTips 
                      tripId={selectedTrip.id} 
                      tripData={selectedTrip}
                    />
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

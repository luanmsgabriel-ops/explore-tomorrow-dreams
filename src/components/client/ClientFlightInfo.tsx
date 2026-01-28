import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plane, 
  Clock, 
  Calendar, 
  MapPin, 
  Download, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TripDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
}

interface ClientFlightInfoProps {
  tripId: string;
  tripData: {
    destination_name: string;
    departure_date: string;
    return_date: string;
    flight_number: string | null;
    flight_return_number?: string | null;
    flight_departure_time: string | null;
    flight_return_time?: string | null;
    flight_locator?: string | null;
  };
}

export const ClientFlightInfo = ({ tripId, tripData }: ClientFlightInfoProps) => {
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFlightDocuments();
  }, [tripId]);

  const fetchFlightDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .in('document_type', ['voucher_voo', 'bilhete_aereo']);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc: TripDocument) => {
    try {
      const fileName = doc.file_url.split('/').pop();
      if (!fileName) return;

      const { data, error } = await supabase.storage
        .from('trip-documents')
        .createSignedUrl(`${tripId}/${fileName.split('/').pop()}`, 60);

      if (error) {
        // Try direct URL as fallback
        window.open(doc.file_url, '_blank');
        return;
      }

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = doc.document_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Erro ao baixar documento');
    }
  };

  const formatFileSize = (size: number | null) => {
    if (!size) return '';
    if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / 1024).toFixed(1)} KB`;
  };

  // Helper to parse date strings correctly (avoid timezone issues)
  const parseDate = (dateStr: string) => {
    // If it's just a date (YYYY-MM-DD), add T12:00:00 to avoid timezone shifts
    if (dateStr && dateStr.length === 10) {
      return new Date(dateStr + 'T12:00:00');
    }
    return new Date(dateStr);
  };

  // Calculate countdown to check-in availability (48 hours before flight)
  const getCheckinCountdown = () => {
    const now = new Date();
    
    // If we have flight departure time, calculate countdown to 48h before
    if (tripData.flight_departure_time) {
      const flightTime = new Date(tripData.flight_departure_time);
      const checkinTime = new Date(flightTime.getTime() - 48 * 60 * 60 * 1000); // 48h before flight
      
      const hoursUntilCheckin = differenceInHours(checkinTime, now);
      const minutesUntilCheckin = differenceInMinutes(checkinTime, now) % 60;
      
      // Flight already passed
      if (flightTime < now) {
        return { text: 'Viagem realizada', isUpcoming: false, checkinAvailable: false };
      }
      
      // Check-in already available (less than 48h to flight)
      if (hoursUntilCheckin <= 0) {
        const hoursToFlight = differenceInHours(flightTime, now);
        const minutesToFlight = differenceInMinutes(flightTime, now) % 60;
        if (hoursToFlight <= 0) {
          return { text: 'Embarque em breve!', isUpcoming: true, checkinAvailable: true };
        }
        return { 
          text: `Check-in disponível! Voo em ${hoursToFlight}h${minutesToFlight > 0 ? ` ${minutesToFlight}min` : ''}`, 
          isUpcoming: true, 
          checkinAvailable: true 
        };
      }
      
      // Countdown to check-in opening
      const daysUntilCheckin = Math.floor(hoursUntilCheckin / 24);
      const remainingHours = hoursUntilCheckin % 24;
      
      if (daysUntilCheckin > 0) {
        return { 
          text: `${daysUntilCheckin}d ${remainingHours}h para check-in`, 
          isUpcoming: daysUntilCheckin <= 2, 
          checkinAvailable: false 
        };
      }
      
      return { 
        text: `${hoursUntilCheckin}h ${minutesUntilCheckin}min para check-in`, 
        isUpcoming: true, 
        checkinAvailable: false 
      };
    }
    
    // Fallback to departure date if no time specified
    const departureDate = parseDate(tripData.departure_date);
    const daysUntil = differenceInDays(departureDate, now);
    
    if (daysUntil < 0) return { text: 'Viagem realizada', isUpcoming: false, checkinAvailable: false };
    if (daysUntil <= 2) return { text: 'Check-in disponível!', isUpcoming: true, checkinAvailable: true };
    if (daysUntil === 3) return { text: 'Check-in em 1 dia', isUpcoming: true, checkinAvailable: false };
    return { text: `${daysUntil - 2} dias para check-in`, isUpcoming: daysUntil <= 7, checkinAvailable: false };
  };

  const countdown = getCheckinCountdown();

  return (
    <div className="space-y-6">
      {/* Check-in Available Alert Banner */}
      {countdown.checkinAvailable && (
        <Alert className="bg-green-500/10 border-green-500/30 animate-pulse">
          <AlertCircle className="h-5 w-5 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300 text-base">
            <strong>🎉 Check-in online disponível!</strong> Seu voo está próximo. Faça o check-in agora para garantir seu assento preferido.
            {tripData.flight_locator && (
              <span className="block mt-1">
                Localizador: <strong className="font-mono text-lg">{tripData.flight_locator}</strong>
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Plane className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Informações de Voo</h2>
          <p className="text-muted-foreground">Detalhes do seu voo para {tripData.destination_name}</p>
        </div>
      </div>

      {/* Countdown Card */}
      <div className={`p-6 rounded-2xl ${countdown.checkinAvailable ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' : countdown.isUpcoming ? 'bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30' : 'glass'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${countdown.checkinAvailable ? 'bg-green-500/20' : countdown.isUpcoming ? 'bg-accent/20' : 'bg-secondary'}`}>
            <Calendar className={`w-8 h-8 ${countdown.checkinAvailable ? 'text-green-500' : countdown.isUpcoming ? 'text-accent' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {countdown.checkinAvailable ? '✅ Check-in online disponível' : '⏱️ Contagem regressiva para o check-in'}
            </p>
            <p className={`text-2xl sm:text-3xl font-bold ${countdown.checkinAvailable ? 'text-green-500' : countdown.isUpcoming ? 'text-accent' : 'text-foreground'}`}>
              {countdown.text}
            </p>
            {countdown.checkinAvailable && tripData.flight_locator && (
              <p className="text-sm text-muted-foreground mt-1">
                Use o localizador <span className="font-mono font-bold text-primary">{tripData.flight_locator}</span> para fazer check-in
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Flight Details Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Departure */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Voo de Ida</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">
                {format(parseDate(tripData.departure_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            {tripData.flight_departure_time && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {format(new Date(tripData.flight_departure_time), 'HH:mm')}
                </span>
              </div>
            )}
            {tripData.flight_number && (
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Voo {tripData.flight_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Return */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-5 h-5 text-primary rotate-180" />
            <h3 className="font-semibold text-foreground">Voo de Volta</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">
                {format(parseDate(tripData.return_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            {tripData.flight_return_time && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {format(new Date(tripData.flight_return_time), 'HH:mm')}
                </span>
              </div>
            )}
            {tripData.flight_return_number && (
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Voo {tripData.flight_return_number}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Locator */}
      {tripData.flight_locator && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Localizador da Reserva</h3>
          </div>
          <p className="text-2xl font-mono font-bold text-primary tracking-wider">
            {tripData.flight_locator}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Use este código para fazer check-in online ou consultar sua reserva
          </p>
        </div>
      )}

      {/* Flight Documents */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Vouchers e Bilhetes</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            Nenhum documento de voo anexado ainda
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{doc.document_name}</p>
                    {doc.file_size && (
                      <p className="text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Baixar</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Hotel, 
  Clock, 
  Calendar, 
  MapPin, 
  Download, 
  Loader2,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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

interface ClientAccommodationInfoProps {
  tripId: string;
  tripData: {
    destination_name: string;
    departure_date: string;
    return_date: string;
    hotel_name: string | null;
    hotel_address: string | null;
    hotel_link?: string | null;
    hotel_checkin_date?: string | null;
    hotel_checkout_date?: string | null;
    hotel_checkin_time?: string | null;
    hotel_checkout_time?: string | null;
  };
}

export const ClientAccommodationInfo = ({ tripId, tripData }: ClientAccommodationInfoProps) => {
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHotelDocuments();
  }, [tripId]);

  const fetchHotelDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .eq('document_type', 'voucher_hotel');

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

  const getCountdown = () => {
    const now = new Date();
    const departureDate = new Date(tripData.departure_date);
    const daysUntil = differenceInDays(departureDate, now);
    
    if (daysUntil < 0) return { text: 'Viagem realizada', isUpcoming: false };
    if (daysUntil === 0) return { text: 'Hoje!', isUpcoming: true };
    if (daysUntil === 1) return { text: 'Amanhã!', isUpcoming: true };
    return { text: `${daysUntil} dias para a viagem`, isUpcoming: daysUntil <= 7 };
  };

  const getStayDuration = () => {
    const checkinDateStr = tripData.hotel_checkin_date || tripData.departure_date;
    const checkoutDateStr = tripData.hotel_checkout_date || tripData.return_date;
    const departure = new Date(checkinDateStr + 'T12:00:00');
    const returnDate = new Date(checkoutDateStr + 'T12:00:00');
    const nights = differenceInDays(returnDate, departure);
    return nights;
  };

  // Get actual check-in and check-out dates (add T12:00:00 to avoid timezone issues)
  const checkinDateStr = tripData.hotel_checkin_date || tripData.departure_date;
  const checkoutDateStr = tripData.hotel_checkout_date || tripData.return_date;
  const checkinDate = new Date(checkinDateStr + 'T12:00:00');
  const checkoutDate = new Date(checkoutDateStr + 'T12:00:00');

  const countdown = getCountdown();
  const nights = getStayDuration();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Hotel className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Hospedagem</h2>
          <p className="text-muted-foreground">Informações do seu hotel em {tripData.destination_name}</p>
        </div>
      </div>

      {/* Countdown Card */}
      <div className={`p-6 rounded-2xl ${countdown.isUpcoming ? 'bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30' : 'glass'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${countdown.isUpcoming ? 'bg-accent/20' : 'bg-secondary'}`}>
            <Calendar className={`w-8 h-8 ${countdown.isUpcoming ? 'text-accent' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contagem regressiva</p>
            <p className={`text-3xl font-bold ${countdown.isUpcoming ? 'text-accent' : 'text-foreground'}`}>
              {countdown.text}
            </p>
          </div>
        </div>
      </div>

      {/* Hotel Name Card */}
      {tripData.hotel_name ? (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">{tripData.hotel_name}</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Check-in */}
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Check-in</span>
              </div>
              <p className="font-semibold text-foreground">
                {format(checkinDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                A partir das {tripData.hotel_checkin_time || '14:00'}
              </p>
            </div>

            {/* Check-out */}
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Check-out</span>
              </div>
              <p className="font-semibold text-foreground">
                {format(checkoutDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                Até às {tripData.hotel_checkout_time || '12:00'}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="p-4 rounded-xl bg-primary/10 text-center mb-4">
            <p className="text-sm text-muted-foreground">Duração da estadia</p>
            <p className="text-2xl font-bold text-primary">{nights} noites</p>
          </div>

          {/* Address */}
          {tripData.hotel_address && (
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                <p className="text-foreground mb-2">{tripData.hotel_address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tripData.hotel_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
                >
                  <Navigation className="w-4 h-4" />
                  Como Chegar
                </a>
              </div>
            </div>
          )}

          {/* Hotel Link */}
          {tripData.hotel_link && (
            <a
              href={tripData.hotel_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors justify-center"
            >
              <ExternalLink className="w-5 h-5" />
              Ver fotos e mais detalhes do hotel
            </a>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center">
          <Hotel className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Informações do hotel serão adicionadas em breve
          </p>
        </div>
      )}

      {/* Hotel Documents */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Vouchers de Hospedagem</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            Nenhum voucher de hotel anexado ainda
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
                    <Hotel className="w-5 h-5 text-primary" />
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

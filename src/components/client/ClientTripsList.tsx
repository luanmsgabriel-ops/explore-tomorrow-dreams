import { Plane, Calendar, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientTrip {
  id: string;
  destination_name: string;
  destination_id: string | null;
  departure_date: string;
  return_date: string;
  flight_number: string | null;
  flight_departure_time: string | null;
  hotel_name: string | null;
  hotel_address: string | null;
  trip_status: string;
  notes: string | null;
  created_at: string;
}

interface ClientTripsListProps {
  trips: ClientTrip[];
  selectedTrip: ClientTrip | null;
  onSelectTrip: (trip: ClientTrip) => void;
}

export const ClientTripsList = ({ trips, selectedTrip, onSelectTrip }: ClientTripsListProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
            <CheckCircle className="w-3 h-3" />
            Confirmada
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <CheckCircle className="w-3 h-3" />
            Concluída
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
            <XCircle className="w-3 h-3" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMM, yyyy", { locale: ptBR });
  };

  const getDaysUntilTrip = (departureDate: string) => {
    const now = new Date();
    const departure = new Date(departureDate);
    const diffTime = departure.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTripDuration = (departure: string, returnDate: string) => {
    const dep = new Date(departure);
    const ret = new Date(returnDate);
    const diffTime = ret.getTime() - dep.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Minhas Viagens
        </h2>
        <span className="text-sm text-muted-foreground">
          {trips.length} viagem{trips.length !== 1 ? 'ns' : ''}
        </span>
      </div>

      <div className="grid gap-4">
        {trips.map((trip) => {
          const daysUntil = getDaysUntilTrip(trip.departure_date);
          const duration = getTripDuration(trip.departure_date, trip.return_date);
          const isSelected = selectedTrip?.id === trip.id;
          const isPast = daysUntil < 0;

          return (
            <button
              key={trip.id}
              onClick={() => onSelectTrip(trip)}
              className={`w-full text-left p-6 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border bg-secondary/50 hover:bg-secondary hover:border-primary/30'
              } ${isPast ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Plane className="w-8 h-8 text-primary-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      {trip.destination_name}
                    </h3>
                    {getStatusBadge(trip.trip_status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(trip.departure_date)} → {formatDate(trip.return_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{duration} dias</span>
                    </div>
                    {trip.hotel_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.hotel_name}</span>
                      </div>
                    )}
                  </div>

                  {trip.flight_number && (
                    <p className="mt-2 text-sm text-foreground/80">
                      Voo: <strong>{trip.flight_number}</strong>
                    </p>
                  )}
                </div>

                <div className="text-center shrink-0">
                  {daysUntil > 0 ? (
                    <div>
                      <p className="text-3xl font-bold text-primary">{daysUntil}</p>
                      <p className="text-xs text-muted-foreground">dias restantes</p>
                    </div>
                  ) : daysUntil === 0 ? (
                    <div>
                      <p className="text-lg font-bold text-accent">Hoje!</p>
                      <p className="text-xs text-muted-foreground">Boa viagem!</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Viagem</p>
                      <p className="text-sm font-medium text-muted-foreground">concluída</p>
                    </div>
                  )}
                </div>
              </div>

              {trip.notes && (
                <p className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground italic">
                  📝 {trip.notes}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

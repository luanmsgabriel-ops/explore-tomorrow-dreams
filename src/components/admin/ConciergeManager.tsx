import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Loader2, MapPin, Plane, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActiveTrip {
  id: string;
  client_name: string | null;
  client_phone: string;
  destination_city: string | null;
  destination_country: string | null;
  check_in_date: string;
  check_out_date: string;
  concierge_active: boolean | null;
  concierge_start_date: string | null;
  concierge_end_date: string | null;
  outbound_flight_iata: string | null;
  return_flight_iata: string | null;
}

export function ConciergeManager() {
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // New trip form
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newCheckin, setNewCheckin] = useState<Date>();
  const [newCheckout, setNewCheckout] = useState<Date>();
  const [newStartDate, setNewStartDate] = useState<Date>();
  const [newEndDate, setNewEndDate] = useState<Date>();
  const [newOutboundFlight, setNewOutboundFlight] = useState('');
  const [newReturnFlight, setNewReturnFlight] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('active_trips')
      .select('id, client_name, client_phone, destination_city, destination_country, check_in_date, check_out_date, concierge_active, concierge_start_date, concierge_end_date, outbound_flight_iata, return_flight_iata')
      .order('check_in_date', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar viagens');
      console.error(error);
    } else {
      setTrips((data as ActiveTrip[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTrips(); }, []);

  const toggleConcierge = async (trip: ActiveTrip) => {
    setSaving(trip.id);
    const newValue = !trip.concierge_active;
    const { error } = await supabase
      .from('active_trips')
      .update({ concierge_active: newValue })
      .eq('id', trip.id);

    if (error) {
      toast.error('Erro ao atualizar concierge');
    } else {
      toast.success(newValue ? 'Concierge ativado' : 'Concierge desativado');
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, concierge_active: newValue } : t));
    }
    setSaving(null);
  };

  const updateSchedule = async (tripId: string, startDate: Date | null, endDate: Date | null) => {
    setSaving(tripId);
    const { error } = await supabase
      .from('active_trips')
      .update({
        concierge_start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        concierge_end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      })
      .eq('id', tripId);

    if (error) {
      toast.error('Erro ao salvar agendamento');
    } else {
      toast.success('Agendamento salvo');
      fetchTrips();
    }
    setSaving(null);
  };

  const createTrip = async () => {
    if (!newPhone || !newCheckin || !newCheckout) {
      toast.error('Telefone, check-in e check-out são obrigatórios');
      return;
    }
    setCreating(true);

    const { error } = await supabase.from('active_trips').insert({
      client_phone: newPhone,
      client_name: newName || null,
      destination_city: newCity || null,
      destination_country: newCountry || null,
      check_in_date: format(newCheckin, 'yyyy-MM-dd'),
      check_out_date: format(newCheckout, 'yyyy-MM-dd'),
      concierge_active: false,
      concierge_start_date: newStartDate ? format(newStartDate, 'yyyy-MM-dd') : null,
      concierge_end_date: newEndDate ? format(newEndDate, 'yyyy-MM-dd') : null,
      outbound_flight_iata: newOutboundFlight || null,
      return_flight_iata: newReturnFlight || null,
    });

    if (error) {
      toast.error('Erro ao criar viagem');
      console.error(error);
    } else {
      toast.success('Viagem criada com sucesso');
      setShowNewDialog(false);
      resetForm();
      fetchTrips();
    }
    setCreating(false);
  };

  const resetForm = () => {
    setNewPhone(''); setNewName(''); setNewCity(''); setNewCountry('');
    setNewCheckin(undefined); setNewCheckout(undefined);
    setNewStartDate(undefined); setNewEndDate(undefined);
    setNewOutboundFlight(''); setNewReturnFlight('');
  };

  const getStatus = (trip: ActiveTrip) => {
    const today = new Date().toISOString().split('T')[0];
    if (trip.concierge_active) return 'active';
    if (trip.concierge_start_date && trip.concierge_start_date > today) return 'scheduled';
    if (trip.concierge_end_date && trip.concierge_end_date < today) return 'expired';
    return 'inactive';
  };

  const StatusBadge = ({ trip }: { trip: ActiveTrip }) => {
    const status = getStatus(trip);
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">🟢 Ativo</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">📅 Agendado</Badge>;
      case 'expired':
        return <Badge className="bg-muted text-muted-foreground">⏹️ Expirado</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">⚪ Inativo</Badge>;
    }
  };

  const DatePicker = ({ value, onChange, placeholder }: { value: Date | undefined; onChange: (d: Date | undefined) => void; placeholder: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-1 h-3 w-3" />
          {value ? format(value, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Concierge</h1>
          <p className="text-muted-foreground mt-1">Gerencie o acompanhamento de voo e localização por cliente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTrips}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Viagem</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar Viagem Concierge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Telefone *</label>
                    <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="5511999..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do cliente" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Cidade destino</label>
                    <Input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Ex: Cancún" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">País</label>
                    <Input value={newCountry} onChange={e => setNewCountry(e.target.value)} placeholder="Ex: México" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Check-in *</label>
                    <DatePicker value={newCheckin} onChange={setNewCheckin} placeholder="Data check-in" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Check-out *</label>
                    <DatePicker value={newCheckout} onChange={setNewCheckout} placeholder="Data check-out" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Voo ida (IATA)</label>
                    <Input value={newOutboundFlight} onChange={e => setNewOutboundFlight(e.target.value)} placeholder="Ex: LA3456" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Voo volta (IATA)</label>
                    <Input value={newReturnFlight} onChange={e => setNewReturnFlight(e.target.value)} placeholder="Ex: LA3457" />
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">📅 Agendamento do Concierge (opcional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Início</label>
                      <DatePicker value={newStartDate} onChange={setNewStartDate} placeholder="Data início" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Fim</label>
                      <DatePicker value={newEndDate} onChange={setNewEndDate} placeholder="Data fim" />
                    </div>
                  </div>
                </div>
                <Button onClick={createTrip} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Criar Viagem
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : trips.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Nenhuma viagem ativa encontrada</p>
        </Card>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Voos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Concierge</TableHead>
                <TableHead>Agendamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map(trip => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{trip.client_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{trip.client_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{[trip.destination_city, trip.destination_country].filter(Boolean).join(', ') || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p>{trip.check_in_date} →</p>
                      <p>{trip.check_out_date}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      {trip.outbound_flight_iata && <p><Plane className="w-3 h-3 inline mr-1" />{trip.outbound_flight_iata}</p>}
                      {trip.return_flight_iata && <p><Plane className="w-3 h-3 inline mr-1 rotate-180" />{trip.return_flight_iata}</p>}
                      {!trip.outbound_flight_iata && !trip.return_flight_iata && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge trip={trip} /></TableCell>
                  <TableCell>
                    <Switch
                      checked={!!trip.concierge_active}
                      onCheckedChange={() => toggleConcierge(trip)}
                      disabled={saving === trip.id}
                    />
                  </TableCell>
                  <TableCell>
                    <ScheduleEditor trip={trip} onSave={updateSchedule} saving={saving === trip.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ScheduleEditor({ trip, onSave, saving }: { trip: ActiveTrip; onSave: (id: string, start: Date | null, end: Date | null) => void; saving: boolean }) {
  const [startDate, setStartDate] = useState<Date | undefined>(trip.concierge_start_date ? new Date(trip.concierge_start_date + 'T12:00:00') : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(trip.concierge_end_date ? new Date(trip.concierge_end_date + 'T12:00:00') : undefined);
  const [dirty, setDirty] = useState(false);

  const handleStartChange = (d: Date | undefined) => { setStartDate(d); setDirty(true); };
  const handleEndChange = (d: Date | undefined) => { setEndDate(d); setDirty(true); };

  return (
    <div className="space-y-1 min-w-[180px]">
      <div className="flex gap-1 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 text-[10px] flex-1", !startDate && "text-muted-foreground")}>
              {startDate ? format(startDate, "dd/MM") : "Início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={startDate} onSelect={handleStartChange} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-xs">→</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 text-[10px] flex-1", !endDate && "text-muted-foreground")}>
              {endDate ? format(endDate, "dd/MM") : "Fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={endDate} onSelect={handleEndChange} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
      {dirty && (
        <Button size="sm" variant="secondary" className="h-6 text-[10px] w-full" onClick={() => { onSave(trip.id, startDate || null, endDate || null); setDirty(false); }} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
        </Button>
      )}
    </div>
  );
}

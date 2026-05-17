import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Calendar, Loader2, Pencil, Plus, Send, Trash2, Play } from 'lucide-react';

interface ScheduledMessage {
  id: string;
  trip_id: string | null;
  phone_number: string;
  message_text: string;
  scheduled_for: string;
  status: string;
  sent_at: string | null;
  error: string | null;
  label: string | null;
  created_at: string;
}

interface ActiveTrip {
  id: string;
  client_name: string | null;
  client_phone: string;
  destination_city: string | null;
  check_in_date: string;
  check_out_date: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  sent: 'bg-green-500/15 text-green-700 dark:text-green-300',
  failed: 'bg-red-500/15 text-red-700 dark:text-red-300',
  cancelled: 'bg-muted text-muted-foreground',
};

// Converte ISO UTC → string "YYYY-MM-DDTHH:mm" no fuso local (para input datetime-local)
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YYYY-MM-DDTHH:mm" local → ISO UTC
function localInputToIso(local: string): string {
  return new Date(local).toISOString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface FormState {
  trip_id: string;
  phone_number: string;
  message_text: string;
  scheduled_for: string;
  label: string;
}

const emptyForm = (): FormState => ({
  trip_id: '',
  phone_number: '',
  message_text: '',
  scheduled_for: '',
  label: '',
});

export const ScheduledMessagesManager = () => {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [tripFilter, setTripFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [msgsRes, tripsRes] = await Promise.all([
        supabase.from('scheduled_messages').select('*').order('scheduled_for', { ascending: true }),
        supabase.from('active_trips').select('id, client_name, client_phone, destination_city, check_in_date, check_out_date').order('check_in_date', { ascending: false }),
      ]);
      if (msgsRes.error) throw msgsRes.error;
      if (tripsRes.error) throw tripsRes.error;
      setMessages((msgsRes.data || []) as ScheduledMessage[]);
      setTrips((tripsRes.data || []) as ActiveTrip[]);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao carregar mensagens agendadas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const tripsById = useMemo(() => {
    const m = new Map<string, ActiveTrip>();
    trips.forEach(t => m.set(t.id, t));
    return m;
  }, [trips]);

  const filtered = useMemo(() => {
    return messages.filter(m => {
      if (tripFilter !== 'all' && m.trip_id !== tripFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (dateFilter) {
        const local = new Date(m.scheduled_for);
        const y = local.getFullYear();
        const mo = String(local.getMonth() + 1).padStart(2, '0');
        const d = String(local.getDate()).padStart(2, '0');
        if (`${y}-${mo}-${d}` !== dateFilter) return false;
      }
      return true;
    });
  }, [messages, tripFilter, statusFilter, dateFilter]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (m: ScheduledMessage) => {
    setEditingId(m.id);
    setForm({
      trip_id: m.trip_id || '',
      phone_number: m.phone_number,
      message_text: m.message_text,
      scheduled_for: isoToLocalInput(m.scheduled_for),
      label: m.label || '',
    });
    setDialogOpen(true);
  };

  const handleTripChange = (tripId: string) => {
    const trip = tripsById.get(tripId);
    setForm(f => ({
      ...f,
      trip_id: tripId,
      phone_number: f.phone_number || trip?.client_phone || '',
    }));
  };

  const handleSave = async () => {
    if (!form.phone_number || !form.message_text || !form.scheduled_for) {
      toast.error('Preencha telefone, mensagem e data/hora');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        trip_id: form.trip_id || null,
        phone_number: form.phone_number.replace(/\D/g, ''),
        message_text: form.message_text,
        scheduled_for: localInputToIso(form.scheduled_for),
        label: form.label || null,
      };
      if (editingId) {
        const { error } = await supabase
          .from('scheduled_messages')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Mensagem atualizada');
      } else {
        const { error } = await supabase
          .from('scheduled_messages')
          .insert({ ...payload, status: 'pending' });
        if (error) throw error;
        toast.success('Mensagem agendada');
      }
      setDialogOpen(false);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta mensagem agendada?')) return;
    try {
      const { error } = await supabase.from('scheduled_messages').delete().eq('id', id);
      if (error) throw error;
      toast.success('Excluída');
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir');
    }
  };

  const handleResend = async (id: string) => {
    if (!confirm('Reenviar agora? A mensagem será marcada como pendente e enviada no próximo ciclo.')) return;
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .update({
          status: 'pending',
          sent_at: null,
          error: null,
          scheduled_for: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Reagendada. Disparando agora…');
      await triggerCron();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reenviar');
    }
  };

  const triggerCron = async () => {
    try {
      const { error } = await supabase.functions.invoke('concierge-engine', {
        body: { action: 'scheduled_messages' },
      });
      if (error) throw error;
      toast.success('Processamento disparado');
      setTimeout(loadAll, 1500);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao disparar');
    }
  };

  const tripLabel = (t: ActiveTrip) =>
    `${t.client_name || 'Sem nome'} — ${t.destination_city || 'destino'} (${t.check_in_date})`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Mensagens Agendadas</h1>
          <p className="text-sm text-muted-foreground">
            Programe envios da Téo para datas e horários específicos por viagem.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={triggerCron}>
            <Play className="w-4 h-4 mr-2" /> Disparar agora
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" /> Nova mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar mensagem' : 'Agendar mensagem'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Viagem (opcional)</Label>
                  <Select value={form.trip_id || 'none'} onValueChange={(v) => handleTripChange(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma viagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Sem viagem (manual) —</SelectItem>
                      {trips.map(t => (
                        <SelectItem key={t.id} value={t.id}>{tripLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Telefone (com DDI/DDD)</Label>
                    <Input
                      placeholder="5515999999999"
                      value={form.phone_number}
                      onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Data e hora (fuso local)</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_for}
                      onChange={(e) => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Rótulo (opcional)</Label>
                  <Input
                    placeholder="Ex.: Raquel - Dia 17 véspera"
                    value={form.label}
                    onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    rows={10}
                    value={form.message_text}
                    onChange={(e) => setForm(f => ({ ...f, message_text: e.target.value }))}
                    placeholder="Texto exato que a Téo enviará no WhatsApp…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {editingId ? 'Salvar' : 'Agendar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Viagem</Label>
          <Select value={tripFilter} onValueChange={setTripFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as viagens</SelectItem>
              {trips.map(t => (
                <SelectItem key={t.id} value={t.id}>{tripLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="failed">Falhas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Data</Label>
          <div className="flex gap-2">
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>Limpar</Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            Nenhuma mensagem encontrada com os filtros atuais.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Viagem / Telefone</TableHead>
                <TableHead>Rótulo / Mensagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => {
                const trip = m.trip_id ? tripsById.get(m.trip_id) : null;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      <div className="font-medium">{formatDate(m.scheduled_for)}</div>
                      {m.sent_at && (
                        <div className="text-xs text-muted-foreground">Enviada {formatDate(m.sent_at)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        {trip ? `${trip.client_name || '—'} · ${trip.destination_city || ''}` : 'Manual'}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.phone_number}</div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {m.label && <div className="text-xs font-semibold text-foreground">{m.label}</div>}
                      <div className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{m.message_text}</div>
                      {m.error && <div className="text-xs text-red-500 mt-1">Erro: {m.error}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[m.status] || ''}>{m.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {m.status !== 'pending' && (
                          <Button variant="ghost" size="icon" onClick={() => handleResend(m.id)} title="Reenviar agora">
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} title="Excluir">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

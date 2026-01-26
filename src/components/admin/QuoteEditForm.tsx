import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Edit } from 'lucide-react';

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
  client_name: string | null;
  source_channel: string | null;
  follow_up_date: string | null;
  notes: string | null;
  is_manual: boolean | null;
}

interface QuoteEditFormProps {
  quote: QuoteRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SOURCE_CHANNELS = [
  { value: 'website', label: 'Site' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp_direct', label: 'WhatsApp Direto' },
  { value: 'phone', label: 'Telefone' },
  { value: 'walk_in', label: 'Presencial' },
  { value: 'referral', label: 'Indicação' },
  { value: 'email', label: 'E-mail' },
  { value: 'other', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'quoted', label: 'Cotado' },
  { value: 'completed', label: 'Finalizado' },
];

export function QuoteEditForm({ quote, open, onOpenChange, onSuccess }: QuoteEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    whatsapp: '',
    destination_name: '',
    travel_date: '',
    num_people: '',
    travel_type: '',
    preferred_airport: '',
    flight_time_preference: '',
    traveling_with_children: false,
    special_requests: '',
    travel_word: '',
    preferred_contact_time: '',
    preferred_contact_channel: '',
    follow_up_date: undefined as Date | undefined,
    source_channel: '',
    notes: '',
    status: 'pending',
  });

  useEffect(() => {
    if (quote && open) {
      setFormData({
        client_name: quote.client_name || '',
        email: quote.email || '',
        whatsapp: quote.whatsapp || '',
        destination_name: quote.destination_name || '',
        travel_date: quote.travel_date || '',
        num_people: quote.num_people || '',
        travel_type: quote.travel_type || '',
        preferred_airport: quote.preferred_airport || '',
        flight_time_preference: quote.flight_time_preference || '',
        traveling_with_children: quote.traveling_with_children || false,
        special_requests: quote.special_requests || '',
        travel_word: quote.travel_word || '',
        preferred_contact_time: quote.preferred_contact_time || '',
        preferred_contact_channel: quote.preferred_contact_channel || '',
        follow_up_date: quote.follow_up_date ? new Date(quote.follow_up_date + 'T12:00:00') : undefined,
        source_channel: quote.source_channel || 'website',
        notes: quote.notes || '',
        status: quote.status || 'pending',
      });
    }
  }, [quote, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        client_name: formData.client_name || null,
        email: formData.email,
        whatsapp: formData.whatsapp,
        destination_name: formData.destination_name || null,
        travel_date: formData.travel_date || null,
        num_people: formData.num_people || null,
        travel_type: formData.travel_type || null,
        preferred_airport: formData.preferred_airport || null,
        flight_time_preference: formData.flight_time_preference || null,
        traveling_with_children: formData.traveling_with_children,
        special_requests: formData.special_requests || null,
        travel_word: formData.travel_word || null,
        preferred_contact_time: formData.preferred_contact_time || null,
        preferred_contact_channel: formData.preferred_contact_channel || null,
        follow_up_date: formData.follow_up_date ? format(formData.follow_up_date, 'yyyy-MM-dd') : null,
        source_channel: formData.source_channel || null,
        notes: formData.notes || null,
        status: formData.status,
      };

      const { error } = await supabase
        .from('quote_requests')
        .update(updateData)
        .eq('id', quote.id);

      if (error) throw error;

      toast.success('Cotação atualizada com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Erro ao atualizar cotação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Cotação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Cliente Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nome do Cliente</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination_name">Destino</Label>
              <Input
                id="destination_name"
                value={formData.destination_name}
                onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                placeholder="Ex: Maldivas"
              />
            </div>
          </div>

          {/* Viagem Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travel_date">Data da Viagem</Label>
              <Input
                id="travel_date"
                value={formData.travel_date}
                onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                placeholder="Ex: Janeiro 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num_people">Quantidade de Pessoas</Label>
              <Input
                id="num_people"
                value={formData.num_people}
                onChange={(e) => setFormData({ ...formData, num_people: e.target.value })}
                placeholder="Ex: 2 adultos"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travel_type">Tipo de Viagem</Label>
              <Input
                id="travel_type"
                value={formData.travel_type}
                onChange={(e) => setFormData({ ...formData, travel_type: e.target.value })}
                placeholder="Ex: Lua de mel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travel_word">Palavra que Representa</Label>
              <Input
                id="travel_word"
                value={formData.travel_word}
                onChange={(e) => setFormData({ ...formData, travel_word: e.target.value })}
                placeholder="Ex: Relaxamento"
              />
            </div>
          </div>

          {/* Voo Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_airport">Aeroporto Preferido</Label>
              <Input
                id="preferred_airport"
                value={formData.preferred_airport}
                onChange={(e) => setFormData({ ...formData, preferred_airport: e.target.value })}
                placeholder="Ex: GRU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flight_time_preference">Horário de Voo</Label>
              <Input
                id="flight_time_preference"
                value={formData.flight_time_preference}
                onChange={(e) => setFormData({ ...formData, flight_time_preference: e.target.value })}
                placeholder="Ex: Manhã"
              />
            </div>
          </div>

          {/* Contato Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_contact_time">Horário para Contato</Label>
              <Input
                id="preferred_contact_time"
                value={formData.preferred_contact_time}
                onChange={(e) => setFormData({ ...formData, preferred_contact_time: e.target.value })}
                placeholder="Ex: À tarde"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_contact_channel">Canal Preferido</Label>
              <Input
                id="preferred_contact_channel"
                value={formData.preferred_contact_channel}
                onChange={(e) => setFormData({ ...formData, preferred_contact_channel: e.target.value })}
                placeholder="Ex: WhatsApp"
              />
            </div>
          </div>

          {/* Status e Canal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Canal de Origem</Label>
              <Select
                value={formData.source_channel}
                onValueChange={(value) => setFormData({ ...formData, source_channel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerta Follow-up */}
          <div className="space-y-2">
            <Label>Alerta de Retorno</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.follow_up_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.follow_up_date ? (
                    format(formData.follow_up_date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecionar data de retorno</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.follow_up_date}
                  onSelect={(date) => setFormData({ ...formData, follow_up_date: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Crianças */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="traveling_with_children"
              checked={formData.traveling_with_children}
              onChange={(e) => setFormData({ ...formData, traveling_with_children: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="traveling_with_children" className="cursor-pointer">
              Viaja com crianças
            </Label>
          </div>

          {/* Pedidos Especiais */}
          <div className="space-y-2">
            <Label htmlFor="special_requests">Pedidos Especiais</Label>
            <Textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              placeholder="Pedidos especiais ou outros destinos..."
              rows={2}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações internas..."
              rows={2}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

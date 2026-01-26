import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, MessageCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';

const manualQuoteSchema = z.object({
  client_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  whatsapp: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos').max(20),
  destination_name: z.string().min(2, 'Destino é obrigatório').max(200),
  travel_date: z.string().optional(),
  follow_up_date: z.date().optional(),
  source_channel: z.string().min(1, 'Canal de origem é obrigatório'),
  notes: z.string().max(1000).optional(),
});

interface ManualQuoteFormProps {
  onSuccess?: () => void;
}

const SOURCE_CHANNELS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp_direct', label: 'WhatsApp Direto' },
  { value: 'phone', label: 'Telefone' },
  { value: 'walk_in', label: 'Presencial' },
  { value: 'referral', label: 'Indicação' },
  { value: 'email', label: 'E-mail' },
  { value: 'other', label: 'Outro' },
];

export function ManualQuoteForm({ onSuccess }: ManualQuoteFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    whatsapp: '',
    destination_name: '',
    travel_date: '',
    follow_up_date: undefined as Date | undefined,
    source_channel: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      client_name: '',
      whatsapp: '',
      destination_name: '',
      travel_date: '',
      follow_up_date: undefined,
      source_channel: '',
      notes: '',
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = manualQuoteSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('quote_requests').insert({
        client_name: formData.client_name,
        whatsapp: formData.whatsapp,
        email: `manual-${Date.now()}@manual.local`, // Placeholder for manual entries
        destination_name: formData.destination_name,
        travel_date: formData.travel_date || null,
        follow_up_date: formData.follow_up_date ? format(formData.follow_up_date, 'yyyy-MM-dd') : null,
        source_channel: formData.source_channel,
        notes: formData.notes || null,
        is_manual: true,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Cotação cadastrada com sucesso!');
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating manual quote:', error);
      toast.error('Erro ao cadastrar cotação');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone: string, clientName: string, destination: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${clientName}! Tudo bem?\n\nSou da Tomorrow Travel e vi que você demonstrou interesse em viajar para ${destination}.\n\nGostaria de saber mais sobre sua viagem para poder te ajudar com uma cotação personalizada!`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Cadastrar Cotação Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Nova Cotação Manual</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nome do Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client_name">Nome do Cliente *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Ex: João Silva"
              className={errors.client_name ? 'border-destructive' : ''}
            />
            {errors.client_name && (
              <p className="text-sm text-destructive">{errors.client_name}</p>
            )}
          </div>

          {/* Telefone/WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Telefone/WhatsApp *</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="Ex: (11) 99999-9999"
                className={cn("flex-1", errors.whatsapp ? 'border-destructive' : '')}
              />
              {formData.whatsapp.length >= 10 && formData.client_name && formData.destination_name && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openWhatsApp(formData.whatsapp, formData.client_name, formData.destination_name)}
                  title="Abrir WhatsApp"
                  className="shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-green-500" />
                </Button>
              )}
            </div>
            {errors.whatsapp && (
              <p className="text-sm text-destructive">{errors.whatsapp}</p>
            )}
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <Label htmlFor="destination_name">Destino Cotado *</Label>
            <Input
              id="destination_name"
              value={formData.destination_name}
              onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
              placeholder="Ex: Maldivas, Paris, Fernando de Noronha..."
              className={errors.destination_name ? 'border-destructive' : ''}
            />
            {errors.destination_name && (
              <p className="text-sm text-destructive">{errors.destination_name}</p>
            )}
          </div>

          {/* Data da Viagem */}
          <div className="space-y-2">
            <Label htmlFor="travel_date">Data Prevista da Viagem</Label>
            <Input
              id="travel_date"
              value={formData.travel_date}
              onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
              placeholder="Ex: Janeiro 2025, Próximo mês, Flexível..."
            />
          </div>

          {/* Data de Retorno de Contato (Alerta) */}
          <div className="space-y-2">
            <Label>Alerta de Retorno de Contato</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
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
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Você será lembrado de retornar o contato nesta data
            </p>
          </div>

          {/* Canal de Origem */}
          <div className="space-y-2">
            <Label>Canal de Origem *</Label>
            <Select
              value={formData.source_channel}
              onValueChange={(value) => setFormData({ ...formData, source_channel: value })}
            >
              <SelectTrigger className={errors.source_channel ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_CHANNELS.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source_channel && (
              <p className="text-sm text-destructive">{errors.source_channel}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalhes adicionais sobre a cotação, preferências do cliente..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Cadastrar Cotação'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

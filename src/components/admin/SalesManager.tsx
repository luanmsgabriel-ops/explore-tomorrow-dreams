import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  Plus, 
  Loader2, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Trash2,
  Edit,
  Clock
} from 'lucide-react';

interface Sale {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  destination_name: string;
  sale_date: string;
  departure_date: string | null;
  return_date: string | null;
  total_value: number;
  commission_percentage: number;
  commission_value: number;
  payment_method: string | null;
  payment_status: string;
  notes: string | null;
  source_channel: string | null;
  created_at: string;
}

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'installments', label: 'Parcelado' },
];

const PAYMENT_STATUS = [
  { value: 'pending', label: 'Pendente', color: 'bg-accent/20 text-accent' },
  { value: 'partial', label: 'Parcial', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'paid', label: 'Pago', color: 'bg-primary/20 text-primary' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-destructive/20 text-destructive' },
];

const SOURCE_CHANNELS = [
  { value: 'website', label: 'Site' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp_direct', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefone' },
  { value: 'walk_in', label: 'Presencial' },
  { value: 'referral', label: 'Indicação' },
];

export function SalesManager() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    destination_name: '',
    sale_date: new Date(),
    departure_date: undefined as Date | undefined,
    return_date: undefined as Date | undefined,
    total_value: '',
    commission_percentage: '10',
    payment_method: '',
    payment_status: 'pending',
    notes: '',
    source_channel: 'website',
  });

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      client_phone: '',
      destination_name: '',
      sale_date: new Date(),
      departure_date: undefined,
      return_date: undefined,
      total_value: '',
      commission_percentage: '10',
      payment_method: '',
      payment_status: 'pending',
      notes: '',
      source_channel: 'website',
    });
    setEditingSale(null);
  };

  const openEditForm = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      client_name: sale.client_name,
      client_email: sale.client_email || '',
      client_phone: sale.client_phone || '',
      destination_name: sale.destination_name,
      sale_date: new Date(sale.sale_date + 'T12:00:00'),
      departure_date: sale.departure_date ? new Date(sale.departure_date + 'T12:00:00') : undefined,
      return_date: sale.return_date ? new Date(sale.return_date + 'T12:00:00') : undefined,
      total_value: sale.total_value.toString(),
      commission_percentage: sale.commission_percentage.toString(),
      payment_method: sale.payment_method || '',
      payment_status: sale.payment_status,
      notes: sale.notes || '',
      source_channel: sale.source_channel || 'website',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.destination_name || !formData.total_value) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const saleData = {
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        destination_name: formData.destination_name,
        sale_date: format(formData.sale_date, 'yyyy-MM-dd'),
        departure_date: formData.departure_date ? format(formData.departure_date, 'yyyy-MM-dd') : null,
        return_date: formData.return_date ? format(formData.return_date, 'yyyy-MM-dd') : null,
        total_value: parseFloat(formData.total_value),
        commission_percentage: parseFloat(formData.commission_percentage),
        payment_method: formData.payment_method || null,
        payment_status: formData.payment_status,
        notes: formData.notes || null,
        source_channel: formData.source_channel,
      };

      if (editingSale) {
        const { error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', editingSale.id);
        if (error) throw error;
        toast.success('Venda atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('sales')
          .insert(saleData);
        if (error) throw error;
        toast.success('Venda cadastrada com sucesso!');
      }

      resetForm();
      setFormOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Erro ao salvar venda');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;
    
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      toast.success('Venda excluída com sucesso!');
      fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Erro ao excluir venda');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
  };

  // Dashboard calculations
  const totalSales = sales.reduce((acc, sale) => acc + Number(sale.total_value), 0);
  const totalCommission = sales.reduce((acc, sale) => acc + Number(sale.commission_value), 0);
  const paidSales = sales.filter(s => s.payment_status === 'paid');
  const pendingSales = sales.filter(s => s.payment_status === 'pending');
  const totalPaid = paidSales.reduce((acc, sale) => acc + Number(sale.total_value), 0);
  const totalPending = pendingSales.reduce((acc, sale) => acc + Number(sale.total_value), 0);

  // Current month stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthSales = sales.filter(s => {
    const saleDate = new Date(s.sale_date + 'T12:00:00');
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  const monthTotal = monthSales.reduce((acc, sale) => acc + Number(sale.total_value), 0);
  const monthCommission = monthSales.reduce((acc, sale) => acc + Number(sale.commission_value), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Vendas Realizadas
        </h1>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {editingSale ? 'Editar Venda' : 'Cadastrar Nova Venda'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination_name">Destino *</Label>
                  <Input
                    id="destination_name"
                    value={formData.destination_name}
                    onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                    placeholder="Ex: Maldivas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">E-mail</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data da Venda *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.sale_date, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.sale_date}
                        onSelect={(date) => date && setFormData({ ...formData, sale_date: date })}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Data de Ida</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.departure_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.departure_date ? format(formData.departure_date, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.departure_date}
                        onSelect={(date) => setFormData({ ...formData, departure_date: date })}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Data de Volta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.return_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.return_date ? format(formData.return_date, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.return_date}
                        onSelect={(date) => setFormData({ ...formData, return_date: date })}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_value">Valor Total (R$) *</Label>
                  <Input
                    id="total_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_value}
                    onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_percentage">Comissão (%)</Label>
                  <Input
                    id="commission_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                    placeholder="10"
                  />
                  {formData.total_value && formData.commission_percentage && (
                    <p className="text-xs text-muted-foreground">
                      Comissão: {formatCurrency(parseFloat(formData.total_value) * parseFloat(formData.commission_percentage) / 100)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status do Pagamento</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Canal de Origem</Label>
                <Select
                  value={formData.source_channel}
                  onValueChange={(value) => setFormData({ ...formData, source_channel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes adicionais da venda..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : editingSale ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">{sales.length} vendas realizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Comissões</CardTitle>
            <Percent className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">Média: {((totalCommission / totalSales) * 100 || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(monthTotal)}</div>
            <p className="text-xs text-muted-foreground">{monthSales.length} vendas | {formatCurrency(monthCommission)} comissão</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">{pendingSales.length} vendas pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Destino</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data Venda</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Comissão</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((sale) => {
                const statusInfo = PAYMENT_STATUS.find(s => s.value === sale.payment_status);
                return (
                  <tr key={sale.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{sale.client_name}</p>
                        {sale.client_phone && (
                          <p className="text-sm text-muted-foreground">{sale.client_phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-foreground">{sale.destination_name}</td>
                    <td className="px-4 py-4 text-foreground">{formatDate(sale.sale_date)}</td>
                    <td className="px-4 py-4 text-foreground font-medium">{formatCurrency(sale.total_value)}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-foreground">{formatCurrency(sale.commission_value)}</p>
                        <p className="text-xs text-muted-foreground">{sale.commission_percentage}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium", statusInfo?.color)}>
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditForm(sale)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
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
          {sales.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma venda cadastrada ainda
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

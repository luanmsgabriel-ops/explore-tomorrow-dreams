import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Trash2, Edit, Clock, Calendar, 
  DollarSign, Tag, Sparkles, MapPin, Save, X, Plus, Image, ArrowUp, ArrowDown, Eye, EyeOff
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { BannerGenerator } from './BannerGenerator';
import { PromotionalOfferModal } from './PromotionalOfferModal';
interface PromotionalOffer {
  id: string;
  destination_id: string;
  title: string;
  tagline: string | null;
  total_price: number;
  cash_price: number | null;
  installments: number | null;
  installment_value: number | null;
  inclusions: string[];
  valid_from: string;
  valid_until: string;
  departure_date: string | null;
  return_date: string | null;
  is_active: boolean;
  created_at: string;
  destinations: {
    name: string;
    image_url: string | null;
    description: string | null;
  } | null;
}

export const PromotionalOffersManager = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState<PromotionalOffer | null>(null);
  const [bannerOffer, setBannerOffer] = useState<PromotionalOffer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [isTogglingPopup, setIsTogglingPopup] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    total_price: '',
    cash_price: '',
    installments: '',
    installment_value: '',
    inclusions: [''],
    valid_until: '',
    departure_date: '',
    return_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchOffers();
    fetchPopupSetting();
  }, []);

  const fetchPopupSetting = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'popup_offers_enabled')
      .single();
    if (data) setPopupEnabled(data.value === true);
  };

  const handleTogglePopup = async () => {
    setIsTogglingPopup(true);
    try {
      const newValue = !popupEnabled;
      const { error } = await supabase
        .from('site_settings')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', 'popup_offers_enabled');
      if (error) throw error;
      setPopupEnabled(newValue);
      toast.success(`Pop-up de ofertas ${newValue ? 'ativado' : 'desativado'}`);
    } catch (error) {
      console.error('Error toggling popup:', error);
      toast.error('Erro ao alterar configuração');
    } finally {
      setIsTogglingPopup(false);
    }
  };

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotional_offers')
        .select(`
          *,
          destinations (
            name,
            image_url,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data as PromotionalOffer[]);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Erro ao carregar ofertas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (offer: PromotionalOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      tagline: offer.tagline || '',
      total_price: offer.total_price.toString(),
      cash_price: offer.cash_price?.toString() || '',
      installments: offer.installments?.toString() || '',
      installment_value: offer.installment_value?.toString() || '',
      inclusions: offer.inclusions.length > 0 ? offer.inclusions : [''],
      valid_until: new Date(offer.valid_until).toISOString().slice(0, 16),
      departure_date: offer.departure_date || '',
      return_date: offer.return_date || '',
      is_active: offer.is_active,
    });
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oferta?')) return;

    try {
      const { error } = await supabase
        .from('promotional_offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;
      toast.success('Oferta excluída com sucesso!');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Erro ao excluir oferta');
    }
  };

  const handleToggleActive = async (offer: PromotionalOffer) => {
    try {
      const { error } = await supabase
        .from('promotional_offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offer.id);

      if (error) throw error;
      toast.success(offer.is_active ? 'Oferta desativada' : 'Oferta ativada');
      fetchOffers();
    } catch (error) {
      console.error('Error toggling offer:', error);
      toast.error('Erro ao atualizar oferta');
    }
  };

  const handleExtendValidity = async (offerId: string, days: number) => {
    try {
      const offer = offers.find(o => o.id === offerId);
      if (!offer) return;

      const currentDate = new Date(offer.valid_until);
      currentDate.setDate(currentDate.getDate() + days);

      const { error } = await supabase
        .from('promotional_offers')
        .update({ valid_until: currentDate.toISOString() })
        .eq('id', offerId);

      if (error) throw error;
      toast.success(`Oferta prorrogada por ${days} dias!`);
      fetchOffers();
    } catch (error) {
      console.error('Error extending offer:', error);
      toast.error('Erro ao prorrogar oferta');
    }
  };

  const handleGenerateTagline = async () => {
    if (!editingOffer) return;

    setIsGeneratingTagline(true);
    try {
      const inclusionsText = formData.inclusions.filter(i => i.trim()).join(', ');
      const cashText = formData.cash_price ? `À vista: R$ ${formData.cash_price}` : '';
      const installmentText = formData.installments && formData.installment_value 
        ? `${formData.installments}x de R$ ${formData.installment_value}` 
        : '';

      const response = await supabase.functions.invoke('generate-promo-tagline', {
        body: { 
          destinationName: editingOffer.destinations?.name || 'Destino',
          title: formData.title,
          totalPrice: formData.total_price,
          cashPrice: cashText,
          installments: installmentText,
          inclusions: inclusionsText,
        }
      });

      if (response.error) throw response.error;

      const tagline = response.data?.tagline;
      if (tagline) {
        setFormData(prev => ({ ...prev, tagline }));
        toast.success('Legenda gerada com sucesso!');
      }
    } catch (error) {
      console.error('Error generating tagline:', error);
      toast.error('Erro ao gerar legenda');
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  const handleSave = async () => {
    if (!editingOffer) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('promotional_offers')
        .update({
          title: formData.title,
          tagline: formData.tagline || null,
          total_price: parseFloat(formData.total_price),
          cash_price: formData.cash_price ? parseFloat(formData.cash_price) : null,
          installments: formData.installments ? parseInt(formData.installments) : null,
          installment_value: formData.installment_value ? parseFloat(formData.installment_value) : null,
          inclusions: formData.inclusions.filter(i => i.trim()),
          valid_until: new Date(formData.valid_until).toISOString(),
          departure_date: formData.departure_date || null,
          return_date: formData.return_date || null,
          is_active: formData.is_active,
        })
        .eq('id', editingOffer.id);

      if (error) throw error;
      toast.success('Oferta atualizada com sucesso!');
      setEditingOffer(null);
      fetchOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Erro ao salvar oferta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInclusion = () => {
    setFormData(prev => ({
      ...prev,
      inclusions: [...prev.inclusions, '']
    }));
  };

  const handleRemoveInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }));
  };

  const handleInclusionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.map((inc, i) => i === index ? value : inc)
    }));
  };

  const handleMoveInclusion = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newInclusions = [...prev.inclusions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newInclusions.length) return prev;
      
      [newInclusions[index], newInclusions[targetIndex]] = [newInclusions[targetIndex], newInclusions[index]];
      
      return { ...prev, inclusions: newInclusions };
    });
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

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const getTimeRemaining = (validUntil: string) => {
    const now = new Date().getTime();
    const end = new Date(validUntil).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Expirada';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Ofertas Promocionais
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
            {popupEnabled ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground">Pop-up</span>
            <Switch
              checked={popupEnabled}
              onCheckedChange={handleTogglePopup}
              disabled={isTogglingPopup}
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova Oferta
          </button>
          <div className="text-sm text-muted-foreground">
            {offers.length} oferta{offers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className={`rounded-2xl border overflow-hidden transition-all ${
              isExpired(offer.valid_until) 
                ? 'border-destructive/30 bg-destructive/5' 
                : offer.is_active 
                  ? 'border-primary/30 bg-primary/5' 
                  : 'border-border bg-secondary/50'
            }`}
          >
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image */}
                {offer.destinations?.image_url && (
                  <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={offer.destinations.image_url}
                      alt={offer.destinations.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      {offer.destinations?.name || 'Destino'}
                    </h3>
                    
                    {/* Status badges */}
                    {isExpired(offer.valid_until) ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                        Expirada
                      </span>
                    ) : offer.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        Ativa
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Inativa
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{offer.title}</p>
                  
                  {offer.tagline && (
                    <p className="text-sm text-foreground/80 italic mb-3">
                      "{offer.tagline}"
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-accent">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">R$ {offer.total_price.toLocaleString('pt-BR')}</span>
                    </div>
                    
                    {offer.installments && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Tag className="w-4 h-4" />
                        <span>{offer.installments}x de R$ {offer.installment_value?.toLocaleString('pt-BR')}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeRemaining(offer.valid_until)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>

                  <button
                    onClick={() => setBannerOffer(offer)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 transition-colors text-sm"
                  >
                    <Image className="w-4 h-4" />
                    Banner
                  </button>
                  
                  <div className="relative group">
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Prorrogar
                    </button>
                    <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <div className="bg-card border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1">
                        <button
                          onClick={() => handleExtendValidity(offer.id, 7)}
                          className="px-4 py-2 text-sm hover:bg-secondary rounded-lg whitespace-nowrap"
                        >
                          +7 dias
                        </button>
                        <button
                          onClick={() => handleExtendValidity(offer.id, 15)}
                          className="px-4 py-2 text-sm hover:bg-secondary rounded-lg whitespace-nowrap"
                        >
                          +15 dias
                        </button>
                        <button
                          onClick={() => handleExtendValidity(offer.id, 30)}
                          className="px-4 py-2 text-sm hover:bg-secondary rounded-lg whitespace-nowrap"
                        >
                          +30 dias
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggleActive(offer)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm ${
                      offer.is_active
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {offer.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma oferta promocional cadastrada</p>
            <p className="text-sm mt-2">Crie ofertas na aba "Destinos" clicando no botão % de cada destino</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setEditingOffer(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditingOffer(null)} className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              Editar Oferta
            </h2>
            <p className="text-muted-foreground mb-6">
              {editingOffer.destinations?.name}
            </p>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Título da Oferta</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                />
              </div>

              {/* Tagline with AI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Legenda Chamativa</label>
                  <button
                    type="button"
                    onClick={handleGenerateTagline}
                    disabled={isGeneratingTagline}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGeneratingTagline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar com IA
                  </button>
                </div>
                <textarea
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Ex: Realize o sonho de conhecer o paraíso!"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground resize-none"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_price: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valor à Vista (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cash_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, cash_price: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              {/* Installments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Número de Parcelas</label>
                  <input
                    type="number"
                    value={formData.installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valor da Parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.installment_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, installment_value: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              {/* Travel Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Data de Ida</label>
                  <input
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, departure_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Data de Volta</label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, return_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              {/* Validity */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Válido até</label>
                <input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                />
              </div>

              {/* Inclusions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">O que está incluso</label>
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Use as setas para reordenar os itens</p>
                <div className="space-y-2">
                  {formData.inclusions.map((inclusion, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveInclusion(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveInclusion(index, 'down')}
                          disabled={index === formData.inclusions.length - 1}
                          className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={inclusion}
                        onChange={(e) => handleInclusionChange(index, e.target.value)}
                        placeholder="Ex: Passagem aérea, Hotel 5 estrelas..."
                        className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                      />
                      {formData.inclusions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInclusion(index)}
                          className="p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded border-border"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                  Oferta ativa
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="flex-1 px-6 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Generator Modal */}
      {bannerOffer && (
        <BannerGenerator 
          offer={bannerOffer} 
          onClose={() => setBannerOffer(null)} 
        />
      )}

      {/* Create Offer Modal - Opens directly with PDF extraction */}
      {showCreateModal && (
        <PromotionalOfferModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchOffers();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

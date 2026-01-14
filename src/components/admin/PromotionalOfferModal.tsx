import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  image_url: string | null;
}

interface PromotionalOfferModalProps {
  destination: Destination;
  onClose: () => void;
  onSuccess: () => void;
}

export const PromotionalOfferModal = ({ destination, onClose, onSuccess }: PromotionalOfferModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  
  const [formData, setFormData] = useState({
    title: `Oferta Especial - ${destination.name}`,
    tagline: '',
    total_price: '',
    cash_price: '',
    installments: '',
    installment_value: '',
    inclusions: [''],
    valid_until: '',
  });

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

  const handleGenerateTagline = async () => {
    if (!formData.total_price) {
      toast.error('Preencha o valor total primeiro');
      return;
    }

    setIsGeneratingTagline(true);
    try {
      const inclusionsText = formData.inclusions.filter(i => i.trim()).join(', ');
      const cashText = formData.cash_price ? `À vista: R$ ${formData.cash_price}` : '';
      const installmentText = formData.installments && formData.installment_value 
        ? `${formData.installments}x de R$ ${formData.installment_value}` 
        : '';

      const response = await supabase.functions.invoke('generate-promo-tagline', {
        body: { 
          destinationName: destination.name,
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
        toast.success('Texto promocional gerado com sucesso!');
      }
    } catch (error) {
      console.error('Error generating tagline:', error);
      toast.error('Erro ao gerar texto promocional');
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.total_price || !formData.valid_until) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('promotional_offers')
        .insert([{
          destination_id: destination.id,
          title: formData.title,
          tagline: formData.tagline || null,
          total_price: parseFloat(formData.total_price),
          cash_price: formData.cash_price ? parseFloat(formData.cash_price) : null,
          installments: formData.installments ? parseInt(formData.installments) : null,
          installment_value: formData.installment_value ? parseFloat(formData.installment_value) : null,
          inclusions: formData.inclusions.filter(i => i.trim()),
          valid_until: new Date(formData.valid_until).toISOString(),
          is_active: true,
        }]);

      if (error) throw error;

      toast.success('Oferta promocional criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating offer:', error);
      toast.error(error.message || 'Erro ao criar oferta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
          Nova Oferta Promocional
        </h2>
        <p className="text-muted-foreground mb-6">
          {destination.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Título da Oferta *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
              required
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Valor Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.total_price}
                onChange={(e) => setFormData(prev => ({ ...prev, total_price: e.target.value }))}
                placeholder="5990.00"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Valor à Vista (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cash_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cash_price: e.target.value }))}
                placeholder="5490.00"
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
                placeholder="12"
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
                placeholder="499.17"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
              />
            </div>
          </div>

          {/* Validity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Válido até *</label>
            <input
              type="datetime-local"
              value={formData.valid_until}
              onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
              required
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
            <div className="space-y-2">
              {formData.inclusions.map((inclusion, index) => (
                <div key={index} className="flex gap-2">
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

          {/* Tagline - Promotional Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">Texto Chamativo (Tagline)</label>
              <button
                type="button"
                onClick={handleGenerateTagline}
                disabled={isGeneratingTagline || !formData.total_price}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-50"
              >
                {isGeneratingTagline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar com IA
              </button>
            </div>
            <textarea
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="Ex: Realize o sonho de conhecer as Maldivas! Pacote completo com desconto imperdível."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Este texto será exibido no popup promocional para chamar atenção do cliente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Criar Oferta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, X, Upload, FileText, Save, Plus, Trash2, 
  Sparkles, MapPin, Calendar, Users, Hotel, Plane, Check
} from 'lucide-react';

interface ExtractedData {
  destination_name: string | null;
  title: string | null;
  total_price: number | null;
  cash_price: number | null;
  installments: number | null;
  installment_value: number | null;
  inclusions: string[] | null;
  valid_until: string | null;
  description: string | null;
  tagline: string | null;
  travel_dates?: {
    start: string | null;
    end: string | null;
  };
  travelers?: {
    adults: number | null;
    children: number | null;
  };
  hotel?: {
    name: string | null;
    room_type: string | null;
    meal_plan: string | null;
  };
  flights?: {
    origin: string | null;
    destination: string | null;
    airline: string | null;
  };
  additional_services?: string[];
}

interface Destination {
  id: string;
  name: string;
  image_url: string | null;
}

interface CreateOfferFromQuoteProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOfferFromQuote = ({ onClose, onSuccess }: CreateOfferFromQuoteProps) => {
  const [step, setStep] = useState<'upload' | 'review' | 'save'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [pdfText, setPdfText] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  
  // Form data for editing
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    total_price: '',
    cash_price: '',
    installments: '',
    installment_value: '',
    inclusions: [''],
    valid_until: '',
  });

  const handleExtract = useCallback(async () => {
    if (!pdfText.trim() || pdfText.length < 50) {
      toast.error('Cole o conteúdo do orçamento (mínimo 50 caracteres)');
      return;
    }

    setIsProcessing(true);
    toast.loading('Extraindo dados com IA...');

    try {
      const { data, error } = await supabase.functions.invoke('extract-quote-pdf', {
        body: { pdfText }
      });

      toast.dismiss();

      if (error) {
        console.error('Error extracting data:', error);
        toast.error('Erro ao extrair dados');
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setExtractedData(data);
      
      setFormData({
        title: data.title || '',
        tagline: data.tagline || '',
        total_price: data.total_price?.toString() || '',
        cash_price: data.cash_price?.toString() || '',
        installments: data.installments?.toString() || '',
        installment_value: data.installment_value?.toString() || '',
        inclusions: data.inclusions?.length > 0 ? data.inclusions : [''],
        valid_until: data.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });

      await loadDestinations(data.destination_name);
      setStep('review');
      toast.success('Dados extraídos com sucesso!');

    } catch (error) {
      toast.dismiss();
      console.error('Error:', error);
      toast.error('Erro ao extrair dados');
    } finally {
      setIsProcessing(false);
    }
  }, [pdfText]);

  const loadDestinations = async (suggestedName?: string) => {
    const { data, error } = await supabase
      .from('destinations')
      .select('id, name, image_url')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading destinations:', error);
      return;
    }

    setDestinations(data || []);

    // Try to auto-match destination
    if (suggestedName && data) {
      const normalizedSuggestion = suggestedName.toLowerCase().trim();
      const match = data.find(d => 
        d.name.toLowerCase().includes(normalizedSuggestion) ||
        normalizedSuggestion.includes(d.name.toLowerCase())
      );
      if (match) {
        setSelectedDestinationId(match.id);
      }
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

  const handleSave = async () => {
    if (!selectedDestinationId) {
      toast.error('Selecione um destino');
      return;
    }

    if (!formData.title || !formData.total_price) {
      toast.error('Título e valor total são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('promotional_offers')
        .insert({
          destination_id: selectedDestinationId,
          title: formData.title,
          tagline: formData.tagline || null,
          total_price: parseFloat(formData.total_price),
          cash_price: formData.cash_price ? parseFloat(formData.cash_price) : null,
          installments: formData.installments ? parseInt(formData.installments) : null,
          installment_value: formData.installment_value ? parseFloat(formData.installment_value) : null,
          inclusions: formData.inclusions.filter(i => i.trim()),
          valid_from: new Date().toISOString(),
          valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
        });

      if (error) throw error;
      
      toast.success('Oferta criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Erro ao salvar oferta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Nova Oferta via PDF
            </h2>
            <p className="text-sm text-muted-foreground">
              Extraia dados automaticamente de um orçamento PDF
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            <Upload className="w-4 h-4" />
            Upload
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            <FileText className="w-4 h-4" />
            Revisar
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'save' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            <Check className="w-4 h-4" />
            Salvar
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cole o conteúdo do orçamento (PDF/texto)
              </label>
              <textarea
                value={pdfText}
                onChange={(e) => setPdfText(e.target.value)}
                placeholder="Abra o PDF do orçamento, selecione todo o texto (Ctrl+A), copie (Ctrl+C) e cole aqui..."
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground resize-none font-mono text-sm"
                disabled={isProcessing}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo 50 caracteres • {pdfText.length} caracteres
              </p>
            </div>

            <button
              onClick={handleExtract}
              disabled={isProcessing || pdfText.length < 50}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extraindo com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extrair Dados com IA
                </>
              )}
            </button>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                O que será extraído automaticamente:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Destino da viagem</li>
                <li>• Valores (total, à vista, parcelado)</li>
                <li>• O que está incluso (hotel, aéreo, transfer, etc.)</li>
                <li>• Datas e informações do hotel</li>
              </ul>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && extractedData && (
          <div className="space-y-6">
            {/* Extracted Summary */}
            {(extractedData.hotel || extractedData.flights || extractedData.travelers) && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Informações Detectadas
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {extractedData.destination_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{extractedData.destination_name}</span>
                    </div>
                  )}
                  
                  {extractedData.travel_dates?.start && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{extractedData.travel_dates.start} a {extractedData.travel_dates.end}</span>
                    </div>
                  )}
                  
                  {extractedData.travelers?.adults && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      <span>
                        {extractedData.travelers.adults} adulto(s)
                        {extractedData.travelers.children ? `, ${extractedData.travelers.children} criança(s)` : ''}
                      </span>
                    </div>
                  )}
                  
                  {extractedData.hotel?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hotel className="w-4 h-4 text-primary" />
                      <span>{extractedData.hotel.name}</span>
                    </div>
                  )}
                  
                  {extractedData.flights?.airline && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Plane className="w-4 h-4 text-primary" />
                      <span>
                        {extractedData.flights.airline}
                        {extractedData.flights.origin && ` (${extractedData.flights.origin} → ${extractedData.flights.destination})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Destination Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Vincular ao Destino *
              </label>
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
              >
                <option value="">Selecione um destino...</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}
                  </option>
                ))}
              </select>
              {extractedData.destination_name && !selectedDestinationId && (
                <p className="mt-1 text-xs text-amber-500">
                  Destino detectado: "{extractedData.destination_name}" - selecione o destino correspondente
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Título da Oferta *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                placeholder="Ex: 7 noites em João Pessoa + Aéreo + Transfer"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Legenda Chamativa</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">Valor Total (R$) *</label>
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

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="flex-1 px-6 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !selectedDestinationId}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Criar Oferta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

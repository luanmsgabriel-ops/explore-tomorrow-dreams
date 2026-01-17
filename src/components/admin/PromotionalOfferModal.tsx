import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Loader2, Sparkles, Plus, Trash2, Wand2, Upload, FileText, Check } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Destination {
  id: string;
  name: string;
  image_url: string | null;
}

interface PromotionalOfferModalProps {
  destination?: Destination;
  onClose: () => void;
  onSuccess: () => void;
}

export const PromotionalOfferModal = ({ destination, onClose, onSuccess }: PromotionalOfferModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [isExtractingData, setIsExtractingData] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Destination state for when creating without pre-selected destination
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(destination || null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [extractedDestinationName, setExtractedDestinationName] = useState<string>('');
  const [isCreatingDestination, setIsCreatingDestination] = useState(false);
  
  const [formData, setFormData] = useState({
    title: destination ? `Oferta Especial - ${destination.name}` : '',
    tagline: '',
    total_price: '',
    cash_price: '',
    installments: '',
    installment_value: '',
    inclusions: [''],
    valid_until: '',
  });

  useEffect(() => {
    if (!destination) {
      fetchDestinations();
    }
  }, [destination]);

  const fetchDestinations = async () => {
    const { data } = await supabase
      .from('destinations')
      .select('id, name, image_url')
      .eq('is_active', true)
      .order('name');
    if (data) setDestinations(data);
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

  // Extract text from PDF file
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }

    setPdfFile(file);
    
    try {
      toast.info('Lendo PDF...');
      const text = await extractTextFromPdf(file);
      setPdfText(text);
      
      if (text.length < 50) {
        toast.error('O PDF não contém texto suficiente para extração');
        return;
      }
      
      toast.success('PDF carregado! Clique em "Extrair Dados" para processar.');
    } catch (error) {
      console.error('Error reading PDF:', error);
      toast.error('Erro ao ler o PDF');
    }
  };

  const handleExtractData = async () => {
    if (!pdfText) {
      toast.error('Carregue um PDF primeiro');
      return;
    }

    setIsExtractingData(true);

    try {
      toast.info('Analisando dados com IA...');
      const { data, error } = await supabase.functions.invoke('extract-quote-pdf', {
        body: { pdfText }
      });

      if (error) throw error;

      if (data) {
        // Store extracted destination name
        if (data.destination_name) {
          setExtractedDestinationName(data.destination_name);
          
          // Try to find matching destination
          const matchingDest = destinations.find(d => 
            d.name.toLowerCase().includes(data.destination_name.toLowerCase()) ||
            data.destination_name.toLowerCase().includes(d.name.toLowerCase())
          );
          
          if (matchingDest) {
            setSelectedDestination(matchingDest);
            toast.success(`Destino encontrado: ${matchingDest.name}`);
          } else {
            toast.info(`Destino "${data.destination_name}" não encontrado. Será criado automaticamente.`);
          }
        }

        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          tagline: data.tagline || prev.tagline,
          total_price: data.total_price ? String(data.total_price) : prev.total_price,
          cash_price: data.cash_price ? String(data.cash_price) : prev.cash_price,
          installments: data.installments ? String(data.installments) : prev.installments,
          installment_value: data.installment_value ? String(data.installment_value) : prev.installment_value,
          inclusions: data.inclusions?.length > 0 ? data.inclusions : prev.inclusions,
          valid_until: data.valid_until ? data.valid_until.split('T')[0] + 'T23:59' : prev.valid_until,
        }));
        toast.success('Dados extraídos com sucesso! Revise e ajuste se necessário.');
      }
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error(error.message || 'Erro ao extrair dados do PDF');
    } finally {
      setIsExtractingData(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, arraste um arquivo PDF');
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: { files: dataTransfer.files } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleGenerateTagline = async () => {
    if (!formData.total_price) {
      toast.error('Preencha o valor total primeiro');
      return;
    }

    const destName = selectedDestination?.name || destination?.name || extractedDestinationName || 'Destino';

    setIsGeneratingTagline(true);
    try {
      const inclusionsText = formData.inclusions.filter(i => i.trim()).join(', ');
      const cashText = formData.cash_price ? `À vista: R$ ${formData.cash_price}` : '';
      const installmentText = formData.installments && formData.installment_value 
        ? `${formData.installments}x de R$ ${formData.installment_value}` 
        : '';

      const response = await supabase.functions.invoke('generate-promo-tagline', {
        body: { 
          destinationName: destName,
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

  const createDestination = async (name: string): Promise<string | null> => {
    setIsCreatingDestination(true);
    try {
      // Generate slug from name
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('destinations')
        .insert({
          name,
          slug,
          description: `Descubra ${name}, um destino incrível para suas próximas férias.`,
          location: name,
          type: 'internacional',
          category: 'praia',
          best_time: 'O ano todo',
          ideal_duration: '5-7 dias',
          for_who: 'Todos os públicos',
          is_active: true,
          is_featured: false,
        })
        .select('id')
        .single();

      if (error) throw error;
      
      toast.success(`Destino "${name}" criado automaticamente!`);
      return data.id;
    } catch (error) {
      console.error('Error creating destination:', error);
      toast.error('Erro ao criar destino automaticamente');
      return null;
    } finally {
      setIsCreatingDestination(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.total_price || !formData.valid_until) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    let destinationId = selectedDestination?.id || destination?.id;

    // If no destination selected but we have extracted name, create it
    if (!destinationId && extractedDestinationName) {
      destinationId = await createDestination(extractedDestinationName) || undefined;
      if (!destinationId) return;
    }

    if (!destinationId) {
      toast.error('Selecione ou crie um destino');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('promotional_offers')
        .insert([{
          destination_id: destinationId,
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

  const currentDestName = selectedDestination?.name || destination?.name || extractedDestinationName || '';

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
          {currentDestName || 'Extraia os dados do PDF para começar'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PDF Upload Extraction */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Preenchimento Automático com IA</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Anexe o PDF do orçamento e clique em extrair para preencher automaticamente.
            </p>
            
            <div
              className={`border-2 border-dashed rounded-xl p-4 transition-all ${
                pdfFile 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-center">
                {pdfFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-foreground text-sm">{pdfFile.name}</span>
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arraste o PDF aqui ou clique para selecionar
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload-modal"
                />
                <div className="flex items-center justify-center gap-2 mt-3">
                  <label
                    htmlFor="pdf-upload-modal"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    {pdfFile ? 'Trocar PDF' : 'Selecionar PDF'}
                  </label>
                  
                  {pdfFile && pdfText && (
                    <button
                      type="button"
                      onClick={handleExtractData}
                      disabled={isExtractingData}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                    >
                      {isExtractingData ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Extraindo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Extrair Dados
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Show destination status after extraction */}
            {extractedDestinationName && !selectedDestination && !destination && (
              <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Destino detectado:</span> {extractedDestinationName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este destino será criado automaticamente ao salvar a oferta.
                </p>
              </div>
            )}
            
            {selectedDestination && !destination && (
              <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-foreground flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Destino encontrado:</span> {selectedDestination.name}
                </p>
              </div>
            )}
          </div>

          {/* Destination selector (only if no pre-selected destination and no extraction yet) */}
          {!destination && !extractedDestinationName && destinations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Selecionar Destino</label>
              <select
                value={selectedDestination?.id || ''}
                onChange={(e) => {
                  const dest = destinations.find(d => d.id === e.target.value);
                  setSelectedDestination(dest || null);
                  if (dest) {
                    setFormData(prev => ({ ...prev, title: `Oferta Especial - ${dest.name}` }));
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
              >
                <option value="">Selecione um destino ou extraia do PDF...</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>{dest.name}</option>
                ))}
              </select>
            </div>
          )}

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
              disabled={isLoading || isCreatingDestination}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {(isLoading || isCreatingDestination) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isCreatingDestination ? 'Criando destino...' : 'Criar Oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

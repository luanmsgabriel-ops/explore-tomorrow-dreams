import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Upload, FileText, Check, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedQuoteData {
  destination_name: string;
  title: string;
  total_price: number;
  cash_price: number | null;
  installments: number | null;
  installment_value: number | null;
  inclusions: string[];
  valid_until: string | null;
  description: string;
  tagline: string;
  travel_dates: {
    start: string | null;
    end: string | null;
  };
  travelers: {
    adults: number | null;
    children: number | null;
  };
  hotel: {
    name: string | null;
    room_type: string | null;
    meal_plan: string | null;
  };
  flights: {
    origin: string | null;
    destination: string | null;
    airline: string | null;
  };
  additional_services: string[];
}

interface CreateOfferFromQuoteProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOfferFromQuote = ({ onClose, onSuccess }: CreateOfferFromQuoteProps) => {
  const [step, setStep] = useState<'upload' | 'review' | 'saving'>('upload');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedQuoteData | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch destinations for selection
  const fetchDestinations = async () => {
    const { data } = await supabase
      .from('destinations')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setDestinations(data);
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
    setIsExtracting(true);

    try {
      // Extract text from PDF
      toast.info('Extraindo texto do PDF...');
      const text = await extractTextFromPdf(file);

      if (text.length < 50) {
        toast.error('O PDF não contém texto suficiente para extração');
        setIsExtracting(false);
        return;
      }

      // Send to AI for extraction
      toast.info('Analisando dados com IA...');
      const { data, error } = await supabase.functions.invoke('extract-quote-pdf', {
        body: { pdfText: text }
      });

      if (error) throw error;

      setExtractedData(data);
      await fetchDestinations();
      setStep('review');
      toast.success('Dados extraídos com sucesso!');
    } catch (error) {
      console.error('Error extracting quote:', error);
      toast.error('Erro ao extrair dados do PDF');
    } finally {
      setIsExtracting(false);
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

    // Create a DataTransfer to set the file input
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

  const handleSave = async () => {
    if (!extractedData || !selectedDestinationId) {
      toast.error('Selecione um destino para continuar');
      return;
    }

    setStep('saving');

    try {
      // Calculate valid_until if not present (default to 30 days from now)
      const validUntil = extractedData.valid_until 
        ? new Date(extractedData.valid_until).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('promotional_offers')
        .insert({
          destination_id: selectedDestinationId,
          title: extractedData.title,
          tagline: extractedData.tagline,
          total_price: extractedData.total_price,
          cash_price: extractedData.cash_price,
          installments: extractedData.installments,
          installment_value: extractedData.installment_value,
          inclusions: extractedData.inclusions,
          valid_until: validUntil,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Oferta criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Erro ao salvar oferta');
      setStep('review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Criar Oferta de Orçamento
            </h2>
            <p className="text-muted-foreground text-sm">
              Faça upload do PDF para extrair automaticamente os dados
            </p>
          </div>
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 transition-all ${
                isExtracting 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {isExtracting ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-foreground font-medium">Processando PDF...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Extraindo texto e analisando com IA
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-foreground font-medium mb-2">
                    Arraste o PDF aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Aceita arquivos PDF de cotações de viagem
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Selecionar PDF
                  </label>
                </div>
              )}
            </div>

            {pdfFile && !isExtracting && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-foreground">{pdfFile.name}</span>
              </div>
            )}
          </div>
        )}

        {step === 'review' && extractedData && (
          <div className="space-y-6">
            {/* Success indicator */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-foreground">Dados extraídos com sucesso! Revise e confirme.</span>
            </div>

            {/* Destination Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Vincular a Destino <span className="text-destructive">*</span>
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
              <p className="text-xs text-muted-foreground mt-1">
                Destino detectado: <span className="font-medium">{extractedData.destination_name}</span>
              </p>
            </div>

            {/* Extracted Data Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm text-muted-foreground mb-1">Título</p>
                <p className="text-foreground font-medium">{extractedData.title}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-foreground font-medium">
                  R$ {extractedData.total_price?.toLocaleString('pt-BR')}
                </p>
              </div>
              {extractedData.cash_price && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Valor à Vista</p>
                  <p className="text-foreground font-medium">
                    R$ {extractedData.cash_price?.toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              {extractedData.installments && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Parcelamento</p>
                  <p className="text-foreground font-medium">
                    {extractedData.installments}x de R$ {extractedData.installment_value?.toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Tagline */}
            {extractedData.tagline && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Legenda Sugerida</p>
                </div>
                <p className="text-foreground italic">"{extractedData.tagline}"</p>
              </div>
            )}

            {/* Inclusions */}
            {extractedData.inclusions?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">O que está incluso</p>
                <div className="flex flex-wrap gap-2">
                  {extractedData.inclusions.map((item, index) => (
                    <span key={index} className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel & Flight info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extractedData.hotel?.name && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Hospedagem</p>
                  <p className="text-foreground font-medium">{extractedData.hotel.name}</p>
                  {extractedData.hotel.room_type && (
                    <p className="text-sm text-muted-foreground">{extractedData.hotel.room_type}</p>
                  )}
                  {extractedData.hotel.meal_plan && (
                    <p className="text-sm text-muted-foreground">{extractedData.hotel.meal_plan}</p>
                  )}
                </div>
              )}
              {extractedData.flights?.airline && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Voo</p>
                  <p className="text-foreground font-medium">{extractedData.flights.airline}</p>
                  {extractedData.flights.origin && extractedData.flights.destination && (
                    <p className="text-sm text-muted-foreground">
                      {extractedData.flights.origin} → {extractedData.flights.destination}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setStep('upload');
                  setPdfFile(null);
                  setExtractedData(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedDestinationId}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Criar Oferta
              </button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-foreground font-medium">Salvando oferta...</p>
          </div>
        )}
      </div>
    </div>
  );
};

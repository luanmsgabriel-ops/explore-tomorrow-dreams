import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Image, Download, Copy, Check, 
  Smartphone, MessageCircle, Sparkles,
  FileUp, Wand2, X, Share2, Link, Calendar
} from 'lucide-react';

type BannerFormat = 'stories' | 'whatsapp';

interface ExtractedQuoteData {
  destination_name: string | null;
  title: string | null;
  total_price: number | null;
  cash_price: number | null;
  installments: number | null;
  installment_value: number | null;
  inclusions: string[];
  departure_date: string | null;
  return_date: string | null;
  valid_until: string | null;
  description: string | null;
  hotel_name: string | null;
  flight_info: string | null;
  tagline: string | null;
  travel_dates?: {
    start: string | null;
    end: string | null;
  };
}

export const StandaloneBannerGenerator = () => {
  const [format, setFormat] = useState<BannerFormat>('stories');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedQuoteData | null>(null);
  const [offerLink, setOfferLink] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [quoteUrl, setQuoteUrl] = useState('');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // Dynamically import pdfjs-dist to avoid worker issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Use CDN worker with correct path format
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }

    setPdfFileName(file.name);
    setIsExtractingPdf(true);
    
    try {
      // Extract text from PDF
      const pdfText = await extractTextFromPdf(file);
      
      if (!pdfText || pdfText.length < 50) {
        throw new Error('Não foi possível extrair texto do PDF');
      }

      // Send to edge function for AI processing
      const response = await supabase.functions.invoke('extract-quote-pdf', {
        body: { pdfText }
      });

      if (response.error) throw response.error;

      const data = response.data as ExtractedQuoteData;
      if (data) {
        setExtractedData(data);
        toast.success('Dados do orçamento extraídos com sucesso!');
      }
    } catch (error: any) {
      console.error('Error extracting PDF:', error);
      toast.error(error.message || 'Erro ao processar o PDF');
      setPdfFileName('');
    } finally {
      setIsExtractingPdf(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExtractFromUrl = async () => {
    if (!quoteUrl.trim()) {
      toast.error('Cole a URL da cotação primeiro');
      return;
    }

    setIsExtractingUrl(true);
    try {
      const response = await supabase.functions.invoke('extract-quote-data', {
        body: { url: quoteUrl.trim() }
      });

      if (response.error) throw response.error;

      const data = response.data as ExtractedQuoteData;
      if (data) {
        setExtractedData(data);
        setOfferLink(quoteUrl.trim());
        toast.success('Dados da cotação extraídos! Use para gerar a legenda.');
      }
    } catch (error: any) {
      console.error('Error extracting quote data:', error);
      toast.error(error.message || 'Erro ao extrair dados da URL');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const generateBanner = async () => {
    if (!extractedData?.destination_name) {
      toast.error('Extraia os dados do orçamento primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const aspectRatio = format === 'stories' ? '9:16 (vertical, Stories/Reels format)' : '1:1 (square, WhatsApp format)';
      const dimensions = format === 'stories' ? '1080x1920' : '1080x1080';
      
      const destinationName = extractedData.destination_name;
      const prompt = `Create a stunning travel promotional banner for ${destinationName}.

📍 DESTINATION: ${destinationName}

FORMAT: ${aspectRatio}
DIMENSIONS: ${dimensions}

EXACT VISUAL STYLE REQUIRED:
- Beautiful high-quality aerial/landscape photo of ${destinationName} as background (beaches, nature, iconic landmarks, scenic views)
- ELEGANT GOLDEN BORDER: thin elegant golden/amber rectangular decorative frame around the edges
- SEMI-TRANSPARENT DARK GRADIENT OVERLAY at bottom third for text overlay
- Single thin horizontal golden decorative line at bottom area
- 3D GOLDEN AIRPLANE: Include a beautiful 3D rendered golden/metallic airplane icon flying across the image, positioned elegantly (top corner or side), with realistic metallic gold texture and subtle shadow
- Small elegant golden compass rose or star icon centered at bottom
- COLOR PALETTE: Rich destination colors, golden/amber accents, dark navy overlay gradient
- Professional travel magazine aesthetic with luxury feel

TEXT TO INCLUDE (ONLY THE DESTINATION NAME):
- Write "${destinationName.toUpperCase()}" in elegant, large, bold golden/white serif typography
- Position the destination name prominently in the center or bottom center of the image
- Use a classic elegant serif font style (like Times New Roman, Playfair Display style)
- Add subtle golden glow or shadow effect to make text stand out
- Make sure the text is clearly readable against the background

CRITICAL - DO NOT INCLUDE:
- NO prices or currency symbols (R$, $, etc)
- NO numbers for prices or dates
- NO promotional text like "promoção", "oferta", "a partir de"
- NO dates or time periods
- NO logos with text
- NO watermarks
- ONLY the destination name text, photo, border, gradient, decorative line, 3D golden airplane, small icon

Focus on creating a breathtaking photo composition with elegant golden decorative elements, the striking 3D golden airplane, and the destination name "${destinationName.toUpperCase()}" beautifully displayed.`;

      const response = await supabase.functions.invoke('generate-promo-image', {
        body: { 
          prompt,
          destinationName
        }
      });

      if (response.error) throw response.error;

      if (response.data?.imageUrl) {
        setGeneratedImage(response.data.imageUrl);
        toast.success('Banner gerado com sucesso!');
      } else {
        throw new Error('Nenhuma imagem gerada');
      }
    } catch (error) {
      console.error('Error generating banner:', error);
      toast.error('Erro ao gerar banner. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCaption = () => {
    if (!extractedData) {
      toast.error('Extraia os dados do orçamento primeiro');
      return;
    }

    setIsGeneratingCaption(true);
    try {
      const { 
        destination_name, 
        title, 
        total_price, 
        cash_price, 
        installments, 
        installment_value,
        inclusions,
        description,
        valid_until,
        departure_date,
        return_date,
        travel_dates
      } = extractedData;

      const inclusionsList = inclusions && inclusions.length > 0 
        ? inclusions.map((inc: string) => `✅ ${inc}`).join('\n')
        : '';

      const briefDescription = description && description.length > 150 
        ? description.substring(0, 150).replace(/\s+\S*$/, '') + '...'
        : description || '';

      // Determine departure and return dates
      const startDate = departure_date || travel_dates?.start;
      const endDate = return_date || travel_dates?.end;

      let captionText = `🌴 *${(destination_name || 'DESTINO').toUpperCase()}* 🌴

${briefDescription ? `✨ ${briefDescription}\n\n` : ''}${title || 'Pacote de Viagem'}
`;

      // Add travel dates if available
      if (startDate && endDate) {
        captionText += `
📅 *Período da Viagem:*
🛫 Ida: ${formatDate(startDate)}
🛬 Volta: ${formatDate(endDate)}
`;
      } else if (startDate) {
        captionText += `
📅 *Data de Ida:* ${formatDate(startDate)}
`;
      }

      captionText += `
💰 *A partir de R$ ${formatPrice(total_price || 0)}*
${cash_price ? `💵 À vista: R$ ${formatPrice(cash_price)}` : ''}
${installments ? `📦 Ou ${installments}x de R$ ${formatPrice(installment_value || 0)}` : ''}

${inclusionsList ? `📋 *O que está incluso:*\n${inclusionsList}\n` : ''}
⏰ *Oferta por tempo limitado!*
${valid_until ? `📅 Válido até ${formatDate(valid_until)}` : ''}`;

      if (offerLink.trim()) {
        captionText += `

🔗 *Veja todos os detalhes:* ${offerLink.trim()}`;
      }

      captionText += `

📲 Entre em contato agora e garanta sua viagem dos sonhos!

✈️ *Tomorrow Travel - Realizando Sonhos*`;

      setCaption(captionText);
      toast.success('Legenda gerada!');
    } catch (error) {
      console.error('Error generating caption:', error);
      toast.error('Erro ao gerar legenda');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setIsCopied(true);
      toast.success('Legenda copiada!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `banner-${extractedData?.destination_name?.toLowerCase().replace(/\s+/g, '-') || 'destino'}-${format}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  const getImageBlob = async (): Promise<Blob | null> => {
    if (!generatedImage) return null;
    
    try {
      const response = await fetch(generatedImage);
      return await response.blob();
    } catch (error) {
      console.error('Error converting image to blob:', error);
      return null;
    }
  };

  const copyImageToClipboard = async (): Promise<boolean> => {
    if (!generatedImage) return false;
    
    try {
      const blob = await getImageBlob();
      if (blob) {
        const pngBlob = new Blob([blob], { type: 'image/png' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': pngBlob
          })
        ]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error copying image to clipboard:', error);
      return false;
    }
  };

  const shareToWhatsApp = async () => {
    if (!caption) {
      toast.error('Gere a legenda primeiro para compartilhar');
      return;
    }

    if (navigator.share && navigator.canShare && generatedImage) {
      try {
        const blob = await getImageBlob();
        if (blob) {
          const file = new File([blob], `banner-${extractedData?.destination_name || 'destino'}.png`, { type: 'image/png' });
          
          const shareData = {
            title: extractedData?.title || 'Banner Promocional',
            text: caption,
            files: [file]
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toast.success('Compartilhado com sucesso!');
            return;
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    if (generatedImage) {
      const imageCopied = await copyImageToClipboard();
      
      if (imageCopied) {
        toast.success('Imagem copiada! Cole (Ctrl+V) no WhatsApp. A legenda será aberta em seguida.', { duration: 4000 });
        
        setTimeout(() => {
          const encodedCaption = encodeURIComponent(caption);
          const whatsappUrl = `https://wa.me/?text=${encodedCaption}`;
          window.open(whatsappUrl, '_blank');
        }, 1500);
      } else {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `whatsapp-${extractedData?.destination_name || 'destino'}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        const encodedCaption = encodeURIComponent(caption);
        const whatsappUrl = `https://wa.me/?text=${encodedCaption}`;
        window.open(whatsappUrl, '_blank');
        
        toast.info('Banner baixado! Anexe ao WhatsApp.', { duration: 5000 });
      }
    } else {
      const encodedCaption = encodeURIComponent(caption);
      const whatsappUrl = `https://wa.me/?text=${encodedCaption}`;
      window.open(whatsappUrl, '_blank');
      toast.success('WhatsApp aberto!');
    }
  };

  const shareToInstagram = async () => {
    await navigator.clipboard.writeText(caption);
    
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `instagram-${extractedData?.destination_name || 'destino'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Legenda copiada e imagem baixada! Compartilhe no Instagram.', { duration: 5000 });
    } else {
      toast.success('Legenda copiada!');
    }
  };

  const clearAll = () => {
    setExtractedData(null);
    setGeneratedImage(null);
    setCaption('');
    setPdfFileName('');
    setOfferLink('');
    setQuoteUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Gerar Banner de Orçamento
        </h1>
        {(extractedData || generatedImage) && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      <p className="text-muted-foreground">
        Faça upload do PDF do orçamento ou cole a URL para extrair as informações e gerar um banner promocional.
      </p>

      {/* PDF Upload */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <FileUp className="w-5 h-5 text-primary" />
          Upload do Orçamento (PDF)
        </h3>

        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isExtractingPdf ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isExtractingPdf}
              className="hidden"
              id="pdf-upload"
            />
            <label 
              htmlFor="pdf-upload" 
              className={`cursor-pointer ${isExtractingPdf ? 'pointer-events-none' : ''}`}
            >
              {isExtractingPdf ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <span className="text-muted-foreground">Extraindo dados do PDF...</span>
                </div>
              ) : pdfFileName ? (
                <div className="flex flex-col items-center gap-3">
                  <FileUp className="w-10 h-10 text-primary" />
                  <span className="text-foreground font-medium">{pdfFileName}</span>
                  <span className="text-sm text-muted-foreground">Clique para trocar o arquivo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileUp className="w-10 h-10 text-muted-foreground" />
                  <span className="text-muted-foreground">Clique para selecionar um PDF</span>
                  <span className="text-sm text-muted-foreground">ou arraste e solte aqui</span>
                </div>
              )}
            </label>
          </div>

          {/* URL Extraction */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Link className="w-4 h-4 text-accent" />
              Ou extrair de URL
            </h4>
            <div className="flex gap-2">
              <input
                type="url"
                value={quoteUrl}
                onChange={(e) => setQuoteUrl(e.target.value)}
                placeholder="https://link-do-orcamento.com"
                className="flex-1 px-4 py-2 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                onClick={handleExtractFromUrl}
                disabled={isExtractingUrl || !quoteUrl.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 text-sm"
              >
                {isExtractingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Extrair
              </button>
            </div>
          </div>

          {extractedData && (
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <h4 className="font-medium text-primary mb-3">✅ Dados Extraídos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Destino:</span>
                  <span className="ml-2 text-foreground font-medium">{extractedData.destination_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="ml-2 text-foreground font-medium">
                    {extractedData.total_price ? `R$ ${formatPrice(extractedData.total_price)}` : 'N/A'}
                  </span>
                </div>
                {extractedData.cash_price && (
                  <div>
                    <span className="text-muted-foreground">À Vista:</span>
                    <span className="ml-2 text-foreground">R$ {formatPrice(extractedData.cash_price)}</span>
                  </div>
                )}
                {extractedData.installments && (
                  <div>
                    <span className="text-muted-foreground">Parcelamento:</span>
                    <span className="ml-2 text-foreground">
                      {extractedData.installments}x de R$ {formatPrice(extractedData.installment_value || 0)}
                    </span>
                  </div>
                )}
                {(extractedData.departure_date || extractedData.travel_dates?.start) && (
                  <div>
                    <span className="text-muted-foreground">Data Ida:</span>
                    <span className="ml-2 text-foreground">
                      {formatDate(extractedData.departure_date || extractedData.travel_dates?.start || '')}
                    </span>
                  </div>
                )}
                {(extractedData.return_date || extractedData.travel_dates?.end) && (
                  <div>
                    <span className="text-muted-foreground">Data Volta:</span>
                    <span className="ml-2 text-foreground">
                      {formatDate(extractedData.return_date || extractedData.travel_dates?.end || '')}
                    </span>
                  </div>
                )}
                {extractedData.hotel_name && (
                  <div>
                    <span className="text-muted-foreground">Hotel:</span>
                    <span className="ml-2 text-foreground">{extractedData.hotel_name}</span>
                  </div>
                )}
                {extractedData.inclusions && extractedData.inclusions.length > 0 && (
                  <div className="col-span-full">
                    <span className="text-muted-foreground">Incluso:</span>
                    <span className="ml-2 text-foreground">{extractedData.inclusions.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner Format Selection */}
      {extractedData && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-medium text-foreground mb-4">Formato do Banner</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setFormat('stories')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${
                format === 'stories' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="font-medium">Stories (9:16)</span>
            </button>
            <button
              onClick={() => setFormat('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${
                format === 'whatsapp' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">WhatsApp (1:1)</span>
            </button>
          </div>

          <button
            onClick={generateBanner}
            disabled={isGenerating}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando Banner...
              </>
            ) : (
              <>
                <Image className="w-5 h-5" />
                Gerar Banner
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Image Preview */}
      {generatedImage && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">Banner Gerado</h3>
            <button
              onClick={downloadImage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Baixar
            </button>
          </div>
          
          <div className={`mx-auto overflow-hidden rounded-xl ${
            format === 'stories' ? 'max-w-[280px]' : 'max-w-[400px]'
          }`}>
            <img 
              src={generatedImage} 
              alt="Banner gerado" 
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Caption Generator */}
      {extractedData && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Legenda para Redes Sociais
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Link do orçamento (opcional)
              </label>
              <input
                type="url"
                value={offerLink}
                onChange={(e) => setOfferLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={generateCaption}
              disabled={isGeneratingCaption}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors w-full font-medium"
            >
              {isGeneratingCaption ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Gerar Legenda
            </button>

            {caption && (
              <div className="space-y-3">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyCaption}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {isCopied ? 'Copiado!' : 'Copiar Legenda'}
                  </button>
                  
                  <button
                    onClick={shareToWhatsApp}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>

                  <button
                    onClick={shareToInstagram}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90 transition-opacity"
                  >
                    <Share2 className="w-4 h-4" />
                    Instagram
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

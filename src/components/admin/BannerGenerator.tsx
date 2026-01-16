import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Image, Download, Copy, Check, 
  Smartphone, MessageCircle, X, Sparkles,
  History, Trash2, Clock, Share2, ExternalLink
} from 'lucide-react';

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
  is_active: boolean;
  destinations: {
    name: string;
    image_url: string | null;
    description: string | null;
  } | null;
}

interface BannerHistoryItem {
  id: string;
  offer_id: string;
  offer_title: string;
  destination_name: string;
  format: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

interface BannerGeneratorProps {
  offer: PromotionalOffer;
  onClose: () => void;
}

type BannerFormat = 'stories' | 'whatsapp';

export const BannerGenerator = ({ offer, onClose }: BannerGeneratorProps) => {
  const [format, setFormat] = useState<BannerFormat>('stories');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<BannerHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, offer.id]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('banner_history')
        .select('*')
        .eq('offer_id', offer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const generateBanner = async () => {
    setIsGenerating(true);
    try {
      const aspectRatio = format === 'stories' ? '9:16 (vertical, Stories/Reels format)' : '1:1 (square, WhatsApp format)';
      const dimensions = format === 'stories' ? '1080x1920' : '1080x1080';
      
      // Prompt com nome do destino em texto elegante
      const destinationName = offer.destinations?.name || 'Destino';
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
          destinationName: offer.destinations?.name || 'Destino',
          destinationImageUrl: offer.destinations?.image_url
        }
      });

      if (response.error) throw response.error;

      if (response.data?.imageUrl) {
        const imageUrl = response.data.imageUrl;
        setGeneratedImage(imageUrl);
        
        // Salvar automaticamente no histórico
        try {
          await supabase
            .from('banner_history')
            .insert({
              offer_id: offer.id,
              offer_title: offer.title,
              destination_name: offer.destinations?.name || 'Destino',
              format,
              image_url: imageUrl,
              caption: null
            });
          
          toast.success('Banner gerado e salvo automaticamente!');
          
          // Atualizar histórico se estiver visível
          if (showHistory) {
            loadHistory();
          }
        } catch (saveError) {
          console.error('Error auto-saving banner:', saveError);
          toast.success('Banner gerado! (Erro ao salvar no histórico)');
        }
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

  const saveBannerToHistory = async () => {
    if (!generatedImage) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('banner_history')
        .insert({
          offer_id: offer.id,
          offer_title: offer.title,
          destination_name: offer.destinations?.name || 'Destino',
          format,
          image_url: generatedImage,
          caption: caption || null
        });

      if (error) throw error;
      
      toast.success('Banner salvo no histórico!');
      if (showHistory) {
        loadHistory();
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Erro ao salvar banner');
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromHistory = (item: BannerHistoryItem) => {
    setGeneratedImage(item.image_url);
    setFormat(item.format as BannerFormat);
    if (item.caption) {
      setCaption(item.caption);
    }
    setShowHistory(false);
    toast.success('Banner carregado do histórico');
  };

  const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('banner_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Banner removido do histórico');
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Erro ao remover banner');
    }
  };

  const generateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const inclusionsList = offer.inclusions.length > 0 
        ? offer.inclusions.map(inc => `✅ ${inc}`).join('\n')
        : '';

      // Cria uma breve descrição do destino (primeiras 2 frases ou 150 caracteres)
      const fullDescription = offer.destinations?.description || '';
      const briefDescription = fullDescription.length > 150 
        ? fullDescription.substring(0, 150).replace(/\s+\S*$/, '') + '...'
        : fullDescription;

      const captionText = `🌴 *${offer.destinations?.name?.toUpperCase()}* 🌴

${briefDescription ? `✨ ${briefDescription}\n\n` : ''}${offer.title}

💰 *A partir de R$ ${formatPrice(offer.total_price)}*
${offer.cash_price ? `💵 À vista: R$ ${formatPrice(offer.cash_price)}` : ''}
${offer.installments ? `📦 Ou ${offer.installments}x de R$ ${formatPrice(offer.installment_value || 0)}` : ''}

${inclusionsList ? `\n📋 *O que está incluso:*\n${inclusionsList}\n` : ''}
⏰ *Oferta por tempo limitado!*
📅 Válido até ${new Date(offer.valid_until).toLocaleDateString('pt-BR')}

📲 Entre em contato agora e garanta sua viagem dos sonhos!

🔗 *Tomorrow Travel - Realizando Sonhos*`;

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
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `banner-${offer.destinations?.name?.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  // Helper function to convert base64/URL to blob
  const getImageBlob = async (): Promise<Blob | null> => {
    if (!generatedImage) return null;
    
    try {
      if (generatedImage.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(generatedImage);
        return await response.blob();
      } else {
        // Fetch from URL
        const response = await fetch(generatedImage);
        return await response.blob();
      }
    } catch (error) {
      console.error('Error converting image to blob:', error);
      return null;
    }
  };

  // Copy image to clipboard
  const copyImageToClipboard = async (): Promise<boolean> => {
    if (!generatedImage) return false;
    
    try {
      const blob = await getImageBlob();
      if (blob) {
        // Convert to PNG blob for clipboard (required format)
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

  const shareWithImage = async (platform: 'whatsapp' | 'instagram') => {
    if (!caption) {
      toast.error('Gere a legenda primeiro para compartilhar');
      return;
    }

    // Check if Web Share API with files is supported (mobile devices)
    if (navigator.share && navigator.canShare && generatedImage) {
      try {
        const blob = await getImageBlob();
        if (blob) {
          const file = new File([blob], `banner-${offer.destinations?.name || 'destino'}.png`, { type: 'image/png' });
          
          const shareData = {
            title: offer.title,
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
        // User cancelled or error - fall back to alternative
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Desktop fallback: Copy image to clipboard, copy caption, then open platform
    if (platform === 'whatsapp') {
      if (generatedImage) {
        // Try to copy image to clipboard first
        const imageCopied = await copyImageToClipboard();
        
        // Copy caption to clipboard as well (will override image, so we do image first for user to paste)
        if (imageCopied) {
          toast.success('Imagem copiada! Cole (Ctrl+V) no WhatsApp. A legenda será aberta em seguida.', { duration: 4000 });
          
          // Wait a moment then open WhatsApp with caption
          setTimeout(() => {
            const encodedCaption = encodeURIComponent(caption);
            const whatsappUrl = `https://wa.me/?text=${encodedCaption}`;
            window.open(whatsappUrl, '_blank');
          }, 1500);
        } else {
          // Clipboard API not supported, download instead
          const link = document.createElement('a');
          link.href = generatedImage;
          link.download = `whatsapp-${offer.destinations?.name || 'destino'}-${Date.now()}.png`;
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
    } else if (platform === 'instagram') {
      // Instagram: copy caption and download image
      await navigator.clipboard.writeText(caption);
      
      if (generatedImage) {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `instagram-${offer.destinations?.name || 'destino'}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Legenda copiada e imagem baixada! Compartilhe no Instagram.', { duration: 5000 });
      } else {
        toast.success('Legenda copiada!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Gerar Banner Promocional
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showHistory 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary hover:bg-muted text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
        </div>
        <p className="text-muted-foreground mb-6">
          {offer.destinations?.name} - {offer.title}
        </p>

        {showHistory ? (
          // History View
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Banners Salvos</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-sm text-primary hover:text-primary/80"
              >
                ← Voltar
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum banner salvo ainda</p>
                <p className="text-sm">Gere um banner e salve para reutilizar depois</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-secondary rounded-xl overflow-hidden"
                  >
                    <div 
                      onClick={() => loadFromHistory(item)}
                      className={`cursor-pointer hover:opacity-90 transition-opacity ${item.format === 'stories' ? 'aspect-[9/16]' : 'aspect-square'}`}
                    >
                      <img 
                        src={item.image_url} 
                        alt={item.offer_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{item.offer_title}</p>
                        <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          <span className="uppercase">{item.format}</span>
                        </div>
                      </div>
                    </div>
                    {/* Botão de excluir sempre visível */}
                    <button
                      onClick={(e) => deleteFromHistory(item.id, e)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                      title="Excluir banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Generator View
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Formato do Banner
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('stories')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      format === 'stories'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary hover:border-primary/50'
                    }`}
                  >
                    <Smartphone className="w-8 h-8" />
                    <span className="font-medium">Stories</span>
                    <span className="text-xs text-muted-foreground">9:16 Vertical</span>
                  </button>
                  <button
                    onClick={() => setFormat('whatsapp')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      format === 'whatsapp'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary hover:border-primary/50'
                    }`}
                  >
                    <MessageCircle className="w-8 h-8" />
                    <span className="font-medium">WhatsApp</span>
                    <span className="text-xs text-muted-foreground">1:1 Quadrado</span>
                  </button>
                </div>
              </div>

              {/* Generate Banner Button */}
              <button
                onClick={generateBanner}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
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

              {/* Caption Section */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    Legenda para WhatsApp
                  </label>
                  <button
                    onClick={generateCaption}
                    disabled={isGeneratingCaption}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    {isGeneratingCaption ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Gerar Legenda
                  </button>
                </div>
                
                {caption && (
                  <div className="space-y-3">
                    <div className="bg-secondary rounded-xl p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                        {caption}
                      </pre>
                    </div>
                    <button
                      onClick={copyCaption}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Legenda
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Preview do Banner
              </label>
              
              <div 
                className={`bg-secondary rounded-xl overflow-hidden flex items-center justify-center ${
                  format === 'stories' ? 'aspect-[9/16]' : 'aspect-square'
                }`}
              >
                {generatedImage ? (
                  <img 
                    src={generatedImage} 
                    alt="Banner gerado" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Clique em "Gerar Banner" para criar sua imagem promocional</p>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={saveBannerToHistory}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <History className="w-4 h-4" />
                      )}
                      Salvar
                    </button>
                    <button
                      onClick={downloadImage}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </button>
                  </div>
                  
                  {/* Share Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => shareWithImage('whatsapp')}
                      disabled={!caption}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => shareWithImage('instagram')}
                      disabled={!caption}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-4 h-4" />
                      Instagram
                    </button>
                  </div>
                  {!caption && generatedImage && (
                    <p className="text-xs text-center text-muted-foreground">
                      Gere a legenda para habilitar o compartilhamento
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

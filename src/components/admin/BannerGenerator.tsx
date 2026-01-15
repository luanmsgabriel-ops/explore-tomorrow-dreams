import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Image, Download, Copy, Check, 
  Smartphone, MessageCircle, X, Sparkles 
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
  } | null;
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

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const generateBanner = async () => {
    setIsGenerating(true);
    try {
      const aspectRatio = format === 'stories' ? '9:16 (vertical, Stories/Reels format)' : '1:1 (square, WhatsApp format)';
      const dimensions = format === 'stories' ? '1080x1920' : '1080x1080';
      
      const prompt = `Create a professional promotional travel banner for ${offer.destinations?.name || 'destination'}.

📍 DESTINATION: ${offer.destinations?.name}
💰 PRICE: R$ ${formatPrice(offer.total_price)}
${offer.cash_price ? `💵 CASH PRICE: R$ ${formatPrice(offer.cash_price)}` : ''}
${offer.installments ? `📦 INSTALLMENTS: ${offer.installments}x R$ ${formatPrice(offer.installment_value || 0)}` : ''}

📝 OFFER TITLE: ${offer.title}
${offer.tagline ? `✨ TAGLINE: ${offer.tagline}` : ''}

FORMAT: ${aspectRatio}
DIMENSIONS: ${dimensions}

DESIGN REQUIREMENTS:
- Beautiful destination landscape as main visual
- CLEAR price display with "R$ ${formatPrice(offer.total_price)}" prominently shown
- ${offer.installments ? `Show "${offer.installments}x de R$ ${formatPrice(offer.installment_value || 0)}" as payment option` : ''}
- "TOMORROW TRAVEL" branding
- Golden/amber accents for pricing
- Dark elegant overlay for text readability
- Professional travel agency style
- URGENCY element: "Oferta por tempo limitado" or similar
- Make it scroll-stopping and conversion-focused`;

      const response = await supabase.functions.invoke('generate-promo-image', {
        body: { 
          prompt,
          destinationName: offer.destinations?.name || 'Destino',
          destinationImageUrl: offer.destinations?.image_url
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

  const generateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const inclusionsList = offer.inclusions.length > 0 
        ? offer.inclusions.map(inc => `✅ ${inc}`).join('\n')
        : '';

      const captionText = `🌴 *${offer.destinations?.name?.toUpperCase()}* 🌴

${offer.title}

💰 *A partir de R$ ${formatPrice(offer.total_price)}*
${offer.cash_price ? `💵 À vista: R$ ${formatPrice(offer.cash_price)}` : ''}
${offer.installments ? `📦 Ou ${offer.installments}x de R$ ${formatPrice(offer.installment_value || 0)}` : ''}

${inclusionsList ? `\n📋 *O que está incluso:*\n${inclusionsList}\n` : ''}
⏰ *Oferta por tempo limitado!*
📅 Válido até ${new Date(offer.valid_until).toLocaleDateString('pt-BR')}

📲 Entre em contato agora e garanta sua viagem dos sonhos!

🔗 *Tomorrow Travel - Realizando Sonhos*
#TomorrowTravel #Viagem #${offer.destinations?.name?.replace(/\s+/g, '')} #Promoção`;

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

        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
          Gerar Banner Promocional
        </h2>
        <p className="text-muted-foreground mb-6">
          {offer.destinations?.name} - {offer.title}
        </p>

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
              <button
                onClick={downloadImage}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Banner
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

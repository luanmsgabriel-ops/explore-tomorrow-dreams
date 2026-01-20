import { useState, useRef } from 'react';
import { Image, Upload, Loader2, Download, RefreshCw, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDestinations } from '@/hooks/useDestinations';

interface ClientImageGeneratorProps {
  userName: string;
  userEmail: string;
  userWhatsapp?: string;
}

export const ClientImageGenerator = ({ userName, userEmail, userWhatsapp = '' }: ClientImageGeneratorProps) => {
  const [step, setStep] = useState<'destination' | 'upload' | 'result'>('destination');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [selectedDestinationName, setSelectedDestinationName] = useState('');
  const { destinations, isLoading: isLoadingDestinations } = useDestinations();
  
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDestinationSelect = (destId: string, destName: string) => {
    setSelectedDestinationId(destId);
    setSelectedDestinationName(destName);
    setStep('upload');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const response = await supabase.functions.invoke('generate-destination-image', {
        body: {
          destination: selectedDestinationName,
          userImageBase64: userImage,
          email: userEmail,
          whatsapp: userWhatsapp,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { imageUrl } = response.data;
      setGeneratedImage(imageUrl);
      setStep('result');

      // Save to database
      await supabase.from('ai_generated_images').insert({
        destination_id: selectedDestinationId,
        destination_name: selectedDestinationName,
        prompt: `Imagem gerada para ${selectedDestinationName} - Cliente: ${userName}`,
        image_url: imageUrl,
        user_email: userEmail,
        user_whatsapp: userWhatsapp,
      });

      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `viagem-${selectedDestinationName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const resetGenerator = () => {
    setStep('destination');
    setSelectedDestinationId('');
    setSelectedDestinationName('');
    setUserImage(null);
    setGeneratedImage(null);
  };

  // Destination Selection Step
  if (step === 'destination') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Image className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Gerar Imagem no Destino
          </h3>
          <p className="text-muted-foreground">
            Olá, {userName}! Escolha o destino para criar sua imagem personalizada
          </p>
        </div>

        {isLoadingDestinations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {destinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => handleDestinationSelect(dest.id, dest.name)}
                className="relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all group aspect-[4/3]"
              >
                <img 
                  src={dest.image || '/placeholder.svg'} 
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-medium text-sm">{dest.name}</p>
                  <p className="text-white/70 text-xs">{dest.location}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Upload Step
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Image className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Visualize-se em {selectedDestinationName}
          </h3>
          <p className="text-muted-foreground">
            Envie uma foto sua ou da sua família
          </p>
        </div>

        {/* Upload section */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 border border-accent/30">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                📸 Inclua uma foto sua ou da sua família!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nossa IA vai criar uma imagem personalizada de vocês no destino.
              </p>
            </div>
          </div>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-accent/50 rounded-xl p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
          >
            {userImage ? (
              <div className="relative">
                <img
                  src={userImage}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded-lg object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserImage(null);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-accent mx-auto mb-3" />
                <p className="text-foreground font-medium text-sm mb-1">
                  Clique para enviar sua foto
                </p>
                <p className="text-xs text-muted-foreground">
                  Foto de rosto ou em família • Máx 5MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep('destination')}
            className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Image className="w-5 h-5" />
                Gerar Imagem
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Result Step
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-foreground">
            Sua Imagem em {selectedDestinationName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Imagem gerada com IA
          </p>
        </div>
        <button
          onClick={resetGenerator}
          className="text-sm text-primary hover:underline"
        >
          Nova Imagem
        </button>
      </div>

      {generatedImage && (
        <>
          <div className="rounded-xl overflow-hidden border border-border">
            <img
              src={generatedImage}
              alt={`Você em ${selectedDestinationName}`}
              className="w-full"
            />
          </div>
          
          {/* Branded message */}
          <div className="text-center py-4 px-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl border border-primary/20">
            <p className="text-lg font-medium text-foreground">
              Isso pode se tornar <span className="font-bold text-primary uppercase">REAL</span> com a{' '}
              <span className="font-bold text-accent">TOMORROW TRAVEL</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 btn-gold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar Imagem
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Gerar Novamente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

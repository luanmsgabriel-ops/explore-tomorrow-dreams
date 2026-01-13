import { useState, useRef } from 'react';
import { Image, Upload, Loader2, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageGeneratorProps {
  destinationId: string;
  destinationName: string;
}

export const ImageGenerator = ({ destinationId, destinationName }: ImageGeneratorProps) => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    `Pessoa visitando ${destinationName}, cenário realista com os principais pontos turísticos, iluminação natural, estilo fotografia de viagem profissional`
  );
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
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
          destination: destinationName,
          userImageBase64: userImage,
          customPrompt: prompt,
        },
      });

      if (response.error) throw response.error;

      const { imageUrl } = response.data;
      setGeneratedImage(imageUrl);

      // Save to database
      await supabase.from('ai_generated_images').insert({
        destination_id: destinationId,
        destination_name: destinationName,
        prompt,
        image_url: imageUrl,
      });

      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `viagem-${destinationName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Image className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
          Gerar Imagem no Destino
        </h3>
        <p className="text-muted-foreground">
          Visualize você em {destinationName} com IA
        </p>
      </div>

      <div className="space-y-6">
        {/* Upload section */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sua foto (opcional)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Clique para fazer upload de uma foto
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

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Descrição da imagem
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
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

        {/* Result */}
        {generatedImage && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border">
              <img
                src={generatedImage}
                alt={`Você em ${destinationName}`}
                className="w-full"
              />
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
          </div>
        )}
      </div>
    </div>
  );
};

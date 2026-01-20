import { useState } from 'react';
import { Sparkles, Map, Image, X } from 'lucide-react';
import { ItineraryGenerator } from '@/components/ItineraryGenerator';
import { ImageGenerator } from '@/components/ImageGenerator';

interface ClientAIToolsProps {
  destinationId: string;
  destinationName: string;
}

export const ClientAITools = ({ destinationId, destinationName }: ClientAIToolsProps) => {
  const [activeTool, setActiveTool] = useState<'none' | 'itinerary' | 'image'>('none');

  if (activeTool === 'itinerary') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveTool('none')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
          Voltar
        </button>
        <ItineraryGenerator 
          destinationId={destinationId} 
          destinationName={destinationName}
          onClose={() => setActiveTool('none')}
        />
      </div>
    );
  }

  if (activeTool === 'image') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveTool('none')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
          Voltar
        </button>
        <ImageGenerator 
          destinationId={destinationId} 
          destinationName={destinationName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Ferramentas de IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Use inteligência artificial para planejar sua viagem
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Itinerary Generator */}
        <button
          onClick={() => setActiveTool('itinerary')}
          className="group p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/50 transition-all text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Map className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Criar Roteiro com IA
          </h3>
          <p className="text-muted-foreground text-sm">
            Gere um roteiro personalizado para {destinationName} com base nas suas preferências de viagem.
          </p>
          <div className="mt-6 flex items-center gap-2 text-primary font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Iniciar</span>
          </div>
        </button>

        {/* Image Generator */}
        <button
          onClick={() => setActiveTool('image')}
          className="group p-8 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 hover:border-accent/50 transition-all text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Image className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Gerar Imagem com IA
          </h3>
          <p className="text-muted-foreground text-sm">
            Crie uma imagem temática da sua viagem para {destinationName} usando sua foto.
          </p>
          <div className="mt-6 flex items-center gap-2 text-accent font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Iniciar</span>
          </div>
        </button>
      </div>

      {/* Tips */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Dicas para usar as ferramentas de IA
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Roteiro:</strong> Quanto mais detalhes você fornecer sobre suas preferências, melhor será o roteiro gerado</li>
          <li>• <strong>Imagem:</strong> Use fotos com boa iluminação e rosto visível para melhores resultados</li>
          <li>• Você pode gerar novos conteúdos a qualquer momento</li>
          <li>• Os roteiros podem ser baixados em PDF para usar offline</li>
        </ul>
      </div>
    </div>
  );
};

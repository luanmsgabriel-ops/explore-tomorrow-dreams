import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Info, 
  Lightbulb, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ClientTripTipsProps {
  tripId: string;
  tripData: {
    destination_name: string;
    trip_tips?: string | null;
  };
}

export const ClientTripTips = ({ tripId, tripData }: ClientTripTipsProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Default tips that are always shown
  const defaultTips = [
    {
      icon: CheckCircle,
      title: 'Check-in Online',
      description: 'Faça o check-in online 24-48h antes do voo para garantir seu assento e evitar filas no aeroporto.'
    },
    {
      icon: AlertCircle,
      title: 'Documentos',
      description: 'Verifique a validade do seu passaporte (mínimo 6 meses) e providencie vistos necessários.'
    },
    {
      icon: Lightbulb,
      title: 'Bagagem',
      description: 'Confira as regras de bagagem da companhia aérea e evite surpresas no embarque.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Info className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Informações Importantes</h2>
          <p className="text-muted-foreground">Dicas e orientações para sua viagem</p>
        </div>
      </div>

      {/* Custom Tips from Admin */}
      {tripData.trip_tips && (
        <div className="glass rounded-2xl p-6 border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Dicas Personalizadas</h3>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-foreground">
            <ReactMarkdown>{tripData.trip_tips}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Default Tips Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {defaultTips.map((tip, index) => (
          <div key={index} className="glass rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
              <tip.icon className="w-5 h-5 text-accent" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">{tip.title}</h4>
            <p className="text-sm text-muted-foreground">{tip.description}</p>
          </div>
        ))}
      </div>

      {/* Destination Specific Info */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Preparativos para {tripData.destination_name}</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-secondary/50">
            <h4 className="font-medium text-foreground mb-2">📱 Conectividade</h4>
            <p className="text-sm text-muted-foreground">
              Considere adquirir um chip internacional ou ativar roaming para manter-se conectado durante a viagem.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50">
            <h4 className="font-medium text-foreground mb-2">💳 Dinheiro e Cartões</h4>
            <p className="text-sm text-muted-foreground">
              Avise seu banco sobre a viagem para evitar bloqueios. Leve uma pequena quantia em dinheiro local.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50">
            <h4 className="font-medium text-foreground mb-2">🏥 Saúde</h4>
            <p className="text-sm text-muted-foreground">
              Verifique se há vacinas recomendadas e leve uma pequena farmácia de viagem com medicamentos básicos.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50">
            <h4 className="font-medium text-foreground mb-2">📋 Seguro Viagem</h4>
            <p className="text-sm text-muted-foreground">
              Certifique-se de ter um seguro viagem válido. Em caso de emergência, entre em contato com a seguradora.
            </p>
          </div>
        </div>
      </div>

      {/* No Custom Tips Message */}
      {!tripData.trip_tips && (
        <div className="glass rounded-2xl p-6 text-center">
          <Info className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Seu consultor de viagens poderá adicionar dicas personalizadas aqui.
          </p>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { Sparkles, Loader2, Mail, Phone, Download, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ItineraryGeneratorProps {
  destinationId: string;
  destinationName: string;
  onClose?: () => void;
}

export const ItineraryGenerator = ({ destinationId, destinationName, onClose }: ItineraryGeneratorProps) => {
  const [step, setStep] = useState<'contact' | 'preferences' | 'generating' | 'result'>('contact');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [preferences, setPreferences] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !whatsapp) {
      toast.error('Preencha todos os campos');
      return;
    }
    setStep('preferences');
  };

  const handleGenerate = async () => {
    setStep('generating');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('generate-itinerary', {
        body: {
          destination: destinationName,
          preferences,
          email,
          whatsapp,
        },
      });

      if (response.error) throw response.error;

      const { itinerary: generatedItinerary } = response.data;
      setItinerary(generatedItinerary);

      // Save to database
      await supabase.from('ai_itineraries').insert({
        destination_id: destinationId,
        destination_name: destinationName,
        user_email: email,
        user_whatsapp: whatsapp,
        preferences,
        itinerary_content: generatedItinerary,
      });

      setStep('result');
      toast.success('Roteiro gerado com sucesso!');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast.error('Erro ao gerar roteiro. Tente novamente.');
      setStep('preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([itinerary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-${destinationName.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'contact') {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Criar Roteiro com IA
          </h3>
          <p className="text-muted-foreground">
            Informe seus dados para receber seu roteiro personalizado para {destinationName}
          </p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full btn-gold">
            Continuar
          </button>
        </form>
      </div>
    );
  }

  if (step === 'preferences') {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Suas Preferências
          </h3>
          <p className="text-muted-foreground">
            Conte-nos mais sobre o que você busca nessa viagem (opcional)
          </p>
        </div>

        <div className="space-y-4">
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="Ex: Viagem romântica, gosto de gastronomia e vinhos, prefiro hotéis boutique, quero conhecer lugares menos turísticos..."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-none"
          />

          <button onClick={handleGenerate} className="w-full btn-primary flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Gerar Meu Roteiro
          </button>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
          Criando seu roteiro...
        </h3>
        <p className="text-muted-foreground">
          Nossa IA está preparando um roteiro personalizado para você. Isso pode levar alguns segundos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 border-b border-border">
        <h3 className="font-serif text-xl font-bold text-foreground">
          Seu Roteiro para {destinationName}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{itinerary}</ReactMarkdown>
        </div>
      </div>

      <div className="p-6 border-t border-border flex flex-wrap gap-3">
        <button onClick={handleDownload} className="btn-outline flex items-center gap-2">
          <Download className="w-4 h-4" />
          Baixar Roteiro
        </button>
        <button className="btn-gold flex items-center gap-2">
          <Send className="w-4 h-4" />
          Solicitar Cotação
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-outline ml-auto">
            Fechar
          </button>
        )}
      </div>
    </div>
  );
};

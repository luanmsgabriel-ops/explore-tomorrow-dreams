import { useState } from 'react';
import { Send, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuoteFormChatProps {
  destinationId?: string;
  destinationName?: string;
  onClose?: () => void;
}

const questions = [
  { key: 'travel_date', question: 'Quando você pretende viajar?', placeholder: 'Ex: Janeiro de 2026, Próximas férias...' },
  { key: 'num_people', question: 'Quantas pessoas vão viajar?', placeholder: 'Ex: 2 adultos, 2 adultos e 1 criança...' },
  { key: 'travel_type', question: 'O que você busca nessa viagem?', placeholder: 'Ex: Praia, aventura, romance, história, neve, luxo...' },
  { key: 'preferred_airport', question: 'Qual aeroporto de preferência para embarque?', placeholder: 'Ex: Guarulhos (GRU), Congonhas...' },
  { key: 'flight_time_preference', question: 'Tem preferência de horário para os voos?', placeholder: 'Ex: Manhã, noite, tanto faz...' },
  { key: 'traveling_with_children', question: 'Vai viajar com crianças?', placeholder: 'Sim ou Não' },
  { key: 'special_requests', question: 'Possui algum pedido especial ou necessidade específica?', placeholder: 'Ex: Acessibilidade, dietas, comemorações...' },
  { key: 'travel_word', question: 'Qual palavra representa esta viagem para você?', placeholder: 'Ex: Aventura, descanso, descoberta, romance...' },
  { key: 'email', question: 'Qual seu e-mail para contato?', placeholder: 'seu@email.com' },
  { key: 'whatsapp', question: 'Qual seu WhatsApp?', placeholder: '(11) 99999-9999' },
  { key: 'preferred_contact_time', question: 'Qual melhor horário para contato?', placeholder: 'Ex: Manhã, tarde, noite...' },
  { key: 'preferred_contact_channel', question: 'Prefere contato por WhatsApp, e-mail ou ambos?', placeholder: 'WhatsApp, E-mail ou Ambos' },
];

export const QuoteFormChat = ({ destinationId, destinationName, onClose }: QuoteFormChatProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;

    const currentQuestion = questions[currentStep];
    const newAnswers = { ...answers, [currentQuestion.key]: currentAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitForm(newAnswers);
    }
  };

  const submitForm = async (formData: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('quote_requests').insert({
        travel_date: formData.travel_date,
        num_people: formData.num_people,
        travel_type: formData.travel_type,
        preferred_airport: formData.preferred_airport,
        flight_time_preference: formData.flight_time_preference,
        traveling_with_children: formData.traveling_with_children?.toLowerCase().includes('sim'),
        special_requests: formData.special_requests,
        travel_word: formData.travel_word,
        email: formData.email,
        whatsapp: formData.whatsapp,
        preferred_contact_time: formData.preferred_contact_time,
        preferred_contact_channel: formData.preferred_contact_channel,
        destination_id: destinationId,
        destination_name: destinationName,
      });

      if (error) throw error;

      setIsComplete(true);
      toast.success('Solicitação enviada com sucesso! Entraremos em contato em breve.');
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  if (isComplete) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
          Solicitação Enviada!
        </h3>
        <p className="text-muted-foreground mb-6">
          Recebemos sua solicitação e entraremos em contato em breve pelo canal de sua preferência.
        </p>
        {onClose && (
          <button onClick={onClose} className="btn-primary">
            Fechar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Pergunta {currentStep + 1} de {questions.length}
          </span>
          <span className="text-sm text-primary font-medium">
            {Math.round(((currentStep + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4">
        {/* Previous answers */}
        {Object.entries(answers).map(([key, value], index) => {
          const q = questions.find(q => q.key === key);
          return (
            <div key={key} className="space-y-2 animate-fade-in">
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-foreground text-sm">{q?.question}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">{value}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Current question */}
        <div className="flex justify-start animate-fade-in">
          <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
            <p className="text-foreground">{questions[currentStep].question}</p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="p-6 border-t border-border">
        <div className="flex gap-3">
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={questions[currentStep].placeholder}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            disabled={isSubmitting}
            autoFocus
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={!currentAnswer.trim() || isSubmitting}
            className="btn-primary p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

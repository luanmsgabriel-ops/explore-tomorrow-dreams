import { useState, useMemo } from 'react';
import { Send, Check, Loader2, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { destinations } from '@/data/destinations';
import { quoteFormSchema, validateForm, sanitizeText, isValidationError } from '@/lib/validations';

interface QuoteFormChatProps {
  destinationId?: string;
  destinationName?: string;
  onClose?: () => void;
}

const baseQuestions = [
  { key: 'destination_choice', question: 'Qual destino você deseja cotar?', placeholder: 'Digite o nome do destino ou escolha da lista...' },
  { key: 'other_destination', question: 'Tem outro destino em mente ou prefere nos contar o estilo de viagem que busca?', placeholder: 'Ex: Outro destino específico, praias paradisíacas, neve, cultura...' },
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
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (destinationName) {
      return { destination_choice: destinationName };
    }
    return {};
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const questions = useMemo(() => {
    if (destinationName) {
      return baseQuestions.filter(q => q.key !== 'destination_choice');
    }
    return baseQuestions;
  }, [destinationName]);

  const filteredDestinations = useMemo(() => {
    if (!currentAnswer.trim()) return destinations.slice(0, 6);
    const search = currentAnswer.toLowerCase();
    return destinations.filter(d => 
      d.name.toLowerCase().includes(search) || 
      d.location.toLowerCase().includes(search)
    ).slice(0, 6);
  }, [currentAnswer]);

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;

    // Sanitiza a entrada
    const sanitizedAnswer = sanitizeText(currentAnswer);
    setValidationError(null);

    const currentQuestion = questions[currentStep];
    const newAnswers = { ...answers, [currentQuestion.key]: sanitizedAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setShowDestinationSuggestions(false);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitForm(newAnswers);
    }
  };

  const handleSelectDestination = (destName: string) => {
    setCurrentAnswer(destName);
    setShowDestinationSuggestions(false);
  };

  const handleGoBack = () => {
    if (currentStep > 0) {
      const previousQuestion = questions[currentStep - 1];
      const previousAnswer = answers[previousQuestion.key] || '';
      
      const newAnswers = { ...answers };
      delete newAnswers[previousQuestion.key];
      setAnswers(newAnswers);
      
      setCurrentAnswer(previousAnswer);
      setCurrentStep(currentStep - 1);
      setShowDestinationSuggestions(false);
      setValidationError(null);
    }
  };

  const submitForm = async (formData: Record<string, string>) => {
    setIsSubmitting(true);
    setValidationError(null);

    // Valida os dados do formulário
    const validation = validateForm(quoteFormSchema, formData);
    if (isValidationError(validation)) {
      const emailError = validation.errors.find(e => e.field === 'email');
      const phoneError = validation.errors.find(e => e.field === 'whatsapp');
      
      if (emailError) {
        setValidationError(emailError.message);
        setCurrentStep(questions.findIndex(q => q.key === 'email'));
        setIsSubmitting(false);
        return;
      }
      if (phoneError) {
        setValidationError(phoneError.message);
        setCurrentStep(questions.findIndex(q => q.key === 'whatsapp'));
        setIsSubmitting(false);
        return;
      }
      
      toast.error('Por favor, verifique os dados informados.');
      setIsSubmitting(false);
      return;
    }

    try {
      const finalDestinationName = formData.destination_choice || destinationName;
      const otherDestination = formData.other_destination;
      
      const insertData = {
        travel_date: formData.travel_date,
        num_people: formData.num_people,
        travel_type: formData.travel_type,
        preferred_airport: formData.preferred_airport,
        flight_time_preference: formData.flight_time_preference,
        traveling_with_children: formData.traveling_with_children?.toLowerCase().includes('sim'),
        special_requests: otherDestination 
          ? `Outro destino/estilo: ${otherDestination}. ${formData.special_requests || ''}`
          : formData.special_requests,
        travel_word: formData.travel_word,
        email: formData.email,
        whatsapp: formData.whatsapp,
        preferred_contact_time: formData.preferred_contact_time,
        preferred_contact_channel: formData.preferred_contact_channel,
        destination_id: destinationId || null,
        destination_name: finalDestinationName,
      };
      
      const { error } = await supabase.from('quote_requests').insert(insertData);

      if (error) throw error;

      // Envia notificação por e-mail para o admin
      try {
        const notifyResponse = await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'quote_request',
            data: insertData,
          },
        });
        if (notifyResponse.error) {
          console.error('Erro ao enviar notificação:', notifyResponse.error);
        } else {
          console.log('Notificação enviada com sucesso');
        }
      } catch (err) {
        console.error('Erro ao enviar notificação:', err);
      }

      setIsComplete(true);
      toast.success('Solicitação enviada com sucesso! Entraremos em contato em breve.');
    } catch {
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

  const isDestinationQuestion = questions[currentStep]?.key === 'destination_choice';

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

      {/* Chat area - Only current question */}
      <div className="flex-1 flex flex-col justify-center px-6 overflow-y-auto">
        <div className="flex justify-start animate-fade-in">
          <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
            <p className="text-foreground text-lg">{questions[currentStep].question}</p>
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="mt-2 text-sm text-destructive animate-fade-in">
            {validationError}
          </div>
        )}

        {/* Destination suggestions */}
        {isDestinationQuestion && showDestinationSuggestions && filteredDestinations.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 animate-fade-in">
            {filteredDestinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => handleSelectDestination(dest.name)}
                className="text-left p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/50 transition-all"
              >
                <p className="font-medium text-foreground text-sm">{dest.name}</p>
                <p className="text-xs text-muted-foreground">{dest.location}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-6 border-t border-border">
        <div className="flex gap-3">
          {/* Back button */}
          {currentStep > 0 && (
            <button
              onClick={handleGoBack}
              className="p-3 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
              title="Voltar para pergunta anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => {
              setCurrentAnswer(e.target.value);
              setValidationError(null);
              if (isDestinationQuestion) {
                setShowDestinationSuggestions(true);
              }
            }}
            onFocus={() => {
              if (isDestinationQuestion) {
                setShowDestinationSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={questions[currentStep].placeholder}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            disabled={isSubmitting}
            autoFocus
            maxLength={1000}
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

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Phone, UserCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { chatMessageSchema, generateSecureSessionId, sanitizeText, phoneSchema, nameSchema } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TeoMascot } from '@/components/TeoMascot';
import { QuotationStatusDisplay } from '@/components/QuotationStatusDisplay';
import { useQuotation, parseQuotationTag, formatQuotationResults } from '@/hooks/useQuotation';
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuizAnswers {
  travelStyle?: string;
  climate?: string;
  experience?: string;
  budget?: string;
  companion?: string;
}

type ChatStep = 'collect_name' | 'collect_whatsapp' | 'chatting' | 'destination_chosen';

interface TeoChatProps {
  fullPage?: boolean;
}

export const TeoChat = ({ fullPage = false }: TeoChatProps) => {
  const sessionIdRef = useRef<string>(generateSecureSessionId());
  const quotation = useQuotation();
  
  const [step, setStep] = useState<ChatStep>('collect_name');
  const [userName, setUserName] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `E aí, viajante! 🌍✨ Eu sou o Téo, seu novo melhor amigo quando o assunto é VIAJAR! 🎉

Tô aqui pra te ajudar a descobrir o destino PERFEITO pros seus sonhos (e pro seu bolso também, haha! 💸)

Bora começar essa aventura? Me conta, qual é o seu nome? 🙋‍♂️`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappRedirectLink, setWhatsappRedirectLink] = useState<string | null>(null);
  const [chosenDestination, setChosenDestination] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-advisor-chat`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createChatSession = async (name: string, whatsapp: string) => {
    try {
      const { error } = await supabase.from('chat_sessions').insert({
        session_id: sessionIdRef.current,
        destination_id: 'travel-advisor',
        destination_name: 'Consultor de Viagens IA',
        user_name: name,
        user_whatsapp: whatsapp,
      });
      
      if (error) {
        console.error('Error creating chat session:', error);
      }
    } catch (err) {
      console.error('Error creating chat session:', err);
    }
  };

  const handleNameSubmit = () => {
    if (!input.trim()) return;
    
    const validation = nameSchema.safeParse(input.trim());
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Nome inválido');
      return;
    }
    
    const sanitizedName = sanitizeText(input.trim());
    setUserName(sanitizedName);
    
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: sanitizedName },
      { 
        role: 'assistant', 
        content: `${sanitizedName}! Que nome INCRÍVEL! 🎊 Prazer em te conhecer!

Agora me passa seu WhatsApp rapidinho - prometo que não vou ficar mandando meme de bom dia! 😂 

É só pra gente poder te mandar as melhores ofertas de viagem depois! 📱✨`
      },
    ]);
    
    setInput('');
    setStep('collect_whatsapp');
  };

  const handleWhatsappSubmit = async () => {
    if (!input.trim()) return;
    
    const validation = phoneSchema.safeParse(input.trim());
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'WhatsApp inválido');
      return;
    }
    
    const sanitizedWhatsapp = sanitizeText(input.trim());
    setUserWhatsapp(sanitizedWhatsapp);
    
    await createChatSession(userName, sanitizedWhatsapp);
    
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: sanitizedWhatsapp },
      { 
        role: 'assistant', 
        content: `Show de bola, ${userName}! 🙌 Agora sim, tamos conectados!

Bora pro que interessa: descobrir a viagem dos seus SONHOS! 🌟

Pensa comigo: quando você viaja, o que te faz mais feliz? 🤔

🏖️ **Relaxar** - Praia, piscina, drinks... vida boa!
🏔️ **Aventura** - Trilhas, esportes radicais, adrenalina!
🏛️ **Cultura** - Museus, história, gastronomia local!
🎉 **Festa** - Baladas, shows, agito total!

Me conta aí! 👇`
      },
    ]);
    
    setInput('');
    setStep('chatting');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (step === 'collect_name') {
      handleNameSubmit();
      return;
    }

    if (step === 'collect_whatsapp') {
      handleWhatsappSubmit();
      return;
    }

    const validation = chatMessageSchema.safeParse({ content: input });
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast.error(error?.message || 'Mensagem inválida');
      return;
    }

    const sanitizedInput = sanitizeText(input);
    
    const lowerInput = sanitizedInput.toLowerCase();
    const newQuizAnswers = { ...quizAnswers };
    
    if (lowerInput.includes('relax') || lowerInput.includes('praia') || lowerInput.includes('descanso')) {
      newQuizAnswers.travelStyle = 'relaxamento';
    } else if (lowerInput.includes('aventura') || lowerInput.includes('trilha') || lowerInput.includes('radical')) {
      newQuizAnswers.travelStyle = 'aventura';
    } else if (lowerInput.includes('cultura') || lowerInput.includes('museu') || lowerInput.includes('história')) {
      newQuizAnswers.travelStyle = 'cultura';
    } else if (lowerInput.includes('festa') || lowerInput.includes('balada') || lowerInput.includes('agito')) {
      newQuizAnswers.travelStyle = 'festa';
    }
    
    if (lowerInput.includes('tropical') || lowerInput.includes('calor') || lowerInput.includes('quente')) {
      newQuizAnswers.climate = 'tropical';
    } else if (lowerInput.includes('frio') || lowerInput.includes('neve') || lowerInput.includes('inverno')) {
      newQuizAnswers.climate = 'frio';
    }
    
    if (lowerInput.includes('econômic') || lowerInput.includes('barato') || lowerInput.includes('budget')) {
      newQuizAnswers.budget = 'econômico';
    } else if (lowerInput.includes('premium') || lowerInput.includes('luxo') || lowerInput.includes('5 estrelas')) {
      newQuizAnswers.budget = 'premium';
    }
    
    if (lowerInput.includes('sozinho') || lowerInput.includes('solo')) {
      newQuizAnswers.companion = 'sozinho';
    } else if (lowerInput.includes('casal') || lowerInput.includes('namorad') || lowerInput.includes('lua de mel')) {
      newQuizAnswers.companion = 'casal';
    } else if (lowerInput.includes('família') || lowerInput.includes('filho') || lowerInput.includes('criança')) {
      newQuizAnswers.companion = 'família';
    } else if (lowerInput.includes('amigo')) {
      newQuizAnswers.companion = 'amigos';
    }
    
    setQuizAnswers(newQuizAnswers);
    
    const userMessage: Message = { role: 'user', content: sanitizedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messages.slice(-10).concat(userMessage).filter(m => 
            !m.content.includes('qual é o seu nome?') &&
            !m.content.includes('Me conta, qual é o seu nome?') &&
            !m.content.includes('me passa seu WhatsApp')
          ).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionId: sessionIdRef.current,
          userName,
          userWhatsapp,
          quizAnswers: newQuizAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      
      // Check for quotation tag
      const quotationData = parseQuotationTag(assistantContent);
      if (quotationData) {
        // Remove quotation tag from displayed message
        assistantContent = assistantContent.replace(/\[COTAR_VIAGEM:.*?\]/s, '').trim();
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantContent.replace(/\[DESTINO_ESCOLHIDO:\s*[^\]]+\]/gi, '').trim(),
          };
          return newMessages;
        });

        // Trigger quotation request
        const quotResult = await quotation.requestQuotation(quotationData);
        if (quotResult.status === 'success' && quotResult.data) {
          const formatted = formatQuotationResults(quotResult.data);
          setMessages((prev) => [...prev, { role: 'assistant', content: formatted }]);
        } else if (quotResult.status === 'pending_code') {
          setMessages((prev) => [...prev, { 
            role: 'assistant', 
            content: `Recebi o pedido! 📧 A operadora enviou um código de verificação para o seu e-mail. Por favor, digite-o no campo abaixo para eu prosseguir com a cotação! 🔐`
          }]);
        }
      }

      // Check for escalation tag
      if (assistantContent.includes('[ESCALAR_ESPECIALISTA]')) {
        assistantContent = assistantContent.replace(/\[ESCALAR_ESPECIALISTA\]/g, '').trim();
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantContent,
          };
          return newMessages;
        });
      }

      const destinationMatch = assistantContent.match(/\[DESTINO_ESCOLHIDO:\s*([^\]]+)\]/i);
      if (destinationMatch) {
        const destination = destinationMatch[1].trim();
        setChosenDestination(destination);
        
        const cleanContent = assistantContent.replace(/\[DESTINO_ESCOLHIDO:\s*[^\]]+\]/gi, '').replace(/\[COTAR_VIAGEM:.*?\]/s, '').trim();
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: cleanContent,
          };
          return newMessages;
        });
        
        const whatsappMessage = encodeURIComponent(
          `Olá! Sou ${userName} e acabei de conversar com o Téo. Me interessei por ${destination}! Gostaria de mais informações.`
        );
        setWhatsappRedirectLink(`https://wa.me/5515991833448?text=${whatsappMessage}`);
        setStep('destination_chosen');
      }
    } catch {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
    if (step === 'collect_name') return 'Digite seu nome...';
    if (step === 'collect_whatsapp') return 'Ex: (11) 99999-9999';
    return 'Digite sua mensagem...';
  };

  const getInputIcon = () => {
    if (step === 'collect_name') return <UserCircle className="w-5 h-5 text-muted-foreground" />;
    if (step === 'collect_whatsapp') return <Phone className="w-5 h-5 text-muted-foreground" />;
    return null;
  };

  const containerClass = fullPage 
    ? "flex flex-col h-full bg-background"
    : "flex flex-col h-full";

  const messagesContainerClass = fullPage
    ? "flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
    : "flex-1 overflow-y-auto p-4 space-y-4";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="relative">
          <TeoMascot size="small" animated />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            Téo
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Online
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">Seu consultor de viagens pessoal</p>
        </div>
      </div>

      {/* Messages */}
      <div className={messagesContainerClass}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            {message.role === 'assistant' ? (
              <div className="w-8 h-8 flex-shrink-0">
                <TeoMascot size="small" animated={false} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex-shrink-0">
              <TeoMascot size="small" animated />
            </div>
            <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}

        <QuotationStatusDisplay
          status={quotation.status}
          onSubmitCode={async (code) => {
            setMessages((prev) => [...prev, { 
              role: 'assistant', 
              content: '⏳ Código enviado! Aguardando a operadora processar... isso pode levar alguns minutos. 🔄'
            }]);
            const result = await quotation.submitVerificationCode(code);
            if (result?.status === 'success' && result.data) {
              const hasQuotationData = result.data.resultados || result.data.results || 
                result.data.cotacoes || result.data.preco || result.data.valor || 
                result.data.price || Array.isArray(result.data);
              
              if (hasQuotationData) {
                const formatted = formatQuotationResults(result.data);
                setMessages((prev) => [...prev, { role: 'assistant', content: formatted }]);
              } else {
                // Server returned ack but no prices yet — show what we got and keep status visible
                const formatted = formatQuotationResults(result.data);
                setMessages((prev) => [...prev, { role: 'assistant', content: formatted }]);
              }
            } else if (result?.status === 'error') {
              setMessages((prev) => [...prev, { 
                role: 'assistant', 
                content: '❌ Não foi possível processar o código. Tente novamente ou peça uma nova cotação.'
              }]);
            }
          }}
        />

        {step === 'destination_chosen' && whatsappRedirectLink && (
          <div className="flex justify-center mt-4">
            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <a href={whatsappRedirectLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Falar com um consultor sobre {chosenDestination}
              </a>
            </Button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          {getInputIcon()}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="flex-1 px-4 py-3 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full h-12 w-12"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

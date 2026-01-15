import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Phone, UserCircle, X, Sparkles, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { chatMessageSchema, generateSecureSessionId, sanitizeText, phoneSchema, nameSchema } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Téo mascot phrases that appear randomly - exactly as specified
const TEO_PHRASES = [
  "Eiiii",
  "Oiiiii",
  "Olha aquiiii",
  "Owwww",
  "Fala comigoo",
  "😂😂",
  "😭😭",
  "ta calor ai??🥵",
  "Ta frio aii??🥶",
];

interface QuizAnswers {
  travelStyle?: string;
  climate?: string;
  experience?: string;
  budget?: string;
  companion?: string;
}

type ChatStep = 'collect_name' | 'collect_whatsapp' | 'chatting' | 'limit_reached';

export const TravelAdvisorChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const sessionIdRef = useRef<string>(generateSecureSessionId());
  
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
    
    // Try to extract quiz answers from user input
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
        try {
          const errorData = await response.json();
          if (errorData.code === 'RATE_LIMIT_REDIRECT' || errorData.code === 'RATE_LIMIT') {
            // Mostra mensagem do Teo explicando o limite
            const limitMessage = errorData.message || `Eita, ${userName || 'viajante'}! 😅 Parece que já conversamos bastante esse mês!

Mas calma que a nossa equipe INCRÍVEL está esperando você no WhatsApp! 💬✨

Fala com eles que eles são ótimos (quase tão bons quanto eu, haha! 😜)`;
            
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: limitMessage },
            ]);
            
            // Salva o link do WhatsApp para mostrar o botão
            setWhatsappRedirectLink(errorData.whatsappLink || 'https://wa.me/5511999999999');
            setStep('limit_reached');
            setIsLoading(false);
            return;
          }
          throw new Error(errorData.error || 'Failed to get response');
        } catch (e) {
          if (e instanceof Error && e.message.includes('Failed to get response')) {
            throw e;
          }
          throw new Error('Failed to get response');
        }
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

  // Téo mascot state
  const [showMascot, setShowMascot] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [currentExpression, setCurrentExpression] = useState<'happy' | 'wink' | 'surprised' | 'laugh' | 'cool'>('happy');
  const mascotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Expression types for more realistic animations
  const expressions = ['happy', 'wink', 'surprised', 'laugh', 'cool'] as const;

  // Mascot animation effect - appears every 4-8 seconds with random phrases and expressions
  useEffect(() => {
    if (isOpen) {
      if (mascotIntervalRef.current) {
        clearInterval(mascotIntervalRef.current);
      }
      setShowMascot(false);
      return;
    }

    const showMascotWithPhrase = () => {
      const randomPhrase = TEO_PHRASES[Math.floor(Math.random() * TEO_PHRASES.length)];
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setCurrentPhrase(randomPhrase);
      setCurrentExpression(randomExpression);
      setShowMascot(true);
      
      // Hide mascot after 3 seconds
      setTimeout(() => {
        setShowMascot(false);
      }, 3000);
    };

    // Show first time after 2 seconds
    const initialTimeout = setTimeout(() => {
      showMascotWithPhrase();
    }, 2000);

    // Then show every 5-10 seconds
    mascotIntervalRef.current = setInterval(() => {
      showMascotWithPhrase();
    }, 5000 + Math.random() * 5000);

    return () => {
      clearTimeout(initialTimeout);
      if (mascotIntervalRef.current) {
        clearInterval(mascotIntervalRef.current);
      }
    };
  }, [isOpen]);

  // Render expression-based eyes
  const renderEyes = () => {
    switch (currentExpression) {
      case 'wink':
        return (
          <>
            {/* Left eye - winking */}
            <div className="absolute top-4 left-2 w-2.5 h-0.5 bg-amber-900 rounded-full transform rotate-3" />
            {/* Right eye - open */}
            <div className="absolute top-3.5 right-2 w-2.5 h-2.5 bg-white rounded-full border border-gray-400 shadow-inner">
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-amber-900 rounded-full">
                <div className="absolute top-0 left-0.5 w-0.5 h-0.5 bg-white rounded-full" />
              </div>
            </div>
          </>
        );
      case 'surprised':
        return (
          <>
            {/* Wide open eyes */}
            <div className="absolute top-3 left-1.5 w-3 h-3 bg-white rounded-full border border-gray-400 shadow-inner">
              <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-amber-900 rounded-full">
                <div className="absolute top-0 left-0.5 w-0.5 h-0.5 bg-white rounded-full" />
              </div>
            </div>
            <div className="absolute top-3 right-1.5 w-3 h-3 bg-white rounded-full border border-gray-400 shadow-inner">
              <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-amber-900 rounded-full">
                <div className="absolute top-0 left-0.5 w-0.5 h-0.5 bg-white rounded-full" />
              </div>
            </div>
          </>
        );
      case 'laugh':
        return (
          <>
            {/* Closed happy eyes */}
            <div className="absolute top-4 left-2 w-2 h-1 border-t-2 border-amber-900 rounded-t-full" />
            <div className="absolute top-4 right-2 w-2 h-1 border-t-2 border-amber-900 rounded-t-full" />
          </>
        );
      case 'cool':
        return (
          <>
            {/* Sunglasses */}
            <div className="absolute top-3 left-1 w-3 h-2 bg-gray-800 rounded-sm" />
            <div className="absolute top-3 right-1 w-3 h-2 bg-gray-800 rounded-sm" />
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-gray-800" />
          </>
        );
      default: // happy
        return (
          <>
            <div className="absolute top-3.5 left-2 w-2.5 h-2.5 bg-white rounded-full border border-gray-400 shadow-inner">
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-amber-900 rounded-full" style={{ animation: 'blink 4s infinite' }}>
                <div className="absolute top-0 left-0.5 w-0.5 h-0.5 bg-white rounded-full" />
              </div>
            </div>
            <div className="absolute top-3.5 right-2 w-2.5 h-2.5 bg-white rounded-full border border-gray-400 shadow-inner">
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-amber-900 rounded-full" style={{ animation: 'blink 4s infinite' }}>
                <div className="absolute top-0 left-0.5 w-0.5 h-0.5 bg-white rounded-full" />
              </div>
            </div>
          </>
        );
    }
  };

  // Render expression-based mouth
  const renderMouth = () => {
    switch (currentExpression) {
      case 'surprised':
        return <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2.5 bg-amber-900 rounded-full" />;
      case 'laugh':
        return (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-amber-900 rounded-b-full overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1 bg-pink-400 rounded-t-full" />
          </div>
        );
      default: // happy, wink, cool
        return <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-amber-800 rounded-b-full" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-6 z-50">
        {/* Téo Mascot Character - Realistic Cartoon Human Man - Smaller size */}
        <div 
          className={`absolute -top-32 -left-6 transition-all duration-500 ${
            showMascot 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-75 pointer-events-none'
          }`}
        >
          {/* Speech bubble - kept same size */}
          <div className="relative mb-2">
            <div className="bg-white text-black px-6 py-3 rounded-2xl shadow-xl text-lg font-bold whitespace-nowrap border-2 border-primary/20" style={{ animation: 'pulse-bubble 2s ease-in-out infinite' }}>
              {currentPhrase}
            </div>
            {/* Bubble arrow */}
            <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white drop-shadow-sm" />
          </div>
          
          {/* Téo character - Smaller, more realistic */}
          <div className="relative w-16 h-20" style={{ animation: 'float 3s ease-in-out infinite' }}>
            {/* Hair - more detailed */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-4 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-full" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-t-full" />
            {/* Hair strands */}
            <div className="absolute -top-2.5 left-4 w-1 h-2 bg-amber-700 rounded-full transform -rotate-12" />
            <div className="absolute -top-2.5 right-4 w-1 h-2 bg-amber-700 rounded-full transform rotate-12" />
            
            {/* Head - more realistic shape */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-11 h-11 bg-gradient-to-b from-amber-100 to-amber-200 rounded-[45%] shadow-lg border border-amber-200/50">
              {/* Eyebrows - animated */}
              <div 
                className="absolute top-2 left-1.5 w-2.5 h-0.5 bg-amber-800 rounded-full"
                style={{ 
                  transform: currentExpression === 'surprised' ? 'translateY(-2px) rotate(-10deg)' : 'rotate(-8deg)',
                  transition: 'transform 0.3s'
                }}
              />
              <div 
                className="absolute top-2 right-1.5 w-2.5 h-0.5 bg-amber-800 rounded-full"
                style={{ 
                  transform: currentExpression === 'surprised' ? 'translateY(-2px) rotate(10deg)' : 'rotate(8deg)',
                  transition: 'transform 0.3s'
                }}
              />
              
              {/* Dynamic Eyes */}
              {renderEyes()}
              
              {/* Nose - subtle */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-amber-300/60 rounded-full" />
              
              {/* Dynamic Mouth */}
              {renderMouth()}
              
              {/* Cheeks - blush */}
              <div className="absolute bottom-2.5 left-0.5 w-1.5 h-1 bg-pink-300 rounded-full opacity-40" />
              <div className="absolute bottom-2.5 right-0.5 w-1.5 h-1 bg-pink-300 rounded-full opacity-40" />
              
              {/* Ears */}
              <div className="absolute top-4 -left-1 w-1.5 h-2 bg-amber-200 rounded-full" />
              <div className="absolute top-4 -right-1 w-1.5 h-2 bg-amber-200 rounded-full" />
            </div>
            
            {/* Neck */}
            <div className="absolute top-11 left-1/2 -translate-x-1/2 w-3 h-2 bg-gradient-to-b from-amber-200 to-amber-100" />
            
            {/* Body / Shirt - more fitted */}
            <div className="absolute left-1/2 -translate-x-1/2 w-14 h-9 bg-gradient-to-b from-primary via-primary to-accent rounded-t-lg rounded-b-2xl shadow-lg" style={{ top: '52px' }}>
              {/* Shirt collar */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-white rounded-b-full" />
              
              {/* Shirt buttons */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full" />
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full" />
            </div>
            
            {/* Left arm */}
            <div className="absolute -left-1.5 w-3 h-7 bg-gradient-to-b from-primary to-accent rounded-full origin-top" style={{ top: '54px' }}>
              {/* Left hand */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-200 rounded-full" />
            </div>
            
            {/* Right arm - waving */}
            <div 
              className="absolute -right-4 origin-bottom"
              style={{
                top: '50px',
                animation: showMascot ? 'wave 0.4s ease-in-out infinite' : 'none'
              }}
            >
              <div className="w-3 h-8 bg-gradient-to-b from-primary to-accent rounded-full" />
              {/* Hand */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-200 rounded-full shadow-md flex items-center justify-center">
                <span className="text-xs">👋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in group relative"
          aria-label="Abrir consultor de viagens"
        >
          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
          <span className="font-medium text-sm whitespace-nowrap">Qual seu destino ideal?</span>
          <MessageCircle className="w-5 h-5" />
          
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent animate-ping opacity-20" />
        </button>

        {/* CSS for animations */}
        <style>{`
          @keyframes wave {
            0%, 100% { transform: rotate(-25deg); }
            50% { transform: rotate(35deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes pulse-bubble {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border border-border bg-background flex flex-col animate-scale-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Téo - Consultor de Viagens</h3>
            <p className="text-xs text-muted-foreground">Descubra seu destino ideal! ✨</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user' 
                  ? 'bg-primary' 
                  : 'bg-gradient-to-r from-primary to-accent'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-primary-foreground" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-secondary text-foreground rounded-tl-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input or WhatsApp redirect */}
      <div className="p-4 border-t border-border shrink-0">
        {step === 'limit_reached' && whatsappRedirectLink ? (
          <div className="space-y-3">
            <Button
              onClick={() => window.open(whatsappRedirectLink, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-6"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Continuar no WhatsApp
              <ExternalLink className="w-4 h-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Nossa equipe está pronta para te ajudar! 🚀
            </p>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            {getInputIcon() && (
              <div className="shrink-0">
                {getInputIcon()}
              </div>
            )}
            <input
              type={step === 'collect_whatsapp' ? 'tel' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={isLoading}
              maxLength={step === 'collect_whatsapp' ? 20 : step === 'collect_name' ? 100 : 2000}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white disabled:opacity-50 hover:shadow-lg transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

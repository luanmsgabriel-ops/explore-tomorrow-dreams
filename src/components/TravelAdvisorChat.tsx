import { useState, useRef, useEffect } from 'react';
import { Send, User, Phone, UserCircle, X, Sparkles, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { chatMessageSchema, generateSecureSessionId, sanitizeText, phoneSchema, nameSchema } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TeoMascot } from './TeoMascot';

import { useQuotation, parseQuotationTag, formatQuotationResults } from '@/hooks/useQuotation';

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

type ChatStep = 'collect_name' | 'collect_whatsapp' | 'chatting' | 'destination_chosen';

// Check if 24 hours have passed since last interaction
const checkTeoInteraction = (): boolean => {
  const lastInteraction = localStorage.getItem('teo_last_interaction');
  if (!lastInteraction) return false;
  
  const lastTime = parseInt(lastInteraction, 10);
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  return (now - lastTime) < twentyFourHours;
};

export const TravelAdvisorChat = () => {
  // Check if user has interacted with Téo in the last 24 hours
  const [hasInteracted, setHasInteracted] = useState(() => checkTeoInteraction());
  const [isOpen, setIsOpen] = useState(false);
  const sessionIdRef = useRef<string>(generateSecureSessionId());
  const quotation = useQuotation();
  
  const [step, setStep] = useState<ChatStep>('collect_name');
  const [userName, setUserName] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Ufaa, venci no cansaço kkkkkkkk 😅

E aí, viajante! 🌍✨ Eu sou o Téo, seu novo melhor amigo quando o assunto é VIAJAR! 🎉

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

  const createChatSession = async (name: string, whatsapp: string, currentMessages: Message[]) => {
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
        return;
      }

      // Save all previous messages (name collection, whatsapp collection) to the database
      if (currentMessages.length > 0) {
        const messagesToInsert = currentMessages.map((msg) => ({
          session_id: sessionIdRef.current,
          destination_id: 'travel-advisor',
          role: msg.role,
          content: msg.content,
          user_name: name,
          user_whatsapp: whatsapp,
        }));

        const { error: messagesError } = await supabase
          .from('chat_messages')
          .insert(messagesToInsert);

        if (messagesError) {
          console.error('Error saving initial messages:', messagesError);
        }
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
    
    // Include all messages up to now (including the whatsapp the user just entered)
    const allMessagesUpToNow: Message[] = [
      ...messages,
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
    ];
    
    await createChatSession(userName, sanitizedWhatsapp, allMessagesUpToNow);
    
    setMessages(allMessagesUpToNow);
    
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
        assistantContent = assistantContent.replace(/\[COTAR_VIAGEM:\s*\{.*\}\s*\]/s, '').trim();
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantContent.replace(/\[DESTINO_ESCOLHIDO:\s*[^\]]+\]/gi, '').trim(),
          };
          return newMessages;
        });

        const quotResult = await quotation.requestQuotation(quotationData);
        if (quotResult.status === 'success' && quotResult.data) {
          const formatted = formatQuotationResults(quotResult.data);
          setMessages((prev) => [...prev, { role: 'assistant', content: formatted }]);
          // Fire-and-forget: generate visual quote card
          supabase.functions.invoke('generate-quote-visual', {
            body: {
              destination: quotationData.destino,
              departureDate: quotationData.data_ida,
              returnDate: quotationData.data_volta,
              passengers: `${quotationData.passageiros.adultos} adulto(s)${quotationData.passageiros.criancas ? ` + ${quotationData.passageiros.criancas} criança(s)` : ''}`,
              ...(quotResult.data?.resultados?.[0] || quotResult.data?.results?.[0]),
            },
          }).then(({ data: visualData }) => {
            if (visualData?.imageUrl) {
              setMessages((prev) => [...prev, { role: 'assistant', content: `📋 **Sua cotação visual:**\n\n![Cotação ${quotationData.destino}](${visualData.imageUrl})\n\n[📥 Baixar cotação](${visualData.imageUrl})` }]);
            }
          }).catch(() => {/* non-blocking */});
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

      // Verifica se o assistente indicou que o cliente escolheu um destino
      const destinationMatch = assistantContent.match(/\[DESTINO_ESCOLHIDO:\s*([^\]]+)\]/i);
      if (destinationMatch) {
        const destination = destinationMatch[1].trim();
        setChosenDestination(destination);
        
        const cleanContent = assistantContent.replace(/\[DESTINO_ESCOLHIDO:\s*[^\]]+\]/gi, '').replace(/\[COTAR_VIAGEM:\s*\{.*\}\s*\]/s, '').trim();
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

  // Téo mascot state
  const [showMascot, setShowMascot] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [currentExpression, setCurrentExpression] = useState<'happy' | 'wink' | 'surprised' | 'laugh' | 'cool'>('happy');
  const mascotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mascotTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expression types for more realistic animations
  const expressions = ['happy', 'wink', 'surprised', 'laugh', 'cool'] as const;

  // Mascot animation effect - appears every 4-8 seconds with random phrases and expressions
  // Only if user hasn't interacted with Téo yet
  useEffect(() => {
    // Don't show mascot if user has already interacted
    if (hasInteracted) {
      setShowMascot(false);
      return;
    }
    
    // Clear all timers when chat opens
    if (isOpen) {
      if (mascotIntervalRef.current) {
        clearInterval(mascotIntervalRef.current);
        mascotIntervalRef.current = null;
      }
      if (mascotTimeoutRef.current) {
        clearTimeout(mascotTimeoutRef.current);
        mascotTimeoutRef.current = null;
      }
      setShowMascot(false);
      return;
    }

    const showMascotWithPhrase = () => {
      // Don't show if chat is open or user has interacted
      if (isOpen || hasInteracted) return;
      
      const randomPhrase = TEO_PHRASES[Math.floor(Math.random() * TEO_PHRASES.length)];
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setCurrentPhrase(randomPhrase);
      setCurrentExpression(randomExpression);
      setShowMascot(true);
      
      // Hide mascot after 3 seconds
      if (mascotTimeoutRef.current) {
        clearTimeout(mascotTimeoutRef.current);
      }
      mascotTimeoutRef.current = setTimeout(() => {
        setShowMascot(false);
      }, 3000);
    };

    // Show first time after 2 seconds
    const initialTimeout = setTimeout(() => {
      if (!isOpen && !hasInteracted) {
        showMascotWithPhrase();
      }
    }, 2000);

    // Then show every 5-10 seconds
    mascotIntervalRef.current = setInterval(() => {
      if (!isOpen && !hasInteracted) {
        showMascotWithPhrase();
      }
    }, 5000 + Math.random() * 5000);

    return () => {
      clearTimeout(initialTimeout);
      if (mascotIntervalRef.current) {
        clearInterval(mascotIntervalRef.current);
        mascotIntervalRef.current = null;
      }
      if (mascotTimeoutRef.current) {
        clearTimeout(mascotTimeoutRef.current);
        mascotTimeoutRef.current = null;
      }
    };
  }, [isOpen, hasInteracted]);

  // Render realistic expression-based eyes
  const renderEyes = () => {
    switch (currentExpression) {
      case 'wink':
        return (
          <>
            {/* Left eye - winking with lashes */}
            <div className="absolute top-[18px] left-[8px]">
              <div className="w-[14px] h-[2px] bg-gradient-to-r from-stone-700 to-stone-800 rounded-full transform rotate-2" />
              {/* Eyelashes */}
              <div className="absolute -top-1 left-1 w-[2px] h-[3px] bg-stone-700 rounded-full transform -rotate-12" />
              <div className="absolute -top-1 left-3 w-[2px] h-[3px] bg-stone-700 rounded-full" />
            </div>
            {/* Right eye - open with detail */}
            <div className="absolute top-[14px] right-[8px] w-[16px] h-[14px] bg-white rounded-[50%] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-stone-200">
              {/* Iris */}
              <div className="absolute top-[2px] left-[3px] w-[10px] h-[10px] rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900">
                {/* Pupil */}
                <div className="absolute top-[2px] left-[2px] w-[6px] h-[6px] bg-stone-900 rounded-full">
                  {/* Light reflection */}
                  <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white rounded-full" />
                  <div className="absolute bottom-[1px] right-[1px] w-[1px] h-[1px] bg-white/50 rounded-full" />
                </div>
              </div>
            </div>
          </>
        );
      case 'surprised':
        return (
          <>
            {/* Wide open eyes with raised eyebrows effect */}
            <div className="absolute top-[12px] left-[6px] w-[18px] h-[16px] bg-white rounded-[50%] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-stone-200">
              <div className="absolute top-[2px] left-[3px] w-[12px] h-[12px] rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900">
                <div className="absolute top-[3px] left-[3px] w-[6px] h-[6px] bg-stone-900 rounded-full">
                  <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div className="absolute top-[12px] right-[6px] w-[18px] h-[16px] bg-white rounded-[50%] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-stone-200">
              <div className="absolute top-[2px] left-[3px] w-[12px] h-[12px] rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900">
                <div className="absolute top-[3px] left-[3px] w-[6px] h-[6px] bg-stone-900 rounded-full">
                  <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white rounded-full" />
                </div>
              </div>
            </div>
          </>
        );
      case 'laugh':
        return (
          <>
            {/* Closed happy eyes - curved lines with lashes */}
            <div className="absolute top-[18px] left-[8px]">
              <div className="w-[14px] h-[6px] border-t-[3px] border-stone-800 rounded-t-full" />
            </div>
            <div className="absolute top-[18px] right-[8px]">
              <div className="w-[14px] h-[6px] border-t-[3px] border-stone-800 rounded-t-full" />
            </div>
          </>
        );
      case 'cool':
        return (
          <>
            {/* Stylish sunglasses */}
            <div className="absolute top-[14px] left-[4px] w-[18px] h-[12px] bg-gradient-to-b from-stone-800 to-stone-900 rounded-[3px] shadow-md border border-stone-600">
              <div className="absolute top-[2px] left-[2px] w-[4px] h-[2px] bg-white/20 rounded-full" />
            </div>
            <div className="absolute top-[14px] right-[4px] w-[18px] h-[12px] bg-gradient-to-b from-stone-800 to-stone-900 rounded-[3px] shadow-md border border-stone-600">
              <div className="absolute top-[2px] left-[2px] w-[4px] h-[2px] bg-white/20 rounded-full" />
            </div>
            {/* Bridge */}
            <div className="absolute top-[17px] left-1/2 -translate-x-1/2 w-[8px] h-[3px] bg-stone-700 rounded-sm" />
            {/* Temple arms */}
            <div className="absolute top-[16px] -left-[2px] w-[6px] h-[2px] bg-stone-700" />
            <div className="absolute top-[16px] -right-[2px] w-[6px] h-[2px] bg-stone-700" />
          </>
        );
      default: // happy
        return (
          <>
            {/* Realistic eyes with iris, pupil, and reflections */}
            <div className="absolute top-[14px] left-[7px] w-[16px] h-[14px] bg-white rounded-[50%] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-stone-200">
              <div className="absolute top-[2px] left-[2px] w-[11px] h-[11px] rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900" style={{ animation: 'blink 4s infinite' }}>
                <div className="absolute top-[3px] left-[3px] w-[5px] h-[5px] bg-stone-900 rounded-full">
                  <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white rounded-full" />
                </div>
              </div>
              {/* Lower eyelid shadow */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-t from-stone-100 to-transparent rounded-b-full" />
            </div>
            <div className="absolute top-[14px] right-[7px] w-[16px] h-[14px] bg-white rounded-[50%] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-stone-200">
              <div className="absolute top-[2px] left-[2px] w-[11px] h-[11px] rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900" style={{ animation: 'blink 4s infinite' }}>
                <div className="absolute top-[3px] left-[3px] w-[5px] h-[5px] bg-stone-900 rounded-full">
                  <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-t from-stone-100 to-transparent rounded-b-full" />
            </div>
          </>
        );
    }
  };

  // Render realistic expression-based mouth
  const renderMouth = () => {
    switch (currentExpression) {
      case 'surprised':
        return (
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[12px] h-[14px] bg-gradient-to-b from-stone-800 to-stone-900 rounded-full border-2 border-stone-700">
            {/* Teeth hint */}
            <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[6px] h-[3px] bg-white rounded-sm" />
            {/* Tongue */}
            <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[6px] h-[4px] bg-pink-400 rounded-b-full" />
          </div>
        );
      case 'laugh':
        return (
          <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[22px] h-[14px] bg-gradient-to-b from-stone-800 to-stone-900 rounded-b-[50%] rounded-t-lg overflow-hidden border-2 border-stone-700">
            {/* Teeth */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[16px] h-[5px] bg-white rounded-b-sm" />
            {/* Tongue */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[12px] h-[6px] bg-gradient-to-b from-pink-400 to-pink-500 rounded-t-full" />
          </div>
        );
      default: // happy, wink, cool
        return (
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2">
            {/* Upper lip */}
            <div className="w-[18px] h-[4px] border-b-[3px] border-rose-400 rounded-b-[50%]" />
            {/* Lower lip hint */}
            <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[12px] h-[3px] bg-gradient-to-b from-rose-300 to-rose-200 rounded-b-full opacity-60" />
          </div>
        );
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-6 z-50">
        {/* Mascot bubble removed per user request */}

        {/* Main button */}
        <button
          onClick={() => {
            // Mark that user has interacted with Téo - save timestamp for 24h check
            setHasInteracted(true);
            localStorage.setItem('teo_last_interaction', Date.now().toString());
            setShowMascot(false);
            setIsOpen(true);
          }}
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
            0%, 100% { transform: rotate(-20deg); }
            50% { transform: rotate(30deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes pulse-bubble {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes blink {
            0%, 92%, 100% { transform: scaleY(1); }
            96% { transform: scaleY(0.1); }
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
        {step === 'destination_chosen' && whatsappRedirectLink ? (
          <div className="space-y-3">
            {chosenDestination && (
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-3 mb-2">
                <p className="text-sm text-center font-medium text-foreground">
                  🎉 Destino escolhido: <span className="text-primary">{chosenDestination}</span>
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Fica tranquilinho(a)! Nossa equipe já está ciente e vai entrar em contato! 💫
                </p>
              </div>
            )}
            <Button
              onClick={() => window.open(whatsappRedirectLink, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-6"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {step === 'destination_chosen' ? 'Falar agora no WhatsApp' : 'Continuar no WhatsApp'}
              <ExternalLink className="w-4 h-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {step === 'destination_chosen' 
                ? 'Ou aguarde que entraremos em contato! 🚀' 
                : 'Nossa equipe está pronta para te ajudar! 🚀'}
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

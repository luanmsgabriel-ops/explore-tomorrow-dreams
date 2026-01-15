import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Phone, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { chatMessageSchema, generateSecureSessionId, sanitizeText, phoneSchema, nameSchema } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DestinationChatProps {
  destinationId: string;
  destinationName: string;
}

type ChatStep = 'collect_name' | 'collect_whatsapp' | 'chatting';

export const DestinationChat = ({ destinationId, destinationName }: DestinationChatProps) => {
  // Gera um ID de sessão criptograficamente seguro
  const sessionIdRef = useRef<string>(generateSecureSessionId());
  
  const [step, setStep] = useState<ChatStep>('collect_name');
  const [userName, setUserName] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! 👋 Sou o assistente virtual da Tomorrow Travel. Estou aqui para ajudar você com tudo sobre ${destinationName}!\n\nPara começarmos, qual é o seu nome?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/destination-chat`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createChatSession = async (name: string, whatsapp: string) => {
    try {
      const sessionData = {
        session_id: sessionIdRef.current,
        destination_id: destinationId,
        destination_name: destinationName,
        user_name: name,
        user_whatsapp: whatsapp,
      };
      
      const { error } = await supabase.from('chat_sessions').insert(sessionData);
      
      if (error) {
        console.error('Error creating chat session:', error);
      } else {
        // Envia notificação por e-mail para o admin
        supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'chat_session',
            data: sessionData,
          },
        }).catch(err => console.error('Erro ao enviar notificação:', err));
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
    
    // Add user message with name
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: sanitizedName },
      { 
        role: 'assistant', 
        content: `Prazer em conhecê-lo(a), ${sanitizedName}! 😊\n\nAgora, por favor, me informe seu WhatsApp para que possamos entrar em contato caso você queira uma cotação personalizada.`
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
    
    // Create session in database
    await createChatSession(userName, sanitizedWhatsapp);
    
    // Add user message with whatsapp and welcome to chat
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: sanitizedWhatsapp },
      { 
        role: 'assistant', 
        content: `Obrigado, ${userName}! Agora estamos prontos para conversar! 🎉\n\nPode me perguntar sobre:\n\n• Melhor época para visitar ${destinationName}\n• Passeios e experiências\n• Gastronomia local\n• Dicas de hospedagem\n• Documentação necessária\n• E muito mais!\n\nComo posso ajudar?`
      },
    ]);
    
    setInput('');
    setStep('chatting');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Handle name collection step
    if (step === 'collect_name') {
      handleNameSubmit();
      return;
    }

    // Handle whatsapp collection step
    if (step === 'collect_whatsapp') {
      handleWhatsappSubmit();
      return;
    }

    // Valida a mensagem antes de enviar
    const validation = chatMessageSchema.safeParse({ content: input });
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast.error(error?.message || 'Mensagem inválida');
      return;
    }

    // Sanitiza a entrada
    const sanitizedInput = sanitizeText(input);
    
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
            // Filter out the collection messages, only send actual chat messages
            !m.content.includes('qual é o seu nome?') &&
            !m.content.includes('me informe seu WhatsApp') &&
            !m.content.includes('Agora estamos prontos para conversar')
          ).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          destination: destinationName,
          sessionId: sessionIdRef.current,
          userName,
          userWhatsapp,
        }),
      });

      if (!response.ok) {
        // Tenta parsear erro de rate limit
        try {
          const errorData = await response.json();
          if (errorData.code === 'RATE_LIMIT') {
            toast.error(errorData.error, {
              description: `Uso diário: ${errorData.usage?.daily_used}/${errorData.usage?.daily_limit} | Mensal: ${errorData.usage?.monthly_used}/${errorData.usage?.monthly_limit}`,
              duration: 8000,
            });
            setIsLoading(false);
            return;
          }
          throw new Error(errorData.error || 'Failed to get response');
        } catch {
          throw new Error('Failed to get response');
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      // Add empty assistant message
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
    return 'Pergunte sobre o destino...';
  };

  const getInputIcon = () => {
    if (step === 'collect_name') return <UserCircle className="w-5 h-5 text-muted-foreground" />;
    if (step === 'collect_whatsapp') return <Phone className="w-5 h-5 text-muted-foreground" />;
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user' ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-primary-foreground" />
              ) : (
                <Bot className="w-4 h-4 text-primary" />
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
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
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
            className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
            maxLength={step === 'collect_whatsapp' ? 20 : step === 'collect_name' ? 100 : 2000}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-primary p-3 rounded-xl disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

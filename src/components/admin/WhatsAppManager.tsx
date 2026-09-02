import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface WhatsAppMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface WhatsAppConversation {
  id: string;
  phone_number: string;
  client_name: string | null;
  conversation_state: string;
  collected_data: Record<string, unknown>;
  messages_history: WhatsAppMessage[];
  is_ai_active: boolean;
  quote_request_id: string | null;
  created_at: string;
  updated_at: string;
}

const stateLabels: Record<string, string> = {
  greeting: 'Saudação',
  collecting_name: 'Coletando nome',
  collecting_destination: 'Coletando destino',
  collecting_dates: 'Coletando datas',
  collecting_people: 'Coletando viajantes',
  collecting_preferences: 'Coletando preferências',
  summary_confirmation: 'Confirmando resumo',
  quotation_sent: 'Cotação enviada',
  completed: 'Concluída',
  human_takeover: 'Atendimento humano',
};

const normalizeConversation = (conversation: Record<string, unknown>): WhatsAppConversation => ({
  ...(conversation as unknown as WhatsAppConversation),
  collected_data: ((conversation.collected_data as Record<string, unknown> | null) || {}),
  messages_history: ((conversation.messages_history as WhatsAppMessage[] | null) || []),
});

const getMessageTimestamp = (message: WhatsAppMessage) => {
  const value = new Date(message.timestamp || 0).getTime();
  return Number.isNaN(value) ? 0 : value;
};

const dedupeMessages = (messages: WhatsAppMessage[]) => {
  return messages.reduce<WhatsAppMessage[]>((result, message) => {
    const previous = result[result.length - 1];

    if (!previous) {
      result.push(message);
      return result;
    }

    const samePayload = previous.role === message.role && previous.content === message.content;
    const timeDistance = Math.abs(getMessageTimestamp(message) - getMessageTimestamp(previous));

    // Duplicatas históricas do painel foram gravadas duas vezes em poucos segundos.
    // Mantemos mensagens repetidas legítimas quando não são consecutivas ou estão mais distantes.
    if (samePayload && timeDistance <= 15_000) {
      return result;
    }

    result.push(message);
    return result;
  }, []);
};

const getLastMessage = (messages: WhatsAppMessage[]) => {
  return messages.length > 0 ? messages[messages.length - 1] : undefined;
};

const formatConversationTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat('pt-BR', isToday
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit' }
  ).format(date);
};

const formatMessageTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return phone;
};

const getInitials = (conversation: WhatsAppConversation) => {
  const value = conversation.client_name?.trim() || conversation.phone_number;
  const parts = value.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'WA';
};

export const WhatsAppManager = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [manualMessage, setManualMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const mergeConversation = (conversation: WhatsAppConversation) => {
    setConversations(current => {
      const withoutCurrent = current.filter(item => item.id !== conversation.id);
      return [conversation, ...withoutCurrent].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    });

    setSelectedConversation(current => current?.id === conversation.id ? conversation : current);
  };

  const fetchConversations = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map(item => normalizeConversation(item as Record<string, unknown>));
      setConversations(normalized);

      setSelectedConversation(current => {
        if (current) {
          return normalized.find(item => item.id === current.id) || null;
        }

        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
          return normalized[0] || null;
        }

        return null;
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchConversations();

    const channel = supabase
      .channel('admin-whatsapp-inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_conversations' },
        payload => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string }).id;
            if (!deletedId) return;

            setConversations(current => current.filter(item => item.id !== deletedId));
            setSelectedConversation(current => current?.id === deletedId ? null : current);
            return;
          }

          if (payload.new) {
            mergeConversation(normalizeConversation(payload.new as Record<string, unknown>));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const visibleConversations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter(conversation => {
      const name = conversation.client_name?.toLowerCase() || '';
      const phone = conversation.phone_number.toLowerCase();
      const recentMessage = getLastMessage(conversation.messages_history);
      const lastMessage = recentMessage?.content?.toLowerCase() || '';
      return name.includes(query) || phone.includes(query) || lastMessage.includes(query);
    });
  }, [conversations, searchTerm]);

  const selectedMessages = useMemo(
    () => dedupeMessages(selectedConversation?.messages_history || []),
    [selectedConversation],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.id, selectedMessages.length]);

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conversa e a cotação vinculada? Esta ação não pode ser desfeita.')) return;

    try {
      const conversation = conversations.find(item => item.id === conversationId);
      const quoteRequestId = conversation?.quote_request_id;

      const { error } = await supabase
        .from('whatsapp_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      if (quoteRequestId) {
        const { error: quoteError } = await supabase
          .from('quote_requests')
          .delete()
          .eq('id', quoteRequestId);

        if (quoteError) {
          console.error('Error deleting linked quote:', quoteError);
          toast.warning('Conversa excluída, mas houve erro ao excluir a cotação vinculada');
        } else {
          toast.success('Conversa e cotação vinculada excluídas com sucesso');
        }
      } else {
        toast.success('Conversa excluída com sucesso');
      }

      setConversations(current => current.filter(item => item.id !== conversationId));
      setSelectedConversation(current => current?.id === conversationId ? null : current);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erro ao excluir conversa');
    }
  };

  const toggleAI = async (conversationId: string, currentState: boolean) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .update({ is_ai_active: !currentState })
        .eq('id', conversationId)
        .select('*')
        .single();

      if (error) throw error;

      const updatedConversation = normalizeConversation(data as Record<string, unknown>);
      mergeConversation(updatedConversation);
      toast.success(!currentState ? 'Téo reativado' : 'Atendimento manual assumido');
    } catch (error) {
      console.error('Error toggling AI:', error);
      toast.error('Erro ao alterar modo de atendimento');
    }
  };

  const sendManualMessage = async () => {
    const message = manualMessage.trim();
    if (!selectedConversation || !message || selectedConversation.is_ai_active) return;

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          manual_send: true,
          phone_number: selectedConversation.phone_number,
          message,
        },
      });

      if (error) throw error;

      // O webhook já envia e persiste a mensagem em messages_history.
      // Não gravamos novamente aqui para impedir a duplicação no painel.
      setManualMessage('');
      await fetchConversations(false);
      toast.success('Mensagem enviada');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendManualMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="flex h-[calc(100vh-9rem)] min-h-[620px] max-h-[880px]">
        <aside
          className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r bg-background md:w-[360px] lg:w-[390px]`}
        >
          <div className="border-b px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">WhatsApp</h2>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void fetchConversations(false)}
                aria-label="Atualizar conversas"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Buscar conversa"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {visibleConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-muted-foreground">
                <MessageCircle className="mb-3 h-10 w-10 opacity-50" />
                <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
                <p className="mt-1 text-xs">As conversas dos clientes aparecerão aqui.</p>
              </div>
            ) : (
              visibleConversations.map(conversation => {
                const conversationMessages = dedupeMessages(conversation.messages_history);
                const lastMessage = getLastMessage(conversationMessages);
                const isSelected = selectedConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setManualMessage('');
                    }}
                    className={`flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                      isSelected ? 'bg-muted' : 'bg-background'
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
                      {getInitials(conversation)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {conversation.client_name || formatPhone(conversation.phone_number)}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatConversationTime(conversation.updated_at)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {lastMessage?.content || 'Sem mensagens no histórico'}
                        </p>
                        {!conversation.is_ai_active && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Atendimento manual" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className={`${selectedConversation ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-muted/20`}>
          {!selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-muted-foreground">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <MessageCircle className="h-8 w-8 text-emerald-700 dark:text-emerald-300" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Central de atendimento WhatsApp</h3>
              <p className="mt-1 max-w-sm text-sm">
                Selecione uma conversa à esquerda para acompanhar o histórico e assumir o atendimento.
              </p>
            </div>
          ) : (
            <>
              <header className="flex min-h-[72px] items-center justify-between gap-3 border-b bg-background px-3 py-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                    aria-label="Voltar para conversas"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
                    {getInitials(selectedConversation)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {selectedConversation.client_name || 'Cliente WhatsApp'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(selectedConversation.phone_number)}
                      </span>
                      <span>•</span>
                      <span>{stateLabels[selectedConversation.conversation_state] || selectedConversation.conversation_state}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={selectedConversation.is_ai_active ? 'secondary' : 'default'} className="hidden sm:inline-flex">
                    {selectedConversation.is_ai_active ? 'Téo ativo' : 'Manual'}
                  </Badge>
                  <Button
                    variant={selectedConversation.is_ai_active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => void toggleAI(selectedConversation.id, selectedConversation.is_ai_active)}
                    className="gap-1.5"
                  >
                    {selectedConversation.is_ai_active ? <UserCheck className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    <span className="hidden lg:inline">
                      {selectedConversation.is_ai_active ? 'Assumir atendimento' : 'Reativar Téo'}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void deleteConversation(selectedConversation.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Excluir conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-5">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5">
                  {selectedMessages.length === 0 ? (
                    <div className="my-auto py-16 text-center text-sm text-muted-foreground">
                      Ainda não há mensagens nesta conversa.
                    </div>
                  ) : (
                    selectedMessages.map((message, index) => {
                      const isUser = message.role === 'user';
                      const isAssistant = !isUser;
                      const wasRead = isAssistant && selectedMessages
                        .slice(index + 1)
                        .some(item => item.role === 'user');

                      return (
                        <div key={`${message.timestamp}-${message.role}-${index}`} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                          <div
                            className={`max-w-[86%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[72%] ${
                              isUser
                                ? 'rounded-tl-md border bg-background text-foreground'
                                : 'rounded-tr-md bg-emerald-100 text-emerald-950 dark:bg-emerald-900/45 dark:text-emerald-50'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            <div className="mt-1 flex items-center justify-end gap-1 pl-4">
                              <span className="text-[10px] opacity-60">{formatMessageTime(message.timestamp)}</span>
                              {isAssistant && (
                                <CheckCheck className={`h-3.5 w-3.5 ${wasRead ? 'text-sky-500' : 'opacity-45'}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <footer className="border-t bg-background p-3 sm:p-4">
                <div className="mx-auto flex w-full max-w-4xl items-end gap-2">
                  <Textarea
                    value={manualMessage}
                    onChange={event => setManualMessage(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={selectedConversation.is_ai_active ? 'Assuma o atendimento para responder' : 'Digite uma mensagem'}
                    disabled={selectedConversation.is_ai_active || isSending}
                    className="min-h-[44px] max-h-32 resize-none"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-full"
                    onClick={() => void sendManualMessage()}
                    disabled={selectedConversation.is_ai_active || isSending || !manualMessage.trim()}
                    aria-label="Enviar mensagem"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mx-auto mt-2 max-w-4xl text-[11px] text-muted-foreground">
                  {selectedConversation.is_ai_active
                    ? 'O Téo está respondendo. Clique em “Assumir atendimento” para escrever manualmente.'
                    : 'Atendimento manual ativo. Enter envia; Shift + Enter quebra a linha.'}
                </p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

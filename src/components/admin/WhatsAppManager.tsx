import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  MessageCircle, Eye, Bot, UserCheck, RefreshCw, Send, Phone, Clock, 
  CheckCircle, AlertCircle, Loader2, FileText, Trash2, CheckCheck
} from 'lucide-react';

interface WhatsAppConversation {
  id: string;
  phone_number: string;
  client_name: string | null;
  conversation_state: string;
  collected_data: Record<string, any>;
  messages_history: Array<{ role: string; content: string; timestamp: string }>;
  is_ai_active: boolean;
  quote_request_id: string | null;
  created_at: string;
  updated_at: string;
}

const stateLabels: Record<string, { label: string; color: string }> = {
  greeting: { label: 'Saudação', color: 'bg-blue-100 text-blue-800' },
  collecting_name: { label: 'Coletando Nome', color: 'bg-yellow-100 text-yellow-800' },
  collecting_destination: { label: 'Coletando Destino', color: 'bg-yellow-100 text-yellow-800' },
  collecting_dates: { label: 'Coletando Datas', color: 'bg-yellow-100 text-yellow-800' },
  collecting_people: { label: 'Coletando Viajantes', color: 'bg-yellow-100 text-yellow-800' },
  collecting_preferences: { label: 'Coletando Preferências', color: 'bg-orange-100 text-orange-800' },
  summary_confirmation: { label: 'Confirmando Resumo', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  human_takeover: { label: 'Atendimento Humano', color: 'bg-red-100 text-red-800' },
};

export const WhatsAppManager = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [manualMessage, setManualMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setConversations((data || []).map(c => ({
        ...c,
        collected_data: (c.collected_data || {}) as Record<string, any>,
        messages_history: (c.messages_history || []) as Array<{ role: string; content: string; timestamp: string }>,
      })));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conversa e a cotação vinculada? Esta ação não pode ser desfeita.')) return;

    try {
      // First, get the conversation to find the linked quote_request_id
      const conversation = conversations.find(c => c.id === conversationId);
      const quoteRequestId = conversation?.quote_request_id;

      // Delete the conversation
      const { error } = await supabase
        .from('whatsapp_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Also delete the linked quote request if it exists
      if (quoteRequestId) {
        const { error: quoteError } = await supabase
          .from('quote_requests')
          .delete()
          .eq('id', quoteRequestId);

        if (quoteError) {
          console.error('Error deleting linked quote:', quoteError);
          toast.warning('Conversa excluída, mas houve erro ao excluir a cotação vinculada');
        } else {
          toast.success('Conversa e cotação vinculada excluídas com sucesso!');
        }
      } else {
        toast.success('Conversa excluída com sucesso!');
      }

      fetchConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erro ao excluir conversa');
    }
  };

  const toggleAI = async (conversationId: string, currentState: boolean) => {
    try {
      await supabase
        .from('whatsapp_conversations')
        .update({ is_ai_active: !currentState })
        .eq('id', conversationId);

      toast.success(!currentState ? 'IA reativada' : 'IA desativada - modo manual');
      fetchConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, is_ai_active: !currentState } : null);
      }
    } catch (error) {
      toast.error('Erro ao alterar modo');
    }
  };

  const sendManualMessage = async () => {
    if (!selectedConversation || !manualMessage.trim()) return;
    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          manual_send: true,
          phone_number: selectedConversation.phone_number,
          message: manualMessage.trim(),
        },
      });

      if (error) throw error;

      // Update local history
      const updatedHistory = [
        ...selectedConversation.messages_history,
        { role: 'assistant', content: manualMessage.trim(), timestamp: new Date().toISOString() },
      ];

      await supabase
        .from('whatsapp_conversations')
        .update({ messages_history: updatedHistory })
        .eq('id', selectedConversation.id);

      setSelectedConversation(prev => prev ? { ...prev, messages_history: updatedHistory } : null);
      setManualMessage('');
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const activeCount = conversations.filter(c => c.conversation_state !== 'completed').length;
  const completedCount = conversations.filter(c => c.conversation_state === 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{conversations.length}</p>
              <p className="text-sm text-muted-foreground">Total Conversas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{conversations.filter(c => c.is_ai_active).length}</p>
              <p className="text-sm text-muted-foreground">IA Ativa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchConversations}>
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      {/* Conversations Table */}
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
            <p className="text-muted-foreground">
              Quando clientes enviarem mensagens pelo WhatsApp, as conversas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conv) => {
                  const stateInfo = stateLabels[conv.conversation_state] || { label: conv.conversation_state, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">
                        {conv.client_name || 'Não identificado'}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {conv.phone_number}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={stateInfo.color}>{stateInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={conv.is_ai_active ? 'default' : 'secondary'}>
                          {conv.is_ai_active ? '🤖 Ativa' : '👤 Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(conv.updated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedConversation(conv)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={conv.is_ai_active ? 'secondary' : 'default'}
                            onClick={() => toggleAI(conv.id, conv.is_ai_active)}
                          >
                            {conv.is_ai_active ? <UserCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => deleteConversation(conv.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {selectedConversation?.client_name || selectedConversation?.phone_number}
            </DialogTitle>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-4">
              {/* Collected Data */}
              {Object.keys(selectedConversation.collected_data).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Dados Coletados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedConversation.collected_data).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">{key}:</span>{' '}
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Messages Timeline */}
              <div className="space-y-3 max-h-96 overflow-y-auto p-2">
                {selectedConversation.messages_history.map((msg, idx) => {
                  const isAssistant = msg.role === 'assistant';
                  // "Read" = there's a user reply after this assistant message
                  const wasRead = isAssistant && selectedConversation.messages_history
                    .slice(idx + 1)
                    .some(m => m.role === 'user');

                  return (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] opacity-70">
                            {msg.timestamp ? formatDate(msg.timestamp) : ''}
                          </span>
                          {isAssistant && (
                            wasRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 opacity-50" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manual Message (when AI is off) */}
              {!selectedConversation.is_ai_active && (
                <div className="flex gap-2">
                  <Textarea
                    value={manualMessage}
                    onChange={(e) => setManualMessage(e.target.value)}
                    placeholder="Digite uma mensagem manual..."
                    className="min-h-[60px]"
                  />
                  <Button onClick={sendManualMessage} disabled={isSending || !manualMessage.trim()}>
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              {/* Toggle AI */}
              <div className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  {selectedConversation.is_ai_active ? (
                    <><Bot className="w-4 h-4 text-blue-500" /> Teo (IA) respondendo</>
                  ) : (
                    <><AlertCircle className="w-4 h-4 text-orange-500" /> Modo manual ativo</>
                  )}
                </div>
                <Button
                  variant={selectedConversation.is_ai_active ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => toggleAI(selectedConversation.id, selectedConversation.is_ai_active)}
                >
                  {selectedConversation.is_ai_active ? 'Assumir Manualmente' : 'Reativar Teo (IA)'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Star, Send, RefreshCw, Loader2, Eye, Trash2,
  Phone, MessageCircle, CheckCircle, Clock, BarChart3, ListOrdered, Link2, Copy
} from 'lucide-react';
import { ReviewDashboard } from './ReviewDashboard';

interface TravelReview {
  id: string;
  phone_number: string;
  client_name: string | null;
  destination_name: string | null;
  trip_id: string | null;
  route_score: number | null;
  service_score: number | null;
  nps_score: number | null;
  feedback_text: string | null;
  allows_sharing: string | null;
  photo_url: string | null;
  conversation_status: string;
  current_step: string;
  messages_history: Array<{ role: string; content: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  complete: { label: 'Completa', color: 'bg-green-100 text-green-800' },
  incomplete: { label: 'Incompleta', color: 'bg-orange-100 text-orange-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
};

const stepLabels: Record<string, string> = {
  greeting: 'Saudação',
  route_score: 'Nota Roteiro',
  service_score: 'Nota Atendimento',
  nps_score: 'NPS',
  feedback: 'Feedback',
  sharing: 'Autorização',
  photo: 'Foto',
  done: 'Finalizado',
};

export const ReviewManager = () => {
  const [reviews, setReviews] = useState<TravelReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedReview, setSelectedReview] = useState<TravelReview | null>(null);
  const [showSendForm, setShowSendForm] = useState(false);

  // Send form state
  const [sendPhone, setSendPhone] = useState('');
  const [sendName, setSendName] = useState('');
  const [sendDestination, setSendDestination] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('travel_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews((data || []).map(r => ({
        ...r,
        messages_history: (r.messages_history || []) as Array<{ role: string; content: string; timestamp: string }>,
      })));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setIsLoading(false);
    }
  };

  const sendReview = async () => {
    if (!sendPhone.trim()) {
      toast.error('Informe o número do WhatsApp');
      return;
    }

    // Clean phone number
    const cleanPhone = sendPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Número de WhatsApp inválido');
      return;
    }

    // Add country code if missing
    const phoneWithCode = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('review-webhook', {
        body: {
          action: 'start_review',
          phone_number: phoneWithCode,
          client_name: sendName.trim() || null,
          destination_name: sendDestination.trim() || null,
        },
      });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      setShowSendForm(false);
      setSendPhone('');
      setSendName('');
      setSendDestination('');
      fetchReviews();
    } catch (error) {
      console.error('Error sending review:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setIsSending(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
      const { error } = await supabase
        .from('travel_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Avaliação excluída');
      fetchReviews();
      if (selectedReview?.id === id) setSelectedReview(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Erro ao excluir avaliação');
    }
  };

  const getReviewLink = (reviewId: string) => {
    return `${window.location.origin}/avaliacao/${reviewId}`;
  };

  const copyReviewLink = (reviewId: string) => {
    navigator.clipboard.writeText(getReviewLink(reviewId));
    toast.success('Link copiado!');
  };

  const createReviewLink = async () => {
    try {
      const { data, error } = await supabase
        .from('travel_reviews')
        .insert({
          phone_number: 'link',
          conversation_status: 'pending',
          current_step: 'greeting',
        })
        .select('id')
        .single();

      if (error) throw error;

      const link = getReviewLink(data.id);
      await navigator.clipboard.writeText(link);
      toast.success('Link criado e copiado!');
      fetchReviews();
    } catch (error) {
      console.error('Error creating review link:', error);
      toast.error('Erro ao criar link');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const completedCount = reviews.filter(r => r.conversation_status === 'complete').length;
  const inProgressCount = reviews.filter(r => r.conversation_status === 'in_progress').length;
  const avgNps = reviews.filter(r => r.nps_score !== null).length > 0
    ? (reviews.filter(r => r.nps_score !== null).reduce((sum, r) => sum + (r.nps_score || 0), 0) / reviews.filter(r => r.nps_score !== null).length).toFixed(1)
    : '-';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList>
        <TabsTrigger value="dashboard" className="gap-2">
          <BarChart3 className="w-4 h-4" /> Dashboard
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-2">
          <ListOrdered className="w-4 h-4" /> Lista
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <ReviewDashboard reviews={reviews} />
      </TabsContent>

      <TabsContent value="list">
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-sm text-muted-foreground">Total Avaliações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{avgNps}</p>
              <p className="text-sm text-muted-foreground">NPS Médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button onClick={() => setShowSendForm(true)}>
            <Send className="w-4 h-4 mr-2" /> Enviar Avaliação
          </Button>
          <Button variant="outline" onClick={createReviewLink}>
            <Link2 className="w-4 h-4 mr-2" /> Criar Link
          </Button>
        </div>
        <Button variant="outline" onClick={fetchReviews}>
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      {/* Reviews Table */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground">
              Clique em "Enviar Avaliação" para iniciar uma pesquisa de satisfação via WhatsApp.
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
                  <TableHead>Destino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roteiro</TableHead>
                  <TableHead>Atendimento</TableHead>
                  <TableHead>NPS</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => {
                  const statusInfo = statusLabels[review.conversation_status] || { label: review.conversation_status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.client_name || review.phone_number}
                      </TableCell>
                      <TableCell>{review.destination_name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{review.route_score ?? '-'}</TableCell>
                      <TableCell className="text-center">{review.service_score ?? '-'}</TableCell>
                      <TableCell className="text-center">{review.nps_score ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(review.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => copyReviewLink(review.id)} title="Copiar link">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedReview(review)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => deleteReview(review.id)}
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

      {/* Send Review Dialog */}
      <Dialog open={showSendForm} onOpenChange={setShowSendForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Enviar Avaliação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">WhatsApp *</Label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(15) 99999-9999"
                  value={sendPhone}
                  onChange={(e) => setSendPhone(e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="name">Nome do Cliente</Label>
              <Input
                id="name"
                placeholder="Ex: João Silva"
                value={sendName}
                onChange={(e) => setSendName(e.target.value)}
                maxLength={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destino da Viagem</Label>
              <Input
                id="destination"
                placeholder="Ex: Fernando de Noronha"
                value={sendDestination}
                onChange={(e) => setSendDestination(e.target.value)}
                maxLength={200}
                className="mt-1"
              />
            </div>
            <Button onClick={sendReview} disabled={isSending} className="w-full">
              {isSending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Enviar via WhatsApp</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Avaliação - {selectedReview?.client_name || selectedReview?.phone_number}
            </DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              {/* Scores */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{selectedReview.route_score ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">Roteiro</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{selectedReview.service_score ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">Atendimento</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{selectedReview.nps_score ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">NPS</p>
                  </div>
                </CardContent>
              </Card>

              {/* Info */}
              <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Telefone:</span> {selectedReview.phone_number}</div>
                  <div><span className="font-medium">Destino:</span> {selectedReview.destination_name || '-'}</div>
                  <div><span className="font-medium">Etapa:</span> {stepLabels[selectedReview.current_step] || selectedReview.current_step}</div>
                  <div><span className="font-medium">Divulgação:</span> {selectedReview.allows_sharing || '-'}</div>
                  {selectedReview.feedback_text && (
                    <div className="col-span-2">
                      <span className="font-medium">Feedback:</span>
                      <p className="mt-1 text-muted-foreground">{selectedReview.feedback_text}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <div className="space-y-3 max-h-72 overflow-y-auto p-2">
                {selectedReview.messages_history.map((msg, idx) => (
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
                      <p>{msg.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {msg.timestamp ? formatDate(msg.timestamp) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
      </TabsContent>
    </Tabs>
  );
};

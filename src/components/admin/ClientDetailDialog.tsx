import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import {
  Plane,
  Hotel,
  CheckSquare,
  Square,
  Image,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  Loader2,
  MapPin,
  Calendar,
  Eye,
  ExternalLink,
  Edit,
  Save,
  X,
  Clock
} from 'lucide-react';

interface ClientProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface ClientTrip {
  id: string;
  destination_name: string;
  departure_date: string;
  return_date: string;
  flight_number: string | null;
  flight_departure_time: string | null;
  flight_return_time: string | null;
  flight_locator: string | null;
  hotel_name: string | null;
  hotel_address: string | null;
  hotel_link: string | null;
  hotel_checkin_time: string | null;
  hotel_checkout_time: string | null;
  trip_status: string;
  trip_tips: string | null;
}

interface TripDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  is_completed: boolean;
  is_default_item: boolean;
  sort_order: number;
}

interface AIItinerary {
  id: string;
  destination_name: string;
  travel_mood: string | null;
  preferences: string | null;
  itinerary_content: string;
  created_at: string;
  quote_requested: boolean;
}

interface AIImage {
  id: string;
  destination_name: string;
  prompt: string;
  image_url: string;
  created_at: string;
}

interface ClientDetailDialogProps {
  client: ClientProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientDetailDialog = ({ client, open, onOpenChange }: ClientDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState('trips');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [trips, setTrips] = useState<ClientTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<ClientTrip | null>(null);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [itineraries, setItineraries] = useState<AIItinerary[]>([]);
  const [images, setImages] = useState<AIImage[]>([]);
  
  // Upload/Add states
  const [isUploading, setIsUploading] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [documentType, setDocumentType] = useState('voucher_voo');
  
  // View states
  const [viewingItinerary, setViewingItinerary] = useState<AIItinerary | null>(null);
  const [viewingImage, setViewingImage] = useState<AIImage | null>(null);
  
  // Edit trip state
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editTripData, setEditTripData] = useState({
    departure_date: '',
    return_date: '',
    flight_number: '',
    flight_locator: '',
    flight_departure_time: '',
    flight_return_time: '',
    hotel_name: '',
    hotel_address: '',
    hotel_link: '',
    hotel_checkin_time: '',
    hotel_checkout_time: '',
    trip_tips: '',
    trip_status: ''
  });

  useEffect(() => {
    if (client && open) {
      fetchClientData();
    }
  }, [client, open]);

  useEffect(() => {
    if (selectedTrip) {
      fetchTripDetails(selectedTrip.id);
    }
  }, [selectedTrip]);

  const fetchClientData = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      // Fetch trips
      const { data: tripsData } = await supabase
        .from('client_trips')
        .select('*')
        .eq('user_id', client.user_id)
        .order('departure_date', { ascending: false });
      
      setTrips(tripsData || []);
      if (tripsData && tripsData.length > 0) {
        setSelectedTrip(tripsData[0]);
      }

      // Fetch AI itineraries by email
      const { data: itinerariesData } = await supabase
        .from('ai_itineraries')
        .select('*')
        .eq('user_email', client.email)
        .order('created_at', { ascending: false });
      
      setItineraries(itinerariesData || []);

      // Fetch AI images by email
      const { data: imagesData } = await supabase
        .from('ai_generated_images')
        .select('*')
        .eq('user_email', client.email)
        .order('created_at', { ascending: false });
      
      setImages(imagesData || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTripDetails = async (tripId: string) => {
    try {
      // Fetch documents
      const { data: docs } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      setDocuments(docs || []);

      // Fetch checklist
      const { data: checklistData } = await supabase
        .from('trip_checklist')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_order');
      setChecklist(checklistData || []);
    } catch (error) {
      console.error('Error fetching trip details:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTrip || !e.target.files?.length) return;
    
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedTrip.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('trip-documents')
        .getPublicUrl(fileName);

      const { error: docError } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: selectedTrip.id,
          document_name: file.name,
          document_type: documentType,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: session.user.id
        });

      if (docError) throw docError;

      toast.success('Documento enviado!');
      fetchTripDetails(selectedTrip.id);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Erro ao enviar documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Excluir este documento?')) return;

    try {
      await supabase.from('trip_documents').delete().eq('id', docId);
      toast.success('Documento excluído');
      if (selectedTrip) fetchTripDetails(selectedTrip.id);
    } catch (error) {
      toast.error('Erro ao excluir documento');
    }
  };

  const handleAddChecklistItem = async () => {
    if (!selectedTrip || !newChecklistItem.trim()) {
      toast.error('Digite o texto do item');
      return;
    }

    try {
      const maxSortOrder = checklist.length > 0 ? Math.max(...checklist.map(i => i.sort_order)) : 0;

      await supabase.from('trip_checklist').insert({
        trip_id: selectedTrip.id,
        item_text: newChecklistItem.trim(),
        is_default_item: false,
        sort_order: maxSortOrder + 1
      });

      toast.success('Item adicionado');
      setNewChecklistItem('');
      fetchTripDetails(selectedTrip.id);
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await supabase.from('trip_checklist').delete().eq('id', itemId);
      if (selectedTrip) fetchTripDetails(selectedTrip.id);
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const handleToggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    try {
      await supabase.from('trip_checklist').update({ is_completed: !currentStatus }).eq('id', itemId);
      if (selectedTrip) fetchTripDetails(selectedTrip.id);
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const startEditingTrip = () => {
    if (!selectedTrip) return;
    setEditTripData({
      departure_date: selectedTrip.departure_date || '',
      return_date: selectedTrip.return_date || '',
      flight_number: selectedTrip.flight_number || '',
      flight_locator: selectedTrip.flight_locator || '',
      flight_departure_time: selectedTrip.flight_departure_time ? format(new Date(selectedTrip.flight_departure_time), "yyyy-MM-dd'T'HH:mm") : '',
      flight_return_time: selectedTrip.flight_return_time ? format(new Date(selectedTrip.flight_return_time), "yyyy-MM-dd'T'HH:mm") : '',
      hotel_name: selectedTrip.hotel_name || '',
      hotel_address: selectedTrip.hotel_address || '',
      hotel_link: selectedTrip.hotel_link || '',
      hotel_checkin_time: selectedTrip.hotel_checkin_time || '14:00',
      hotel_checkout_time: selectedTrip.hotel_checkout_time || '12:00',
      trip_tips: selectedTrip.trip_tips || '',
      trip_status: selectedTrip.trip_status || 'confirmed'
    });
    setIsEditingTrip(true);
  };

  const cancelEditingTrip = () => {
    setIsEditingTrip(false);
    setEditTripData({
      departure_date: '',
      return_date: '',
      flight_number: '',
      flight_locator: '',
      flight_departure_time: '',
      flight_return_time: '',
      hotel_name: '',
      hotel_address: '',
      hotel_link: '',
      hotel_checkin_time: '',
      hotel_checkout_time: '',
      trip_tips: '',
      trip_status: ''
    });
  };

  const handleSaveTrip = async () => {
    if (!selectedTrip) return;

    try {
      const updateData: any = {
        departure_date: editTripData.departure_date,
        return_date: editTripData.return_date,
        flight_number: editTripData.flight_number || null,
        flight_locator: editTripData.flight_locator || null,
        flight_departure_time: editTripData.flight_departure_time ? new Date(editTripData.flight_departure_time).toISOString() : null,
        flight_return_time: editTripData.flight_return_time ? new Date(editTripData.flight_return_time).toISOString() : null,
        hotel_name: editTripData.hotel_name || null,
        hotel_address: editTripData.hotel_address || null,
        hotel_link: editTripData.hotel_link || null,
        hotel_checkin_time: editTripData.hotel_checkin_time || null,
        hotel_checkout_time: editTripData.hotel_checkout_time || null,
        trip_tips: editTripData.trip_tips || null,
        trip_status: editTripData.trip_status
      };

      const { error } = await supabase
        .from('client_trips')
        .update(updateData)
        .eq('id', selectedTrip.id);

      if (error) throw error;

      toast.success('Viagem atualizada com sucesso!');
      setIsEditingTrip(false);
      fetchClientData();
    } catch (error: any) {
      console.error('Error updating trip:', error);
      toast.error(error.message || 'Erro ao atualizar viagem');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      voucher_voo: 'Voucher de Voo',
      voucher_hotel: 'Voucher de Hotel',
      voucher_traslado: 'Voucher de Traslado',
      seguro: 'Seguro Viagem',
      outro: 'Outro'
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      confirmed: { label: 'Confirmada', variant: 'default' },
      pending: { label: 'Pendente', variant: 'secondary' },
      completed: { label: 'Concluída', variant: 'outline' },
      cancelled: { label: 'Cancelada', variant: 'destructive' }
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{client.full_name || 'Cliente'}</span>
            <span className="text-sm font-normal text-muted-foreground">({client.email})</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trips" className="flex items-center gap-1">
                <Plane className="w-4 h-4" />
                <span className="hidden sm:inline">Viagens</span>
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Checklist</span>
              </TabsTrigger>
              <TabsTrigger value="itineraries" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Roteiros IA</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Imagens IA</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {/* Trips & Documents Tab */}
              <TabsContent value="trips" className="mt-0 space-y-4">
                {trips.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma viagem cadastrada</p>
                  </div>
                ) : (
                  <>
                    {/* Trip Selector */}
                    <div className="space-y-2">
                      <Label>Selecione a Viagem</Label>
                      <Select
                        value={selectedTrip?.id || ''}
                        onValueChange={(id) => setSelectedTrip(trips.find(t => t.id === id) || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma viagem" />
                        </SelectTrigger>
                        <SelectContent>
                          {trips.map((trip) => (
                            <SelectItem key={trip.id} value={trip.id}>
                              {trip.destination_name} - {format(new Date(trip.departure_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTrip && (
                      <div className="space-y-4">
                        {/* Trip Info Header with Edit Button */}
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Informações da Viagem
                          </h4>
                          {!isEditingTrip ? (
                            <Button variant="outline" size="sm" onClick={startEditingTrip}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={cancelEditingTrip}>
                                <X className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                              <Button size="sm" onClick={handleSaveTrip}>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Trip Info Display / Edit Form */}
                        {!isEditingTrip ? (
                          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50 border">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="font-medium">{selectedTrip.destination_name}</span>
                              {getStatusBadge(selectedTrip.trip_status)}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(selectedTrip.departure_date), 'dd/MM', { locale: ptBR })} - {format(new Date(selectedTrip.return_date), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                            {selectedTrip.flight_locator && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Plane className="w-4 h-4" />
                                <span>Localizador: {selectedTrip.flight_locator}</span>
                              </div>
                            )}
                            {selectedTrip.flight_number && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Plane className="w-4 h-4" />
                                <span>Voo: {selectedTrip.flight_number}</span>
                              </div>
                            )}
                            {selectedTrip.flight_departure_time && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Ida: {format(new Date(selectedTrip.flight_departure_time), 'dd/MM HH:mm', { locale: ptBR })}</span>
                              </div>
                            )}
                            {selectedTrip.flight_return_time && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Volta: {format(new Date(selectedTrip.flight_return_time), 'dd/MM HH:mm', { locale: ptBR })}</span>
                              </div>
                            )}
                            {selectedTrip.hotel_name && (
                              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                <Hotel className="w-4 h-4" />
                                <span>{selectedTrip.hotel_name}</span>
                                {selectedTrip.hotel_checkin_time && selectedTrip.hotel_checkout_time && (
                                  <span className="text-xs">
                                    (Check-in: {selectedTrip.hotel_checkin_time} | Check-out: {selectedTrip.hotel_checkout_time})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-secondary/50 border space-y-4">
                            {/* Status */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">Status</Label>
                                <Select value={editTripData.trip_status} onValueChange={(v) => setEditTripData({...editTripData, trip_status: v})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="confirmed">Confirmada</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="completed">Concluída</SelectItem>
                                    <SelectItem value="cancelled">Cancelada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">Data de Ida</Label>
                                <Input
                                  type="date"
                                  value={editTripData.departure_date}
                                  onChange={(e) => setEditTripData({...editTripData, departure_date: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Data de Volta</Label>
                                <Input
                                  type="date"
                                  value={editTripData.return_date}
                                  onChange={(e) => setEditTripData({...editTripData, return_date: e.target.value})}
                                />
                              </div>
                            </div>

                            {/* Flight Info */}
                            <div className="pt-2 border-t">
                              <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                                <Plane className="w-4 h-4" />
                                Informações do Voo
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">Número do Voo</Label>
                                  <Input
                                    placeholder="Ex: LA3456"
                                    value={editTripData.flight_number}
                                    onChange={(e) => setEditTripData({...editTripData, flight_number: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Código Localizador</Label>
                                  <Input
                                    placeholder="Ex: ABC123"
                                    value={editTripData.flight_locator}
                                    onChange={(e) => setEditTripData({...editTripData, flight_locator: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Data/Hora Partida</Label>
                                  <Input
                                    type="datetime-local"
                                    value={editTripData.flight_departure_time}
                                    onChange={(e) => setEditTripData({...editTripData, flight_departure_time: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Data/Hora Retorno</Label>
                                  <Input
                                    type="datetime-local"
                                    value={editTripData.flight_return_time}
                                    onChange={(e) => setEditTripData({...editTripData, flight_return_time: e.target.value})}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Hotel Info */}
                            <div className="pt-2 border-t">
                              <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                                <Hotel className="w-4 h-4" />
                                Informações da Hospedagem
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">Nome do Hotel</Label>
                                  <Input
                                    placeholder="Nome do hotel ou pousada"
                                    value={editTripData.hotel_name}
                                    onChange={(e) => setEditTripData({...editTripData, hotel_name: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Link de Reserva</Label>
                                  <Input
                                    placeholder="https://..."
                                    value={editTripData.hotel_link}
                                    onChange={(e) => setEditTripData({...editTripData, hotel_link: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label className="text-xs">Endereço</Label>
                                  <Input
                                    placeholder="Endereço completo"
                                    value={editTripData.hotel_address}
                                    onChange={(e) => setEditTripData({...editTripData, hotel_address: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Horário Check-in</Label>
                                  <Input
                                    type="time"
                                    value={editTripData.hotel_checkin_time}
                                    onChange={(e) => setEditTripData({...editTripData, hotel_checkin_time: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Horário Check-out</Label>
                                  <Input
                                    type="time"
                                    value={editTripData.hotel_checkout_time}
                                    onChange={(e) => setEditTripData({...editTripData, hotel_checkout_time: e.target.value})}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Trip Tips */}
                            <div className="pt-2 border-t">
                              <div className="space-y-2">
                                <Label className="text-xs">Dicas da Viagem</Label>
                                <Textarea
                                  placeholder="Dicas personalizadas para esta viagem..."
                                  value={editTripData.trip_tips}
                                  onChange={(e) => setEditTripData({...editTripData, trip_tips: e.target.value})}
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Documents Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Documentos
                            </h4>
                          </div>

                          {/* Upload Form */}
                          <div className="flex items-end gap-2 p-3 rounded-lg bg-secondary/30 border">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Tipo do Documento</Label>
                              <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="voucher_voo">Voucher de Voo</SelectItem>
                                  <SelectItem value="voucher_hotel">Voucher de Hotel</SelectItem>
                                  <SelectItem value="voucher_traslado">Voucher de Traslado</SelectItem>
                                  <SelectItem value="seguro">Seguro Viagem</SelectItem>
                                  <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="outline"
                              className="relative"
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Enviar
                                </>
                              )}
                              <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              />
                            </Button>
                          </div>

                          {/* Documents List */}
                          {documents.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum documento enviado
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <div>
                                      <p className="text-sm font-medium">{doc.document_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {getDocumentTypeLabel(doc.document_type)} • {formatFileSize(doc.file_size)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(doc.file_url, '_blank')}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="mt-0 space-y-4">
                {!selectedTrip ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma viagem na aba "Viagens" primeiro</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Checklist: {selectedTrip.destination_name}
                      </h4>
                      <Badge variant="outline">
                        {checklist.filter(i => i.is_completed).length}/{checklist.length} concluídos
                      </Badge>
                    </div>

                    {/* Add New Item */}
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Adicionar novo item..."
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                      />
                      <Button onClick={handleAddChecklistItem} size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-2">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            item.is_completed ? 'bg-primary/5 border-primary/20' : 'bg-secondary/50'
                          }`}
                        >
                          <button onClick={() => handleToggleChecklistItem(item.id, item.is_completed)}>
                            {item.is_completed ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          <span className={`flex-1 ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.item_text}
                          </span>
                          {!item.is_default_item && (
                            <Badge variant="outline" className="text-xs">Personalizado</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      {checklist.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">
                          Nenhum item no checklist
                        </p>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* AI Itineraries Tab */}
              <TabsContent value="itineraries" className="mt-0 space-y-4">
                {itineraries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum roteiro gerado por este cliente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itineraries.map((itinerary) => (
                      <div key={itinerary.id} className="p-4 rounded-lg border bg-background">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              {itinerary.destination_name}
                              {itinerary.quote_requested && (
                                <Badge variant="secondary">Cotação Solicitada</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {itinerary.travel_mood && <span className="mr-2">Clima: {itinerary.travel_mood}</span>}
                              {format(new Date(itinerary.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {itinerary.preferences && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Preferências: {itinerary.preferences}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingItinerary(itinerary)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Itinerary Viewer Dialog */}
                <Dialog open={!!viewingItinerary} onOpenChange={() => setViewingItinerary(null)}>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>
                        Roteiro: {viewingItinerary?.destination_name}
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1">
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {viewingItinerary?.itinerary_content}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* AI Images Tab */}
              <TabsContent value="images" className="mt-0 space-y-4">
                {images.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma imagem gerada por este cliente</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border cursor-pointer"
                        onClick={() => setViewingImage(image)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.destination_name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <div className="text-white">
                            <p className="font-medium text-sm">{image.destination_name}</p>
                            <p className="text-xs opacity-80">
                              {format(new Date(image.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Viewer Dialog */}
                <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>{viewingImage?.destination_name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewingImage && window.open(viewingImage.image_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Abrir
                        </Button>
                      </DialogTitle>
                    </DialogHeader>
                    {viewingImage && (
                      <div className="space-y-4">
                        <img
                          src={viewingImage.image_url}
                          alt={viewingImage.destination_name}
                          className="w-full rounded-lg"
                        />
                        <p className="text-sm text-muted-foreground">{viewingImage.prompt}</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

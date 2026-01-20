import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plane, 
  Loader2, 
  Calendar,
  MapPin,
  Hotel,
  FileText,
  Phone,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
}

interface Trip {
  id: string;
  user_id: string;
  destination_name: string;
  destination_id: string | null;
  departure_date: string;
  return_date: string;
  flight_number: string | null;
  flight_departure_time: string | null;
  hotel_name: string | null;
  hotel_address: string | null;
  notes: string | null;
  trip_status: string;
  created_at: string;
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

interface EmergencyContact {
  id: string;
  contact_name: string;
  contact_type: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  sort_order: number;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  is_completed: boolean;
  is_default_item: boolean;
  sort_order: number;
}

export const TripManager = () => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state for new trip
  const [selectedClientId, setSelectedClientId] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightTime, setFlightTime] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // New contact form
  const [newContactName, setNewContactName] = useState('');
  const [newContactType, setNewContactType] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  
  // New checklist item
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchTripDetails(selectedTrip.id);
    }
  }, [selectedTrip]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch clients
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      // Filter out admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
      setClients(profiles?.filter(p => !adminUserIds.has(p.user_id)) || []);

      // Fetch all trips
      const { data: tripsData } = await supabase
        .from('client_trips')
        .select('*')
        .order('departure_date', { ascending: false });
      
      setTrips(tripsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
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

      // Fetch emergency contacts
      const { data: contactsData } = await supabase
        .from('trip_emergency_contacts')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_order');
      setContacts(contactsData || []);

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

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !destinationName || !departureDate || !returnDate) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const { data: trip, error } = await supabase
        .from('client_trips')
        .insert({
          user_id: selectedClientId,
          destination_name: destinationName,
          departure_date: departureDate,
          return_date: returnDate,
          flight_number: flightNumber || null,
          flight_departure_time: flightTime ? new Date(flightTime).toISOString() : null,
          hotel_name: hotelName || null,
          hotel_address: hotelAddress || null,
          notes: notes || null,
          trip_status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      // Copy default checklist items
      const { data: defaultItems } = await supabase
        .from('checklist_items_default')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (defaultItems && defaultItems.length > 0) {
        const checklistItems = defaultItems.map((item, index) => ({
          trip_id: trip.id,
          item_text: item.item_text,
          is_default_item: true,
          sort_order: index,
          is_completed: false
        }));

        await supabase.from('trip_checklist').insert(checklistItems);
      }

      toast.success('Viagem criada com sucesso!');
      resetForm();
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast.error(error.message || 'Erro ao criar viagem');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setDestinationName('');
    setDepartureDate('');
    setReturnDate('');
    setFlightNumber('');
    setFlightTime('');
    setHotelName('');
    setHotelAddress('');
    setNotes('');
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

      // Determine document type
      let docType = 'outro';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('voucher') || lowerName.includes('voo')) docType = 'voucher_voo';
      else if (lowerName.includes('hotel')) docType = 'voucher_hotel';
      else if (lowerName.includes('seguro')) docType = 'seguro';
      else if (lowerName.includes('traslado') || lowerName.includes('transfer')) docType = 'voucher_traslado';

      const { error: docError } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: selectedTrip.id,
          document_name: file.name,
          document_type: docType,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: session.user.id
        });

      if (docError) throw docError;

      toast.success('Documento enviado com sucesso!');
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
      const { error } = await supabase
        .from('trip_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      toast.success('Documento excluído');
      if (selectedTrip) fetchTripDetails(selectedTrip.id);
    } catch (error) {
      toast.error('Erro ao excluir documento');
    }
  };

  const handleAddContact = async () => {
    if (!selectedTrip || !newContactName || !newContactType) {
      toast.error('Preencha nome e tipo do contato');
      return;
    }

    try {
      const { error } = await supabase
        .from('trip_emergency_contacts')
        .insert({
          trip_id: selectedTrip.id,
          contact_name: newContactName,
          contact_type: newContactType,
          phone: newContactPhone || null,
          email: newContactEmail || null,
          sort_order: contacts.length
        });

      if (error) throw error;
      
      toast.success('Contato adicionado');
      setNewContactName('');
      setNewContactType('');
      setNewContactPhone('');
      setNewContactEmail('');
      fetchTripDetails(selectedTrip.id);
    } catch (error) {
      toast.error('Erro ao adicionar contato');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await supabase.from('trip_emergency_contacts').delete().eq('id', contactId);
      toast.success('Contato removido');
      if (selectedTrip) fetchTripDetails(selectedTrip.id);
    } catch (error) {
      toast.error('Erro ao remover contato');
    }
  };

  const handleAddChecklistItem = async () => {
    if (!selectedTrip || !newChecklistItem) return;

    try {
      const { error } = await supabase
        .from('trip_checklist')
        .insert({
          trip_id: selectedTrip.id,
          item_text: newChecklistItem,
          is_default_item: false,
          sort_order: checklist.length
        });

      if (error) throw error;
      
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

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Excluir esta viagem e todos os documentos associados?')) return;

    try {
      const { error } = await supabase
        .from('client_trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;
      toast.success('Viagem excluída');
      setSelectedTrip(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir viagem');
    }
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

  const getClientName = (userId: string) => {
    const client = clients.find(c => c.user_id === userId);
    return client?.full_name || client?.email || 'Cliente';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Viagens</h2>
          <p className="text-muted-foreground">Gerencie viagens, documentos e informações</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Viagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Viagem</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.user_id} value={client.user_id}>
                          {client.full_name || client.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label>Destino *</Label>
                  <Input
                    value={destinationName}
                    onChange={(e) => setDestinationName(e.target.value)}
                    placeholder="Ex: Maldivas, Paris, Fernando de Noronha"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Data de Ida *</Label>
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Data de Volta *</Label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Número do Voo</Label>
                  <Input
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="Ex: LA8084"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Horário do Voo</Label>
                  <Input
                    type="datetime-local"
                    value={flightTime}
                    onChange={(e) => setFlightTime(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nome do Hotel</Label>
                  <Input
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="Ex: Resort Paradise"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Endereço do Hotel</Label>
                  <Input
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionais sobre a viagem"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Viagem'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Viagens */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-foreground">Viagens Cadastradas</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {trips.length === 0 ? (
              <div className="text-center py-8 glass rounded-xl">
                <Plane className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Nenhuma viagem cadastrada</p>
              </div>
            ) : (
              trips.map((trip) => (
                <div
                  key={trip.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTrip?.id === trip.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {trip.destination_name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getClientName(trip.user_id)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(trip.departure_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {getStatusBadge(trip.trip_status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalhes da Viagem */}
        <div className="lg:col-span-2">
          {selectedTrip ? (
            <div className="glass rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedTrip.destination_name}</h3>
                  <p className="text-muted-foreground">{getClientName(selectedTrip.user_id)}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedTrip.trip_status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteTrip(selectedTrip.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ida</p>
                  <p className="font-medium">{format(new Date(selectedTrip.departure_date), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Volta</p>
                  <p className="font-medium">{format(new Date(selectedTrip.return_date), "dd/MM/yyyy")}</p>
                </div>
                {selectedTrip.flight_number && (
                  <div>
                    <p className="text-muted-foreground">Voo</p>
                    <p className="font-medium">{selectedTrip.flight_number}</p>
                  </div>
                )}
                {selectedTrip.hotel_name && (
                  <div>
                    <p className="text-muted-foreground">Hotel</p>
                    <p className="font-medium">{selectedTrip.hotel_name}</p>
                  </div>
                )}
              </div>

              <Tabs defaultValue="documents" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="documents">
                    <FileText className="w-4 h-4 mr-2" />
                    Documentos
                  </TabsTrigger>
                  <TabsTrigger value="contacts">
                    <Phone className="w-4 h-4 mr-2" />
                    Contatos
                  </TabsTrigger>
                  <TabsTrigger value="checklist">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Checklist
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Enviando...' : 'Enviar Documento'}
                      </div>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                  </div>

                  {documents.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">Nenhum documento anexado</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{doc.document_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.document_type} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome do contato"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                    />
                    <Select value={newContactType} onValueChange={setNewContactType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultor">Consultor</SelectItem>
                        <SelectItem value="seguradora">Seguradora</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="emergencia">Emergência</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Telefone"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                    />
                    <Input
                      placeholder="E-mail"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddContact} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Contato
                  </Button>

                  {contacts.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">Nenhum contato cadastrado</p>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{contact.contact_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact.contact_type} {contact.phone && `• ${contact.phone}`}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="checklist" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Novo item do checklist"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                    />
                    <Button onClick={handleAddChecklistItem} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {checklist.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">Checklist vazio</p>
                  ) : (
                    <div className="space-y-2">
                      {checklist.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className={`w-5 h-5 ${item.is_completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <span className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.item_text}
                            </span>
                            {!item.is_default_item && (
                              <Badge variant="outline" className="text-xs">Personalizado</Badge>
                            )}
                          </div>
                          {!item.is_default_item && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteChecklistItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Selecione uma viagem</h3>
              <p className="text-muted-foreground">Clique em uma viagem para gerenciar documentos e informações</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

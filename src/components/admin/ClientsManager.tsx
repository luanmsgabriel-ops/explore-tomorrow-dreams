import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Loader2, 
  Mail, 
  User, 
  Calendar,
  Plane,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  trip_status: string;
}

export const ClientsManager = () => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [clientTrips, setClientTrips] = useState<Record<string, ClientTrip[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles that have 'user' role (not admin)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user roles to filter out admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
      const clientProfiles = profiles?.filter(p => !adminUserIds.has(p.user_id)) || [];
      
      setClients(clientProfiles);

      // Fetch trips for each client
      const tripsMap: Record<string, ClientTrip[]> = {};
      for (const client of clientProfiles) {
        const { data: trips } = await supabase
          .from('client_trips')
          .select('id, destination_name, departure_date, return_date, trip_status')
          .eq('user_id', client.user_id)
          .order('departure_date', { ascending: false });
        
        if (trips) {
          tripsMap[client.user_id] = trips;
        }
      }
      setClientTrips(tripsMap);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsCreating(true);
    try {
      const response = await supabase.functions.invoke('create-user', {
        body: { email, password, full_name: fullName }
      });

      // Check for errors - can come from response.error.message, response.error.context, or response.data.error
      let errorMessage = '';
      if (response.error) {
        // FunctionsHttpError includes context with the response body
        errorMessage = response.error.message || '';
        // Try to parse the context if it contains JSON error
        try {
          const context = (response.error as any).context;
          if (context?.body) {
            const bodyText = await context.body.text?.() || context.body;
            const parsed = typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText;
            if (parsed.error) errorMessage = parsed.error;
          }
        } catch {
          // Use original message
        }
      } else if (response.data?.error) {
        errorMessage = response.data.error;
      }
      
      if (errorMessage) {
        if (errorMessage.includes('already been registered') || errorMessage.includes('email_exists')) {
          throw new Error('Este e-mail já está cadastrado no sistema. Use um e-mail diferente.');
        }
        throw new Error(errorMessage);
      }

      if (!response.data?.success) {
        throw new Error('Erro inesperado ao criar usuário');
      }

      // The database trigger handle_new_user automatically creates:
      // - Profile entry with user_id, email, full_name
      // - User role entry with 'user' role
      // So we don't need to create them manually here

      toast.success('Cliente criado com sucesso!', {
        description: `Email: ${email} | Senha: ${password}`
      });

      // Reset form
      setEmail('');
      setFullName('');
      setPassword('');
      setIsDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(error.message || 'Erro ao criar cliente');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async (client: ClientProfile) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente ${client.full_name || client.email}?`)) {
      return;
    }

    try {
      // Delete from profiles (cascade will handle related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', client.user_id);

      if (error) throw error;

      toast.success('Cliente removido com sucesso');
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
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
          <h2 className="text-2xl font-bold text-foreground">Gestão de Clientes</h2>
          <p className="text-muted-foreground">Gerencie os clientes e suas viagens</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClients}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="João Silva"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha inicial"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Gerar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O cliente receberá essas credenciais para o primeiro acesso
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Cliente'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum cliente cadastrado</h3>
          <p className="text-muted-foreground mb-4">Crie o primeiro cliente para começar</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Criar Cliente
          </Button>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Viagens</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const trips = clientTrips[client.user_id] || [];
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.full_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      {trips.length > 0 ? (
                        <div className="space-y-1">
                          {trips.slice(0, 2).map((trip) => (
                            <div key={trip.id} className="flex items-center gap-2">
                              <Plane className="w-3 h-3 text-primary" />
                              <span className="text-sm">{trip.destination_name}</span>
                              {getStatusBadge(trip.trip_status)}
                            </div>
                          ))}
                          {trips.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{trips.length - 2} viagem(ns)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhuma viagem</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedClient(client)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClient(client)}
                          className="text-destructive hover:text-destructive"
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
        </div>
      )}
    </div>
  );
};

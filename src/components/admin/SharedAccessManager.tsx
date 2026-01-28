import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, UserPlus, Users, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SharedAccess {
  id: string;
  primary_user_id: string;
  shared_user_id: string;
  shared_email: string;
  created_at: string;
}

interface SharedAccessManagerProps {
  primaryUserId: string;
  primaryEmail: string;
  clientName: string;
}

export const SharedAccessManager = ({ primaryUserId, primaryEmail, clientName }: SharedAccessManagerProps) => {
  const [sharedAccesses, setSharedAccesses] = useState<SharedAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchSharedAccesses();
  }, [primaryUserId]);

  const fetchSharedAccesses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('account_shared_access')
        .select('*')
        .eq('primary_user_id', primaryUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedAccesses(data || []);
    } catch (error) {
      console.error('Error fetching shared accesses:', error);
      toast.error('Erro ao carregar acessos compartilhados');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleAddSharedAccess = async () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      toast.error('Preencha o e-mail e a senha');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error('E-mail inválido');
      return;
    }

    setIsAdding(true);
    try {
      // 1. Create the user via edge function
      const { data: createData, error: createError } = await supabase.functions.invoke('create-user', {
        body: {
          email: newEmail.trim(),
          password: newPassword,
          full_name: newName.trim() || `Acesso Compartilhado - ${clientName}`
        }
      });

      if (createError) throw createError;
      if (createData?.error) throw new Error(createData.error);

      const newUserId = createData.user?.id;

      // 2. Create the shared access entry
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error: linkError } = await supabase
        .from('account_shared_access')
        .insert({
          primary_user_id: primaryUserId,
          shared_user_id: newUserId,
          shared_email: newEmail.trim(),
          created_by: session?.user?.id
        });

      if (linkError) throw linkError;

      toast.success('Acesso compartilhado criado com sucesso!');
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      fetchSharedAccesses();
    } catch (error: any) {
      console.error('Error adding shared access:', error);
      toast.error(error.message || 'Erro ao criar acesso compartilhado');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveSharedAccess = async (accessId: string, sharedEmail: string) => {
    if (!confirm(`Remover acesso de ${sharedEmail}? O usuário não será excluído, apenas perderá acesso às viagens.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('account_shared_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      toast.success('Acesso removido');
      fetchSharedAccesses();
    } catch (error) {
      console.error('Error removing shared access:', error);
      toast.error('Erro ao remover acesso');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          Adicione e-mails adicionais que poderão acessar as viagens de <strong>{clientName}</strong>. 
          Cada e-mail receberá suas próprias credenciais de acesso.
        </AlertDescription>
      </Alert>

      {/* Current shared accesses */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">E-mails com Acesso</h4>
        
        {/* Primary email */}
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-primary" />
            <div>
              <span className="font-medium">{primaryEmail}</span>
              <span className="ml-2 text-xs text-muted-foreground">(Principal)</span>
            </div>
          </div>
        </div>

        {/* Shared accesses */}
        {sharedAccesses.map((access) => (
          <div key={access.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border">
            <div className="flex items-center gap-3">
              <UserPlus className="w-4 h-4 text-accent" />
              <span>{access.shared_email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveSharedAccess(access.id, access.shared_email)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {sharedAccesses.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            Nenhum e-mail adicional cadastrado
          </p>
        )}
      </div>

      {/* Add new shared access */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Novo Acesso
        </h4>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="shared-name">Nome (opcional)</Label>
            <Input
              id="shared-name"
              type="text"
              placeholder="Nome do usuário"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shared-email">E-mail *</Label>
            <Input
              id="shared-email"
              type="email"
              placeholder="email@exemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shared-password">Senha *</Label>
            <div className="flex gap-2">
              <Input
                id="shared-password"
                type="text"
                placeholder="Senha de acesso"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
              >
                Gerar
              </Button>
            </div>
          </div>

          <Button
            onClick={handleAddSharedAccess}
            disabled={isAdding || !newEmail.trim() || !newPassword.trim()}
            className="w-full"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Acesso Compartilhado
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

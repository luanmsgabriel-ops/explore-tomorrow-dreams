import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, User, Building2, Shield, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyContact {
  id: string;
  contact_type: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  sort_order: number;
}

interface ClientEmergencyContactsProps {
  tripId: string;
  tripName: string;
}

export const ClientEmergencyContacts = ({ tripId, tripName }: ClientEmergencyContactsProps) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, [tripId]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_emergency_contacts')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'consultant':
        return <User className="w-5 h-5" />;
      case 'insurance':
        return <Shield className="w-5 h-5" />;
      case 'embassy':
        return <Building2 className="w-5 h-5" />;
      case 'local_emergency':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Phone className="w-5 h-5" />;
    }
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'consultant':
        return 'Consultor de Viagens';
      case 'insurance':
        return 'Seguradora';
      case 'embassy':
        return 'Embaixada/Consulado';
      case 'local_emergency':
        return 'Emergência Local';
      default:
        return 'Outro Contato';
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'consultant':
        return 'from-primary to-primary/70';
      case 'insurance':
        return 'from-blue-500 to-blue-400';
      case 'embassy':
        return 'from-purple-500 to-purple-400';
      case 'local_emergency':
        return 'from-destructive to-destructive/70';
      default:
        return 'from-accent to-accent/70';
    }
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
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Contatos de Emergência
        </h2>
        <p className="text-muted-foreground mt-1">
          Contatos importantes para sua viagem a {tripName}
        </p>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Nenhum contato cadastrado
          </h3>
          <p className="text-muted-foreground">
            Seu consultor irá adicionar os contatos importantes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getContactColor(contact.contact_type)} flex items-center justify-center text-white shrink-0`}>
                  {getContactIcon(contact.contact_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {getContactTypeLabel(contact.contact_type)}
                  </span>
                  <h3 className="font-semibold text-foreground mt-1 truncate">
                    {contact.contact_name}
                  </h3>

                  <div className="mt-3 space-y-2">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        {contact.email}
                      </a>
                    )}
                  </div>

                  {contact.notes && (
                    <p className="mt-3 text-sm text-muted-foreground italic">
                      {contact.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emergency Tips */}
      <div className="glass rounded-2xl p-6 border border-accent/30 bg-accent/5">
        <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          Dicas em Caso de Emergência
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Mantenha sempre uma cópia digital dos seus documentos no celular</li>
          <li>• Anote os números de emergência antes de viajar</li>
          <li>• Informe seu itinerário a familiares ou amigos</li>
          <li>• Tenha o cartão da seguradora sempre acessível</li>
          <li>• Salve os contatos importantes offline</li>
        </ul>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Volume2, Send, Sparkles, Loader2, Phone, Search } from 'lucide-react';

interface WhatsAppConversation {
  id: string;
  phone_number: string;
  client_name: string | null;
  updated_at: string;
}

interface QuoteRequest {
  id: string;
  client_name: string | null;
  whatsapp: string;
  created_at: string;
  destination_name: string | null;
}

export const AudioManager = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [customText, setCustomText] = useState('');
  const [isSendingCustom, setIsSendingCustom] = useState(false);
  const [isSendingCuriosity, setIsSendingCuriosity] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'custom' | 'curiosity'>('custom');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [convRes, quotesRes] = await Promise.all([
      supabase.from('whatsapp_conversations').select('id, phone_number, client_name, updated_at').order('updated_at', { ascending: false }).limit(50),
      supabase.from('quote_requests').select('id, client_name, whatsapp, created_at, destination_name').order('created_at', { ascending: false }).limit(50),
    ]);
    if (convRes.data) setConversations(convRes.data);
    if (quotesRes.data) setQuotes(quotesRes.data);
  };

  const allContacts = (() => {
    const map = new Map<string, { phone: string; name: string; source: string }>();
    conversations.forEach(c => {
      if (!map.has(c.phone_number)) {
        map.set(c.phone_number, { phone: c.phone_number, name: c.client_name || 'Sem nome', source: 'WhatsApp' });
      }
    });
    quotes.forEach(q => {
      if (!map.has(q.whatsapp)) {
        map.set(q.whatsapp, { phone: q.whatsapp, name: q.client_name || 'Sem nome', source: 'Cotação' });
      }
    });
    return Array.from(map.values());
  })();

  const filteredContacts = allContacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const selectContact = (phone: string, name: string) => {
    setSelectedPhone(phone);
    setSelectedName(name);
  };

  const handleSendCustomAudio = async () => {
    if (!selectedPhone || !customText.trim()) {
      toast.error('Selecione um contato e digite o texto do áudio');
      return;
    }
    setIsSendingCustom(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/whatsapp-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'send_audio',
          phone_number: selectedPhone,
          text: customText.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao enviar áudio');

      toast.success(`Áudio enviado para ${selectedName}!`);
      setCustomText('');
    } catch (error: any) {
      console.error('Error sending custom audio:', error);
      toast.error(error.message || 'Erro ao enviar áudio');
    } finally {
      setIsSendingCustom(false);
    }
  };

  const handleSendCuriosityAudio = async () => {
    if (!selectedPhone) {
      toast.error('Selecione um contato primeiro');
      return;
    }
    setIsSendingCuriosity(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/whatsapp-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'send_curiosity_audio',
          phone_number: selectedPhone,
          client_name: selectedName !== 'Sem nome' ? selectedName : undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao enviar áudio');

      toast.success(`Áudio de curiosidade + "Urgente!!" enviado para ${selectedName}!`);
    } catch (error: any) {
      console.error('Error sending curiosity audio:', error);
      toast.error(error.message || 'Erro ao enviar áudio de curiosidade');
    } finally {
      setIsSendingCuriosity(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Áudio do Teo</h1>
          <p className="text-muted-foreground text-sm">Envie áudios personalizados ou de curiosidade para clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact selector */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4" /> Selecionar Contato
          </h3>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredContacts.map((contact) => (
              <button
                key={contact.phone}
                onClick={() => selectContact(contact.phone, contact.name)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm ${
                  selectedPhone === contact.phone
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary text-foreground'
                }`}
              >
                <p className="font-medium truncate">{contact.name}</p>
                <p className={`text-xs ${selectedPhone === contact.phone ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {contact.phone} · {contact.source}
                </p>
              </button>
            ))}
            {filteredContacts.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum contato encontrado</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected contact indicator */}
          {selectedPhone && (
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{selectedName}</p>
                <p className="text-muted-foreground text-xs">{selectedPhone}</p>
              </div>
            </div>
          )}

          {/* Tab buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSection('custom')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeSection === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Áudio Personalizado
            </button>
            <button
              onClick={() => setActiveSection('curiosity')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeSection === 'curiosity' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Áudio de Curiosidade
            </button>
          </div>

          {/* Custom audio section */}
          {activeSection === 'custom' && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Send className="w-4 h-4" /> Enviar Áudio Personalizado
              </h3>
              <p className="text-muted-foreground text-sm">
                Digite o texto que o Teo vai falar. O texto será convertido em áudio com a voz do Teo e enviado pelo WhatsApp.
              </p>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Ex: Oi Maria! Passando aqui pra te lembrar que aquele pacote pra Maldivas ainda está disponível com condições especiais..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{customText.length} caracteres</span>
                <button
                  onClick={handleSendCustomAudio}
                  disabled={isSendingCustom || !selectedPhone || !customText.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingCustom ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando e Enviando...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Enviar Áudio
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Curiosity audio section */}
          {activeSection === 'curiosity' && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Áudio de Curiosidade
              </h3>
              <div className="rounded-xl bg-secondary/50 border border-border p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">O que será enviado:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground italic">
                      "Ei {selectedName || '[nome]'}! Ficou curioso né? hahaha! É só para te lembrar que eu ainda tô aqui, pronto para te ajudar a montar a viagem perfeita! Me chama quando quiser!"
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Send className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground font-medium">
                      Urgente!! 🚨
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Este é o áudio de curiosidade usado no follow-up do dia 1. Primeiro é enviado o áudio com a voz do Teo, seguido da mensagem de texto "Urgente!! 🚨".
              </p>
              <button
                onClick={handleSendCuriosityAudio}
                disabled={isSendingCuriosity || !selectedPhone}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              >
                {isSendingCuriosity ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando e Enviando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Disparar Áudio de Curiosidade
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Sparkles, Loader2, Mail, Phone, Download, Send, CheckCircle, User, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import logo from '@/assets/logo.jpeg';
import { useDestinations } from '@/hooks/useDestinations';
import { itineraryFormSchema, validateForm, sanitizeText, isValidationError } from '@/lib/validations';

interface ItineraryGeneratorProps {
  destinationId?: string;
  destinationName?: string;
  onClose?: () => void;
}

export const ItineraryGenerator = ({ destinationId: initialDestinationId, destinationName: initialDestinationName, onClose }: ItineraryGeneratorProps) => {
  const needsDestinationSelection = !initialDestinationId || !initialDestinationName;
  const [step, setStep] = useState<'contact' | 'destination' | 'preferences' | 'generating' | 'result' | 'quote_success'>('contact');
  const [selectedDestinationId, setSelectedDestinationId] = useState(initialDestinationId || '');
  const [selectedDestinationName, setSelectedDestinationName] = useState(initialDestinationName || '');
  const { destinations, isLoading: isLoadingDestinations } = useDestinations();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [preferences, setPreferences] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    // Valida os campos de contato
    const validation = validateForm(itineraryFormSchema, {
      name: sanitizeText(name),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      preferences: '',
    });

    if (isValidationError(validation)) {
      const errors: Record<string, string> = {};
      for (const err of validation.errors) {
        errors[err.field] = err.message;
      }
      setValidationErrors(errors);
      return;
    }

    // Se precisa selecionar destino, vai para essa etapa; senão, vai direto para preferências
    if (needsDestinationSelection) {
      setStep('destination');
    } else {
      setStep('preferences');
    }
  };

  const handleDestinationSelect = (destId: string, destName: string) => {
    setSelectedDestinationId(destId);
    setSelectedDestinationName(destName);
    setStep('preferences');
  };

  const handleGenerate = async () => {
    setStep('generating');
    setIsLoading(true);

    try {
      const sanitizedPreferences = sanitizeText(preferences);
      
      const response = await supabase.functions.invoke('generate-itinerary', {
        body: {
          destination: selectedDestinationName,
          preferences: sanitizedPreferences,
          email: email.trim(),
          whatsapp: whatsapp.trim(),
        },
      });

      if (response.error) throw response.error;

      const { itinerary: generatedItinerary, destination: actualDestination } = response.data;
      setItinerary(generatedItinerary);
      
      // Update destination name if AI returned a different one
      const finalDestinationName = actualDestination || selectedDestinationName;
      setSelectedDestinationName(finalDestinationName);

      // Save to database - with proper error handling
      const { data: insertedData, error: insertError } = await supabase.from('ai_itineraries').insert({
        destination_id: selectedDestinationId,
        destination_name: finalDestinationName,
        user_email: email.trim() || '',
        user_whatsapp: whatsapp.trim(),
        preferences: sanitizedPreferences,
        itinerary_content: generatedItinerary,
        status: 'pending',
        quote_requested: false,
      }).select('id').single();

      if (insertError) {
        console.error('Erro ao salvar roteiro:', insertError);
        // Continue showing the itinerary but warn about quote limitation
        toast.warning('Roteiro gerado! Porém, houve um erro ao salvar. A solicitação de cotação pode não funcionar.');
        setItineraryId(null);
      } else if (insertedData) {
        setItineraryId(insertedData.id);
      }

      setStep('result');
      toast.success('Roteiro gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar roteiro:', error);
      toast.error('Erro ao gerar roteiro. Tente novamente.');
      setStep('preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    // Simple markdown to HTML conversion
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3 style="color: #14b8a6; margin-top: 24px; margin-bottom: 12px; font-size: 18px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #14b8a6; margin-top: 32px; margin-bottom: 16px; font-size: 22px; border-bottom: 2px solid #14b8a6; padding-bottom: 8px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: #14b8a6; margin-bottom: 20px; font-size: 28px;">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong style="color: #f59e0b;">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 8px;">$1</li>')
      .replace(/\n/gim, '<br>');
    
    return html;
  };

  const handleDownload = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roteiro ${selectedDestinationName} - Tomorrow Travel</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      color: #e5e5e5;
      min-height: 100vh;
      padding: 40px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(15,15,25,0.98) 100%);
      border-radius: 24px;
      padding: 48px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 2px solid rgba(20, 184, 166, 0.3);
    }
    
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      object-fit: cover;
    }
    
    .brand {
      font-family: 'Playfair Display', serif;
    }
    
    .brand-tomorrow {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .brand-travel {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-left: 8px;
    }
    
    .destination-title {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #14b8a6;
      font-size: 16px;
      font-weight: 500;
    }
    
    .content {
      line-height: 1.8;
      font-size: 15px;
    }
    
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 2px solid rgba(20, 184, 166, 0.3);
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    
    .footer a {
      color: #14b8a6;
      text-decoration: none;
    }
    
    .cta {
      display: inline-block;
      margin-top: 16px;
      padding: 12px 32px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #000;
      font-weight: 600;
      border-radius: 12px;
      text-decoration: none;
    }
    
    @media print {
      body {
        background: white;
        color: #333;
        padding: 20px;
      }
      .container {
        background: white;
        box-shadow: none;
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logo}" alt="Tomorrow Travel" class="logo" onerror="this.style.display='none'">
      <div>
        <div class="brand">
          <span class="brand-tomorrow">TOMORROW</span>
          <span class="brand-travel">TRAVEL</span>
        </div>
        <p class="subtitle">Sua próxima aventura começa aqui</p>
      </div>
    </div>
    
    <h1 class="destination-title">Roteiro: ${selectedDestinationName}</h1>
    
    <div class="content">
      ${convertMarkdownToHtml(itinerary)}
    </div>
    
    <div class="footer">
      <p>Roteiro gerado exclusivamente para você por Tomorrow Travel</p>
      <p style="margin-top: 8px;">Dúvidas? Entre em contato conosco!</p>
      <a href="https://wa.me/5511999999999" class="cta">Solicitar Cotação</a>
      <p style="margin-top: 24px; font-size: 12px;">© ${new Date().getFullYear()} Tomorrow Travel. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-${selectedDestinationName.toLowerCase().replace(/\s+/g, '-')}-tomorrow-travel.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Roteiro baixado! Abra o arquivo em seu navegador.');
  };

  if (step === 'contact') {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Criar Roteiro com IA
          </h3>
          <p className="text-muted-foreground">
            Informe seus dados para receber seu roteiro personalizado{selectedDestinationName ? ` para ${selectedDestinationName}` : ''}
          </p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nome *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Seu nome completo"
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.name ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                required
                maxLength={100}
              />
            </div>
            {validationErrors.name && (
              <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WhatsApp *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, whatsapp: '' }));
                }}
                placeholder="(11) 99999-9999"
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.whatsapp ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                required
                maxLength={20}
              />
            </div>
            {validationErrors.whatsapp && (
              <p className="text-sm text-destructive mt-1">{validationErrors.whatsapp}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              E-mail (opcional)
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="seu@email.com"
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.email ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                maxLength={255}
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>
            )}
          </div>

          <button type="submit" className="w-full btn-gold">
            Continuar
          </button>
        </form>
      </div>
    );
  }

  if (step === 'destination') {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Escolha o Destino
          </h3>
          <p className="text-muted-foreground">
            Para qual destino você deseja gerar o roteiro?
          </p>
        </div>

        {isLoadingDestinations ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {destinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => handleDestinationSelect(dest.id, dest.name)}
                className="w-full p-4 rounded-xl bg-secondary border border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-3"
              >
                {dest.image && (
                  <img src={dest.image} alt={dest.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-foreground">{dest.name}</p>
                  <p className="text-sm text-muted-foreground">{dest.location}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 'preferences') {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Suas Preferências
          </h3>
          <p className="text-muted-foreground">
            Conte-nos mais sobre o que você busca na viagem para <strong>{selectedDestinationName}</strong> (opcional)
          </p>
        </div>

        <div className="space-y-4">
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="Ex: Viagem romântica, gosto de gastronomia e vinhos, prefiro hotéis boutique, quero conhecer lugares menos turísticos..."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-none"
            maxLength={1000}
          />

          <button onClick={handleGenerate} className="w-full btn-primary flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Gerar Meu Roteiro
          </button>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
          Criando seu roteiro...
        </h3>
        <p className="text-muted-foreground">
          Nossa IA está preparando um roteiro personalizado para você. Isso pode levar alguns segundos.
        </p>
      </div>
    );
  }

  const handleRequestQuote = async () => {
    setIsRequestingQuote(true);
    
    try {
      // Se temos o itineraryId, atualiza o registro existente
      if (itineraryId) {
        const { error } = await supabase.from('ai_itineraries')
          .update({
            quote_requested: true,
            quote_requested_at: new Date().toISOString(),
          })
          .eq('id', itineraryId);

        if (error) {
          console.error('Erro ao atualizar cotação:', error);
          throw error;
        }
      } else {
        // Fallback: cria uma nova solicitação de cotação diretamente
        console.log('itineraryId não disponível, criando quote_request diretamente');
        const { error } = await supabase.from('quote_requests').insert({
          destination_name: selectedDestinationName,
          destination_id: selectedDestinationId || null,
          email: email.trim() || 'nao-informado@temp.com',
          whatsapp: whatsapp.trim(),
          special_requests: `Roteiro IA gerado. Preferências: ${preferences || 'Nenhuma especificada'}`,
          status: 'pending',
        });

        if (error) {
          console.error('Erro ao criar quote_request:', error);
          throw error;
        }
      }

      setStep('quote_success');
      toast.success('Solicitação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao solicitar cotação:', error);
      toast.error('Erro ao solicitar cotação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsRequestingQuote(false);
    }
  };

  if (step === 'quote_success') {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
          Solicitação Realizada!
        </h3>
        <p className="text-muted-foreground mb-6">
          Recebemos sua solicitação de cotação para {selectedDestinationName}. Nossa equipe entrará em contato em breve pelo WhatsApp ou e-mail informados.
        </p>
        {onClose && (
          <button onClick={onClose} className="btn-primary">
            Fechar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 border-b border-border">
        <h3 className="font-serif text-xl font-bold text-foreground">
          Seu Roteiro para {selectedDestinationName}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{itinerary}</ReactMarkdown>
        </div>
      </div>

      <div className="p-6 border-t border-border flex flex-wrap gap-3">
        <button onClick={handleDownload} className="btn-outline flex items-center gap-2">
          <Download className="w-4 h-4" />
          Baixar Roteiro
        </button>
        <button 
          onClick={handleRequestQuote} 
          disabled={isRequestingQuote}
          className="btn-gold flex items-center gap-2"
        >
          {isRequestingQuote ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Solicitar Cotação
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-outline ml-auto">
            Fechar
          </button>
        )}
      </div>
    </div>
  );
};

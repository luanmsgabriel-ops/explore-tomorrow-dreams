import { useState, useMemo } from 'react';
import { Sparkles, Loader2, Mail, Phone, Download, Send, CheckCircle, User, MapPin, Database, Heart, Compass, Utensils, Zap, Palmtree, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { ItineraryMapView } from './ItineraryMapView';
import logo from '@/assets/logo.jpeg';
import { useDestinations } from '@/hooks/useDestinations';
import { itineraryFormSchema, validateForm, sanitizeText, isValidationError } from '@/lib/validations';
import { getCachedItinerary, setCachedItinerary } from '@/hooks/useItineraryCache';

interface ItineraryGeneratorProps {
  destinationId?: string;
  destinationName?: string;
  onClose?: () => void;
}

// Definição dos climas de viagem
const TRAVEL_MOODS = [
  { id: 'romantica', label: 'Romântica', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { id: 'relaxante', label: 'Relaxante', icon: Palmtree, color: 'from-teal-500 to-cyan-500' },
  { id: 'aventura', label: 'Aventura Radical', icon: Zap, color: 'from-orange-500 to-amber-500' },
  { id: 'gastronomica', label: 'Gastronômica', icon: Utensils, color: 'from-purple-500 to-violet-500' },
  { id: 'cultural', label: 'Cultural', icon: Compass, color: 'from-blue-500 to-indigo-500' },
  { id: 'fotografica', label: 'Fotográfica', icon: Camera, color: 'from-emerald-500 to-green-500' },
];

interface Activity {
  id: string;
  day: string;
  title: string;
  description: string;
  selected: boolean;
}

export const ItineraryGenerator = ({ destinationId: initialDestinationId, destinationName: initialDestinationName, onClose }: ItineraryGeneratorProps) => {
  const needsDestinationSelection = !initialDestinationId || !initialDestinationName;
  const [step, setStep] = useState<'contact' | 'mood' | 'destination' | 'preferences' | 'generating' | 'result' | 'quote_success'>('contact');
  const [selectedDestinationId, setSelectedDestinationId] = useState(initialDestinationId || '');
  const [selectedDestinationName, setSelectedDestinationName] = useState(initialDestinationName || '');
  const { destinations, isLoading: isLoadingDestinations } = useDestinations();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [preferences, setPreferences] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fromCache, setFromCache] = useState(false);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [placePhotos, setPlacePhotos] = useState<Record<string, string>>({});

  // Parse itinerary to extract activities
  const parseItineraryActivities = (content: string): Activity[] => {
    const activities: Activity[] = [];
    const lines = content.split('\n');
    let currentDay = '';
    let activityIndex = 0;

    for (const line of lines) {
      // Detectar dia (ex: "## Dia 1" ou "### Dia 1" ou "**Dia 1**")
      const dayMatch = line.match(/^(?:#{1,3}\s*)?(?:\*\*)?(Dia\s*\d+)[:\s-]*(.*?)(?:\*\*)?$/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
        continue;
      }

      // Detectar atividades (linhas que começam com - ou * e têm conteúdo significativo)
      const activityMatch = line.match(/^[-*]\s+(?:\*\*)?(.+?)(?:\*\*)?:\s*(.+)?$/);
      if (activityMatch && currentDay) {
        activities.push({
          id: `activity-${activityIndex++}`,
          day: currentDay,
          title: activityMatch[1].replace(/\*\*/g, ''),
          description: activityMatch[2] || '',
          selected: false,
        });
      }
    }

    return activities;
  };

  // Group activities by day
  const activitiesByDay = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    for (const activity of activities) {
      if (!grouped[activity.day]) {
        grouped[activity.day] = [];
      }
      grouped[activity.day].push(activity);
    }
    return grouped;
  }, [activities]);

  const toggleActivity = (activityId: string) => {
    setActivities(prev => prev.map(a => 
      a.id === activityId ? { ...a, selected: !a.selected } : a
    ));
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const selectedActivitiesCount = activities.filter(a => a.selected).length;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
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

    // Vai para seleção de clima
    setStep('mood');
  };

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
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
    setFromCache(false);

    try {
      const sanitizedPreferences = sanitizeText(preferences);
      const moodLabel = TRAVEL_MOODS.find(m => m.id === selectedMood)?.label || '';
      const fullPreferences = moodLabel 
        ? `Clima da viagem: ${moodLabel}. ${sanitizedPreferences}`
        : sanitizedPreferences;
      
      // Verifica se existe no cache
      const cached = getCachedItinerary(selectedDestinationName, fullPreferences);
      
      if (cached) {
        setItinerary(cached.itinerary);
        setSelectedDestinationName(cached.actualDestination);
        setFromCache(true);
        
        // Parse activities from cached itinerary
        const parsedActivities = parseItineraryActivities(cached.itinerary);
        setActivities(parsedActivities);
        if (parsedActivities.length > 0) {
          setExpandedDays([parsedActivities[0].day]);
        }
        
        setStep('result');
        toast.success('Roteiro carregado do cache! 💾');
        return;
      }
      
      // Gera novo roteiro via API
      const response = await supabase.functions.invoke('generate-itinerary', {
        body: {
          destination: selectedDestinationName,
          preferences: fullPreferences,
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          travelMood: selectedMood,
        },
      });

      if (response.error) {
        const errorData = response.error as any;
        if (errorData?.context?.body) {
          try {
            const body = JSON.parse(errorData.context.body);
            if (body.code === 'RATE_LIMIT') {
              toast.error(body.error, {
                description: `Uso diário: ${body.usage?.daily_used}/${body.usage?.daily_limit} | Mensal: ${body.usage?.monthly_used}/${body.usage?.monthly_limit}`,
                duration: 8000,
              });
              setStep('preferences');
              return;
            }
          } catch {
            // Parse failed, continue with generic error
          }
        }
        throw response.error;
      }

      const { itinerary: generatedItinerary, destination: actualDestination, structured, placeNames } = response.data;
      setItinerary(generatedItinerary);
      setStructuredData(structured || null);
      
      const finalDestinationName = actualDestination || selectedDestinationName;
      setSelectedDestinationName(finalDestinationName);
      
      // Parse activities from generated itinerary (fallback for non-structured)
      const parsedActivities = parseItineraryActivities(generatedItinerary);
      setActivities(parsedActivities);
      if (parsedActivities.length > 0) {
        setExpandedDays([parsedActivities[0].day]);
      }
      
      // Fetch photos for places in background
      if (placeNames?.length > 0) {
        supabase.functions.invoke('search-place-photos', {
          body: { queries: placeNames },
        }).then(({ data: photoData }) => {
          if (photoData?.photos) {
            setPlacePhotos(photoData.photos);
          }
        }).catch(err => console.error('Photo fetch error:', err));
      }
      
      // Salva no cache
      setCachedItinerary(
        selectedDestinationName,
        fullPreferences,
        generatedItinerary,
        finalDestinationName
      );

      // Save to database with mood
      const generatedItineraryId = crypto.randomUUID();
      const itineraryData = {
        id: generatedItineraryId,
        destination_id: selectedDestinationId,
        destination_name: finalDestinationName,
        user_email: email.trim() || '',
        user_whatsapp: whatsapp.trim(),
        preferences: fullPreferences,
        itinerary_content: generatedItinerary,
        status: 'pending',
        quote_requested: false,
        travel_mood: selectedMood,
        selected_activities: [],
      };
      
      const { error: insertError } = await supabase.from('ai_itineraries')
        .insert(itineraryData);

      if (insertError) {
        console.error('Erro ao salvar roteiro:', insertError);
      } else {
        setItineraryId(generatedItineraryId);
        console.log('Roteiro salvo com sucesso, ID:', generatedItineraryId);
        
        // Envia notificação por e-mail para o admin
        try {
          const notifyResponse = await supabase.functions.invoke('send-admin-notification', {
            body: {
              type: 'ai_itinerary',
              data: {
                ...itineraryData,
                id: generatedItineraryId,
              },
            },
          });
          if (notifyResponse.error) {
            console.error('Erro ao enviar notificação:', notifyResponse.error);
          } else {
            console.log('Notificação de roteiro enviada com sucesso');
          }
        } catch (err) {
          console.error('Erro ao enviar notificação:', err);
        }
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
    const selectedList = activities.filter(a => a.selected);
    const selectedSection = selectedList.length > 0 
      ? `
      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
        <h2 style="color: #f59e0b; margin-bottom: 16px; font-size: 20px;">⭐ Passeios Selecionados pelo Cliente</h2>
        <ul style="list-style: none; padding: 0;">
          ${selectedList.map(a => `<li style="margin-bottom: 12px; padding-left: 24px; position: relative;"><span style="position: absolute; left: 0;">✓</span><strong>${a.day}</strong> - ${a.title}${a.description ? `: ${a.description}` : ''}</li>`).join('')}
        </ul>
      </div>`
      : '';

    const moodLabel = TRAVEL_MOODS.find(m => m.id === selectedMood)?.label || 'Não especificado';
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roteiro ${selectedDestinationName} - Tomorrow Travel</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: #e5e5e5; min-height: 100vh; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(15,15,25,0.98) 100%); border-radius: 24px; padding: 48px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.1); }
    .header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid rgba(20, 184, 166, 0.3); }
    .logo { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; }
    .brand { font-family: 'Playfair Display', serif; }
    .brand-tomorrow { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .brand-travel { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-left: 8px; }
    .destination-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .mood-badge { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; font-weight: 600; border-radius: 20px; margin-bottom: 16px; }
    .content { line-height: 1.8; font-size: 15px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 2px solid rgba(20, 184, 166, 0.3); text-align: center; color: #666; font-size: 14px; }
    .footer a { color: #14b8a6; text-decoration: none; }
    .cta { display: inline-block; margin-top: 16px; padding: 12px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; font-weight: 600; border-radius: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logo}" alt="Tomorrow Travel" class="logo" onerror="this.style.display='none'">
      <div>
        <div class="brand"><span class="brand-tomorrow">TOMORROW</span><span class="brand-travel">TRAVEL</span></div>
        <p style="color: #14b8a6; font-size: 14px;">Sua próxima aventura começa aqui</p>
      </div>
    </div>
    
    <h1 class="destination-title">Roteiro: ${selectedDestinationName}</h1>
    <span class="mood-badge">🎯 ${moodLabel}</span>
    
    ${selectedSection}
    
    <div class="content">${convertMarkdownToHtml(itinerary)}</div>
    
    <div class="footer">
      <p>Roteiro gerado exclusivamente para você por Tomorrow Travel</p>
      <a href="https://wa.me/5515991833448" class="cta">Solicitar Cotação</a>
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
    toast.success('Roteiro baixado!');
  };

  const handleRequestQuote = async () => {
    setIsRequestingQuote(true);
    
    try {
      const selectedList = activities.filter(a => a.selected);
      
      // Update itinerary with selected activities if we have an ID
      if (itineraryId) {
        await supabase.from('ai_itineraries').update({
          selected_activities: selectedList.map(a => ({
            day: a.day,
            title: a.title,
            description: a.description,
          })),
          quote_requested: true,
          quote_requested_at: new Date().toISOString(),
        }).eq('id', itineraryId);
      }

      const selectedActivitiesText = selectedList.length > 0
        ? `\n\nPASSEIOS SELECIONADOS:\n${selectedList.map(a => `- ${a.day}: ${a.title}`).join('\n')}`
        : '';

      const moodLabel = TRAVEL_MOODS.find(m => m.id === selectedMood)?.label || '';
      
      const { error } = await supabase.from('quote_requests').insert({
        destination_name: selectedDestinationName,
        destination_id: selectedDestinationId || null,
        email: email.trim() || 'nao-informado@temp.com',
        whatsapp: whatsapp.trim(),
        special_requests: `Clima: ${moodLabel || 'Não especificado'}. Preferências: ${preferences || 'Nenhuma especificada'}.${selectedActivitiesText}`,
        travel_word: moodLabel,
        status: 'pending',
      });

      if (error) throw error;

      setStep('quote_success');
      toast.success('Solicitação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao solicitar cotação:', error);
      toast.error('Erro ao solicitar cotação.');
    } finally {
      setIsRequestingQuote(false);
    }
  };

  // Contact Step
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
            <label className="block text-sm font-medium text-foreground mb-2">Nome *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setValidationErrors(prev => ({ ...prev, name: '' })); }}
                placeholder="Seu nome completo"
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.name ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                required
                maxLength={100}
              />
            </div>
            {validationErrors.name && <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">WhatsApp *</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => { setWhatsapp(e.target.value); setValidationErrors(prev => ({ ...prev, whatsapp: '' })); }}
                placeholder="(11) 99999-9999"
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.whatsapp ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                required
                maxLength={20}
              />
            </div>
            {validationErrors.whatsapp && <p className="text-sm text-destructive mt-1">{validationErrors.whatsapp}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">E-mail (opcional)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setValidationErrors(prev => ({ ...prev, email: '' })); }}
                placeholder="seu@email.com"
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.email ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                maxLength={255}
              />
            </div>
            {validationErrors.email && <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>}
          </div>

          <button type="submit" className="w-full btn-gold">Continuar</button>
        </form>
      </div>
    );
  }

  // Mood Selection Step
  if (step === 'mood') {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Qual o Clima da Viagem?
          </h3>
          <p className="text-muted-foreground">
            Selecione o estilo que melhor representa o que você busca
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TRAVEL_MOODS.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                  selectedMood === mood.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 bg-secondary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mood.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-medium text-foreground text-sm">{mood.label}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Destination Selection Step
  if (step === 'destination') {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Escolha o Destino</h3>
          <p className="text-muted-foreground">Para qual destino você deseja gerar o roteiro?</p>
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

  // Preferences Step
  if (step === 'preferences') {
    const moodLabel = TRAVEL_MOODS.find(m => m.id === selectedMood)?.label;
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Suas Preferências</h3>
          <p className="text-muted-foreground">
            Conte-nos mais sobre o que você busca na viagem para <strong>{selectedDestinationName}</strong>
          </p>
          {moodLabel && (
            <span className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm">
              🎯 Clima: {moodLabel}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="Ex: Prefiro hotéis boutique, quero conhecer lugares menos turísticos, adoro vinhos..."
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

  // Generating Step
  if (step === 'generating') {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Criando seu roteiro...</h3>
        <p className="text-muted-foreground">Nossa IA está preparando um roteiro personalizado para você.</p>
      </div>
    );
  }

  // Quote Success Step
  if (step === 'quote_success') {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-3">Solicitação Realizada!</h3>
        <p className="text-muted-foreground mb-6">
          Recebemos sua solicitação para {selectedDestinationName}. 
          {selectedActivitiesCount > 0 && ` Você selecionou ${selectedActivitiesCount} passeios de interesse.`}
          {' '}Nossa equipe entrará em contato em breve!
        </p>
        {onClose && (
          <button onClick={onClose} className="btn-primary">Fechar</button>
        )}
      </div>
    );
  }

  // Result Step
  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-xl font-bold text-foreground">
            Seu Roteiro para {selectedDestinationName}
          </h3>
          <div className="flex items-center gap-2">
            {fromCache && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                <Database className="w-3 h-3" />
                Cache
              </span>
            )}
            {selectedMood && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                {TRAVEL_MOODS.find(m => m.id === selectedMood)?.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Activities Selection */}
        {activities.length > 0 && (
          <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Selecione os Passeios de Interesse
              </h4>
              <span className="text-sm text-muted-foreground">
                {selectedActivitiesCount} selecionado(s)
              </span>
            </div>

            <div className="space-y-2">
              {Object.entries(activitiesByDay).map(([day, dayActivities]) => (
                <div key={day} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleDay(day)}
                    className="w-full p-3 bg-secondary/50 flex items-center justify-between hover:bg-secondary transition-colors"
                  >
                    <span className="font-medium text-foreground">{day}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {dayActivities.filter(a => a.selected).length}/{dayActivities.length}
                      </span>
                      {expandedDays.includes(day) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  
                  {expandedDays.includes(day) && (
                    <div className="p-2 space-y-1">
                      {dayActivities.map((activity) => (
                        <label
                          key={activity.id}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            activity.selected 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'hover:bg-secondary/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={activity.selected}
                            onChange={() => toggleActivity(activity.id)}
                            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Itinerary */}
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
          Solicitar Cotação {selectedActivitiesCount > 0 && `(${selectedActivitiesCount} passeios)`}
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-outline ml-auto">Fechar</button>
        )}
      </div>
    </div>
  );
};

export default ItineraryGenerator;

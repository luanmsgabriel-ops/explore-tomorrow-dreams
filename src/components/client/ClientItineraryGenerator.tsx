import { useState, useMemo } from 'react';
import { Sparkles, Loader2, Download, Send, CheckCircle, MapPin, Heart, Compass, Utensils, Zap, Palmtree, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useDestinations } from '@/hooks/useDestinations';
import logo from '@/assets/logo.jpeg';

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

interface ClientItineraryGeneratorProps {
  userName: string;
  userEmail: string;
  userWhatsapp?: string;
}

export const ClientItineraryGenerator = ({ userName, userEmail, userWhatsapp = '' }: ClientItineraryGeneratorProps) => {
  const [step, setStep] = useState<'mood' | 'destination' | 'preferences' | 'generating' | 'result'>('mood');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [selectedDestinationName, setSelectedDestinationName] = useState('');
  const { destinations, isLoading: isLoadingDestinations } = useDestinations();
  const [preferences, setPreferences] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);

  // Parse itinerary to extract activities
  const parseItineraryActivities = (content: string): Activity[] => {
    const activities: Activity[] = [];
    const lines = content.split('\n');
    let currentDay = '';
    let activityIndex = 0;

    for (const line of lines) {
      const dayMatch = line.match(/^(?:#{1,3}\s*)?(?:\*\*)?(Dia\s*\d+)[:\s-]*(.*?)(?:\*\*)?$/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
        continue;
      }

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

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    setStep('destination');
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
      const moodLabel = TRAVEL_MOODS.find(m => m.id === selectedMood)?.label || '';
      const fullPreferences = moodLabel 
        ? `Clima da viagem: ${moodLabel}. ${preferences}`
        : preferences;
      
      const response = await supabase.functions.invoke('generate-itinerary', {
        body: {
          destination: selectedDestinationName,
          preferences: fullPreferences,
          email: userEmail,
          whatsapp: userWhatsapp,
          travelMood: selectedMood,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { itinerary: generatedItinerary, destination: actualDestination } = response.data;
      setItinerary(generatedItinerary);
      
      const finalDestinationName = actualDestination || selectedDestinationName;
      setSelectedDestinationName(finalDestinationName);
      
      const parsedActivities = parseItineraryActivities(generatedItinerary);
      setActivities(parsedActivities);
      if (parsedActivities.length > 0) {
        setExpandedDays([parsedActivities[0].day]);
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
        <h2 style="color: #f59e0b; margin-bottom: 16px; font-size: 20px;">⭐ Passeios Selecionados</h2>
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
      <p>Roteiro gerado exclusivamente para ${userName} por Tomorrow Travel</p>
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
      const selectedActivitiesText = selectedList.length > 0
        ? `\n\nPASSEIOS SELECIONADOS:\n${selectedList.map(a => `- ${a.day}: ${a.title}`).join('\n')}`
        : '';

      const moodLabel = TRAVEL_MOODS.find(m => m.id === selectedMood)?.label || '';
      
      const { error } = await supabase.from('quote_requests').insert({
        destination_name: selectedDestinationName,
        destination_id: selectedDestinationId || null,
        email: userEmail,
        whatsapp: userWhatsapp,
        special_requests: `Cliente: ${userName}. Clima: ${moodLabel || 'Não especificado'}. Preferências: ${preferences || 'Nenhuma especificada'}.${selectedActivitiesText}`,
        travel_word: moodLabel,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Solicitação de cotação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao solicitar cotação:', error);
      toast.error('Erro ao solicitar cotação.');
    } finally {
      setIsRequestingQuote(false);
    }
  };

  const resetGenerator = () => {
    setStep('mood');
    setSelectedMood('');
    setSelectedDestinationId('');
    setSelectedDestinationName('');
    setPreferences('');
    setItinerary('');
    setActivities([]);
    setExpandedDays([]);
  };

  // Mood Selection Step
  if (step === 'mood') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Crie Seu Roteiro Personalizado
          </h3>
          <p className="text-muted-foreground">
            Olá, {userName}! Qual o clima da sua viagem ideal?
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TRAVEL_MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleMoodSelect(mood.id)}
              className="p-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/50 transition-all text-center group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mood.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <mood.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Destination Selection Step
  if (step === 'destination') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Escolha seu Destino
          </h3>
          <p className="text-muted-foreground">
            Clima selecionado: <span className="text-primary font-medium">{TRAVEL_MOODS.find(m => m.id === selectedMood)?.label}</span>
          </p>
        </div>

        {isLoadingDestinations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {destinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => handleDestinationSelect(dest.id, dest.name)}
                className="relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all group aspect-[4/3]"
              >
                <img 
                  src={dest.image || '/placeholder.svg'} 
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-medium text-sm">{dest.name}</p>
                  <p className="text-white/70 text-xs">{dest.location}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setStep('mood')}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  // Preferences Step
  if (step === 'preferences') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
            Personalize seu Roteiro
          </h3>
          <p className="text-muted-foreground">
            Destino: <span className="text-primary font-medium">{selectedDestinationName}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Preferências adicionais (opcional)
            </label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Ex: Prefiro atividades pela manhã, gosto de gastronomia local, viajo com crianças..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-32"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{preferences.length}/500 caracteres</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('destination')}
            className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 btn-primary"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Gerar Roteiro
          </button>
        </div>
      </div>
    );
  }

  // Generating Step
  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-dashed border-primary/30 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="font-serif text-xl font-bold text-foreground mb-2">
          Criando seu roteiro...
        </h3>
        <p className="text-muted-foreground text-center text-sm">
          Nossa IA está preparando uma experiência única para você em {selectedDestinationName}
        </p>
      </div>
    );
  }

  // Result Step
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-foreground">
            Seu Roteiro para {selectedDestinationName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Clima: {TRAVEL_MOODS.find(m => m.id === selectedMood)?.label}
          </p>
        </div>
        <button
          onClick={resetGenerator}
          className="text-sm text-primary hover:underline"
        >
          Novo Roteiro
        </button>
      </div>

      {/* Activities selector */}
      {activities.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border-b border-border">
            <p className="font-medium text-foreground">
              📋 Selecione os passeios que mais te interessam
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedActivitiesCount} passeio(s) selecionado(s)
            </p>
          </div>
          <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
            {Object.entries(activitiesByDay).map(([day, dayActivities]) => (
              <div key={day}>
                <button
                  onClick={() => toggleDay(day)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-medium text-foreground">{day}</span>
                  {expandedDays.includes(day) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {expandedDays.includes(day) && (
                  <div className="px-4 pb-4 space-y-2">
                    {dayActivities.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => toggleActivity(activity.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          activity.selected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            activity.selected ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}>
                            {activity.selected && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary content */}
      <div className="prose prose-invert max-w-none bg-secondary/30 rounded-xl p-6 border border-border max-h-[400px] overflow-y-auto">
        <ReactMarkdown>{itinerary}</ReactMarkdown>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 btn-gold flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Baixar Roteiro
        </button>
        <button
          onClick={handleRequestQuote}
          disabled={isRequestingQuote}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          {isRequestingQuote ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Solicitar Cotação
        </button>
      </div>
    </div>
  );
};

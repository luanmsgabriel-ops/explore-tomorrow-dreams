import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Utensils, Camera, Mountain, Landmark, ShoppingBag, 
  Moon, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, 
  Sun, CloudSun, Wallet, Shield, Luggage, Globe,
  Download, Send, Loader2
} from 'lucide-react';

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  sightseeing: { icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  food: { icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  nature: { icon: Mountain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  culture: { icon: Landmark, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  adventure: { icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  shopping: { icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  relaxation: { icon: Sun, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  nightlife: { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
};

interface StructuredActivity {
  time: string;
  title: string;
  description: string;
  place_name: string;
  category: string;
  tip?: string;
}

interface StructuredDay {
  day_number: number;
  title: string;
  activities: StructuredActivity[];
  restaurant_tip?: {
    name: string;
    cuisine: string;
    price_range: string;
    description: string;
  };
}

interface StructuredItinerary {
  destination: string;
  summary: string;
  days: StructuredDay[];
  practical_tips?: {
    currency: string;
    timezone: string;
    climate: string;
    packing: string[];
    safety: string[];
  };
}

interface ItineraryMapViewProps {
  structured: StructuredItinerary;
  destinationName: string;
  photos: Record<string, string>;
  selectedMood?: string;
  onRequestQuote?: (selectedActivities: { day: number; title: string }[]) => void;
  onDownload?: () => void;
  isRequestingQuote?: boolean;
}

export const ItineraryMapView = ({
  structured,
  destinationName,
  photos,
  selectedMood,
  onRequestQuote,
  onDownload,
  isRequestingQuote,
}: ItineraryMapViewProps) => {
  const [activeDay, setActiveDay] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [showTips, setShowTips] = useState(false);

  const currentDay = structured.days.find(d => d.day_number === activeDay);
  const totalDays = structured.days.length;

  // Get a hero photo for the destination
  const heroPhoto = useMemo(() => {
    const firstPlace = structured.days[0]?.activities[0]?.place_name;
    return photos[firstPlace || ''] || photos[Object.keys(photos)[0] || ''] || '';
  }, [photos, structured]);

  // Get photo for a specific place
  const getActivityPhoto = (placeName: string) => {
    return photos[placeName] || '';
  };

  const toggleActivity = (dayNum: number, title: string) => {
    const key = `${dayNum}:${title}`;
    setSelectedActivities(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRequestQuote = () => {
    const selected = Array.from(selectedActivities).map(key => {
      const [day, ...rest] = key.split(':');
      return { day: parseInt(day), title: rest.join(':') };
    });
    onRequestQuote?.(selected);
  };

  // Build Google Maps static map URL
  const mapUrl = useMemo(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return '';
    
    const places = currentDay?.activities.map(a => a.place_name).filter(Boolean) || [];
    if (places.length === 0) return '';
    
    const markers = places.map((p, i) => 
      `markers=color:red%7Clabel:${i + 1}%7C${encodeURIComponent(p + ', ' + destinationName)}`
    ).join('&');
    
    return `https://maps.googleapis.com/maps/api/staticmap?size=600x300&maptype=roadmap&${markers}&key=${apiKey}`;
  }, [currentDay, destinationName]);

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-background rounded-2xl overflow-hidden">
      {/* Hero Header */}
      <div className="relative h-48 md:h-56 overflow-hidden shrink-0">
        {heroPhoto ? (
          <img 
            src={heroPhoto} 
            alt={destinationName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl md:text-3xl font-bold text-foreground"
          >
            {structured.destination}
          </motion.h2>
          <p className="text-muted-foreground text-sm mt-1">{structured.summary}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
              {totalDays} dias
            </span>
            {selectedMood && (
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full font-medium">
                {selectedMood}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Day Timeline Navigation */}
      <div className="shrink-0 px-4 py-3 border-b border-border overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {structured.days.map((day) => (
            <button
              key={day.day_number}
              onClick={() => setActiveDay(day.day_number)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                activeDay === day.day_number
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span className="text-xs opacity-70">Dia</span>
              <span className="text-lg font-bold">{day.day_number}</span>
            </button>
          ))}
          
          {/* Tips button */}
          <button
            onClick={() => setShowTips(!showTips)}
            className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
              showTips
                ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/30'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs mt-0.5">Dicas</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showTips ? (
            <motion.div
              key="tips"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {structured.practical_tips && (
                <>
                  <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                    <Globe className="w-5 h-5 text-accent" />
                    Dicas Práticas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoCard icon={Wallet} label="Moeda" value={structured.practical_tips.currency} />
                    <InfoCard icon={Clock} label="Fuso Horário" value={structured.practical_tips.timezone} />
                    <InfoCard icon={CloudSun} label="Clima" value={structured.practical_tips.climate} />
                  </div>

                  {structured.practical_tips.packing?.length > 0 && (
                    <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Luggage className="w-4 h-4 text-primary" />
                        O que levar
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {structured.practical_tips.packing.map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {structured.practical_tips.safety?.length > 0 && (
                    <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-amber-400" />
                        Segurança
                      </h4>
                      <ul className="space-y-2">
                        {structured.practical_tips.safety.map((tip, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : currentDay ? (
            <motion.div
              key={`day-${activeDay}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  Dia {currentDay.day_number}: {currentDay.title}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
                    disabled={activeDay === 1}
                    className="p-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveDay(Math.min(totalDays, activeDay + 1))}
                    disabled={activeDay === totalDays}
                    className="p-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Map */}
              {mapUrl && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img 
                    src={mapUrl} 
                    alt={`Mapa do Dia ${activeDay}`} 
                    className="w-full h-40 md:h-52 object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Activities Timeline */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-4">
                  {currentDay.activities.map((activity, idx) => {
                    const catConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.sightseeing;
                    const CatIcon = catConfig.icon;
                    const photo = getActivityPhoto(activity.place_name);
                    const actKey = `${currentDay.day_number}:${activity.title}`;
                    const isSelected = selectedActivities.has(actKey);

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative pl-12"
                      >
                        {/* Timeline dot */}
                        <div className={`absolute left-3 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${
                          isSelected ? 'bg-primary' : catConfig.bg
                        }`}>
                          {isSelected ? (
                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${catConfig.color.replace('text-', 'bg-')}`} />
                          )}
                        </div>

                        {/* Activity Card */}
                        <button
                          onClick={() => toggleActivity(currentDay.day_number, activity.title)}
                          className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                            isSelected 
                              ? 'border-primary/50 shadow-lg shadow-primary/10 bg-primary/5' 
                              : 'border-border hover:border-primary/30 bg-secondary/20 hover:bg-secondary/40'
                          }`}
                        >
                          {/* Photo */}
                          {photo && (
                            <div className="relative h-32 md:h-40 overflow-hidden">
                              <img 
                                src={photo} 
                                alt={activity.place_name} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-primary" />
                                <span className="text-xs text-foreground/80 font-medium">{activity.place_name}</span>
                              </div>
                            </div>
                          )}

                          <div className="p-3">
                            <div className="flex items-start gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${catConfig.bg} ${catConfig.color}`}>
                                {activity.time}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                  <CatIcon className={`w-3.5 h-3.5 shrink-0 ${catConfig.color}`} />
                                  {activity.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {activity.description}
                                </p>
                                {activity.tip && (
                                  <p className="text-xs text-accent mt-1.5 flex items-start gap-1">
                                    <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                                    {activity.tip}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Restaurant Tip */}
              {currentDay.restaurant_tip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-500/20"
                >
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <Utensils className="w-4 h-4 text-orange-400" />
                    Dica de Restaurante
                  </h4>
                  <p className="text-foreground font-medium text-sm mt-1">
                    {currentDay.restaurant_tip.name}
                    <span className="ml-2 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                      {currentDay.restaurant_tip.price_range}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentDay.restaurant_tip.cuisine} · {currentDay.restaurant_tip.description}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 p-4 border-t border-border bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {selectedActivities.size > 0 
              ? `${selectedActivities.size} atividade${selectedActivities.size > 1 ? 's' : ''} selecionada${selectedActivities.size > 1 ? 's' : ''}`
              : 'Toque nos cards para selecionar atividades'
            }
          </span>
          <div className="flex gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
                title="Baixar roteiro"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onRequestQuote && (
              <button
                onClick={handleRequestQuote}
                disabled={isRequestingQuote}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isRequestingQuote ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Solicitar Cotação
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component
const InfoCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="bg-secondary/30 rounded-xl p-3 border border-border flex items-start gap-3">
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default ItineraryMapView;

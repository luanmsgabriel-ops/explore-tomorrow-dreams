import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ChevronLeft, ChevronRight, Utensils, Camera, Mountain, Landmark, ShoppingBag, Moon, Sparkles, Sun, Loader2 } from 'lucide-react';

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

interface Activity {
  time: string;
  title: string;
  description: string;
  place_name: string;
  category: string;
  tip?: string;
}

interface Day {
  day_number: number;
  title: string;
  activities: Activity[];
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
  days: Day[];
}

interface ChatItineraryCardProps {
  structured: StructuredItinerary;
  photos: Record<string, string>;
  isLoading?: boolean;
}

export const ChatItineraryCard = ({ structured, photos, isLoading }: ChatItineraryCardProps) => {
  const [activeDay, setActiveDay] = useState(1);

  if (isLoading) {
    return (
      <div className="w-full max-w-[340px] bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl border border-primary/20 p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Criando seu roteiro premium...</p>
        <p className="text-xs text-muted-foreground mt-1">Com fotos e dicas exclusivas ✨</p>
      </div>
    );
  }

  if (!structured?.days?.length) return null;

  const currentDay = structured.days.find(d => d.day_number === activeDay);
  const totalDays = structured.days.length;

  // Get hero photo
  const heroPhoto = (() => {
    const firstPlace = structured.days[0]?.activities?.[0]?.place_name;
    return photos[firstPlace || ''] || photos[Object.keys(photos)[0] || ''] || '';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-[360px] rounded-2xl overflow-hidden border border-primary/20 shadow-xl bg-background"
    >
      {/* Hero */}
      <div className="relative h-36 overflow-hidden">
        {heroPhoto ? (
          <img src={heroPhoto} alt={structured.destination} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif text-lg font-bold text-foreground leading-tight">
            🗺️ {structured.destination}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{structured.summary}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full font-medium">
            {totalDays} dias
          </span>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
        {structured.days.map((day) => (
          <button
            key={day.day_number}
            onClick={() => setActiveDay(day.day_number)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeDay === day.day_number
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
            }`}
          >
            Dia {day.day_number}
          </button>
        ))}
      </div>

      {/* Day Content */}
      <AnimatePresence mode="wait">
        {currentDay && (
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="p-3 space-y-2 max-h-[320px] overflow-y-auto"
          >
            {/* Day Title */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">
                Dia {currentDay.day_number}: {currentDay.title}
              </h4>
              <div className="flex gap-0.5">
                <button
                  onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
                  disabled={activeDay === 1}
                  className="p-1 rounded bg-secondary/40 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setActiveDay(Math.min(totalDays, activeDay + 1))}
                  disabled={activeDay === totalDays}
                  className="p-1 rounded bg-secondary/40 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Activities */}
            {currentDay.activities.map((activity, idx) => {
              const catConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.sightseeing;
              const CatIcon = catConfig.icon;
              const photo = photos[activity.place_name] || '';

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="rounded-xl overflow-hidden border border-border bg-secondary/10 hover:bg-secondary/20 transition-colors"
                >
                  {photo && (
                    <div className="relative h-24 overflow-hidden">
                      <img
                        src={photo}
                        alt={activity.place_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                      <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-primary" />
                        <span className="text-[10px] text-foreground/80 font-medium">{activity.place_name}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-2.5">
                    <div className="flex items-start gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${catConfig.bg} ${catConfig.color} flex-shrink-0`}>
                        {activity.time}
                      </span>
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <CatIcon className={`w-3 h-3 flex-shrink-0 ${catConfig.color}`} />
                          {activity.title}
                        </h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {activity.description}
                        </p>
                        {activity.tip && (
                          <p className="text-[10px] text-accent mt-1 flex items-start gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" />
                            {activity.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Restaurant Tip */}
            {currentDay.restaurant_tip && (
              <div className="rounded-xl p-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Utensils className="w-3 h-3 text-orange-400" />
                  {currentDay.restaurant_tip.name}
                  <span className="px-1 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] rounded">
                    {currentDay.restaurant_tip.price_range}
                  </span>
                </h5>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {currentDay.restaurant_tip.cuisine} · {currentDay.restaurant_tip.description}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border bg-primary/5 text-center">
        <p className="text-[10px] text-muted-foreground">
          ✈️ Roteiro exclusivo por <span className="text-primary font-medium">Tomorrow Travel</span>
        </p>
      </div>
    </motion.div>
  );
};

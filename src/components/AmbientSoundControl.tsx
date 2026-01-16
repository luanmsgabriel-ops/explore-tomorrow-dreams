import { Volume2, VolumeX, Waves } from 'lucide-react';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { cn } from '@/lib/utils';

interface AmbientSoundControlProps {
  category: string;
}

export const AmbientSoundControl = ({ category }: AmbientSoundControlProps) => {
  const { 
    isPlaying, 
    isMuted, 
    isBeachCategory, 
    hasUserInteracted,
    toggle, 
    toggleMute 
  } = useAmbientSound({ category, volume: 0.25 });

  // Only show for beach destinations
  if (!isBeachCategory) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2">
      {/* Play/Pause button - shown when autoplay blocked */}
      {!hasUserInteracted && (
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300",
            "bg-primary/90 hover:bg-primary text-primary-foreground",
            "backdrop-blur-md border border-primary/20",
            "animate-pulse hover:animate-none"
          )}
          aria-label="Tocar som ambiente de praia"
        >
          <Waves className="w-5 h-5" />
          <span className="text-sm font-medium">Ouvir o mar</span>
        </button>
      )}

      {/* Mute/Unmute button - shown when playing */}
      {hasUserInteracted && (
        <button
          onClick={toggleMute}
          className={cn(
            "flex items-center gap-2 p-3 rounded-full shadow-lg transition-all duration-300",
            "backdrop-blur-md border",
            isPlaying && !isMuted
              ? "bg-primary/90 hover:bg-primary text-primary-foreground border-primary/20"
              : "bg-secondary/90 hover:bg-secondary text-muted-foreground border-border"
          )}
          aria-label={isMuted ? "Ativar som" : "Desativar som"}
          title={isMuted ? "Ativar som do mar" : "Desativar som do mar"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Play/Pause control when audio is active */}
      {hasUserInteracted && (
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-2 p-3 rounded-full shadow-lg transition-all duration-300",
            "backdrop-blur-md border",
            isPlaying
              ? "bg-accent/90 hover:bg-accent text-accent-foreground border-accent/20"
              : "bg-secondary/90 hover:bg-secondary text-muted-foreground border-border"
          )}
          aria-label={isPlaying ? "Pausar som" : "Tocar som"}
          title={isPlaying ? "Pausar som do mar" : "Tocar som do mar"}
        >
          <Waves className={cn("w-5 h-5", isPlaying && "animate-pulse")} />
        </button>
      )}
    </div>
  );
};

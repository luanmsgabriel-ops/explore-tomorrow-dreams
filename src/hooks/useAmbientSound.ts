import { useEffect, useRef } from 'react';

// Check if category contains "Praia" - handles both string and array formats
const checkIsBeachCategory = (category: string): boolean => {
  if (!category) return false;
  
  const categoryLower = category.toLowerCase();
  
  // Check if it's a JSON array string
  if (categoryLower.startsWith('[')) {
    try {
      const parsed = JSON.parse(category);
      if (Array.isArray(parsed)) {
        return parsed.some((cat: string) => cat.toLowerCase() === 'praia');
      }
    } catch {
      // Not valid JSON, continue with string check
    }
  }
  
  // Simple string comparison
  return categoryLower === 'praia' || categoryLower.includes('praia');
};

// Beach ambient sound files
const BEACH_SOUNDS = [
  '/sounds/beach-ambient-1.webm',
  '/sounds/beach-ambient-2.webm',
];

export const useAutoAmbientSound = (category: string, volume: number = 0.15) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const eventListenersRef = useRef<(() => void)[]>([]);

  const isBeachCategory = checkIsBeachCategory(category);

  // Cleanup function to stop audio immediately
  const stopAudio = () => {
    // Remove all event listeners
    eventListenersRef.current.forEach(cleanup => cleanup());
    eventListenersRef.current = [];
    
    // Stop and cleanup audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    hasStartedRef.current = false;
  };

  useEffect(() => {
    if (!isBeachCategory) {
      stopAudio();
      return;
    }

    const playBeachSound = () => {
      // Stop any existing audio first
      stopAudio();
      
      // Pick a random beach sound
      const randomSound = BEACH_SOUNDS[Math.floor(Math.random() * BEACH_SOUNDS.length)];
      console.log('[AmbientSound] Playing beach sound:', randomSound);
      
      const audio = new Audio(randomSound);
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;

      const startAudio = () => {
        if (hasStartedRef.current || !audioRef.current) return;
        
        audioRef.current.play()
          .then(() => {
            console.log('[AmbientSound] Audio started playing!');
            hasStartedRef.current = true;
            // Remove interaction listeners once playing
            eventListenersRef.current.forEach(cleanup => cleanup());
            eventListenersRef.current = [];
          })
          .catch(() => {
            // Autoplay blocked, will try on user interaction
          });
      };

      audio.addEventListener('canplaythrough', startAudio);

      // Add event listeners for user interaction
      const addListener = (event: string) => {
        const handler = () => startAudio();
        document.addEventListener(event, handler, { passive: true });
        eventListenersRef.current.push(() => document.removeEventListener(event, handler));
      };

      addListener('click');
      addListener('scroll');
      addListener('touchstart');
      
      startAudio();
    };

    playBeachSound();

    // Cleanup when component unmounts or category changes
    return () => {
      stopAudio();
    };
  }, [isBeachCategory, volume]);
};

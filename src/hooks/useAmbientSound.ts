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

// Cache key for storing generated audio in localStorage
const AMBIENT_SOUND_CACHE_KEY = 'beach_ambient_sound_v3';

export const useAutoAmbientSound = (category: string, volume: number = 0.15) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const isGeneratingRef = useRef(false);
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

    const generateAndPlaySound = async () => {
      if (isGeneratingRef.current) return;
      
      // Check if we have cached audio
      const cachedAudio = localStorage.getItem(AMBIENT_SOUND_CACHE_KEY);
      
      if (cachedAudio) {
        console.log('[AmbientSound] Using cached audio');
        playAudioFromUrl(cachedAudio);
        return;
      }

      // Generate new audio using ElevenLabs
      isGeneratingRef.current = true;
      console.log('[AmbientSound] Generating ambient sound with ElevenLabs...');
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ambient-sound`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              prompt: "Immersive tropical paradise beach soundscape: very soft and slow ocean waves gently washing onto sandy shore with a calm rhythmic pattern, multiple seagulls and tropical birds calling and singing throughout, light ocean breeze, distant sound of palm trees rustling, complete beach atmosphere for deep relaxation and meditation, ASMR quality, no harsh sounds",
              duration: 22,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to generate sound: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache the audio as base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          try {
            localStorage.setItem(AMBIENT_SOUND_CACHE_KEY, base64);
            console.log('[AmbientSound] Audio cached successfully');
          } catch (e) {
            console.log('[AmbientSound] Could not cache audio (storage full)');
          }
        };
        reader.readAsDataURL(audioBlob);
        
        playAudioFromUrl(audioUrl);
      } catch (error) {
        console.error('[AmbientSound] Error generating sound:', error);
        // Fallback to local file
        playAudioFromUrl('/sounds/ocean-waves.mp3');
      } finally {
        isGeneratingRef.current = false;
      }
    };

    const playAudioFromUrl = (url: string) => {
      // Stop any existing audio first
      stopAudio();
      
      const audio = new Audio(url);
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

    generateAndPlaySound();

    // Cleanup when component unmounts or category changes
    return () => {
      stopAudio();
    };
  }, [isBeachCategory, volume]);
};

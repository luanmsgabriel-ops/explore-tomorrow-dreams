import { useEffect, useRef, useState } from 'react';

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
const AMBIENT_SOUND_CACHE_KEY = 'beach_ambient_sound';

export const useAutoAmbientSound = (category: string, volume: number = 0.15) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isBeachCategory = checkIsBeachCategory(category);

  useEffect(() => {
    if (!isBeachCategory) {
      return;
    }

    const generateAndPlaySound = async () => {
      // Check if we have cached audio
      const cachedAudio = localStorage.getItem(AMBIENT_SOUND_CACHE_KEY);
      
      if (cachedAudio) {
        console.log('[AmbientSound] Using cached audio');
        playAudioFromUrl(cachedAudio);
        return;
      }

      // Generate new audio using ElevenLabs
      setIsGenerating(true);
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
              prompt: "Calm ocean waves gently rolling onto a tropical beach shore, with distant seagulls calls, peaceful and relaxing ambient sound, no wind noise, crystal clear water sounds",
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
        setIsGenerating(false);
      }
    };

    const playAudioFromUrl = (url: string) => {
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
            document.removeEventListener('click', startAudio);
            document.removeEventListener('scroll', startAudio);
            document.removeEventListener('touchstart', startAudio);
          })
          .catch(() => {
            // Autoplay blocked, will try on user interaction
          });
      };

      audio.addEventListener('canplaythrough', startAudio);
      startAudio();

      document.addEventListener('click', startAudio, { passive: true });
      document.addEventListener('scroll', startAudio, { passive: true });
      document.addEventListener('touchstart', startAudio, { passive: true });
    };

    generateAndPlaySound();

    return () => {
      document.removeEventListener('click', () => {});
      document.removeEventListener('scroll', () => {});
      document.removeEventListener('touchstart', () => {});
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      hasStartedRef.current = false;
    };
  }, [isBeachCategory, volume]);

  return { isGenerating };
};

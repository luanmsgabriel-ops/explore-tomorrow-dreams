import { useEffect, useRef } from 'react';

// Ocean waves ambient sound (royalty-free, loopable)
const OCEAN_SOUND_URL = 'https://cdn.freesound.org/previews/527/527602_2861639-lq.mp3';

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

export const useAutoAmbientSound = (category: string, volume: number = 0.2) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

  const isBeachCategory = checkIsBeachCategory(category);
  
  console.log('[AmbientSound] Category received:', category);
  console.log('[AmbientSound] Is beach category:', isBeachCategory);

  useEffect(() => {
    if (!isBeachCategory) {
      console.log('[AmbientSound] Not a beach category, skipping audio');
      return;
    }
    
    console.log('[AmbientSound] Beach category detected, setting up audio');

    // Create audio element
    const audio = new Audio(OCEAN_SOUND_URL);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const startAudio = () => {
      if (hasStartedRef.current || !audioRef.current) return;
      
      console.log('[AmbientSound] Attempting to play audio...');
      
      audioRef.current.play()
        .then(() => {
          console.log('[AmbientSound] Audio started playing successfully!');
          hasStartedRef.current = true;
          // Remove listeners once playing
          document.removeEventListener('click', startAudio);
          document.removeEventListener('scroll', startAudio);
          document.removeEventListener('touchstart', startAudio);
        })
        .catch((error) => {
          console.log('[AmbientSound] Autoplay blocked, waiting for user interaction:', error.message);
        });
    };

    // Add error and canplay listeners for debugging
    audio.addEventListener('error', (e) => {
      console.error('[AmbientSound] Audio error:', e);
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log('[AmbientSound] Audio loaded and ready to play');
      startAudio();
    });

    // Try to autoplay immediately
    startAudio();

    // If autoplay fails, start on first user interaction
    document.addEventListener('click', startAudio, { once: false, passive: true });
    document.addEventListener('scroll', startAudio, { once: false, passive: true });
    document.addEventListener('touchstart', startAudio, { once: false, passive: true });

    return () => {
      // Cleanup
      document.removeEventListener('click', startAudio);
      document.removeEventListener('scroll', startAudio);
      document.removeEventListener('touchstart', startAudio);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      hasStartedRef.current = false;
    };
  }, [isBeachCategory, volume]);
};

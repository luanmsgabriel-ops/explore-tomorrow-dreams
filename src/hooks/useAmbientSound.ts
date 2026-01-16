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

  useEffect(() => {
    if (!isBeachCategory) {
      return;
    }

    // Create audio element
    const audio = new Audio(OCEAN_SOUND_URL);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const startAudio = () => {
      if (hasStartedRef.current || !audioRef.current) return;
      
      audioRef.current.play()
        .then(() => {
          hasStartedRef.current = true;
          // Remove listeners once playing
          document.removeEventListener('click', startAudio);
          document.removeEventListener('scroll', startAudio);
          document.removeEventListener('touchstart', startAudio);
        })
        .catch(() => {
          // Autoplay blocked, will try again on user interaction
        });
    };

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

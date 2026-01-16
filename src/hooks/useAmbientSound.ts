import { useEffect, useRef, useState } from 'react';

interface UseAmbientSoundOptions {
  category: string;
  autoPlay?: boolean;
  volume?: number;
}

// Ocean waves ambient sound (royalty-free)
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

export const useAmbientSound = ({ category, autoPlay = true, volume = 0.3 }: UseAmbientSoundOptions) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const isBeachCategory = checkIsBeachCategory(category);

  useEffect(() => {
    if (!isBeachCategory) {
      // Stop and cleanup if not a beach destination
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
      return;
    }

    // Create audio element
    const audio = new Audio(OCEAN_SOUND_URL);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Try to autoplay
    if (autoPlay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasUserInteracted(true);
          })
          .catch(() => {
            // Autoplay was prevented, wait for user interaction
            setIsPlaying(false);
          });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
    };
  }, [isBeachCategory, autoPlay, volume]);

  const play = () => {
    if (audioRef.current && isBeachCategory) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasUserInteracted(true);
        })
        .catch(console.error);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return {
    isPlaying,
    isMuted,
    isBeachCategory,
    hasUserInteracted,
    play,
    pause,
    toggle,
    toggleMute,
    setVolume,
  };
};

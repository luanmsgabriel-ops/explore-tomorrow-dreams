import { useEffect, useRef, useState } from 'react';
import clip1 from '@/assets/hero-clip-1.mp4.asset.json';
import clip2 from '@/assets/hero-clip-2.mp4.asset.json';
import clip3 from '@/assets/hero-clip-3.mp4.asset.json';

const CLIPS = [clip1.url, clip2.url, clip3.url];

/**
 * Hero background: cinematic full-bleed video loop cycling through
 * breathtaking destinations. Auto-plays muted, loops seamlessly.
 */
export const HeroCinematicBackground = () => {
  const [index, setIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const current = videoRefs.current[index];
    if (!current) return;
    current.playbackRate = 1.5;
    const handleEnded = () => setIndex((i) => (i + 1) % CLIPS.length);
    current.addEventListener('ended', handleEnded);
    current.play().catch(() => {});
    return () => current.removeEventListener('ended', handleEnded);
  }, [index]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-ocean-deep">
      {CLIPS.map((src, i) => (
        <video
          key={src}
          ref={(el) => (videoRefs.current[i] = el)}
          src={src}
          muted
          playsInline
          autoPlay={i === 0}
          preload={i === 0 ? 'auto' : 'metadata'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 scale-105 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: 'blur(4px)',
            willChange: 'opacity',
            transform: 'translateZ(0) scale(1.05)',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
    </div>
  );
};

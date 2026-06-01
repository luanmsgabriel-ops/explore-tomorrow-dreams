import { useEffect, useRef, useState } from 'react';
import clip1 from '@/assets/hero-clip-1.mp4.asset.json';
import clip2 from '@/assets/hero-clip-2.mp4.asset.json';
import clip3 from '@/assets/hero-clip-3.mp4.asset.json';
import heroMountainBg from '@/assets/hero-mountain-bg.jpg';

/**
 * Cinematic 30s hero background: cycles 3 destination clips with crossfade.
 * Mobile gets a static poster to preserve performance/data.
 */
const CLIPS = [clip1.url, clip2.url, clip3.url];

export const HeroCinematicBackground = () => {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];

  // Detect coarse pointer / small screen — skip video on mobile
  const isMobile = typeof window !== 'undefined' &&
    (window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(pointer: coarse)').matches);

  useEffect(() => {
    if (isMobile) return;
    const v = videoRefs[active].current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    const handleEnded = () => setActive((i) => (i + 1) % CLIPS.length);
    v.addEventListener('ended', handleEnded);
    return () => v.removeEventListener('ended', handleEnded);
  }, [active, isMobile]);

  if (isMobile) {
    return (
      <img
        src={heroMountainBg}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-ocean-deep">
      {/* Poster while first clip loads */}
      <img
        src={heroMountainBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: loaded ? 0 : 1 }}
      />
      {CLIPS.map((src, i) => (
        <video
          key={src}
          ref={videoRefs[i]}
          src={src}
          muted
          autoPlay={i === 0}
          playsInline
          preload="auto"
          onLoadedData={() => i === 0 && setLoaded(true)}
          onCanPlay={() => i === 0 && setLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: active === i ? 1 : 0 }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import heroVideo from '@/assets/hero-destinations-cinematic.mp4.asset.json';

/**
 * Cinematic destination montage as background video.
 * Desktop only — mobile keeps the ambient gradient for performance.
 * Lazy-mounts after first paint so it doesn't hurt LCP.
 */
export const HeroBackgroundVideo = () => {
  const isMobile = useIsMobile();
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    if (isMobile) return;
    // Defer past first paint so it doesn't compete with hero LCP
    const id = window.setTimeout(() => setShouldLoad(true), 600);
    return () => window.clearTimeout(id);
  }, [isMobile]);

  if (isMobile || !shouldLoad) return null;

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-40 animate-fade-in"
        aria-hidden="true"
      >
        <source src={heroVideo.url} type="video/mp4" />
      </video>
      {/* Cinematic overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
    </div>
  );
};

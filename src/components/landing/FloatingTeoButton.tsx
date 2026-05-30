import { Link } from 'react-router-dom';
import { TeoMascot } from '@/components/TeoMascot';
import { useState, useEffect } from 'react';

export const FloatingTeoButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Link
      to="/teo"
      aria-label="Conversar com o Téo"
      className={`fixed bottom-5 right-5 z-40 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <div className="relative">
        {/* Aura glow */}
        <div className="absolute inset-0 -m-2 rounded-full bg-gold-light/30 blur-xl animate-pulse-glow" />

        <div className="relative flex items-center gap-3 pl-2 pr-5 py-2 rounded-full glass-gold shadow-2xl">
          <TeoMascot size="small" animated />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">
              Falar com o Téo
            </span>
            <span className="text-[10px] text-foreground/60 leading-tight">
              responde em segundos
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

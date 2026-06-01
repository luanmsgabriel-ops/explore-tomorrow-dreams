import videoAsset from '@/assets/offers-immersive.mp4.asset.json';

/**
 * Full-bleed cinematic video block — replaces the offers carousel
 * with an immersive, breathtaking visual moment.
 */
export const ImmersiveVideoShowcase = () => {
  return (
    <section className="relative w-full py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10 aspect-[21/9] bg-ocean-deep">
          <video
            src={videoAsset.url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          {/* subtle gradient for legibility of overlaid text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 z-10">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-gold-light/90 font-medium mb-3">
              Sua próxima viagem
            </p>
            <h2 className="font-editorial text-3xl md:text-6xl lg:text-7xl text-white leading-[0.95] max-w-3xl">
              Destinos que <span className="font-editorial-italic italic gradient-text-teal">tiram o fôlego</span>
            </h2>
            <p className="mt-3 md:mt-4 text-white/80 max-w-xl text-sm md:text-base">
              Imagine. Sinta. Embarque. A Tomorrow Travel transforma sonhos em memórias.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

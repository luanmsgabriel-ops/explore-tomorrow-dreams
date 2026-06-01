import heroSwissVillage from '@/assets/hero-swiss-village.jpg';

/**
 * Hero background: cinematic Swiss alpine village with turquoise lake,
 * snow-capped mountains and waterfall.
 */
export const HeroCinematicBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-ocean-deep">
      <img
        src={heroSwissVillage}
        alt=""
        aria-hidden="true"
        decoding="async"
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Subtle dark gradient at the bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
    </div>
  );
};

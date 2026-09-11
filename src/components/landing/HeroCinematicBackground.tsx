export const HeroCinematicBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-ocean-deep">
      <picture aria-hidden="true">
        <source media="(max-width: 639px)" srcSet="/images/home-opportunity-radar-poster-mobile.jpg" />
        <img
          src="/images/home-opportunity-radar-poster-desktop.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      </picture>

      <video
        muted
        playsInline
        autoPlay
        loop
        preload="metadata"
        poster="/images/home-opportunity-radar-poster-desktop.jpg"
        className="absolute inset-0 size-full object-cover motion-reduce:hidden"
        aria-hidden="true"
      >
        <source media="(max-width: 639px)" src="/videos/home-opportunity-radar-mobile.mp4" type="video/mp4" />
        <source src="/videos/home-opportunity-radar-desktop.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

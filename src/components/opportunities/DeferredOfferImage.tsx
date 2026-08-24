import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

interface DeferredOfferImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  fallbackSrc?: string;
  eager?: boolean;
}

export function DeferredOfferImage({
  src,
  fallbackSrc,
  eager = false,
  className,
  onLoad,
  onError,
  ...props
}: DeferredOfferImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [activeSrc, setActiveSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setActiveSrc(src);
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (eager || shouldLoad) return;
    const element = imageRef.current;
    if (!element) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [eager, shouldLoad]);

  return (
    <img
      ref={imageRef}
      src={shouldLoad ? activeSrc : undefined}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "low"}
      className={`${className ?? ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`.trim()}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        if (fallbackSrc && activeSrc !== fallbackSrc) {
          setLoaded(false);
          setActiveSrc(fallbackSrc);
          return;
        }
        onError?.(event);
      }}
      {...props}
    />
  );
}

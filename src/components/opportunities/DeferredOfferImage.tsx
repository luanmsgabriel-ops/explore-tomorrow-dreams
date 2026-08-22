import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

interface DeferredOfferImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  eager?: boolean;
}

export function DeferredOfferImage({ src, eager = false, ...props }: DeferredOfferImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);

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
      src={shouldLoad ? src : undefined}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "low"}
      {...props}
    />
  );
}

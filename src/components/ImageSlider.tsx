import { useRef, useState } from "react";

type Slide = { url: string; alt: string };

export function ImageSlider({ images, className = "" }: { images: Slide[]; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className={`aspect-square w-full rounded-2xl bg-muted ${className}`} />;
  }

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(images.length - 1, index)));
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={className}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <img
            key={`${image.url}-${index}`}
            src={image.url}
            alt={image.alt}
            width={800}
            height={800}
            loading={index === 0 ? "eager" : "lazy"}
            className="aspect-square w-full flex-none snap-center object-cover"
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={`dot-${image.url}-${index}`}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === active ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

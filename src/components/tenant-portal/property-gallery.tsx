"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Building2, Expand, X } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/utils";

type GalleryImage = { url: string; caption?: string | null };

export function PropertyGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted text-muted-foreground">
        <Building2 className="size-12" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((image, i) => (
            <CarouselItem key={i}>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="View image fullscreen"
                className="group relative block aspect-video w-full overflow-hidden rounded-xl border bg-muted"
              >
                <SafeImage
                  src={image.url}
                  alt={image.caption || `${title} — image ${i + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 768px"
                  className="object-cover"
                  priority={i === 0}
                />
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Expand className="size-3.5" /> Expand
                </span>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
            <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
              {selected + 1} / {images.length}
            </span>
          </>
        )}
      </Carousel>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={i}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === selected}
              className={cn(
                "relative aspect-video h-16 shrink-0 overflow-hidden rounded-lg border bg-muted transition",
                i === selected
                  ? "ring-2 ring-primary ring-offset-1"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <SafeImage
                src={image.url}
                alt={image.caption || `${title} thumbnail ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      <DialogPrimitive.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none sm:p-10">
            <DialogPrimitive.Title className="sr-only">
              {title} — image gallery
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              aria-label="Close"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
            <Carousel
              className="w-full max-w-5xl"
              opts={{ startIndex: selected }}
            >
              <CarouselContent>
                {images.map((image, i) => (
                  <CarouselItem key={i}>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <SafeImage
                        src={image.url}
                        alt={image.caption || `${title} — image ${i + 1}`}
                        fill
                        sizes="100vw"
                        className="object-contain"
                      />
                    </div>
                    {image.caption && (
                      <p className="mt-2 text-center text-sm text-white/80">
                        {image.caption}
                      </p>
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 border-none bg-white/10 text-white hover:bg-white/20" />
                  <CarouselNext className="right-2 border-none bg-white/10 text-white hover:bg-white/20" />
                </>
              )}
            </Carousel>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

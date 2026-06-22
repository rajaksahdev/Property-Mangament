"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function PropertyCarousel({
  images,
  title,
}: {
  images: { url: string; caption?: string | null }[];
  title: string;
}) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted text-muted-foreground">
        <Building2 className="size-12" />
      </div>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {images.map((image, i) => (
          <CarouselItem key={i}>
            <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
              <Image
                src={image.url}
                alt={image.caption || `${title} — image ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 768px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </>
      )}
    </Carousel>
  );
}

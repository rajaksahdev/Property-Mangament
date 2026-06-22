"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PropertyPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefForPage(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefForPage(page - 1)}>
            <ChevronLeft /> Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft /> Previous
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefForPage(page + 1)}>
            Next <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next <ChevronRight />
        </Button>
      )}
    </div>
  );
}

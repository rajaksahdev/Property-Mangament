import { z } from "zod";

import { PROPERTY_TYPES } from "./property";

export const BOOKING_INTENTS = ["BOOK", "INQUIRY"] as const;

export const createBookingSchema = z.object({
  intent: z.enum(BOOKING_INTENTS),
  message: z.string().trim().max(1000).optional(),
});
export type CreateBookingValues = z.infer<typeof createBookingSchema>;

// ---------------------------------------------------------------------------
// Public listing filters (tenant browse) — all via URL searchParams.
// ---------------------------------------------------------------------------
export const LISTING_PAGE_SIZE = 9;

export const listingFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type ListingFilters = z.infer<typeof listingFilterSchema>;

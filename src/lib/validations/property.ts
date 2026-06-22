import { z } from "zod";

export const PROPERTY_TYPES = [
  "FLAT",
  "OFFICE",
  "LAND",
  "RESORT",
  "SOCIETY",
] as const;

export const PROPERTY_STATUSES = [
  "VACANT",
  "OCCUPIED",
  "MAINTENANCE",
] as const;

export const propertyImageSchema = z.object({
  url: z.url("Each image must be a valid URL."),
  caption: z.string().trim().max(120).optional(),
  isPrimary: z.boolean().optional(),
});

export type PropertyImageInput = z.infer<typeof propertyImageSchema>;

/**
 * The canonical property shape, shared by the client form (react-hook-form)
 * and the create/update server actions. Numbers are stored as numbers in the
 * form (the inputs convert via valueAsNumber), so no coercion is needed.
 */
const propertyFields = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120),
  type: z.enum(PROPERTY_TYPES, { message: "Select a property type." }),
  status: z.enum(PROPERTY_STATUSES, { message: "Select a status." }),
  address: z.string().trim().min(5, "Enter a full address.").max(240),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  rent: z
    .number({ message: "Enter the monthly rent." })
    .positive("Rent must be greater than 0.")
    .max(99_999_999),
  deposit: z
    .number({ message: "Enter the deposit." })
    .min(0, "Deposit can't be negative.")
    .max(99_999_999),
  areaSqft: z
    .number({ message: "Enter the area." })
    .int("Area must be a whole number.")
    .positive("Area must be greater than 0.")
    .max(100_000_000),
  amenities: z.array(z.string().trim().min(1)).max(30),
  description: z.string().trim().max(2000).optional(),
  images: z.array(propertyImageSchema).max(12),
});

// The form/action schema additionally requires a map pin (lat + lng).
export const propertyFormSchema = propertyFields.refine(
  (data) => data.lat !== null && data.lng !== null,
  { message: "Drop a pin on the map to set the location.", path: ["lat"] },
);

// Inferred from the base object so lat/lng stay `number | null` for the form.
export type PropertyFormValues = z.infer<typeof propertyFields>;

// ---------------------------------------------------------------------------
// List filters (parsed from URL searchParams).
// ---------------------------------------------------------------------------
export const PROPERTY_PAGE_SIZE = 9;

export const propertyFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export type PropertyFilters = z.infer<typeof propertyFilterSchema>;

// ---------------------------------------------------------------------------
// Presigned upload request (file type + size validated server-side).
// ---------------------------------------------------------------------------
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const presignUploadSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z
    .string()
    .refine(
      (v) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(v),
      "Only JPEG, PNG, WebP, or GIF images are allowed.",
    ),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, "Images must be 5MB or smaller."),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

import { z } from "zod";

const requiredDate = z
  .string()
  .min(1, "Required.")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date.");

const assignTenantFields = z.object({
  tenantEmail: z.email("Enter a valid email."),
  tenantName: z.string().trim().max(80).optional(),
  startDate: requiredDate,
  endDate: z.string().optional(),
  monthlyRent: z
    .number({ message: "Enter the monthly rent." })
    .positive("Rent must be greater than 0.")
    .max(99_999_999),
  dueDay: z
    .number({ message: "Enter the rent due day." })
    .int()
    .min(1, "Due day is 1–31.")
    .max(31, "Due day is 1–31."),
  deposit: z
    .number({ message: "Enter the deposit." })
    .min(0, "Deposit can't be negative.")
    .max(99_999_999),
  agreementUrl: z.string().optional(),
});

export const assignTenantSchema = assignTenantFields.refine(
  (data) =>
    !data.endDate ||
    data.endDate.trim() === "" ||
    Date.parse(data.endDate) > Date.parse(data.startDate),
  { message: "End date must be after the start date.", path: ["endDate"] },
);

export type AssignTenantValues = z.infer<typeof assignTenantFields>;

// ---------------------------------------------------------------------------
// Notes & documents
// ---------------------------------------------------------------------------
export const noteSchema = z.object({
  body: z.string().trim().min(1, "Note can't be empty.").max(2000),
});
export type NoteValues = z.infer<typeof noteSchema>;

export const DOCUMENT_KINDS = ["AGREEMENT", "ID_PROOF", "OTHER"] as const;

export const documentMetaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.url(),
  kind: z.enum(DOCUMENT_KINDS),
  leaseId: z.string().optional(),
});
export type DocumentMetaValues = z.infer<typeof documentMetaSchema>;

// ---------------------------------------------------------------------------
// Tenant list filters
// ---------------------------------------------------------------------------
export const TENANT_PAGE_SIZE = 10;

export const tenantFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  propertyId: z.string().optional(),
  lease: z.enum(["active", "inactive"]).optional(),
  dues: z.enum(["yes"]).optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type TenantFilters = z.infer<typeof tenantFilterSchema>;

// ---------------------------------------------------------------------------
// Document upload presign (PDF + images, 10MB)
// ---------------------------------------------------------------------------
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const presignDocumentSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z
    .string()
    .refine(
      (v) => (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(v),
      "Only PDF, JPEG, PNG, or WebP files are allowed.",
    ),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_DOCUMENT_BYTES, "Files must be 10MB or smaller."),
});
export type PresignDocumentInput = z.infer<typeof presignDocumentSchema>;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Plus, X } from "lucide-react";

import {
  propertyFormSchema,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type PropertyFormValues,
} from "@/lib/validations/property";
import { createProperty, updateProperty } from "@/lib/actions/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "./image-uploader";

const TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  FLAT: "Flat",
  OFFICE: "Office",
  LAND: "Land",
  RESORT: "Resort",
  SOCIETY: "Society",
};

const STATUS_LABELS: Record<(typeof PROPERTY_STATUSES)[number], string> = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
};

// The Leaflet map touches `window`, so load it client-only.
const MapPicker = dynamic(
  () => import("./map-picker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded-lg border bg-muted" />
    ),
  },
);

type NumericField = "rent" | "deposit" | "areaSqft";

export function PropertyForm({
  propertyId,
  defaultValues,
}: {
  propertyId?: string;
  defaultValues?: Partial<PropertyFormValues>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [amenityDraft, setAmenityDraft] = useState("");

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      type: undefined,
      status: "VACANT",
      address: "",
      lat: null,
      lng: null,
      rent: undefined,
      deposit: undefined,
      areaSqft: undefined,
      amenities: [],
      description: "",
      images: [],
      ...defaultValues,
    },
  });

  const lat = form.watch("lat");
  const lng = form.watch("lng");
  const amenities = form.watch("amenities");
  const images = form.watch("images");

  function numberHandler(field: NumericField) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const el = event.target;
      form.setValue(field, el.value === "" ? (undefined as never) : el.valueAsNumber, {
        shouldValidate: form.formState.isSubmitted,
      });
    };
  }

  function addAmenity() {
    const trimmed = amenityDraft.trim();
    if (!trimmed) return;
    if (!amenities.includes(trimmed)) {
      form.setValue("amenities", [...amenities, trimmed], {
        shouldValidate: true,
      });
    }
    setAmenityDraft("");
  }

  function removeAmenity(name: string) {
    form.setValue(
      "amenities",
      amenities.filter((a) => a !== name),
      { shouldValidate: true },
    );
  }

  async function onSubmit(values: PropertyFormValues) {
    setServerError(null);
    const result = propertyId
      ? await updateProperty(propertyId, values)
      : await createProperty(values);

    // On success the action redirects; only failures return here.
    if (result?.error) setServerError(result.error);
    if (result?.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.[0]) {
          form.setError(field as keyof PropertyFormValues, {
            message: messages[0],
          });
        }
      }
    }
  }

  const isSubmitting = form.formState.isSubmitting;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Basic details */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="2BHK Riverside Flat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROPERTY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="12 Marine Drive, Mumbai, MH 400020" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing & size */}
        <div className="grid gap-6 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="rent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly rent (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="45000"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={numberHandler("rent")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="135000"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={numberHandler("deposit")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="areaSqft"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area (sq ft)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="950"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={numberHandler("areaSqft")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Amenities */}
        <FormField
          control={form.control}
          name="amenities"
          render={() => (
            <FormItem>
              <FormLabel>Amenities</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={amenityDraft}
                  onChange={(e) => setAmenityDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                  placeholder="Parking, Lift, Gym…"
                />
                <Button type="button" variant="secondary" onClick={addAmenity}>
                  <Plus /> Add
                </Button>
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="gap-1">
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="ml-0.5 rounded-full hover:text-destructive"
                        aria-label={`Remove ${amenity}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Sunlit 2BHK with a sea-facing balcony…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Location / map */}
        <FormField
          control={form.control}
          name="lat"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="size-4" /> Location
              </FormLabel>
              <FormDescription>
                Click on the map to drop a pin and set the coordinates.
              </FormDescription>
              <MapPicker
                lat={lat}
                lng={lng}
                onChange={(nextLat, nextLng) => {
                  form.setValue("lat", nextLat, { shouldValidate: true });
                  form.setValue("lng", nextLng, { shouldValidate: true });
                }}
              />
              <p className="text-sm text-muted-foreground">
                {lat !== null && lng !== null
                  ? `Pinned at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                  : "No location set yet."}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Images */}
        <FormField
          control={form.control}
          name="images"
          render={() => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormDescription>
                The first image is used as the primary/cover photo.
              </FormDescription>
              <ImageUploader
                value={images}
                onChange={(next) =>
                  form.setValue("images", next, { shouldValidate: true })
                }
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/properties")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {propertyId ? "Save changes" : "Create property"}
          </Button>
        </div>
      </form>
    </Form>
  );
}


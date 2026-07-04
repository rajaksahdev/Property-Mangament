"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { createPresignedAvatarUrl } from "@/lib/actions/upload";
import { updateProfileAction } from "@/lib/actions/profile";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/validations/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function ProfileForm({
  name: initialName,
  email,
  avatarUrl: initialAvatar,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const presign = await createPresignedAvatarUrl({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      if (!presign.ok) {
        toast.error(presign.error);
        return;
      }
      const res = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) {
        toast.error("Upload failed. Please try again.");
        return;
      }
      setAvatarUrl(presign.publicUrl);
      toast.success("Photo uploaded — remember to save.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    startSaving(async () => {
      const result = await updateProfileAction({ name, avatarUrl });
      if (result.error) {
        toast.error(result.error);
      } else if (result.fieldErrors?.name?.[0]) {
        toast.error(result.fieldErrors.name[0]);
      } else {
        toast.success("Profile saved.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback className="text-lg">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={onPickFile}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UploadCloud />
              )}
              {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAvatarUrl(null)}
                disabled={uploading}
              >
                <Trash2 /> Remove
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-name">Display name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={email} disabled readOnly />
          <p className="text-xs text-muted-foreground">
            Your email can&apos;t be changed here.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || uploading || !name.trim()}>
            {saving && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

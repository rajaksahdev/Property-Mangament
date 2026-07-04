import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

// Note: fonts are defined as system stacks in globals.css (--font-sans /
// --font-geist-mono) rather than next/font/google, so the app builds and runs
// without network access.

export const metadata: Metadata = {
  title: "Property Manager",
  description: "Property rental management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

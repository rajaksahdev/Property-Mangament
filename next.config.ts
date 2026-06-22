import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * Next.js' hydration bootstrap and Recharts/Tailwind use inline scripts/styles,
 * so 'unsafe-inline' is required without a per-request nonce; dev additionally
 * needs 'unsafe-eval' for React Refresh. `connect-src`/`img-src` allow the R2
 * presigned-PUT uploads and OpenStreetMap/Leaflet tiles + image hosts.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `connect-src 'self' https:${isDev ? " ws: wss:" : ""}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `worker-src 'self' blob:`,
  ...(isDev ? [] : [`upgrade-insecure-requests`]),
]
  .join("; ")
  .concat(";");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Keep native / driver packages out of the bundle so they load from node_modules
  // at runtime (argon2 ships a platform-specific .node binary; pg is a Node driver).
  serverExternalPackages: [
    "@node-rs/argon2",
    "@prisma/adapter-pg",
    "pg",
    "@react-pdf/renderer",
    "exceljs",
    "@react-email/render",
    "@react-email/components",
  ],
  images: {
    // Hosts allowed for next/image. R2 public bucket + seed placeholders.
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Custom R2 domain (set R2_PUBLIC_HOST to your bucket's public hostname).
      ...(process.env.R2_PUBLIC_HOST
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.R2_PUBLIC_HOST,
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

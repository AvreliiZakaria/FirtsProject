/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Trend preview images uploaded to Supabase Storage by the admin.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Serve locally stored uploads (user selfies + generated results).
  // The async headers() function keeps this config Edge-compatible so
  // `next build` doesn't warn about a sync function.
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;

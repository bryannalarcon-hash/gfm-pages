/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PGlite ships wasm + a data bundle it loads via fs at runtime; bundling it mangles those
  // paths. Keep it (and pg) external so server modules require them from node_modules directly.
  experimental: {
    serverComponentsExternalPackages: ['@electric-sql/pglite', 'pg'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.gofundme.com' },
      { protocol: 'https', hostname: 'd2g8igdw686xgo.cloudfront.net' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  // No green CTA on white, no real-time LLM on request path — enforced by lint/tests, not config.
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    // Local dev: proxy API calls to the FastAPI backend.
    // On Vercel the backend is deployed as serverless functions, so this is dev-only.
    if (process.env.NODE_ENV !== 'production') {
      const target = process.env.BACKEND_URL || 'http://127.0.0.1:9002'
      return [{ source: '/api/:path*', destination: `${target}/api/:path*` }]
    }
    return []
  },
};

module.exports = nextConfig;

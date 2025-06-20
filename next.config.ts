
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['https://*.cloudworkstations.dev'],

  experimental: {
    turbo: {
      resolveAlias: {
        // The aliases for Node.js built-ins were breaking server-side execution
        // of Genkit's API calls. They have been removed to allow the server to function.
      },
    },
  },
};

export default nextConfig;

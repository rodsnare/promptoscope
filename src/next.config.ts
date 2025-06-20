
import type {NextConfig} from 'next';
import type {Configuration as WebpackConfiguration} from 'webpack';
// path import removed as it wasn't used. Re-add if needed.

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
        // Client-side polyfills are handled by the webpack config below.
      },
    },
  },

  webpack: (config: WebpackConfiguration, { isServer }) => {
    if (!isServer) {
      // Standard webpack fallback for when not using Turbopack
      // Prevent specified Node.js modules from being bundled on the client
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        dns: false,
        fs: false, // This ensures 'fs' is not bundled on the client for Webpack
        "fs/promises": false, // This ensures 'fs/promises' is not bundled on the client for Webpack
        http2: false,
        net: false,
        tls: false,
        express: false,
        perf_hooks: false,
      };
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;

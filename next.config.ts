
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
        // Keeping these as they were added to resolve client-side bundling issues
        'dns': './src/lib/empty-module.js',
        // 'fs': './src/lib/empty-module.js', // REMOVED to allow server-side access
        // 'fs/promises': './src/lib/empty-module.js', // REMOVED to allow server-side access
        'http2': './src/lib/empty-module.js',
        // 'node:fs': './src/lib/empty-module.js', // REMOVED to allow server-side access
        'node:net': './src/lib/empty-module.js',
        'net': './src/lib/empty-module.js',
        'tls': './src/lib/empty-module.js',
        'express': './src/lib/empty-module.js',
        'node:perf_hooks': './src/lib/empty-module.js',
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

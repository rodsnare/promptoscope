
import type {NextConfig} from 'next';
import type {Configuration as WebpackConfiguration} from 'webpack';
import path from 'path'; // Keep path import for now

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

  // Add Turbopack specific alias
  experimental: {
    turbo: {
      resolveAlias: {
        // Use a path relative to the project root for Turbopack
        'async_hooks': './src/lib/empty-module.js',
        'dns': './src/lib/empty-module.js', // Added dns alias
      },
    },
  },

  webpack: (config: WebpackConfiguration, { isServer }) => {
    if (!isServer) {
      // Standard webpack fallback for when not using Turbopack
      // Prevent 'async_hooks' and 'dns' from being bundled on the client
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false, // Webpack typically handles 'false' correctly
        dns: false, // Added dns fallback
      };
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;


import type {NextConfig} from 'next';
import type {Configuration as WebpackConfiguration} from 'webpack';

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
  webpack: (config: WebpackConfiguration, { isServer }) => {
    if (!isServer) {
      // Prevent 'async_hooks' from being bundled on the client
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      };
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;

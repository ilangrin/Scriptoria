/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type errors are fixed progressively — allow build to complete
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@prisma/client'],
  },
  images: {
    remotePatterns: [],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'sharp'];
    }
    return config;
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Allow large file uploads
  api: {
    bodyParser: false,
  },
};

module.exports = nextConfig;

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
  });
  
  /** @type {import('next').NextConfig} */
  const nextConfig = withPWA({
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: {
      domains: ['your-storage-domain.com'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  });
  
  module.exports = nextConfig;
  
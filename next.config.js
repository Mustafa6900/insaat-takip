const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
  });
  
  /** @type {import('next').NextConfig} */
  const nextConfig = {
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
    pwa: {
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development'
    }
  };
  
  const withPWA = require('next-pwa')(nextConfig);
  
  module.exports = withPWA;
  
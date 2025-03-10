const withPWA = require('next-pwa');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-storage-domain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  }
};

// PWA yapılandırmasını ayrı bir obje olarak tanımlayalım
const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
};

// eslint yapılandırmasını PWA yapılandırmasından ayıralım
module.exports = {
  ...withPWA(pwaConfig),
  eslint: {
    ignoreDuringBuilds: true,
  },
  ...nextConfig
};
  
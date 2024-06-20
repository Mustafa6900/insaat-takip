const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
  });
  
  /** @type {import('next').NextConfig} */
  const nextConfig = withPWA({
    // Diğer Next.js yapılandırmalarınızı buraya ekleyebilirsiniz
  });
  
  module.exports = nextConfig;
  
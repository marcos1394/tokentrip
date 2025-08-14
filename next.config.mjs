import 'dotenv/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
experimental: {
    scrollRestoration: true,
  },
images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aggregator.testnet.walrus.atalma.io',
      },
      // Puedes añadir otros aggregators aquí si quieres
    ],
  },
    
};

export default nextConfig;

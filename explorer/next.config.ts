import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/play',
        destination: '/workshop',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

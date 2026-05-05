import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@testea/db',
    '@testea/fetch-kit',
    '@testea/lib',
    '@testea/ui',
    '@testea/util',
  ],
};

export default nextConfig;

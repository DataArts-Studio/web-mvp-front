import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion', 'lucide-react', '@supabase/supabase-js'],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['exceljs'],
  images: {
    localPatterns: [
      { pathname: '/**', search: '' },
      { pathname: '/landing/**', search: '?v=20261113' },
      { pathname: '/landing/**', search: '?v=20261112-2' },
      { pathname: '/landing/**', search: '?v=20261112' },
    ],
  },
};

export default nextConfig;

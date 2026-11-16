import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/**', search: '' },
      { pathname: '/landing/capAgenda.png', search: '?v=20261113' },
      { pathname: '/landing/capCanchas.png', search: '?v=20261113' },
      { pathname: '/landing/capTarifas.png', search: '?v=20261112-2' },
      { pathname: '/landing/capClientes.png', search: '?v=20261112' },
      { pathname: '/landing/capReportesFinanciero.png', search: '?v=20261112' },
    ],
    qualities: [75, 90, 100],
  },
  serverExternalPackages: ['exceljs'],
};

export default nextConfig;

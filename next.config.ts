import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const dashboardReadPaths = ['/dashboard/stats', '/marketing-performance', '/marketing-performance/summary'];

export default function config(phase: string): NextConfig {
  const hosted = process.env.VERCEL === '1';
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const configuredOrigin = configuredUrl ? new URL(configuredUrl) : undefined;
  const isLocalApi = configuredOrigin && ['localhost', '127.0.0.1', '[::1]'].includes(configuredOrigin.hostname);
  const backend = (configuredUrl && !isLocalApi ? configuredUrl : 'https://content-calendar-backend.vercel.app').replace(/\/$/, '');
  const apiBase = backend.endsWith('/api') ? backend : backend + '/api';

  return {
    distDir: hosted || phase === PHASE_DEVELOPMENT_SERVER ? '.next' : '.next-build',
    env: { NEXT_PUBLIC_API_READ_REWRITES: hosted ? '1' : '0' },
    async headers() {
      return hosted ? [{
        source: '/backend-read/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'x-vercel-enable-rewrite-caching', value: '0' },
        ],
      }] : [];
    },
    async rewrites() {
      return hosted ? dashboardReadPaths.map(path => ({
        source: '/backend-read' + path,
        destination: apiBase + path,
      })) : [];
    },
  };
}

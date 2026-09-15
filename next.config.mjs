/**
 * Domain yang boleh menyematkan FIND di dalam <iframe>.
 * Isi lewat environment variable ALLOWED_FRAME_ANCESTORS, dipisah spasi.
 * Contoh untuk SharePoint:
 *   'self' https://tanoto.sharepoint.com
 * Bila tidak diisi, hanya domain aplikasi sendiri yang boleh menyematkan.
 */
const frameAncestors = (process.env.ALLOWED_FRAME_ANCESTORS || "'self'").trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // frame-ancestors menggantikan X-Frame-Options dan mendukung daftar domain.
          { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ];
  }
};

export default nextConfig;

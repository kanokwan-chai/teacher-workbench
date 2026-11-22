/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse', 'mammoth', 'pdfjs-dist'],
  turbopack: {},
};

export default nextConfig;

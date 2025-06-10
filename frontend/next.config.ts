/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: true },
  output: 'standalone',
  images: { unoptimized: true },
};

export default nextConfig;

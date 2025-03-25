/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['a2vibe.s3.amazonaws.com'],
  },
  output: 'standalone',
  distDir: '.next',
}

export default nextConfig


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'your-deployment-domain.com'],
  },
}

module.exports = nextConfig
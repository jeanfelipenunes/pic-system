/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'ldapjs', 'nodemailer', 'node-cron'],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;

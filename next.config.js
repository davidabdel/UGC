/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_KIE_API_KEY: process.env.KIE_API_KEY,
    NEXT_PUBLIC_KIE_API_BASE: process.env.KIE_API_BASE,
  },
};

module.exports = nextConfig;

const withPWA = require('next-pwa')({
  dest: 'public',                                // Outputs service workers to your public asset folder
  disable: process.env.NODE_ENV === 'development', // Keeps hot-reloading fast in local development mode
  register: true,                                // Auto-registers service workers on user browser load hits
  skipWaiting: true,                             // Forces background updates to take effect immediately
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,                           // FIXED: Stops the compiler from looking for a server to process images
  },
};

module.exports = withPWA(nextConfig);
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.CLEANWISE_PREVIEW === "1" ? ".next-invitation-preview" : ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;

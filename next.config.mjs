/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  serverExternalPackages: [
    "discord.js",
    "zlib-sync",
    "@discordjs/opus",
    "sodium-native",
    "bufferutil",
    "utf-8-validate",
  ],
};

export default nextConfig;

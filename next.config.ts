import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Aumenta el límite a 10 MB (ajusta según tus necesidades)
    },
  },
};

export default nextConfig;

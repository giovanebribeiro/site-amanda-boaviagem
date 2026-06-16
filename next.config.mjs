/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Alias removed @nextui-org/react (v1) to @heroui/react (v2) so that
    // legacy components in pages/components/ compile until they are removed
    // in Phase 1 and Phase 2.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@nextui-org/react": "@heroui/react",
    };
    return config;
  },
};

export default nextConfig;

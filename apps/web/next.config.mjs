/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the built app is plain HTML/JS served by the Hono server.
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@shifts/shared"],
  reactStrictMode: true,
  devIndicators: { buildActivity: false, appIsrStatus: false },
};

export default nextConfig;

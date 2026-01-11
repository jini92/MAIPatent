/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/MAIPatent',
  assetPrefix: '/MAIPatent/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;

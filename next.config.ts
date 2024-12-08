import type { NextConfig } from 'next/dist/server/config';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    HUGGINGFACE_INFERENCE_TOKEN: process.env.HUGGINGFACE_INFERENCE_TOKEN,
  },
};

export default nextConfig;

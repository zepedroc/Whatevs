import type { NextConfig } from 'next/dist/server/config';

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },
  env: {
    HUGGINGFACE_INFERENCE_TOKEN: process.env.HUGGINGFACE_INFERENCE_TOKEN,
  },
};

export default withNextIntl(nextConfig);

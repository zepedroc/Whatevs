/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    HUGGINGFACE_INFERENCE_TOKEN: process.env.HUGGINGFACE_INFERENCE_TOKEN,
  },
};

module.exports = nextConfig;

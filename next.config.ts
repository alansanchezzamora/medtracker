import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The AWS SDK (Textract provider) is a large server-only package; keep it external.
  serverExternalPackages: ["@aws-sdk/client-textract"],
  experimental: {
    // Prescription photos from a phone are commonly 2-5 MB; the default
    // Server Action body limit is 1 MB. Keep some headroom for multipart overhead.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

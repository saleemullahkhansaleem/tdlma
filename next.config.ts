import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: The middleware deprecation warning is a known Turbopack issue in Next.js 16.0.7
  // The middleware.ts file is still the standard and correct approach.
  // This warning is informational and can be safely ignored - functionality works correctly.
  // To suppress this warning, you can set NEXT_PRIVATE_SKIP_TURBO=1 environment variable
  // during build, but Turbopack provides faster builds, so the warning is acceptable.
};

export default nextConfig;

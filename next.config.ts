import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this project when a parent directory also has a lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

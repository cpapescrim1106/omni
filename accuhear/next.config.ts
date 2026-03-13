import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "iris.taila6f62d.ts.net",
    "http://iris.taila6f62d.ts.net",
    "http://iris.taila6f62d.ts.net:3000",
    "http://iris.taila6f62d.ts.net:4000",
    "http://iris.taila6f62d.ts.net:4010",
    "https://iris.taila6f62d.ts.net",
    "https://iris.taila6f62d.ts.net:3000",
    "https://iris.taila6f62d.ts.net:4000",
    "https://iris.taila6f62d.ts.net:4010",
    "maximus.taila6f62d.ts.net",
    "https://maximus.taila6f62d.ts.net",
    "https://maximus.taila6f62d.ts.net:4000",
    "https://maximus.taila6f62d.ts.net:4010",
  ],
};

export default nextConfig;

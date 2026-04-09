import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitHash() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

function getBuildNumber() {
  try {
    return execSync("git rev-list --count HEAD").toString().trim();
  } catch {
    return "0";
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require("./package.json");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.219.121"],
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_HASH: getGitHash(),
    NEXT_PUBLIC_BUILD_NUMBER: getBuildNumber(),
  },
};

export default nextConfig;

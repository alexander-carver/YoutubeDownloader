import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		outputFileTracingIncludes: {
			"src/app/api/download/route.ts": ["./yt-dlp"],
		},
	},
};

export default nextConfig;

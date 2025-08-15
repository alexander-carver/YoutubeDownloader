import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	outputFileTracingIncludes: {
		"src/app/api/download/route.ts": ["./yt-dlp"],
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'X-Robots-Tag', value: 'index, follow' },
				],
			},
		];
	},
};

export default nextConfig;

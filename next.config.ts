import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	outputFileTracingIncludes: {
		// App Router key
		"src/app/api/download/route.ts": ["./yt-dlp", "./yt-dlp-linux", "./yt-dlp-macos"],
		// Build sometimes uses absolute app path keys; include both for safety
		"app/api/download/route.ts": ["./yt-dlp", "./yt-dlp-linux", "./yt-dlp-macos"],
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

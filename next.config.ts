import type { NextConfig } from "next";



const nextConfig: NextConfig = {
	experimental: {
		outputFileTracingIncludes: {
			// App Router key
			"src/app/api/download/route.ts": ["./yt-dlp*", "src/app/api/download/yt-dlp*"],
			// Build sometimes uses absolute app path keys; include both for safety
			"app/api/download/route.ts": ["./yt-dlp*", "src/app/api/download/yt-dlp*"],
		},
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

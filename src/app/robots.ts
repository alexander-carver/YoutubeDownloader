export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://freevideosdownloader.com/sitemap.xml',
  } as const;
}



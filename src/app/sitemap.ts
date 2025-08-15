export default function sitemap() {
  const base = 'https://freevideosdownloader.com';
  return [
    { url: `${base}/`, lastModified: new Date() },
  ] as const;
}



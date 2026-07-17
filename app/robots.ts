import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://framebydb.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin', // Keep admin backend unindexed
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

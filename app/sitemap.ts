import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://framebydb.com'; // Production URL

  const routes = [
    '',
    '/about',
    '/services',
    '/portfolio',
    '/gallery',
    '/pricing',
    '/blog',
    '/faq',
    '/contact',
    '/book',
    '/client-portal'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8
  }));

  return routes;
}

import { MetadataRoute } from 'next';
import { getAppBaseUrl } from '@/lib/app-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',           // API routes not for crawling
          '/_next/*',         // Next.js internals
          '/static/*',        // Static assets handled separately
        ],
      },
      {
        userAgent: 'GPTBot',  // OpenAI's crawler
        disallow: '/',        // Opt out of AI training
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',  // Google's AI training bot
        disallow: '/',
      },
      {
        userAgent: 'CCBot',    // Common Crawl (used for AI training)
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',  // Claude's crawler
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

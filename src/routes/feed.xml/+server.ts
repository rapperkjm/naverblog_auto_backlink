import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/server/posts';
import { getSiteConfig } from '$lib/server/config';
import { escapeXml, toBacklinkUrl } from '$lib/server/xml';

export const GET: RequestHandler = async () => {
  const config = getSiteConfig();
  const posts = (await getAllPosts()).slice(0, 30);

  const items = posts
    .map((post) => {
      const link = toBacklinkUrl(config.siteOrigin, post.blogId, post.logNo);
      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(link)}</link>
    <guid>${escapeXml(link)}</guid>
    ${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ''}
    <description>${escapeXml(post.descriptionText ?? '')}</description>
  </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(config.siteTitle)}</title>
  <link>${escapeXml(config.siteOrigin)}</link>
  <description>${escapeXml(config.siteDescription)}</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

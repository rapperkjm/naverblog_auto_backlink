import type { RequestHandler } from './$types';
import { getAllPosts } from '$lib/server/posts';
import { getSiteConfig } from '$lib/server/config';
import { escapeXml } from '$lib/server/xml';

export const GET: RequestHandler = async () => {
	const config = getSiteConfig();
	const posts = (await getAllPosts()).slice(0, 50);

	const items = posts
		.map((post) => {
			const pubDate = post.publishedAt
				? new Date(post.publishedAt).toUTCString()
				: new Date().toUTCString();

			return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(post.url)}</link>
    <guid isPermaLink="true">${escapeXml(post.url)}</guid>
    <pubDate>${escapeXml(pubDate)}</pubDate>
    <description>${escapeXml(`${post.title} 네이버 블로그 원문 링크`)}</description>
  </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- posts: ${posts.length} -->
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
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
};

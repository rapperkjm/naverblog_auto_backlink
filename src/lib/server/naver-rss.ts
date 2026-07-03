import { XMLParser } from 'fast-xml-parser';
import type { NaverPost } from './types';
import { stripHtml, toNaverPostUrl } from './xml';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractLogNo(link: string): string | null {
  const match = String(link).match(/\/(\d{6,})(?:\?|$)/);
  return match?.[1] ?? null;
}

function normalizeDate(value: unknown): string | undefined {
  const date = new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function fetchNaverRssPosts(blogId: string): Promise<NaverPost[]> {
  const rssUrl = `https://rss.blog.naver.com/${encodeURIComponent(blogId)}.xml`;
  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 NaverBlogBacklinkHub/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`RSS 요청 실패: ${blogId} ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const items = asArray(parsed?.rss?.channel?.item);

  return items
    .map((item: any): NaverPost | null => {
      const link = String(item.link ?? '');
      const logNo = extractLogNo(link);
      if (!logNo) return null;

      const description = String(item.description ?? '');
      return {
        blogId,
        logNo,
        title: String(item.title ?? '제목 없음'),
        url: toNaverPostUrl(blogId, logNo),
        description,
        descriptionText: stripHtml(description),
        publishedAt: normalizeDate(item.pubDate),
        source: 'rss'
      };
    })
    .filter((post): post is NaverPost => Boolean(post));
}

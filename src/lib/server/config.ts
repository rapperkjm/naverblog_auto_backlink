import { env } from '$env/dynamic/private';
import type { SiteConfig } from './types';

const DEFAULT_SITE_ORIGIN = 'http://localhost:5173';
const DEFAULT_SITE_TITLE = '네이버 블로그 링크 허브';
const DEFAULT_SITE_DESCRIPTION = '네이버 블로그 글을 구글이 발견할 수 있도록 돕는 개인용 링크 허브입니다.';

function splitBlogIds(value: string | undefined): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getSiteConfig(): SiteConfig {
  return {
    siteOrigin: (env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN).replace(/\/$/, ''),
    siteTitle: env.SITE_TITLE || DEFAULT_SITE_TITLE,
    siteDescription: env.SITE_DESCRIPTION || DEFAULT_SITE_DESCRIPTION,
    blogIds: splitBlogIds(env.NAVER_BLOG_IDS)
  };
}

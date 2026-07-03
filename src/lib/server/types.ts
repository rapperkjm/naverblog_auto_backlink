export type NaverPostSource = 'rss' | 'manual' | 'generated' | 'fallback';

export type NaverPost = {
  blogId: string;
  logNo: string;
  title: string;
  url: string;
  description?: string;
  descriptionText?: string;
  publishedAt?: string;
  source: NaverPostSource;
};

export type SiteConfig = {
  siteOrigin: string;
  siteTitle: string;
  siteDescription: string;
  blogIds: string[];
};

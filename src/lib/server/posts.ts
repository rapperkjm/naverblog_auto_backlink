import generatedPosts from './generated-posts.json';
import { manualPosts } from './manual-posts';
import { getSiteConfig } from './config';
import { fetchNaverRssPosts } from './naver-rss';
import type { NaverPost } from './types';

function keyOf(post: Pick<NaverPost, 'blogId' | 'logNo'>): string {
  return `${post.blogId}:${post.logNo}`;
}

function sortByPublishedAtDesc(posts: NaverPost[]): NaverPost[] {
  return [...posts].sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bt - at;
  });
}

export async function getAllPosts(): Promise<NaverPost[]> {
  const config = getSiteConfig();
  const merged = new Map<string, NaverPost>();

  for (const post of generatedPosts as NaverPost[]) {
    merged.set(keyOf(post), { ...post, source: post.source ?? 'generated' });
  }

  for (const post of manualPosts) {
    merged.set(keyOf(post), post);
  }

  const rssResults = await Promise.allSettled(config.blogIds.map((blogId) => fetchNaverRssPosts(blogId)));
  for (const result of rssResults) {
    if (result.status !== 'fulfilled') continue;
    for (const post of result.value) {
      merged.set(keyOf(post), post);
    }
  }

  return sortByPublishedAtDesc([...merged.values()]);
}

export async function getPost(blogId: string, logNo: string): Promise<NaverPost | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.blogId === blogId && post.logNo === logNo);
}

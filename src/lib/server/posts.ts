import generatedPostsRaw from './generated-posts.json';
import { getSiteConfig } from './config';
import { manualPosts } from './manual-posts';
import { fetchNaverRssPosts } from './naver-rss';
import type { NaverPost } from './types';

const generatedPosts = generatedPostsRaw as NaverPost[];

export function getStoredPosts(): NaverPost[] {
	const merged = mergePosts([...generatedPosts, ...manualPosts]);

	return sortByPublishedAtDesc(merged);
}

export async function getAllPosts(): Promise<NaverPost[]> {
	const { blogIds } = getSiteConfig();
	const rssResults = await Promise.allSettled(
		blogIds.map((blogId) => fetchNaverRssPosts(blogId))
	);

	const rssPosts = rssResults.flatMap((result) => {
		if (result.status === 'fulfilled') {
			return result.value;
		}

		console.error(result.reason);
		return [];
	});

	const merged = mergePosts([
		...generatedPosts,
		...manualPosts,
		...rssPosts
	]);

	return sortByPublishedAtDesc(merged);
}

export async function getPost(
	blogId: string,
	logNo: string
): Promise<NaverPost | undefined> {
	const posts = await getAllPosts();

	return posts.find(
		(post) => post.blogId === blogId && post.logNo === logNo
	);
}

function sortByPublishedAtDesc(posts: NaverPost[]): NaverPost[] {
	return [...posts].sort((a, b) => {
		const aTime = a.publishedAt
			? new Date(a.publishedAt).getTime()
			: 0;
		const bTime = b.publishedAt
			? new Date(b.publishedAt).getTime()
			: 0;

		return bTime - aTime;
	});
}

function mergePosts(posts: NaverPost[]): NaverPost[] {
	const map = new Map<string, NaverPost>();

	for (const post of posts) {
		const key = `${post.blogId}:${post.logNo}`;
		const previous = map.get(key);

		if (!previous) {
			map.set(key, post);
			continue;
		}

		const previousPriority = getSourcePriority(previous.source);
		const nextPriority = getSourcePriority(post.source);

		if (nextPriority >= previousPriority) {
			map.set(key, {
				...previous,
				...post
			});
		}
	}

	return [...map.values()];
}

function getSourcePriority(source: NaverPost['source']): number {
	switch (source) {
		case 'manual':
			return 3;
		case 'rss':
			return 2;
		case 'generated':
			return 1;
		case 'fallback':
			return 0;
		default:
			return 0;
	}
}

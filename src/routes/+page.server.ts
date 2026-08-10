import {
	getArchiveTotalPages,
	POSTS_PER_ARCHIVE_PAGE
} from '$lib/server/archive-pagination';
import { getSiteConfig } from '$lib/server/config';
import { getAllPosts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const config = getSiteConfig();
	const posts = await getAllPosts();

	return {
		siteTitle: config.siteTitle,
		siteDescription: config.siteDescription,
		totalCount: posts.length,
		totalPages: getArchiveTotalPages(posts.length),
		posts: posts.slice(0, POSTS_PER_ARCHIVE_PAGE)
	};
};

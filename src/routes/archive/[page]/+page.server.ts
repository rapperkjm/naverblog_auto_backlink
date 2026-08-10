import { error, redirect } from '@sveltejs/kit';
import {
	getArchivePageRange,
	getArchiveTotalPages
} from '$lib/server/archive-pagination';
import { getSiteConfig } from '$lib/server/config';
import { getStoredPosts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = ({ params }) => {
	if (!/^\d+$/.test(params.page)) {
		error(404, '존재하지 않는 아카이브 페이지입니다.');
	}

	const currentPage = Number(params.page);

	if (!Number.isSafeInteger(currentPage) || currentPage < 1) {
		error(404, '존재하지 않는 아카이브 페이지입니다.');
	}

	if (currentPage === 1) {
		redirect(308, '/');
	}

	const config = getSiteConfig();
	const allPosts = getStoredPosts();
	const totalCount = allPosts.length;
	const totalPages = getArchiveTotalPages(totalCount);

	if (currentPage > totalPages) {
		error(404, '존재하지 않는 아카이브 페이지입니다.');
	}

	const { start, end } = getArchivePageRange(currentPage);
	const posts = allPosts.slice(start, end);

	return {
		siteTitle: config.siteTitle,
		pageTitle:
			`네이버 블로그 글 아카이브 ${currentPage}페이지 | ${config.siteTitle}`,
		pageDescription:
			`등록된 네이버 블로그 글 ${start + 1}번째부터 ` +
			`${Math.min(end, totalCount)}번째까지 확인할 수 있습니다.`,
		canonicalUrl: `${config.siteOrigin}/archive/${currentPage}`,
		currentPage,
		totalPages,
		totalCount,
		rangeStart: start + 1,
		rangeEnd: Math.min(end, totalCount),
		posts
	};
};

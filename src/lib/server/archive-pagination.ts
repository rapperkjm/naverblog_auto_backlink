export const POSTS_PER_ARCHIVE_PAGE = 100;

export function getArchiveTotalPages(totalCount: number): number {
	return Math.max(1, Math.ceil(totalCount / POSTS_PER_ARCHIVE_PAGE));
}

export function getArchivePageRange(page: number): {
	start: number;
	end: number;
} {
	const start = (page - 1) * POSTS_PER_ARCHIVE_PAGE;

	return {
		start,
		end: start + POSTS_PER_ARCHIVE_PAGE
	};
}

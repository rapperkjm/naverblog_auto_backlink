<script lang="ts">
	import { resolve } from '$app/paths';

	type PaginationItem = number | 'ellipsis';

	let {
		currentPage,
		totalPages
	}: {
		currentPage: number;
		totalPages: number;
	} = $props();

	let paginationItems = $derived(
		buildPaginationItems(currentPage, totalPages)
	);

	function pageHref(page: number): string {
		if (page === 1) {
			return resolve('/');
		}

		return resolve('/archive/[page]', {
			page: String(page)
		});
	}

	function buildPaginationItems(
		current: number,
		total: number
	): PaginationItem[] {
		const pageSet = new Set<number>([
			1,
			total,
			current - 2,
			current - 1,
			current,
			current + 1,
			current + 2
		]);

		const pages = [...pageSet]
			.filter((page) => page >= 1 && page <= total)
			.sort((a, b) => a - b);

		const items: PaginationItem[] = [];

		for (let index = 0; index < pages.length; index += 1) {
			const page = pages[index];
			const previousPage = pages[index - 1];

			if (
				index > 0 &&
				previousPage != null &&
				page - previousPage > 1
			) {
				items.push('ellipsis');
			}

			items.push(page);
		}

		return items;
	}
</script>

{#if totalPages > 1}
	<nav class="pagination" aria-label="글 목록 페이지">
		{#if currentPage > 1}
			<a class="page-link" href={pageHref(currentPage - 1)} rel="prev">
				← 이전
			</a>
		{/if}

		{#each paginationItems as item}
			{#if item === 'ellipsis'}
				<span class="ellipsis">…</span>
			{:else if item === currentPage}
				<span class="page-current" aria-current="page">
					{item}
				</span>
			{:else}
				<a class="page-link" href={pageHref(item)}>
					{item}
				</a>
			{/if}
		{/each}

		{#if currentPage < totalPages}
			<a class="page-link" href={pageHref(currentPage + 1)} rel="next">
				다음 →
			</a>
		{/if}
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 30px;
	}

	.page-link,
	.page-current {
		display: inline-flex;
		min-width: 40px;
		min-height: 40px;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		border-radius: 10px;
		font-size: 0.9rem;
		font-weight: 700;
	}

	.page-link {
		border: 1px solid #cbd5e1;
		color: #334155;
		background: #ffffff;
		text-decoration: none;
	}

	.page-link:hover,
	.page-link:focus-visible {
		border-color: #2563eb;
		color: #174ea6;
		background: #eff6ff;
	}

	.page-current {
		border: 1px solid #174ea6;
		color: #ffffff;
		background: #174ea6;
	}

	.ellipsis {
		padding: 0 3px;
		color: #94a3b8;
	}
</style>

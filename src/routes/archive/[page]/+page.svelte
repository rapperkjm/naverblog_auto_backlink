<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import Pagination from '$lib/components/Pagination.svelte';
	import PostList from '$lib/components/PostList.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.pageTitle}</title>
	<meta name="description" content={data.pageDescription} />
	<link rel="canonical" href={data.canonicalUrl} />
</svelte:head>

<main class="page">
	<section class="archive">
		<a class="back" href={resolve('/')}>
			← 최신 글로 돌아가기
		</a>

		<header>
			<p class="eyebrow">Naver Blog Archive</p>
			<h1>네이버 블로그 글 아카이브</h1>
			<p class="page-count">
				{data.currentPage} / {data.totalPages} 페이지
			</p>
			<p class="summary">
				총 {data.totalCount}개 글 중 {data.rangeStart}~{data.rangeEnd}번째 글을 표시합니다.
			</p>
		</header>

		<PostList posts={data.posts} />

		<Pagination
			currentPage={data.currentPage}
			totalPages={data.totalPages}
		/>

		<footer>
			<a href={resolve('/')}>홈</a>
			<span aria-hidden="true">·</span>
			<a href={asset('/sitemap.xml')}>sitemap.xml</a>
		</footer>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: #f8fafc;
		color: #0f172a;
	}

	.page {
		width: min(900px, calc(100% - 32px));
		margin: 0 auto;
		padding: 48px 0;
	}

	.archive {
		padding: 28px;
		border: 1px solid #e2e8f0;
		border-radius: 24px;
		background: #ffffff;
		box-shadow: 0 10px 30px rgb(15 23 42 / 0.06);
	}

	.back,
	footer a {
		color: #174ea6;
		font-weight: 750;
		text-decoration: none;
	}

	.back:hover,
	.back:focus-visible,
	footer a:hover,
	footer a:focus-visible {
		text-decoration: underline;
	}

	header {
		margin: 28px 0 22px;
	}

	.eyebrow {
		margin: 0 0 8px;
		color: #174ea6;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 2.7rem);
	}

	.page-count {
		margin: 14px 0 0;
		font-weight: 750;
	}

	.summary {
		margin: 8px 0 0;
		color: #64748b;
		line-height: 1.6;
	}

	footer {
		display: flex;
		gap: 9px;
		margin-top: 34px;
		padding-top: 20px;
		border-top: 1px solid #e2e8f0;
		color: #64748b;
		font-size: 0.9rem;
	}
</style>

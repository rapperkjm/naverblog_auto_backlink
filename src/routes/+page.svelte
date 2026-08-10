<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import Pagination from '$lib/components/Pagination.svelte';
	import PostList from '$lib/components/PostList.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.siteTitle}</title>
	<meta name="description" content={data.siteDescription} />
</svelte:head>

<main class="page">
	<section class="hero">
		<p class="eyebrow">Naver Blog Link Hub</p>
		<h1>{data.siteTitle}</h1>
		<p>{data.siteDescription}</p>

		<div class="actions">
			<a href={asset('/sitemap.xml')}>sitemap.xml 보기</a>
			<a href={resolve('/feed.xml')}>feed.xml 보기</a>
			<a href={asset('/robots.txt')}>robots.txt 보기</a>
		</div>
	</section>

	<section class="posts">
		<h2>최근 등록된 네이버 블로그 글</h2>
		<p class="summary">
			총 {data.totalCount}개 글 중 최근 {data.posts.length}개를 표시합니다.
		</p>

		<PostList posts={data.posts} />

		<Pagination currentPage={1} totalPages={data.totalPages} />
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

	.hero,
	.posts {
		padding: 28px;
		border: 1px solid #e2e8f0;
		border-radius: 24px;
		background: #ffffff;
		box-shadow: 0 10px 30px rgb(15 23 42 / 0.06);
	}

	.hero + .posts {
		margin-top: 24px;
	}

	.eyebrow {
		margin: 0 0 8px;
		color: #174ea6;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0 0 12px;
		font-size: clamp(2rem, 5vw, 3rem);
	}

	h2 {
		margin: 0;
		font-size: 1.45rem;
	}

	.hero > p:last-of-type,
	.summary {
		color: #64748b;
		line-height: 1.65;
	}

	.summary {
		margin: 10px 0 18px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 20px;
	}

	.actions a {
		padding: 9px 12px;
		border-radius: 10px;
		color: #174ea6;
		background: #eff6ff;
		font-weight: 750;
		text-decoration: none;
	}

	.actions a:hover,
	.actions a:focus-visible {
		text-decoration: underline;
	}
</style>

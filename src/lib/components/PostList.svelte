<script lang="ts">
	import type { NaverPost } from '$lib/server/types';

	let {
		posts
	}: {
		posts: NaverPost[];
	} = $props();

	function formatDate(value?: string): string {
		if (!value) {
			return '';
		}

		const date = new Date(value);

		return Number.isNaN(date.getTime())
			? ''
			: date.toLocaleString('ko-KR');
	}
</script>

{#if posts.length === 0}
	<p class="empty">등록된 글이 없습니다.</p>
{:else}
	<ul class="post-list">
		{#each posts as post (`${post.blogId}:${post.logNo}`)}
			<li class="post-card">
				<a
					class="post-title"
					href={post.url}
					target="_blank"
					rel="external noopener noreferrer"
				>
					{post.title}
				</a>

				<div class="meta">
					<span>{post.blogId}</span>
					<span aria-hidden="true">·</span>
					<span>{post.logNo}</span>
					<span aria-hidden="true">·</span>
					<span>{post.source}</span>
				</div>

				{#if formatDate(post.publishedAt)}
					<time class="published" datetime={post.publishedAt}>
						{formatDate(post.publishedAt)}
					</time>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.post-list {
		display: grid;
		gap: 14px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.post-card {
		padding: 18px;
		border: 1px solid #dbe4f0;
		border-radius: 16px;
		background: #ffffff;
	}

	.post-title {
		color: #174ea6;
		font-size: 1.05rem;
		font-weight: 750;
		line-height: 1.45;
		text-decoration: none;
	}

	.post-title:hover,
	.post-title:focus-visible {
		text-decoration: underline;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
		color: #64748b;
		font-size: 0.875rem;
	}

	.published {
		display: block;
		margin-top: 5px;
		color: #64748b;
		font-size: 0.875rem;
	}

	.empty {
		color: #64748b;
	}
</style>

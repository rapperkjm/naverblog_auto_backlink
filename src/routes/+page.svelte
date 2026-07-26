<script lang="ts">
  import { base, resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.siteTitle}</title>
  <meta name="description" content={data.siteDescription} />
</svelte:head>

<main class="page">
  <section class="hero">
    <p class="eyebrow">Naver Blog Backlink Hub</p>
    <h1>{data.siteTitle}</h1>
    <p>{data.siteDescription}</p>
    <div class="actions">
      <a href={`${base}/sitemap.xml`}>sitemap.xml 보기</a>
      <a href={resolve('/feed.xml')}>feed.xml 보기</a>
      <a href={`${base}/robots.txt`}>robots.txt 보기</a>
    </div>
  </section>

  <section class="posts">
    <h2>최근/수집 글 {data.totalCount}개</h2>
    {#if data.posts.length === 0}
      <p>아직 수집된 글이 없습니다. <code>npm run sync:naver</code>를 실행하세요.</p>
    {:else}
      <ul>
        {#each data.posts as post}
          <li>
            <a href={resolve(`/nb/${post.blogId}/${post.logNo}`)}>{post.title}</a>
            <p>{post.descriptionText}</p>
            <small>{post.blogId} · {post.logNo} · {post.source}</small>
          </li>
        {/each}
      </ul>
    {/if}
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
    width: min(960px, calc(100% - 32px));
    margin: 0 auto;
    padding: 48px 0;
  }

  .hero,
  .posts {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    padding: 28px;
    box-shadow: 0 10px 30px rgb(15 23 42 / 0.06);
  }

  .hero + .posts {
    margin-top: 24px;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #2563eb;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0 0 12px;
    font-size: clamp(2rem, 5vw, 3rem);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }

  .actions a,
  .posts a {
    color: #2563eb;
    font-weight: 700;
  }

  ul {
    display: grid;
    gap: 14px;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
  }

  li p {
    margin: 8px 0;
    color: #475569;
  }

  small {
    color: #64748b;
  }
</style>

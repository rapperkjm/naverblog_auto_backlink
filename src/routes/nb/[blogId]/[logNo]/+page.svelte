<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let post = $derived(data.post);
</script>

<svelte:head>
  <title>{post.title} | {data.siteTitle}</title>
  <meta name="description" content={post.descriptionText || '네이버 블로그 원문으로 연결되는 백링크 페이지입니다.'} />
  <link rel="canonical" href={post.url} />
</svelte:head>

<main class="page">
  <a class="back" href={resolve('/')}>← 목록으로 돌아가기</a>

  <article>
    <p class="eyebrow">Naver Blog Backlink</p>
    <h1>{post.title}</h1>
    {#if post.descriptionText}
      <p class="description">{post.descriptionText}</p>
    {/if}

    <dl>
      <div><dt>블로그 ID</dt><dd>{post.blogId}</dd></div>
      <div><dt>글 번호</dt><dd>{post.logNo}</dd></div>
      <div><dt>수집 경로</dt><dd>{post.source}</dd></div>
      {#if post.publishedAt}
        <div><dt>발행일</dt><dd>{new Date(post.publishedAt).toLocaleDateString('ko-KR')}</dd></div>
      {/if}
    </dl>

    <a class="button" href={post.url} target="_blank" rel="external noopener noreferrer">
      네이버 블로그 원문 보기
    </a>
  </article>
</main>

<style>
  .page {
    width: min(840px, calc(100% - 32px));
    margin: 0 auto;
    padding: 48px 0;
  }

  .back {
    color: #2563eb;
    font-weight: 700;
    text-decoration: none;
  }

  article {
    margin-top: 16px;
    padding: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    background: white;
    box-shadow: 0 10px 30px rgb(15 23 42 / 0.06);
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #2563eb;
    font-weight: 700;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 5vw, 2.7rem);
  }

  .description {
    margin: 18px 0 24px;
    color: #475569;
    line-height: 1.7;
  }

  dl {
    display: grid;
    gap: 10px;
    margin: 0 0 28px;
  }

  dl div {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 12px;
  }

  dt {
    color: #64748b;
    font-weight: 700;
  }

  dd {
    margin: 0;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 18px;
    border-radius: 999px;
    background: #2563eb;
    color: white;
    font-weight: 800;
    text-decoration: none;
  }
</style>

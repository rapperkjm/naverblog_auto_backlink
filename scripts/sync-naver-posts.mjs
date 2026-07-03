import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(rootDir, 'src', 'lib', 'server', 'generated-posts.json');
const blogIds = String(process.env.NAVER_BLOG_IDS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const PAGE_SIZE = 30;
const MAX_EMPTY_PAGES = 2;
const MAX_PAGES_PER_BLOG = Number(process.env.NAVER_MAX_PAGES_PER_BLOG || 1000);

function decodeNaverText(value) {
  const text = String(value ?? '');
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return text;
  }
}

function repairInvalidJsonEscapes(text) {
  return String(text).replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
}

function parseNaverJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return JSON.parse(repairInvalidJsonEscapes(text));
  }
}

function normalizeDate(value) {
  const text = decodeNaverText(value).trim();
  if (!text || /전$/.test(text)) return undefined;

  const isoLike = text.replace(/\./g, '-').replace(/\s+/g, ' ');
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toNaverPostUrl(blogId, logNo) {
  return `https://blog.naver.com/${encodeURIComponent(blogId)}/${encodeURIComponent(logNo)}`;
}

function toPost(blogId, item) {
  const logNo = String(item.logNo ?? item.logno ?? item.log_no ?? '').trim();
  if (!logNo) return null;

  return {
    blogId,
    logNo,
    title: decodeNaverText(item.title ?? item.postTitle ?? item.subject ?? '제목 없음'),
    url: toNaverPostUrl(blogId, logNo),
    descriptionText: decodeNaverText(item.briefContents ?? item.contents ?? ''),
    publishedAt: normalizeDate(item.addDate ?? item.postAddDate ?? item.date),
    source: 'generated'
  };
}

async function fetchPostListPage(blogId, page) {
  const url = new URL('https://blog.naver.com/PostTitleListAsync.naver');
  url.searchParams.set('blogId', blogId);
  url.searchParams.set('viewdate', '');
  url.searchParams.set('currentPage', String(page));
  url.searchParams.set('categoryNo', '0');
  url.searchParams.set('parentCategoryNo', '');
  url.searchParams.set('countPerPage', String(PAGE_SIZE));

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 NaverBlogBacklinkHub/1.0',
      Accept: 'application/json,text/plain,*/*'
    }
  });

  if (!response.ok) {
    throw new Error(`네이버 글 목록 요청 실패: ${blogId} page=${page} status=${response.status}`);
  }

  const text = await response.text();
  const parsed = parseNaverJsonResponse(text);
  return Array.isArray(parsed.postList) ? parsed.postList : [];
}

async function readExistingPosts() {
  try {
    return JSON.parse(await readFile(outputPath, 'utf-8'));
  } catch {
    return [];
  }
}

function mergePosts(existing, incoming) {
  const map = new Map();
  for (const post of existing) {
    if (post?.blogId && post?.logNo) map.set(`${post.blogId}:${post.logNo}`, post);
  }
  for (const post of incoming) {
    if (post?.blogId && post?.logNo) map.set(`${post.blogId}:${post.logNo}`, post);
  }

  return [...map.values()].sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bt - at;
  });
}

async function syncBlog(blogId) {
  const posts = [];
  let emptyPages = 0;

  for (let page = 1; page <= MAX_PAGES_PER_BLOG; page += 1) {
    const list = await fetchPostListPage(blogId, page);
    if (list.length === 0) {
      emptyPages += 1;
      if (emptyPages >= MAX_EMPTY_PAGES) break;
      continue;
    }

    emptyPages = 0;
    for (const item of list) {
      const post = toPost(blogId, item);
      if (post) posts.push(post);
    }

    console.log(`${blogId} page ${page}: ${list.length} item(s)`);
  }

  return posts;
}

if (blogIds.length === 0) {
  console.error('NAVER_BLOG_IDS가 비어 있습니다. .env 또는 GitHub Secrets를 확인하세요.');
  process.exit(1);
}

const existing = await readExistingPosts();
const incoming = [];

for (const blogId of blogIds) {
  const posts = await syncBlog(blogId);
  incoming.push(...posts);
}

const merged = mergePosts(existing, incoming);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');

console.log(`Saved ${merged.length} post(s) to ${outputPath}`);

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const staticDir = join(rootDir, 'static');
const sitemapsDir = join(staticDir, 'sitemaps');
const generatedPostsPath = join(rootDir, 'src', 'lib', 'server', 'generated-posts.json');

const siteOrigin = String(process.env.SITE_ORIGIN || 'https://your-project.vercel.app').replace(/\/$/, '');
const chunkSize = Math.max(1, Number(process.env.SITEMAP_CHUNK_SIZE || 1000));

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toBacklinkUrl(post) {
  return `${siteOrigin}/nb/${encodeURIComponent(post.blogId)}/${encodeURIComponent(post.logNo)}`;
}

function uniquePosts(posts) {
  const map = new Map();
  for (const post of posts) {
    if (!post?.blogId || !post?.logNo) continue;
    map.set(`${post.blogId}:${post.logNo}`, post);
  }
  return [...map.values()];
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length ? chunks : [[]];
}

function buildUrlSet(posts) {
  const urls = posts
    .map((post) => {
      const lastmod = post.publishedAt ? `\n    <lastmod>${escapeXml(post.publishedAt.slice(0, 10))}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(toBacklinkUrl(post))}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildSitemapIndex(fileNames) {
  const items = fileNames
    .map(
      (fileName) =>
        `  <sitemap>\n    <loc>${escapeXml(`${siteOrigin}/sitemaps/${fileName}`)}</loc>\n  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`;
}

const generatedPosts = JSON.parse(await readFile(generatedPostsPath, 'utf-8'));
const posts = uniquePosts(generatedPosts);
const chunks = chunk(posts, chunkSize);
const fileNames = chunks.map((_, index) => `sitemap-${index + 1}.xml`);

await mkdir(staticDir, { recursive: true });
await rm(sitemapsDir, { recursive: true, force: true });
await mkdir(sitemapsDir, { recursive: true });

await Promise.all(
  chunks.map((postsInChunk, index) => writeFile(join(sitemapsDir, fileNames[index]), buildUrlSet(postsInChunk)))
);
await writeFile(join(staticDir, 'sitemap.xml'), buildSitemapIndex(fileNames));
await writeFile(join(staticDir, 'robots.txt'), buildRobotsTxt());

console.log(`Generated ${fileNames.length} sitemap file(s) for ${posts.length} post(s).`);
console.log(`Sitemap index: ${siteOrigin}/sitemap.xml`);

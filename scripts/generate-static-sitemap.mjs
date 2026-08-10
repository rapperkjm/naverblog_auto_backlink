import {
	mkdir,
	readFile,
	rm,
	writeFile
} from 'node:fs/promises';
import { join } from 'node:path';

const projectRoot = process.cwd();
const staticDir = join(projectRoot, 'static');
const ARCHIVE_PAGE_SIZE = 100;

async function loadLocalEnv() {
	try {
		const envText = await readFile(join(projectRoot, '.env'), 'utf8');

		for (const rawLine of envText.split(/\r?\n/)) {
			const line = rawLine.trim();

			if (!line || line.startsWith('#')) {
				continue;
			}

			const separatorIndex = line.indexOf('=');

			if (separatorIndex < 1) {
				continue;
			}

			const key = line.slice(0, separatorIndex).trim();
			let value = line.slice(separatorIndex + 1).trim();

			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}

			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	} catch {
		// Vercel/GitHub Actions에서는 등록된 환경변수를 사용합니다.
	}
}

function escapeXml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function getLatestLastmod(posts) {
	const latestTimestamp = posts.reduce((latest, post) => {
		const timestamp = Date.parse(post?.publishedAt ?? '');

		if (Number.isNaN(timestamp)) {
			return latest;
		}

		return Math.max(latest, timestamp);
	}, 0);

	return latestTimestamp > 0
		? new Date(latestTimestamp).toISOString()
		: null;
}

await loadLocalEnv();

const siteOrigin = String(process.env.SITE_ORIGIN ?? '').replace(/\/+$/, '');

if (!siteOrigin) {
	throw new Error('SITE_ORIGIN 환경변수가 필요합니다.');
}

const postsPath = join(
	projectRoot,
	'src',
	'lib',
	'server',
	'generated-posts.json'
);

let posts = [];

try {
	const postsText = await readFile(postsPath, 'utf8');
	const parsed = JSON.parse(postsText);

	if (Array.isArray(parsed)) {
		posts = parsed;
	}
} catch (error) {
	console.warn('generated-posts.json을 읽지 못했습니다.');
	console.warn(error);
}

const sortedPosts = [...posts].sort((a, b) => {
	const aTime = Date.parse(a?.publishedAt ?? '');
	const bTime = Date.parse(b?.publishedAt ?? '');
	const normalizedATime = Number.isNaN(aTime) ? 0 : aTime;
	const normalizedBTime = Number.isNaN(bTime) ? 0 : bTime;

	return normalizedBTime - normalizedATime;
});

const totalPages = Math.max(
	1,
	Math.ceil(sortedPosts.length / ARCHIVE_PAGE_SIZE)
);

const sitePages = [
	{
		url: `${siteOrigin}/`,
		lastmod: getLatestLastmod(sortedPosts.slice(0, ARCHIVE_PAGE_SIZE))
	}
];

for (let page = 2; page <= totalPages; page += 1) {
	const start = (page - 1) * ARCHIVE_PAGE_SIZE;
	const pagePosts = sortedPosts.slice(start, start + ARCHIVE_PAGE_SIZE);

	sitePages.push({
		url: `${siteOrigin}/archive/${page}`,
		lastmod: getLatestLastmod(pagePosts)
	});
}

const sitemapXml =
	`<?xml version="1.0" encoding="UTF-8"?>\n` +
	`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
	sitePages
		.map(
			(page) =>
				`\t<url>\n` +
				`\t\t<loc>${escapeXml(page.url)}</loc>` +
				(page.lastmod
					? `\n\t\t<lastmod>${escapeXml(page.lastmod)}</lastmod>`
					: '') +
				`\n\t</url>`
		)
		.join('\n') +
	`\n</urlset>\n`;

const robotsText =
	`User-agent: *\n` +
	`Allow: /\n\n` +
	`Sitemap: ${siteOrigin}/sitemap.xml\n`;

await mkdir(staticDir, { recursive: true });

await rm(join(staticDir, 'sitemaps'), {
	recursive: true,
	force: true
});

await writeFile(join(staticDir, 'sitemap.xml'), sitemapXml, 'utf8');
await writeFile(join(staticDir, 'robots.txt'), robotsText, 'utf8');

console.log(`Generated sitemap for ${sitePages.length} listing page(s).`);
console.log(`Stored posts: ${sortedPosts.length}`);
console.log(`Archive pages: ${Math.max(0, totalPages - 1)}`);
console.log(`Sitemap: ${siteOrigin}/sitemap.xml`);

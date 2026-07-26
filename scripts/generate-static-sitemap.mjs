import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const projectRoot = process.cwd();
const staticDir = join(projectRoot, 'static');

/**
 * 로컬 실행 시 프로젝트 루트의 .env 값을 간단히 읽습니다.
 * Vercel/GitHub Actions에서는 이미 등록된 환경변수를 우선 사용합니다.
 */
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
		// .env가 없는 배포 환경에서는 등록된 환경변수를 사용합니다.
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

await loadLocalEnv();

const siteOrigin = String(process.env.SITE_ORIGIN ?? '').replace(/\/+$/, '');

if (!siteOrigin) {
	throw new Error('SITE_ORIGIN 환경변수가 필요합니다.');
}

/**
 * 검색결과에 남길 Vercel 허브 페이지만 넣습니다.
 * 리디렉션되는 /nb/... 주소는 넣지 않습니다.
 *
 * 이후 /blog/rapperkjm/1 같은 고유한 목록 페이지를 만들면
 * 이 배열에 추가할 수 있습니다.
 */
const siteUrls = [`${siteOrigin}/`];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${siteUrls
	.map(
		(url) => `\t<url>
\t\t<loc>${escapeXml(url)}</loc>
\t</url>`
	)
	.join('\n')}
</urlset>
`;

const robotsText = `User-agent: *
Allow: /

Sitemap: ${siteOrigin}/sitemap.xml
`;

await mkdir(staticDir, { recursive: true });

// 기존 분할 sitemap에는 /nb/... 주소가 들어 있으므로 제거합니다.
await rm(join(staticDir, 'sitemaps'), {
	recursive: true,
	force: true
});

await writeFile(join(staticDir, 'sitemap.xml'), sitemapXml, 'utf8');
await writeFile(join(staticDir, 'robots.txt'), robotsText, 'utf8');

console.log(`Generated sitemap for ${siteUrls.length} hub page(s).`);
console.log(`Sitemap: ${siteOrigin}/sitemap.xml`);
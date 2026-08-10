import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(
	rootDir,
	'src',
	'lib',
	'server',
	'generated-posts.json'
);

await loadLocalEnv();

const blogIds = String(process.env.NAVER_BLOG_IDS || '')
	.split(',')
	.map((item) => item.trim())
	.filter(Boolean);

const PAGE_SIZE = 30;
const INCREMENTAL_MAX_PAGES = Number(
	process.env.NAVER_INCREMENTAL_MAX_PAGES || 5
);
const KNOWN_PAGE_STOP_COUNT = Number(
	process.env.NAVER_KNOWN_PAGE_STOP_COUNT || 2
);
const FULL_MAX_PAGES = Number(
	process.env.NAVER_MAX_PAGES_PER_BLOG || 1000
);

const fullSyncRequested =
	process.argv.includes('--full') ||
	process.env.NAVER_FULL_SYNC === '1';

const rssParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text'
});

if (blogIds.length === 0) {
	console.error(
		'NAVER_BLOG_IDS가 비어 있습니다. .env 또는 GitHub Variables를 확인하세요.'
	);
	process.exit(1);
}

const existingPosts = await readExistingPosts();
const useFullSync = fullSyncRequested || existingPosts.length === 0;

console.log(
	useFullSync
		? '전체 동기화 모드로 실행합니다.'
		: 'RSS 기반 증분 동기화 모드로 실행합니다.'
);
console.log(`기존 저장 글: ${existingPosts.length}개`);

const incomingPosts = [];

for (const blogId of blogIds) {
	const posts = useFullSync
		? await syncBlogFull(blogId)
		: await syncBlogIncremental(blogId, existingPosts);

	incomingPosts.push(...posts);
}

const mergedPosts = useFullSync
	? mergePosts([], incomingPosts)
	: mergePosts(existingPosts, incomingPosts);

const previousKeys = new Set(existingPosts.map(keyOf));
const addedCount = mergedPosts.filter(
	(post) => !previousKeys.has(keyOf(post))
).length;

const nextJson = `${JSON.stringify(mergedPosts, null, 2)}\n`;
const previousJson = await readExistingText();

await mkdir(dirname(outputPath), { recursive: true });

if (previousJson === nextJson) {
	console.log('변경된 글이 없습니다.');
} else {
	await writeFile(outputPath, nextJson, 'utf-8');
	console.log(
		`${addedCount}개의 새 글을 추가하거나 기존 글 정보를 갱신했습니다.`
	);
}

console.log(`최종 저장 글: ${mergedPosts.length}개`);
console.log(`저장 위치: ${outputPath}`);

async function syncBlogIncremental(blogId, existingPosts) {
	console.log(`\n[${blogId}] 증분 동기화 시작`);

	const existingKeys = new Set(
		existingPosts
			.filter((post) => post.blogId === blogId)
			.map(keyOf)
	);

	const rssPosts = await fetchRssPostsSafely(blogId);
	const knownKeys = new Set(existingKeys);

	for (const post of rssPosts) {
		knownKeys.add(keyOf(post));
	}

	console.log(`[${blogId}] RSS 수집: ${rssPosts.length}개`);

	const listPosts = [];
	let consecutiveKnownPages = 0;

	for (let page = 1; page <= INCREMENTAL_MAX_PAGES; page += 1) {
		const list = await fetchPostListPage(blogId, page);

		if (list.length === 0) {
			console.log(`[${blogId}] page ${page}: 항목 없음`);
			break;
		}

		const pagePosts = list
			.map((item) => toPost(blogId, item))
			.filter(Boolean);

		const newPosts = pagePosts.filter(
			(post) => !knownKeys.has(keyOf(post))
		);

		for (const post of pagePosts) {
			knownKeys.add(keyOf(post));
			listPosts.push(post);
		}

		console.log(
			`[${blogId}] page ${page}: ` +
				`${pagePosts.length}개 확인, ` +
				`${newPosts.length}개 신규`
		);

		if (newPosts.length === 0) {
			consecutiveKnownPages += 1;
		} else {
			consecutiveKnownPages = 0;
		}

		if (consecutiveKnownPages >= KNOWN_PAGE_STOP_COUNT) {
			console.log(
				`[${blogId}] 기존 글만 ${consecutiveKnownPages}페이지 연속 확인되어 종료합니다.`
			);
			break;
		}

		await sleep(350);
	}

	return [...listPosts, ...rssPosts];
}

async function syncBlogFull(blogId) {
	console.log(`\n[${blogId}] 전체 동기화 시작`);

	const posts = [];
	let emptyPages = 0;

	for (let page = 1; page <= FULL_MAX_PAGES; page += 1) {
		const list = await fetchPostListPage(blogId, page);

		if (list.length === 0) {
			emptyPages += 1;
			console.log(`[${blogId}] page ${page}: 항목 없음`);

			if (emptyPages >= 2) {
				break;
			}

			continue;
		}

		emptyPages = 0;

		for (const item of list) {
			const post = toPost(blogId, item);

			if (post) {
				posts.push(post);
			}
		}

		console.log(`[${blogId}] page ${page}: ${list.length}개 수집`);
		await sleep(350);
	}

	const rssPosts = await fetchRssPostsSafely(blogId);

	console.log(
		`[${blogId}] 전체 목록 ${posts.length}개, RSS ${rssPosts.length}개`
	);

	return [...posts, ...rssPosts];
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
			Accept: 'application/json,text/plain,*/*',
			Referer:
				`https://blog.naver.com/PostList.naver?blogId=` +
				encodeURIComponent(blogId)
		}
	});

	if (!response.ok) {
		throw new Error(
			`네이버 글 목록 요청 실패: ` +
				`${blogId} page=${page} status=${response.status}`
		);
	}

	const text = await response.text();
	const parsed = parseNaverJsonResponse(text);

	return Array.isArray(parsed?.postList) ? parsed.postList : [];
}

async function fetchRssPostsSafely(blogId) {
	try {
		return await fetchRssPosts(blogId);
	} catch (error) {
		console.warn(
			`[${blogId}] RSS 수집에 실패했습니다. 글 목록 API로 계속 진행합니다.`
		);
		console.warn(error instanceof Error ? error.message : error);
		return [];
	}
}

async function fetchRssPosts(blogId) {
	const rssUrl =
		`https://rss.blog.naver.com/` +
		`${encodeURIComponent(blogId)}.xml`;

	const response = await fetch(rssUrl, {
		headers: {
			'User-Agent': 'Mozilla/5.0 NaverBlogBacklinkHub/1.0'
		}
	});

	if (!response.ok) {
		throw new Error(`RSS 요청 실패: ${blogId} ${response.status}`);
	}

	const xml = await response.text();
	const parsed = rssParser.parse(xml);
	const items = asArray(parsed?.rss?.channel?.item);

	return items
		.map((item) => {
			const link = String(item?.link ?? '');
			const logNo = extractLogNo(link);

			if (!logNo) {
				return null;
			}

			const description = String(item?.description ?? '');

			return {
				blogId,
				logNo,
				title: String(item?.title ?? '제목 없음'),
				url: toNaverPostUrl(blogId, logNo),
				description,
				descriptionText: stripHtml(description),
				publishedAt: normalizeDate(item?.pubDate),
				source: 'rss'
			};
		})
		.filter(Boolean);
}

function toPost(blogId, item) {
	const logNo = String(
		item?.logNo ?? item?.logno ?? item?.log_no ?? ''
	).trim();

	if (!logNo) {
		return null;
	}

	return {
		blogId,
		logNo,
		title: decodeNaverText(
			item?.title ?? item?.postTitle ?? item?.subject ?? '제목 없음'
		),
		url: toNaverPostUrl(blogId, logNo),
		descriptionText: decodeNaverText(
			item?.briefContents ?? item?.contents ?? ''
		),
		publishedAt: normalizeDate(
			item?.addDate ?? item?.postAddDate ?? item?.date
		),
		source: 'generated'
	};
}

function mergePosts(existing, incoming) {
	const map = new Map();

	for (const post of existing) {
		addOrUpdatePost(map, post);
	}

	for (const post of incoming) {
		addOrUpdatePost(map, post);
	}

	return [...map.values()].sort((a, b) => {
		const at = a.publishedAt
			? new Date(a.publishedAt).getTime()
			: 0;
		const bt = b.publishedAt
			? new Date(b.publishedAt).getTime()
			: 0;

		return bt - at;
	});
}

function addOrUpdatePost(map, post) {
	if (!post?.blogId || !post?.logNo) {
		return;
	}

	const key = keyOf(post);
	const previous = map.get(key);

	map.set(key, {
		...previous,
		...post,
		title: post.title || previous?.title || '제목 없음',
		descriptionText:
			post.descriptionText || previous?.descriptionText || '',
		publishedAt: post.publishedAt ?? previous?.publishedAt,
		source: post.source ?? previous?.source ?? 'generated'
	});
}

function keyOf(post) {
	return `${post.blogId}:${post.logNo}`;
}

async function readExistingPosts() {
	try {
		const text = await readFile(outputPath, 'utf-8');
		const parsed = JSON.parse(text);

		if (!Array.isArray(parsed)) {
			throw new Error(
				'generated-posts.json의 최상위 값이 배열이 아닙니다.'
			);
		}

		return parsed;
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return [];
		}

		throw error;
	}
}

async function readExistingText() {
	try {
		return await readFile(outputPath, 'utf-8');
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return '';
		}

		throw error;
	}
}

function parseNaverJsonResponse(text) {
	const normalized = String(text ?? '')
		.replace(/^\uFEFF/, '')
		.trim();

	try {
		return JSON.parse(normalized);
	} catch {
		// 네이버 응답에 비표준 역슬래시 escape가 들어오는 경우가 있습니다.
	}

	const repaired = repairInvalidJsonEscapes(normalized);

	try {
		return JSON.parse(repaired);
	} catch (error) {
		throw new Error(
			`네이버 JSON 보정 후에도 파싱하지 못했습니다: ` +
				`${error instanceof Error ? error.message : error}`
		);
	}
}

function repairInvalidJsonEscapes(text) {
	return String(text).replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
}

function decodeNaverText(value) {
	const text = String(value ?? '');

	try {
		return decodeURIComponent(text.replace(/\+/g, ' '));
	} catch {
		return text;
	}
}

function normalizeDate(value) {
	const text = decodeNaverText(value).trim();

	if (!text || /전$/.test(text)) {
		return undefined;
	}

	const date = new Date(text);

	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function extractLogNo(link) {
	const match = String(link).match(/\/(\d{6,})(?:\?|$)/);
	return match?.[1] ?? null;
}

function toNaverPostUrl(blogId, logNo) {
	return (
		`https://blog.naver.com/` +
		`${encodeURIComponent(blogId)}/` +
		`${encodeURIComponent(logNo)}`
	);
}

function stripHtml(value) {
	return String(value ?? '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function asArray(value) {
	if (!value) {
		return [];
	}

	return Array.isArray(value) ? value : [value];
}

async function loadLocalEnv() {
	try {
		const envText = await readFile(join(rootDir, '.env'), 'utf-8');

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
	} catch (error) {
		if (error?.code !== 'ENOENT') {
			throw error;
		}
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

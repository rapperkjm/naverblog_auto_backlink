import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = ({ params }) => {
	const { blogId, logNo } = params;

	// 예상하지 못한 주소가 외부 리디렉션에 사용되지 않도록 기본 형식을 검사합니다.
	if (!/^[a-zA-Z0-9_-]+$/.test(blogId) || !/^\d+$/.test(logNo)) {
		error(404, '유효하지 않은 네이버 블로그 주소입니다.');
	}

	const naverUrl = `https://blog.naver.com/${encodeURIComponent(blogId)}/${logNo}`;

	// 네이버 원문으로 영구 리디렉션합니다.
	redirect(308, naverUrl);
};
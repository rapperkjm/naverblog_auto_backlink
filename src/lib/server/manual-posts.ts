import type { NaverPost } from './types';

// RSS나 자동 수집에서 누락되는 글이 있을 때만 수동으로 추가하세요.
export const manualPosts: NaverPost[] = [
  {
    blogId: 'sample-blog',
    logNo: '223000000001',
    title: '수동 등록 샘플 글',
    url: 'https://blog.naver.com/sample-blog/223000000001',
    descriptionText: '전자책 샘플용 수동 등록 글입니다.',
    publishedAt: '2026-01-01T00:00:00.000Z',
    source: 'manual'
  }
];

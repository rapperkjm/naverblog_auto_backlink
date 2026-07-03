import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPost } from '$lib/server/posts';
import { getSiteConfig } from '$lib/server/config';

export const load: PageServerLoad = async ({ params }) => {
  const post = await getPost(params.blogId, params.logNo);
  if (!post) {
    throw error(404, '글을 찾을 수 없습니다.');
  }

  return {
    siteTitle: getSiteConfig().siteTitle,
    post
  };
};

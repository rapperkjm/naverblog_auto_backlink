import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/server/posts';
import { getSiteConfig } from '$lib/server/config';
import { toBacklinkUrl } from '$lib/server/xml';

export const load: PageServerLoad = async () => {
  const config = getSiteConfig();
  const posts = await getAllPosts();

  return {
    siteTitle: config.siteTitle,
    siteDescription: config.siteDescription,
    totalCount: posts.length,
    posts: posts.slice(0, 50).map((post) => ({
      ...post,
      backlinkUrl: toBacklinkUrl(config.siteOrigin, post.blogId, post.logNo)
    }))
  };
};

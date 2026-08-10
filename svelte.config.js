import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isVercel =
	process.env.VERCEL === '1' ||
	process.env.VERCEL_ENV === 'production' ||
	process.env.VERCEL_ENV === 'preview';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: isVercel ? adapterVercel() : adapterNode()
	}
};

export default config;

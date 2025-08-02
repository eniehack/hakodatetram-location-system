import type { RequestHandler } from '@sveltejs/kit';
import { app } from './app';

export const GET: RequestHandler = async ({ request, platform }) => {
	return app.fetch(request, platform?.env);
};

import type { RequestHandler } from '@sveltejs/kit';
import { app } from './app';

export const GET: RequestHandler = async ({ request }) => {
	return app.fetch(request);
};

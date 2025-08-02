import { hc } from 'hono/client';
import type { Router } from './app';

// reference: https://qiita.com/Kanahiro/items/b109d944f09afd02e57f

let browserClient: ReturnType<typeof hc<Router>>;

export const makeClient = (fetch: Window['fetch']) => {
	const isBrowser = typeof window !== 'undefined';
	const origin = isBrowser ? window.location.origin : '';

	if (isBrowser && browserClient) {
		return browserClient;
	}

	const client = hc<Router>(origin + '/api', { fetch });

	if (isBrowser) {
		browserClient = client;
	}

	return client;
};

import {QueryClient} from '@tanstack/react-query';
import crypto from 'crypto';

export async function hashFileName(fileName: string) {
	return crypto.createHash('sha256').update(fileName).digest('hex');
}

export function getAuthHeaders() {
	const apiKey = process.env['CONVECT_API_KEY'];
	if (!apiKey) {
		throw new Error(
			'API Key is not set. Did you set it with `CONVECT_API_KEY=...`?',
		);
	}

	return {
		Authorization: `Bearer ${apiKey}`,
	};
}

export function getQueryClient() {
	return new QueryClient();
}

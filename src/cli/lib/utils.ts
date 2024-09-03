import {QueryClient} from '@tanstack/react-query';
import crypto from 'crypto';
import {convectConfig} from '../actions/config.js';

export async function hashFileName(fileName: string) {
	return crypto.createHash('sha256').update(fileName).digest('hex');
}

export function getAuthHeaders() {
	const config = convectConfig.read();
	if (!config.apiKey) {
		throw new Error(
			'API Key is not set. Did you authenticate with `yarn convect-xyz auth`?',
		);
	}

	return {
		Authorization: `Bearer ${config.apiKey}`,
	};
}

export function getQueryClient() {
	return new QueryClient();
}

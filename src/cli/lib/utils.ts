import {QueryClient} from '@tanstack/react-query';
import {convectConfig} from '../actions/config.js';

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

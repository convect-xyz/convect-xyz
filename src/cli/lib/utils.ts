export async function hashFileName(fileName: string) {
	return Array.from(
		new Uint8Array(
			await crypto.subtle.digest('SHA-1', new TextEncoder().encode(fileName)),
		),
		byte => byte.toString(16).padStart(2, '0'),
	).join('');
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

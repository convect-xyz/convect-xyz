import {apiAxios} from '../lib/axios.js';

export async function getHandlerInfo(id: string) {
	try {
		return await apiAxios
			.get<{
				id: string;
				handlerName: string;
				projectName: string;
				handlerVersion: number;
				chainId: number;
			}>(`/api/cli/handler-info?id=${id}`)
			.then(r => r.data);
	} catch (e: any) {
		throw new Error(e.response?.data.message ?? 'An unexpected error occurred');
	}
}

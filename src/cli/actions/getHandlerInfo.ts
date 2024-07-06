import {apiAxios} from '../lib/axios.js';

export async function getHandlerInfo(id: string) {
	try {
		return await apiAxios
			.get<{
				functionName: string;
				projectName: string;
				chains: Array<{
					producer: {
						id: number;
						name: string;
						version: number;
					};
					chainId: number;
				}>;
			}>(`/api/cli/function-info?id=${id}`)
			.then(r => r.data);
	} catch (e: any) {
		throw new Error(e.response?.data.message ?? 'An unexpected error occurred');
	}
}

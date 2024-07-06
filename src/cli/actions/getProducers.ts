import {apiAxios} from '../lib/axios.js';

type GetProducersResponse = {
	producers: Array<{
		id: number;
		name: string;
		chainId: number;
	}>;
};

export async function getProducers(ids: string[]) {
	try {
		return await apiAxios
			.post<GetProducersResponse>(`/api/cli/producers`, {
				ids,
			})
			.then(r => r.data);
	} catch (e: any) {
		throw new Error(e.response?.data.message ?? 'An unexpected error occurred');
	}
}

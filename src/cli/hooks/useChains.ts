import {UseQueryResult, useQuery} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {apiAxios} from '../lib/axios.js';

type GetChainsResponse = {
	chains: Array<{
		id: string;
		name: string;
	}>;
};

export function useChains(): UseQueryResult<GetChainsResponse['chains']> {
	return useQuery({
		queryKey: ['chains'],
		queryFn: async () => {
			try {
				return apiAxios
					.get<GetChainsResponse>('/api/cli/chains')
					.then(r => r.data)
					.then(d => d.chains);
			} catch (e) {
				if (e instanceof AxiosError) {
					throw new Error(
						e.response?.data?.message ?? 'An unexpected error occurred',
					);
				}

				throw e;
			}
		},
	});
}

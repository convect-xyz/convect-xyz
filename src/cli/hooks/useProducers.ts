import {UseQueryResult, useQuery} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {getProducers} from '../actions/getProducers.js';

export function useProducers(
	ids: string[],
): UseQueryResult<Awaited<ReturnType<typeof getProducers>>> {
	return useQuery({
		queryKey: ['producers', ids],
		queryFn: async () => {
			try {
				return getProducers(ids);
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

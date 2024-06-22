import {UseQueryResult, useQuery} from '@tanstack/react-query';
import {getConvectFiles} from '../actions/getConvectFiles.js';

export function useConvectFiles(): UseQueryResult<
	Awaited<ReturnType<typeof getConvectFiles>>
> {
	return useQuery({
		queryKey: ['convect-files'],
		queryFn: async () => {
			return await getConvectFiles();
		},
	});
}

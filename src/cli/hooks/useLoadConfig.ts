import {useQuery, UseQueryOptions} from '@tanstack/react-query';
import {loadConfig} from '../actions/loadConfig.js';

const queryKey = ['loadConfig'];

export function useLoadConfig<TData = Awaited<ReturnType<typeof loadConfig>>>(
	options?: UseQueryOptions<
		Awaited<ReturnType<typeof loadConfig>>,
		Error,
		TData
	>,
) {
	return useQuery({
		queryKey: queryKey,
		queryFn: loadConfig,
		throwOnError: false,
		...(options ?? {}),
	});
}

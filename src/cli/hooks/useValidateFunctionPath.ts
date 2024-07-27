import {useQuery, UseQueryOptions} from '@tanstack/react-query';
import {validateFunctionPath} from '../actions/validateFunctionPath.js';

const queryKey = ['validateFunctionPath'];

export function useValidateFunctionPath(
	basePath: string,
	selector: string,
	options?: UseQueryOptions<
		Awaited<ReturnType<typeof validateFunctionPath>>,
		Error
	>,
) {
	return useQuery({
		queryKey: queryKey,
		queryFn: () => validateFunctionPath(basePath, selector),
		throwOnError: false,
		...(options ?? {}),
	});
}

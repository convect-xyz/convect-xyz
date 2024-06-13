import {UseQueryResult, useQuery} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {apiAxios} from '../lib/axios.js';

type GetProjectsResponse = {
	projects: Array<string>;
};

export function useProjects(): UseQueryResult<GetProjectsResponse> {
	return useQuery({
		queryKey: ['projects'],
		queryFn: async () => {
			try {
				return apiAxios
					.get<GetProjectsResponse>('/api/cli/projects')
					.then(r => r.data);
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

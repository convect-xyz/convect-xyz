import {useQuery} from '@tanstack/react-query';
import http from 'http';
import {initAuthServer, waitForApiKey} from '../actions/auth.js';
import {convectConfig} from '../actions/config.js';

export function useAuthServer() {
	return useQuery({
		queryKey: ['auth-server'],
		queryFn: initAuthServer,
	});
}

export function useWaitForAuth(server?: http.Server) {
	return useQuery({
		queryKey: ['wait-for-auth'],
		queryFn: async () => {
			try {
				const apiKey = await waitForApiKey(server!);
				convectConfig.write({apiKey});
				return true;
			} catch (e) {
				throw e;
			} finally {
				server!.close();
			}
		},
		enabled: !!server,
	});
}

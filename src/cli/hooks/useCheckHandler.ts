import {useMutation} from '@tanstack/react-query';
import {checkHandler} from '../actions/checkHandler.js';

const mutationKey = ['check-handler'];

export function useCheckHandler() {
	return useMutation({
		mutationKey,
		mutationFn: checkHandler,
		throwOnError: false,
	});
}

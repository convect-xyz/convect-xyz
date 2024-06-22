import {useMutation, useMutationState} from '@tanstack/react-query';
import {getHandlerInfo} from '../actions/getHandlerInfo.js';

const mutationKey = ['handler-info'];

export function useGetHandlerInfo() {
	return useMutation({
		mutationKey,
		mutationFn: getHandlerInfo,
		throwOnError: false,
	});
}

export function useGetHandlerInfoStatus() {
	return useMutationState<ReturnType<typeof useGetHandlerInfo>>({
		filters: {
			mutationKey,
		},
	})[0];
}

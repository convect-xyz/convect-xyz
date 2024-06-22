import {useMutation, useMutationState} from '@tanstack/react-query';
import {uploadOutputs} from '../actions/upload.js';

const mutationKey = ['upload'];

export function useUploadOutput() {
	return useMutation({
		mutationKey,
		mutationFn: uploadOutputs,
		throwOnError: false,
	});
}

export function useUploadOutputStatus() {
	return useMutationState<ReturnType<typeof useUploadOutput>>({
		filters: {
			mutationKey,
		},
	}).at(0);
}

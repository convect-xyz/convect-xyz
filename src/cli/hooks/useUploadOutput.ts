import {
	useMutation,
	UseMutationOptions,
	useMutationState,
} from '@tanstack/react-query';
import {uploadOutputs} from '../actions/upload.js';

const mutationKey = ['upload'];

export function useUploadOutput(
	options?: UseMutationOptions<
		Awaited<ReturnType<typeof uploadOutputs>>,
		Error,
		{}
	>,
) {
	return useMutation({
		mutationKey,
		mutationFn: uploadOutputs,
		...(options ?? {}),
	});
}

export function useUploadOutputStatus() {
	return useMutationState<ReturnType<typeof useUploadOutput>>({
		filters: {
			mutationKey,
		},
	}).at(0);
}

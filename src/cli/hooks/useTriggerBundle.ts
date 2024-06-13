import {
	UseMutationOptions,
	useMutation,
	useMutationState,
} from '@tanstack/react-query';
import {BundleFileOptions, bundleFile} from '../actions/bundle.js';

const mutationKey = ['bundle'];

export function useTriggerBundle(
	options?: UseMutationOptions<
		Awaited<ReturnType<typeof bundleFile>>,
		Error,
		BundleFileOptions
	>,
) {
	return useMutation({
		mutationKey: mutationKey,
		mutationFn: bundleFile,
		throwOnError: false,
		...(options ?? {}),
	});
}

export function useTriggerBundleStatus() {
	return useMutationState<ReturnType<typeof useTriggerBundle>>({
		filters: {
			mutationKey,
		},
	}).at(0);
}

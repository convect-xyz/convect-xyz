import {
	UseMutationOptions,
	useMutation,
	useMutationState,
} from '@tanstack/react-query';
import {
	GenerateManifestOptions,
	generateManifest,
} from '../actions/generateManifest.js';

const mutationKey = ['generate-manifest'];

export function useGenerateManifest(
	options?: UseMutationOptions<
		Awaited<ReturnType<typeof generateManifest>>,
		Error,
		GenerateManifestOptions
	>,
) {
	return useMutation({
		mutationKey: mutationKey,
		mutationFn: generateManifest,
		throwOnError: false,
		...(options ?? {}),
	});
}

export function useGenerateManifestStatus() {
	return useMutationState<ReturnType<typeof useGenerateManifest>>({
		filters: {
			mutationKey,
		},
	}).at(0);
}

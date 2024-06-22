import {Select, Spinner, StatusMessage} from '@inkjs/ui';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Box} from 'ink';
import React from 'react';
import {z} from 'zod';
import {create} from 'zustand';
import {getHandlerInfo} from '../actions/getHandlerInfo.js';
import {useConvectFiles} from '../hooks/useConvectFiles.js';
import {useGenerateManifest} from '../hooks/useGenerateManifest.js';
import {useGetHandlerInfo} from '../hooks/useGetHandlerInfo.js';
import {
	useTriggerBundle,
	useTriggerBundleStatus,
} from '../hooks/useTriggerBundle.js';
import {
	useUploadOutput,
	useUploadOutputStatus,
} from '../hooks/useUploadOutput.js';

export const args = z.tuple([]);

type Props = {
	args: z.infer<typeof args>;
};

const queryClient = new QueryClient();

type UpdateState = {
	currentState?: 'function';
	handler?: Awaited<ReturnType<typeof getHandlerInfo>>;
	function?: string;
};

const useUpdateState = create<UpdateState>(set => ({
	currentState: 'function',
}));

export default function Update(props: Props) {
	return (
		<QueryClientProvider client={queryClient}>
			<Content />
		</QueryClientProvider>
	);
}

function Content() {
	return (
		<>
			<DisplayFunction />
			<CurrentInput />
			<BundleState />
			<UploadState />
		</>
	);
}

function DisplayFunction() {
	const state = useUpdateState();

	if (state.function) {
		return (
			<StatusMessage variant="success">
				Function: {state.function}
			</StatusMessage>
		);
	}

	return <></>;
}

function CurrentInput() {
	const state = useUpdateState();

	const {mutateAsync: getHandlerInfo} = useGetHandlerInfo();
	const {mutateAsync: generateManifest} = useGenerateManifest();
	const {mutateAsync: triggerUpload} = useUploadOutput();
	const {mutateAsync: triggerBundle} = useTriggerBundle();

	if (state.currentState === 'function') {
		return (
			<SetFunction
				onSubmit={async fn => {
					useUpdateState.setState({
						currentState: undefined,
						function: fn,
					});

					const {id, pipeline, outfile, outmanifest} = await triggerBundle({
						entrypoint: fn,
					});

					const handler = await getHandlerInfo(id);
					useUpdateState.setState({
						handler,
					});

					await generateManifest({
						pipeline,
						outmanifest,
						chainId: handler.chainId,
					});
					await triggerUpload({
						id,
						mode: 'update',
						outfile: outfile,
					});
				}}
			/>
		);
	}

	return <></>;
}

function SetFunction(props: {onSubmit: (name: string) => void}) {
	const {data: convectFiles} = useConvectFiles();

	return (
		<Box>
			<Spinner label="Select function: " />
			<Select
				options={
					convectFiles?.map(fn => ({label: fn.rel, value: fn.abs})) ?? []
				}
				onChange={v => props.onSubmit(v)}
			/>
		</Box>
	);
}

function BundleState() {
	const bundleState = useTriggerBundleStatus();

	if (!bundleState) return <></>;

	if (bundleState.status === 'pending') {
		return <Spinner label="Bundling source code" />;
	}

	if (bundleState.status === 'success') {
		return <StatusMessage variant="success">Bundled source code</StatusMessage>;
	}

	return (
		<StatusMessage variant="error">{bundleState.error?.stack}</StatusMessage>
	);
}

function UploadState() {
	const uploadState = useUploadOutputStatus();

	if (!uploadState) return <></>;

	if (uploadState.status === 'pending') {
		return <Spinner label="Uploading source code" />;
	}

	if (uploadState.status === 'success') {
		return (
			<StatusMessage variant="success">Uploaded source code</StatusMessage>
		);
	}

	return (
		<StatusMessage variant="error">
			{uploadState.error?.message ?? 'Failed to upload source code'}
		</StatusMessage>
	);
}

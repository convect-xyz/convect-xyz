import {Select, Spinner, StatusMessage, TextInput} from '@inkjs/ui';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Box} from 'ink';
import React from 'react';
import {z} from 'zod';
import {create} from 'zustand';
import {getHandlerInfo} from '../actions/getHandlerInfo.js';
import {useConvectFiles} from '../hooks/useConvectFiles.js';
import {
	useGenerateManifest,
	useGenerateManifestStatus,
} from '../hooks/useGenerateManifest.js';
import {
	useGetHandlerInfo,
	useGetHandlerInfoStatus,
} from '../hooks/useGetHandlerInfo.js';
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

type InitState = {
	currentState?: 'function' | 'override';
	handler?: Awaited<ReturnType<typeof getHandlerInfo>>;
	override?: boolean;
	function?: string;
};

const useInitState = create<InitState>(set => ({
	currentState: 'function',
}));

export default function Init(props: Props) {
	return (
		<QueryClientProvider client={queryClient}>
			<Content {...props} />
		</QueryClientProvider>
	);
}

function Content(_: Props) {
	return (
		<>
			<DisplayFunction />
			<DisplayBundleState />
			<DisplayHandlerInfo />
			<DisplayOverride />
			<DisplayGenerateManifestState />
			<DisplayUploadState />

			<CurrentInput />
		</>
	);
}

function DisplayOverride() {
	const state = useInitState();

	if (state.override) {
		return (
			<StatusMessage variant="success">
				Convect function already exists. Doing this will create a new version of
				your function. Would you like to proceed? y
			</StatusMessage>
		);
	}

	return <></>;
}

function DisplayFunction() {
	const state = useInitState();

	if (state.function) {
		return (
			<StatusMessage variant="success">
				Function: {state.function}
			</StatusMessage>
		);
	}

	return <></>;
}

function DisplayHandlerInfo() {
	const handlerState = useGetHandlerInfoStatus();

	if (!handlerState) return <></>;

	if (handlerState.status === 'pending') {
		return <Spinner label="Getting handler information" />;
	}

	if (handlerState.status === 'success' && handlerState.data) {
		return (
			<StatusMessage variant="success">
				Handler Name: {handlerState.data.handlerName}
			</StatusMessage>
		);
	}

	return <></>;
}

function DisplayBundleState() {
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

function DisplayGenerateManifestState() {
	const generateState = useGenerateManifestStatus();

	if (!generateState) return <></>;

	if (generateState.status === 'pending') {
		return <Spinner label="Generating manifest" />;
	}

	if (generateState.status === 'success') {
		return <StatusMessage variant="success">Generated manifest</StatusMessage>;
	}

	return (
		<StatusMessage variant="error">{generateState.error?.stack}</StatusMessage>
	);
}

function DisplayUploadState() {
	const uploadState = useUploadOutputStatus();

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

function CurrentInput() {
	const state = useInitState();

	const {data: handlerData, mutateAsync: getHandlerInfo} = useGetHandlerInfo();
	const {mutateAsync: generateManifest} = useGenerateManifest();
	const {mutateAsync: triggerUpload} = useUploadOutput();
	const {data: bundleData, mutateAsync: triggerBundle} = useTriggerBundle();

	if (state.currentState === 'function') {
		return (
			<SetFunction
				onSubmit={async fn => {
					useInitState.setState({
						currentState: undefined,
						function: fn,
					});

					const {id, pipeline, outfile, outmanifest} = await triggerBundle({
						entrypoint: fn,
					});
					const handler = await getHandlerInfo(id);

					// Handler has not been initialised
					if (handler.handlerVersion < 0) {
						useInitState.setState({
							handler,
							override: false,
						});

						await generateManifest({
							pipeline,
							outmanifest,
							chainId: handler.chainId,
						});
						await triggerUpload({
							id,
							mode: 'init',
							outfile: outfile,
							outmanifest,
							override: false,
						});
					} else {
						useInitState.setState({
							handler,
							currentState: 'override',
						});
					}
				}}
			/>
		);
	}

	if (state.currentState === 'override') {
		return (
			<SetOverride
				onSubmit={async _ => {
					useInitState.setState({currentState: undefined, override: true});

					await generateManifest({
						pipeline: bundleData!.pipeline,
						outmanifest: bundleData!.outmanifest,
						chainId: handlerData!.chainId,
					});

					await triggerUpload({
						id: handlerData!.id,
						mode: 'init',
						outfile: bundleData!.outfile,
						outmanifest: bundleData!.outmanifest,
						override: true,
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

function SetOverride(props: {onSubmit: (override: true) => void}) {
	return (
		<Box>
			<Spinner label="Convect function already exists. Doing this will create a new version of your function. Would you like to proceed? " />
			<TextInput
				onSubmit={v => {
					if (v.toLowerCase() === 'y') {
						props.onSubmit(true);
					} else {
						process.exit(0);
					}
				}}
				placeholder="y/n"
			/>
		</Box>
	);
}

import {Spinner, StatusMessage} from '@inkjs/ui';
import {QueryClientProvider} from '@tanstack/react-query';
import {option} from 'pastel';
import React, {useEffect} from 'react';
import {z} from 'zod';
import {create} from 'zustand';
import {
	useGenerateManifest,
	useGenerateManifestStatus,
} from '../hooks/useGenerateManifest.js';
import {useLoadConfig} from '../hooks/useLoadConfig.js';
import {
	useTriggerBundle,
	useTriggerBundleStatus,
} from '../hooks/useTriggerBundle.js';
import {
	useUploadOutput,
	useUploadOutputStatus,
} from '../hooks/useUploadOutput.js';
import {useValidateFunctionPath} from '../hooks/useValidateFunctionPath.js';
import {getQueryClient} from '../lib/utils.js';

export const options = z.object({
	select: z.string().describe(
		option({
			description: 'Selected Convect Function',
			alias: 's',
		}),
	),
});

type Props = {
	options: z.infer<typeof options>;
};

type InitState = {
	currentState: 'findFunction';
	manifest?: any;
	outfile?: string;
	outmanifest?: string;
	pipeline?: any;
	override?: boolean;
	function?: string;
	producerId?: number;
	chainId?: number;
};

const useInitState = create<InitState>(() => ({
	currentState: 'findFunction',
}));

export default function Init(props: Props) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			<Content {...props} />
		</QueryClientProvider>
	);
}

function Content(props: Props) {
	const {data: config, error} = useLoadConfig();

	if (error) {
		return <StatusMessage variant="error">{error.message}</StatusMessage>;
	}

	if (!config) {
		return null;
	}

	return (
		<>
			<DisplayFunction />
			<DisplayBundleState />
			<DisplayGenerateManifestState />
			<DisplayUploadState />

			<Controller {...props} />
		</>
	);
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

function Controller(props: Props) {
	const state = useInitState();

	const {mutateAsync: generateManifest} = useGenerateManifest();
	const {mutateAsync: triggerUpload} = useUploadOutput();
	const {mutateAsync: triggerBundle} = useTriggerBundle();

	if (state.currentState === 'findFunction') {
		return (
			<FindFunction
				{...props}
				onSubmit={async fn => {
					useInitState.setState({
						currentState: undefined,
						function: fn,
					});

					const {pipeline, outfile, outmanifest} = await triggerBundle({
						entrypoint: fn,
					});

					await generateManifest({
						pipeline: pipeline,
						outmanifest: outmanifest!,
					});

					await triggerUpload({
						mode: 'init',
						outfile: outfile!,
						id: props.options.select,
						outmanifest: outmanifest!,
						override: false,
					});

					useInitState.setState({
						pipeline,
						outfile,
						outmanifest,
						override: false,
					});
				}}
			/>
		);
	}

	return <></>;
}

function FindFunction(props: {onSubmit: (name: string) => void} & Props) {
	const {data: config} = useLoadConfig();
	const {data: fullFnPath, error} = useValidateFunctionPath(
		config!.convectBasePath,
		props.options.select,
	);

	useEffect(() => {
		if (fullFnPath) {
			props.onSubmit(fullFnPath);
		}
	}, [fullFnPath]);

	if (error) {
		return <StatusMessage variant="error">{error.message}</StatusMessage>;
	}

	return <></>;
}

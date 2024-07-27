import {Select, Spinner, StatusMessage} from '@inkjs/ui';
import {QueryClientProvider} from '@tanstack/react-query';
import {Box} from 'ink';
import {option} from 'pastel';
import React, {useEffect} from 'react';
import {z} from 'zod';
import {create} from 'zustand';
import {getHandlerInfo} from '../actions/getHandlerInfo.js';
import {useGenerateManifest} from '../hooks/useGenerateManifest.js';
import {useGetHandlerInfo} from '../hooks/useGetHandlerInfo.js';
import {useLoadConfig} from '../hooks/useLoadConfig.js';
import {useProducers} from '../hooks/useProducers.js';
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

type UpdateState = {
	currentState?: 'findFunction' | 'selectChain' | 'confirmation';
	handler?: Awaited<ReturnType<typeof getHandlerInfo>>;
	function?: string;
	manifest?: any;
	outfile?: string;
	outmanifest?: string;
	pipeline?: any;
	producerId?: number;
};

const useUpdateState = create<UpdateState>(() => ({
	currentState: 'findFunction',
}));

export default function Update(props: Props) {
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
			<DisplayUploadState />
			<CurrentInput {...props} />
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

function CurrentInput(props: Props) {
	const state = useUpdateState();

	const {mutateAsync: getHandlerInfo} = useGetHandlerInfo();
	const {mutateAsync: generateManifest} = useGenerateManifest();
	const {mutateAsync: triggerUpload} = useUploadOutput();
	const {mutateAsync: triggerBundle} = useTriggerBundle();

	if (state.currentState === 'findFunction') {
		return (
			<FindFunction
				{...props}
				onSubmit={async fn => {
					useUpdateState.setState({
						currentState: undefined,
						function: fn,
					});

					const {pipeline, outfile, outmanifest} = await triggerBundle({
						entrypoint: fn,
					});

					const handler = await getHandlerInfo(props.options.select);
					useUpdateState.setState({
						handler,
						pipeline,
						outfile,
						outmanifest,
						currentState: 'selectChain',
					});
				}}
			/>
		);
	}

	if (state.currentState === 'selectChain') {
		return (
			<SelectChain
				onSubmit={async (producerId, chainId) => {
					useUpdateState.setState({currentState: undefined, producerId});

					const producer = state.handler?.chains.map(
						c => c.producer.id === producerId,
					);

					// Handler has not been initialised
					if (!producer) {
						process.exit(0);
					} else {
						await generateManifest({
							pipeline: state.pipeline,
							outmanifest: state.outmanifest!,
							chainId,
						});

						await triggerUpload({
							mode: 'update',
							outfile: state.outfile!,
							id: props.options.select,
							producerId,
						});
					}
				}}
			/>
		);
	}

	return <></>;
}

function FindFunction(props: {onSubmit: (name: string) => void} & Props) {
	const {data: config} = useLoadConfig();
	const {data: fullFnPath} = useValidateFunctionPath(
		config!.convectBasePath,
		props.options.select,
	);

	useEffect(() => {
		if (fullFnPath) {
			props.onSubmit(fullFnPath);
		}
	}, [fullFnPath]);

	return <></>;
}

function SelectChain(props: {
	onSubmit: (producerId: number, chainId: number) => void;
}) {
	const state = useUpdateState();
	const {data} = useProducers(state.pipeline.chains);

	if (!data) {
		return <></>;
	}

	return (
		<Box>
			<Spinner label="Select chain: " />
			<Select
				options={
					data.producers?.map(c => ({
						label: c.name,
						value: c.id.toString(),
					})) ?? []
				}
				onChange={value => {
					const producerId = Number(value);
					const producer = data.producers.find(c => c.id === producerId)!;
					props.onSubmit(producer.id, producer.chainId);
				}}
			/>
		</Box>
	);
}

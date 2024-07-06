import {Select, Spinner, StatusMessage, TextInput} from '@inkjs/ui';
import {QueryClientProvider} from '@tanstack/react-query';
import {Box} from 'ink';
import {option} from 'pastel';
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
import {useProducers} from '../hooks/useProducers.js';
import {
	useTriggerBundle,
	useTriggerBundleStatus,
} from '../hooks/useTriggerBundle.js';
import {
	useUploadOutput,
	useUploadOutputStatus,
} from '../hooks/useUploadOutput.js';
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
	currentState: 'function' | 'chain' | 'override';
	handler?: Awaited<ReturnType<typeof getHandlerInfo>>;
	manifest?: any;
	outfile?: string;
	outmanifest?: string;
	pipeline?: any;
	override?: boolean;
	function?: string;
	producerId?: number;
	chainId?: number;
};

const useInitState = create<InitState>(set => ({
	currentState: 'function',
}));

export default function Init(props: Props) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			<Content {...props} />
		</QueryClientProvider>
	);
}

function Content(props: Props) {
	return (
		<>
			<DisplayFunction />
			<DisplayBundleState />
			<DisplayHandlerInfo />
			<DisplayOverride />
			<DisplayGenerateManifestState />
			<DisplayUploadState />

			<CurrentInput {...props} />
		</>
	);
}

function DisplayOverride() {
	const state = useInitState();

	if (state.override) {
		return (
			<StatusMessage variant="success">
				Convect Function already exists. Doing this will create a new version of
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
				Function Name: {handlerState.data.functionName}
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

function CurrentInput(props: Props) {
	const state = useInitState();

	const {mutateAsync: getHandlerInfo} = useGetHandlerInfo();
	const {mutateAsync: generateManifest} = useGenerateManifest();
	const {mutateAsync: triggerUpload} = useUploadOutput();
	const {mutateAsync: triggerBundle} = useTriggerBundle();

	if (state.currentState === 'function') {
		return (
			<SetFunction
				onSubmit={async fn => {
					useInitState.setState({
						currentState: undefined,
						function: fn,
					});

					const {pipeline, outfile, outmanifest} = await triggerBundle({
						entrypoint: fn,
					});
					const handler = await getHandlerInfo(props.options.select);

					useInitState.setState({
						handler,
						pipeline,
						outfile,
						outmanifest,
						override: false,
						currentState: 'chain',
					});
				}}
			/>
		);
	}

	if (state.currentState === 'chain') {
		return (
			<SelectChain
				onSubmit={async (producerId, chainId) => {
					useInitState.setState({
						currentState: undefined,
						producerId,
						chainId,
					});

					const producer = state.handler?.chains.find(
						c => c.producer.id === producerId,
					);

					// Function has been initialised (we need confirmation)
					if (producer) {
						return useInitState.setState({
							currentState: 'override',
						});
					}

					await generateManifest({
						pipeline: state.pipeline,
						outmanifest: state.outmanifest!,
						chainId,
					});

					await triggerUpload({
						mode: 'init',
						outfile: state.outfile!,
						id: props.options.select,
						outmanifest: state.outmanifest!,
						override: false,
						producerId,
					});
				}}
			/>
		);
	}

	if (state.currentState === 'override') {
		return (
			<SetOverride
				onSubmit={async override => {
					if (!override) {
						return useInitState.setState({
							currentState: undefined,
							override: false,
						});
					}

					useInitState.setState({currentState: undefined, override: true});

					await generateManifest({
						pipeline: state.pipeline,
						outmanifest: state.outmanifest!,
						chainId: state.chainId!,
					});

					await triggerUpload({
						mode: 'init',
						outfile: state.outfile!,
						id: props.options.select,
						outmanifest: state.outmanifest!,
						override: false,
						producerId: state.producerId!,
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

function SelectChain(props: {
	onSubmit: (producerId: number, chainId: number) => void;
}) {
	const state = useInitState();
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

function SetOverride(props: {onSubmit: (override: boolean) => void}) {
	return (
		<Box>
			<Spinner label="Convect function already exists. Doing this will create a new version of your function. Would you like to proceed? " />
			<TextInput
				onSubmit={v => {
					props.onSubmit(v.toLowerCase() === 'y');
				}}
				placeholder="y/n"
			/>
		</Box>
	);
}

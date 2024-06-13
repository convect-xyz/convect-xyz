import {Select, Spinner, StatusMessage, TextInput} from '@inkjs/ui';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Box} from 'ink';
import React from 'react';
import {z} from 'zod';
import {create} from 'zustand';
import {useChains} from '../hooks/useChains.js';
import {useCheckHandler} from '../hooks/useCheckHandler.js';
import {useProjects} from '../hooks/useProjects.js';
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
	currentState?: 'project' | 'handler' | 'chain' | 'entrypoint' | 'override';
	project?: string;
	handler?: {
		name: string;
		exists: boolean;
	};
	chain?: string;
	entrypoint?: string;
	override?: boolean;
};

const useInitState = create<InitState>(() => ({
	currentState: 'project',
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
			<DisplayProject />
			<DisplayHandlerName />
			<DisplayOverride />
			<DisplayChain />
			<DisplayEntrypoint />

			<CurrentInput />

			<BundleState />
			<UploadState />
		</>
	);
}

function DisplayProject() {
	const state = useInitState();

	if (state.project) {
		return (
			<StatusMessage variant="success">
				Project Name ({state.project})
			</StatusMessage>
		);
	}

	return <></>;
}

function DisplayHandlerName() {
	const state = useInitState();

	if (state.handler) {
		return (
			<StatusMessage variant="success">
				Handler Name: {state.handler.name}
			</StatusMessage>
		);
	}

	return <></>;
}

function DisplayOverride() {
	const state = useInitState();

	if (state.project && state.handler && state.override !== undefined) {
		return (
			<StatusMessage variant="success">
				Handler '{state.handler.name}', already exists in '{state.project}'.
				Doing this will create a new version of your handler. Would you like to
				proceed? y
			</StatusMessage>
		);
	}

	return <></>;
}

function DisplayChain() {
	const state = useInitState();
	const {data: chains} = useChains();

	if (state.chain) {
		return (
			<StatusMessage variant="success">
				Chain ({chains?.find(c => c.id === state.chain)!.name})
			</StatusMessage>
		);
	}

	return <></>;
}

function DisplayEntrypoint() {
	const state = useInitState();

	if (state.entrypoint) {
		return (
			<StatusMessage variant="success">
				Entrypoint: {state.entrypoint}
			</StatusMessage>
		);
	}

	return <></>;
}

function CurrentInput() {
	const state = useInitState();

	const {mutateAsync: triggerUpload} = useUploadOutput();
	const {mutateAsync: triggerBundle} = useTriggerBundle({
		onSuccess(data) {
			const {project, handler, chain, override} = state;
			if (!project) throw new Error('Project name is not specified');
			if (!handler) throw new Error('Handler name is not specified');
			if (!chain) throw new Error('Chain is not specified');

			const {exists, name} = handler;

			const getOverride = () => {
				if (!exists) return false;
				if (exists && override === undefined) {
					throw new Error('Override is not specified');
				}
				return override!;
			};

			triggerUpload({
				mode: 'init',
				project,
				handlerName: name,
				outfile: data.outfile,
				outmanifest: data.outmanifest,
				override: getOverride(),
				chain,
			}).catch(() => {});
		},
	});

	if (state.currentState === 'project') {
		return (
			<SelectProject
				onSelect={project =>
					useInitState.setState({currentState: 'handler', project})
				}
			/>
		);
	}

	if (state.currentState === 'handler') {
		return (
			<SetHandlerName
				onSubmit={(name, exists) =>
					useInitState.setState({
						currentState: exists ? 'override' : 'chain',
						handler: {name, exists},
					})
				}
			/>
		);
	}

	if (state.currentState === 'override') {
		return (
			<SetOverride
				onSubmit={override =>
					useInitState.setState({currentState: 'chain', override})
				}
			/>
		);
	}

	if (state.currentState === 'chain') {
		return (
			<SelectChain
				onSelect={chain =>
					useInitState.setState({currentState: 'entrypoint', chain})
				}
			/>
		);
	}

	if (state.currentState === 'entrypoint') {
		return (
			<SetEntrypoint
				onSubmit={entrypoint => {
					useInitState.setState({currentState: undefined, entrypoint});
					triggerBundle({
						entrypoint,
					});
				}}
			/>
		);
	}

	return <></>;
}

function SelectProject(props: {onSelect: (id: string) => void}) {
	const {data: projects, error, isLoading} = useProjects();

	if (isLoading) {
		return <Spinner label="Fetching your projects" />;
	}

	if (error) {
		return <StatusMessage variant="error">{error.message}</StatusMessage>;
	}

	return (
		<Box>
			<Spinner label="Select a project " />

			<Select
				options={projects?.projects.map(p => ({label: p, value: p})) ?? []}
				onChange={props.onSelect}
			/>
		</Box>
	);
}

function SelectChain(props: {onSelect: (id: string) => void}) {
	const {data: chains, error, isLoading} = useChains();

	if (isLoading) {
		return <Spinner label="Fetching supported chains" />;
	}

	if (error) {
		return <StatusMessage variant="error">{error.message}</StatusMessage>;
	}

	return (
		<Box>
			<Spinner label="Select a chain " />

			<Select
				options={chains?.map(p => ({label: p.name, value: p.id})) ?? []}
				onChange={props.onSelect}
			/>
		</Box>
	);
}

function SetHandlerName(props: {
	onSubmit: (name: string, exists: boolean) => void;
}) {
	const state = useInitState();
	const {mutateAsync: check} = useCheckHandler();

	return (
		<Box>
			<Spinner label="Handler Name: " />
			<TextInput
				onSubmit={async v => {
					const exists = await check({
						project: state.project!,
						handlerName: v,
					});
					props.onSubmit(v, exists);
				}}
				placeholder="Only characters and hyphens allowed"
			/>
		</Box>
	);
}

function SetOverride(props: {onSubmit: (override: boolean) => void}) {
	const state = useInitState();

	return (
		<Box>
			<Spinner
				label={`Handler '${
					state.handler!.name
				}', already exists in '${state.project!}'. Doing this will create a new version of your handler. Would you like to proceed? `}
			/>
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

function SetEntrypoint(props: {onSubmit: (entrypoint: string) => void}) {
	return (
		<Box>
			<Spinner label="Handler path: " />
			<TextInput
				onSubmit={props.onSubmit}
				placeholder="Tell us the path to your ingestion handler"
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

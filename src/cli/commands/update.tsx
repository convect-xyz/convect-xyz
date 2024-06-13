import {Spinner, StatusMessage, TextInput} from '@inkjs/ui';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Box} from 'ink';
import React, {useState} from 'react';
import {z} from 'zod';
import {
	useTriggerBundle,
	useTriggerBundleStatus,
} from '../hooks/useTriggerBundle.js';
import {
	useUploadOutput,
	useUploadOutputStatus,
} from '../hooks/useUploadOutput.js';

export const args = z.tuple([z.string()]);

type Props = {
	args: z.infer<typeof args>;
};

const queryClient = new QueryClient();

export default function Update(props: Props) {
	return (
		<QueryClientProvider client={queryClient}>
			<Content {...props} />
		</QueryClientProvider>
	);
}

function Content(props: Props) {
	const [project, handlerName] = props.args[0].split('/');
	const [entrypoint, setEntrypoint] = useState<string>();

	const {mutateAsync: triggerUpload} = useUploadOutput();

	const {mutateAsync: triggerBundle} = useTriggerBundle({
		onSuccess(data) {
			if (!project) throw new Error('No Project');
			if (!handlerName) throw new Error('No Handler');
			triggerUpload({
				mode: 'update',
				project,
				handlerName,
				outfile: data.outfile,
			}).catch(() => {});
		},
	});

	return (
		<>
			<SetEntrypoint
				handlerName={handlerName}
				entrypoint={entrypoint}
				onSubmit={v => {
					setEntrypoint(v);
					triggerBundle({
						entrypoint: v,
					}).catch(() => {});
				}}
			/>
			<BundleState />
			<UploadState />
		</>
	);
}

function SetEntrypoint(props: {
	entrypoint?: string;
	handlerName?: string;
	onSubmit: (entrypoint: string) => void;
}) {
	if (!props.handlerName) return null;

	if (props.entrypoint) {
		return (
			<StatusMessage variant="success">
				Entrypoint: {props.entrypoint}
			</StatusMessage>
		);
	}

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

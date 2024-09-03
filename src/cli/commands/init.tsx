import {Spinner, StatusMessage} from '@inkjs/ui';
import {QueryClientProvider} from '@tanstack/react-query';
import {Box, Static} from 'ink';
import {option} from 'pastel';
import React, {useEffect} from 'react';
import {z} from 'zod';
import {create} from 'zustand';
import {useGenerateManifest} from '../hooks/useGenerateManifest.js';
import {useLoadConfig} from '../hooks/useLoadConfig.js';
import {useTriggerBundle} from '../hooks/useTriggerBundle.js';
import {useUploadOutput} from '../hooks/useUploadOutput.js';
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

type CurrentStep =
	| {
			label: 'validateFunctionPath';
	  }
	| {
			label: 'bundle';
			inputs: {
				fnEntrypoint: string;
			};
	  }
	| {
			label: 'generateManifest';
			inputs: {
				pipeline: any;
				outfile: string;
				outmanifest: string;
			};
	  }
	| {
			label: 'upload';
			inputs: {
				outfile: string;
				outmanifest: string;
			};
	  };

type CompletedStep = {
	title: string;
};

type InitState = {
	currentStep: CurrentStep;
	completedSteps: Array<CompletedStep>;
};

type InitStateActions = {
	setCurrentStep: (step: CurrentStep) => void;
	addCompletedStep: (step: CompletedStep) => void;
};

const useInitState = create<InitState & InitStateActions>(set => ({
	currentStep: {
		label: 'validateFunctionPath',
	},
	completedSteps: [],
	setCurrentStep: (step: CurrentStep) => set({currentStep: step}),
	addCompletedStep: (step: CompletedStep) =>
		set(state => ({completedSteps: [...state.completedSteps, step]})),
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
	const state = useInitState();
	if (error) {
		return <StatusMessage variant="error">{error.message}</StatusMessage>;
	}

	if (!config) {
		return null;
	}

	return (
		<>
			<Static items={state.completedSteps}>
				{(item, index) => (
					<Box key={index}>
						<StatusMessage variant="success">{item.title}</StatusMessage>
					</Box>
				)}
			</Static>
			<Controller {...props} />
		</>
	);
}

function Controller(props: Props) {
	const state = useInitState();
	const currentStep = state.currentStep;

	if (currentStep.label === 'validateFunctionPath') {
		return <ValidateFunctionPath {...props} />;
	} else if (currentStep.label === 'bundle') {
		return <TriggerBundle fnEntrypoint={currentStep.inputs.fnEntrypoint} />;
	} else if (currentStep.label === 'generateManifest') {
		return (
			<GenerateManifest
				pipeline={currentStep.inputs.pipeline}
				outmanifest={currentStep.inputs.outmanifest}
				outfile={currentStep.inputs.outfile}
			/>
		);
	} else if (currentStep.label === 'upload') {
		return (
			<UploadOutput
				outfile={currentStep.inputs.outfile}
				id={props.options.select}
				outmanifest={currentStep.inputs.outmanifest}
				override={false}
			/>
		);
	}

	return <></>;
}

function ValidateFunctionPath(props: Props) {
	const state = useInitState();
	const {data: config} = useLoadConfig();
	const {
		data: fullFnPath,
		isLoading,
		error,
	} = useValidateFunctionPath(config!.convectBasePath, props.options.select);

	useEffect(() => {
		if (fullFnPath) {
			state.addCompletedStep({
				title: `Function: ${fullFnPath}`,
			});

			state.setCurrentStep({
				label: 'bundle',
				inputs: {fnEntrypoint: fullFnPath},
			});
		}
	}, [fullFnPath]);

	if (isLoading) {
		return <Spinner label="Validating function path" />;
	}

	if (error) {
		return <StatusMessage variant="error">{error.message}</StatusMessage>;
	}

	return <></>;
}

function TriggerBundle(props: {fnEntrypoint: string}) {
	const {fnEntrypoint} = props;
	const state = useInitState();
	const {mutateAsync: triggerBundle, isPending} = useTriggerBundle({
		onSuccess: data => {
			state.addCompletedStep({
				title: `Bundled source code`,
			});

			state.setCurrentStep({
				label: 'generateManifest',
				inputs: {
					pipeline: data.pipeline,
					outfile: data.outfile,
					outmanifest: data.outmanifest,
				},
			});
		},
	});

	useEffect(() => {
		triggerBundle({
			entrypoint: fnEntrypoint,
		});
	}, []);

	if (isPending) {
		return <Spinner label="Bundling source code" />;
	}

	return <></>;
}

function GenerateManifest(props: {
	pipeline: any;
	outmanifest: string;
	outfile: string;
}) {
	const state = useInitState();
	const {mutateAsync: generateManifest, isPending} = useGenerateManifest({
		onSuccess: data => {
			state.addCompletedStep({
				title: `Generated manifest`,
			});

			state.setCurrentStep({
				label: 'upload',
				inputs: {
					outfile: props.outfile,
					outmanifest: props.outmanifest,
				},
			});
		},
	});

	useEffect(() => {
		generateManifest({
			pipeline: props.pipeline,
			outmanifest: props.outmanifest,
		});
	}, []);

	if (isPending) {
		return <Spinner label="Generating manifest" />;
	}

	return <></>;
}

function UploadOutput(props: {
	outfile: string;
	id: string;
	outmanifest: string;
	override: boolean;
}) {
	const state = useInitState();
	const {mutateAsync: triggerUpload, isPending} = useUploadOutput({
		onSuccess: () => {
			state.addCompletedStep({
				title: `Uploaded source code`,
			});
		},
	});

	useEffect(() => {
		triggerUpload({
			mode: 'init',
			outfile: props.outfile,
			id: props.id,
			outmanifest: props.outmanifest,
			override: props.override,
		});
	}, []);

	if (isPending) {
		return <Spinner label="Uploading source code" />;
	}

	return <></>;
}

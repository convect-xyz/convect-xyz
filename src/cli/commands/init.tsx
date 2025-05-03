import {Spinner, StatusMessage} from '@inkjs/ui';
import {QueryClientProvider, useMutation} from '@tanstack/react-query';
import fs from 'fs';
import path from 'path';
import React, {useEffect} from 'react';
import {z} from 'zod';
import {create} from 'zustand';
import {getQueryClient} from '../lib/utils.js';

function useInitialise() {
	return useMutation({
		mutationKey: ['initialise'],
		mutationFn: async () => {
			const packageJsonExists = fs.existsSync(
				path.join(process.cwd(), 'package.json'),
			);
			if (!packageJsonExists) {
				throw new Error(
					'This command must be run in the project root directory.',
				);
			}

			const convectConfigExists = fs.existsSync(
				path.join(process.cwd(), 'convect.config.mjs'),
			);
			if (convectConfigExists) {
				throw new Error(
					'Convect has already been initialised in this project.',
				);
			}

			fs.writeFileSync(
				path.join(process.cwd(), 'convect.config.mjs'),
				`
export default {
  src: "src/convect",
};
        `.trimStart(),
			);

			return true;
		},
	});
}

export const options = z.object({});

type Props = {
	options: z.infer<typeof options>;
};

type State = {};

type Actions = {};

const useState = create<State & Actions>(set => ({}));

export default function Init(props: Props) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			<Content {...props} />
		</QueryClientProvider>
	);
}

function Content(props: Props) {
	return <Controller {...props} />;
}

function Controller(props: Props) {
	const {data: result, mutate: initialise, error} = useInitialise();

	useEffect(() => {
		initialise();
	}, []);

	if (error) {
		return <StatusMessage variant="error">{error.message}</StatusMessage>;
	}

	if (result) {
		return (
			<StatusMessage variant="success">
				Created convect.config.mjs in project root directory.
			</StatusMessage>
		);
	}

	return <Spinner label="Initialising Convect..." />;
}

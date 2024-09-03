import {Spinner, StatusMessage} from '@inkjs/ui';
import {QueryClientProvider} from '@tanstack/react-query';
import {Box, Text} from 'ink';
import Link from 'ink-link';
import React from 'react';
import {useAuthServer, useWaitForAuth} from '../hooks/useAuth.js';
import {getQueryClient} from '../lib/utils.js';

type Props = {};

export default function Auth(props: Props) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			<Content {...props} />
		</QueryClientProvider>
	);
}

function Content(_: Props) {
	const {data: serverConfig, error: authServerError} = useAuthServer();
	const {data: isAuthenticated, error: authError} = useWaitForAuth();

	if (authServerError || authError) {
		return (
			<StatusMessage variant="error">
				{authServerError?.message || authError?.message}
			</StatusMessage>
		);
	}

	if (isAuthenticated) {
		return (
			<StatusMessage variant="success">
				Authenticated successfully.
			</StatusMessage>
		);
	}

	return (
		<>
			<Spinner label="Authenticating..." />
			{serverConfig && (
				<>
					<Box marginTop={1}>
						<Text>
							Open the following URL in your browser:{' '}
							<Link url={serverConfig.confirmationUrl.toString()}>
								<Text color="cyan">
									{serverConfig.confirmationUrl.toString()}
								</Text>
							</Link>
						</Text>
					</Box>
					<Box marginTop={1} marginBottom={3}>
						<Text>Auth Code: {serverConfig.code}</Text>
					</Box>
				</>
			)}
		</>
	);
}

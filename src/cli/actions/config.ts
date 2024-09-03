import {readFileSync, writeFileSync} from 'fs';
import os from 'os';
import path from 'path';

type Config = {
	apiKey: string;
};

export const convectConfig = {
	read() {
		return readConfigFileOrDefault();
	},
	write(newConfig: Partial<Config>) {
		writeToConfigFile(newConfig);
	},
};

function writeToConfigFile(newConfig: Partial<Config>) {
	const configPath = path.join(os.homedir(), '.convect');
	const config = readConfigFileOrDefault();
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				...config,
				...newConfig,
			} satisfies Config,
			null,
			2,
		),
	);
}

function readConfigFileOrDefault(): Config {
	const configPath = path.join(os.homedir(), '.convect');
	try {
		return JSON.parse(readFileSync(configPath, 'utf8')) as Config;
	} catch (e) {
		return {
			apiKey: '',
		};
	}
}

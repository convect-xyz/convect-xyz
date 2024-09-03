import FormData from 'form-data';
import fs from 'fs';
import {apiAxios} from '../lib/axios.js';

type UploadOutputsOptions =
	| {
			mode: 'init';
			outfile: string;
			outmanifest: string;
			id: string;
			override: boolean;
	  }
	| {
			mode: 'update';
			id: string;
			outfile: string;
	  };

export async function uploadOutputs(options: UploadOutputsOptions) {
	const {outfile, id} = options;

	const apiKey = process.env['CONVECT_API_KEY'];
	if (!apiKey) {
		throw new Error(
			'API Key is not set. Did you set it with `CONVECT_API_KEY=...`?',
		);
	}

	const bodyFormData = new FormData();
	bodyFormData.append('mode', options.mode);
	bodyFormData.append('id', id);
	bodyFormData.append('handler', fs.createReadStream(outfile));

	if (options.mode === 'init') {
		bodyFormData.append('manifest', fs.createReadStream(options.outmanifest));
		bodyFormData.append('override', options.override.toString());
	}

	try {
		await apiAxios.post('/api/cli/deployments', bodyFormData);
	} catch (e: any) {
		throw e;
	}
}

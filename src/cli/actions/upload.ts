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
	const bodyFormData = new FormData();
	bodyFormData.append('mode', options.mode);
	bodyFormData.append('id', id);
	bodyFormData.append('handler', fs.createReadStream(outfile));

	if (options.mode === 'init') {
		bodyFormData.append('manifest', fs.createReadStream(options.outmanifest));
		bodyFormData.append('override', options.override.toString());
	}

	try {
		return apiAxios
			.post<{
				deploymentUrl: string;
			}>('/api/cli/deployments', bodyFormData)
			.then(res => res.data);
	} catch (e: any) {
		throw new Error(e.response?.data.message ?? 'An unexpected error occurred');
	}
}

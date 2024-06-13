import FormData from 'form-data';
import {apiAxios} from '../lib/axios.js';

type UploadOutputsOptions = {
	project: string;
	handlerName: string;
};

export async function checkHandler(options: UploadOutputsOptions) {
	const bodyFormData = new FormData();
	bodyFormData.append('project', options.project);
	bodyFormData.append('handlerName', options.handlerName);

	try {
		return await apiAxios
			.post('/api/cli/check-handler', bodyFormData)
			.then(r => r.data.exists as boolean);
	} catch (e: any) {
		throw new Error(e.response?.data.message ?? 'An unexpected error occurred');
	}
}

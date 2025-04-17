import axios from 'axios';
import {getAuthHeaders} from './utils.js';

export const apiAxios = axios.create({
	baseURL: process.env.BASE_URL,
});

apiAxios.interceptors.request.use(config => {
	for (const [key, value] of Object.entries(getAuthHeaders())) {
		config.headers[key] = value;
	}
	return config;
});

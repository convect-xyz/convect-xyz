import axios from 'axios';
import {getAuthHeaders} from './utils.js';

export const apiAxios = axios.create({
	baseURL: process.env.BASE_URL,
	headers: getAuthHeaders(),
});

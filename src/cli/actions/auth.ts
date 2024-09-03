import {listen} from 'async-listen';
import {spawn} from 'child_process';
import http from 'http';
import {customAlphabet} from 'nanoid';
import url from 'url';

const nanoid = customAlphabet('123456789QAZWSXEDCRFVTGBYHNUJMIKOLP', 8);

export async function initAuthServer() {
	const {port, server} = await startServer();

	const code = nanoid();
	const redirect = `http://127.0.0.1:${port}`;
	const confirmationUrl = new URL(`${process.env.BASE_URL}/cli/auth`);
	confirmationUrl.searchParams.append('code', code);
	confirmationUrl.searchParams.append('redirect', redirect);

	spawn('open', [confirmationUrl.toString()]);

	return {
		code,
		confirmationUrl,
		server,
	};
}

async function startServer() {
	const server = http.createServer();
	const {port} = await listen(server, 0, '127.0.0.1');

	return {port, server};
}

export async function waitForApiKey(server: http.Server) {
	return new Promise<string>((resolve, reject) => {
		server.on('request', (req, res) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
			res.setHeader(
				'Access-Control-Allow-Headers',
				'Content-Type, Authorization',
			);

			if (req.method === 'OPTIONS') {
				res.writeHead(200);
				res.end();
			} else if (req.method === 'GET') {
				const parsedUrl = url.parse(req.url as string, true);
				const queryParams = parsedUrl.query;
				if (queryParams.cancelled) {
					res.writeHead(200);
					res.end();
					return reject(new Error('Login process cancelled by user.'));
				} else {
					res.writeHead(200);
					res.end();
					const apiKey = queryParams.apiKey;
					if (typeof apiKey !== 'string') {
						return reject(new Error('No API key provided.'));
					}

					return resolve(apiKey);
				}
			} else {
				res.writeHead(405);
				res.end();
			}
		});
	});
}

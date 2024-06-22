import {glob} from 'glob';
import path from 'path';

export async function getConvectFiles() {
	return await glob(`${process.cwd()}/**/*.convect.ts`, {
		ignore: 'node_modules/**',
	}).then(files =>
		files.map(abs => ({
			rel: path.relative(process.cwd(), abs),
			abs,
		})),
	);
}

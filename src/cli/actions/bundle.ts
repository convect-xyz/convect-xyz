import esbuild from 'esbuild';
import path from 'path';
import {hashFileName} from '../lib/utils.js';

export type BundleFileOptions = {
	entrypoint: string;
};

export async function bundleFile(options: BundleFileOptions) {
	const {entrypoint} = options;

	const hashedFileName = await hashFileName(path.basename(entrypoint));

	const outfile = path.join('.ingest', 'outputs', hashedFileName + '.js');
	const outmanifest = path.join('.ingest', 'outputs', hashedFileName + '.json');

	await esbuild.build({
		entryPoints: [entrypoint],
		minify: false,
		target: 'node10.4',
		platform: 'node',
		outfile: outfile,
		bundle: true,
	});

	const {
		default: {default: pipeline},
	} = await import(path.join(process.cwd(), outfile));

	return {outfile, outmanifest, pipeline};
}

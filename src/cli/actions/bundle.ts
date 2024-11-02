import esbuild from 'esbuild';
import path from 'path';

export type BundleFileOptions = {
	entrypoint: string;
};

export async function bundleFile(options: BundleFileOptions) {
	const {entrypoint} = options;

	const projectName = path.dirname(entrypoint).split('/').at(-1) ?? '';
	const fileName = path.basename(entrypoint).split('.').at(0) ?? '';

	const outfile = path.join(
		'.convect',
		'outputs',
		projectName,
		fileName + '.js',
	);
	const outmanifest = path.join(
		'.convect',
		'outputs',
		projectName,
		fileName + '.manifest.json',
	);

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

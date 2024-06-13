import * as esbuild from 'esbuild';

const enableWatch = process.argv.find(arg => arg === '--watch') === '--watch';

(async () => {
	const config = {
		entryPoints: ['./src/cli/**/*.tsx', './src/cli/**/*.ts'],
		outdir: 'dist/cli',
		define: {
			'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL),
		},
	};

	await esbuild.build(config);

	if (enableWatch) {
		const ctx = await esbuild.context(config);
		console.log('Watching…');
		await ctx.watch();
	}
})();

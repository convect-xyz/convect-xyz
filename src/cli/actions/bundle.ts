import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import {encodeEventTopics} from 'viem';
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
	const allTxConfigs = pipeline.handlers as Array<any>;

	const manifest = {
		tx_configs: allTxConfigs.map((v: any) => ({
			start_block: v._startBlock.toString(),
		})),
		log_configs: [] as Array<any>,
	};

	const allLogConfigs = allTxConfigs.map((txConfig: any, txConfigIdx) => [
		txConfig._logs,
		txConfigIdx,
	]);

	const seenLogConfigs = new Map<string, number>();
	for (const [logConfigs, txConfigIdx] of allLogConfigs) {
		for (const logConfig of logConfigs) {
			let topics = encodeEventTopics({abi: [logConfig._event]});
			let eventSignature = topics[0].substring(2);
			let origin = logConfig._origin;

			let identifier = eventSignature + '-' + origin;

			if (seenLogConfigs.has(identifier)) {
				manifest.log_configs[seenLogConfigs.get(identifier)!].tx_configs.push(
					txConfigIdx,
				);
				continue;
			}

			seenLogConfigs.set(identifier, manifest.log_configs.length);
			manifest.log_configs.push({
				address: origin,
				topics: [eventSignature],
				tx_configs: [txConfigIdx],
			});
		}
	}

	fs.writeFileSync(outmanifest, JSON.stringify(manifest));

	return {outfile, outmanifest};
}

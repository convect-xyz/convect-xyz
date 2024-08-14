import fs from 'fs';
import {encodeEventTopics} from 'viem';
import {getProducers} from './getProducers.js';

export type GenerateManifestOptions = {
	pipeline: any;
	outmanifest: string;
};

export async function generateManifest(options: GenerateManifestOptions) {
	const {pipeline, outmanifest} = options;

	const producers = await getProducers(pipeline.chains);

	const allTxConfigs = pipeline.handlers as Array<any>;

	const manifest = {
		tx_configs: allTxConfigs.map((v: any) => ({
			start_block: v._startBlock,
		})),
		log_configs: [] as Array<any>,
		chains: producers.producers.map(p => ({
			chainId: p.chainId,
			name: p.name,
		})),
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

			let identifier = eventSignature + '-' + JSON.stringify(logConfig._origin);

			if (seenLogConfigs.has(identifier)) {
				manifest.log_configs[seenLogConfigs.get(identifier)!].tx_configs.push(
					txConfigIdx,
				);
				continue;
			}

			seenLogConfigs.set(identifier, manifest.log_configs.length);
			manifest.log_configs.push({
				address: logConfig._origin,
				abi: logConfig._event,
				topics: [eventSignature],
				tx_configs: [txConfigIdx],
			});
		}
	}

	fs.writeFileSync(outmanifest, JSON.stringify(manifest));

	return manifest;
}

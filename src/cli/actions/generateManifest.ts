import fs from 'fs';
import {encodeEventTopics} from 'viem';
import {convect, ConvectChain} from '../../sdk/index.js';
import {getProducers} from './getProducers.js';

export type GenerateManifestOptions = {
	pipeline: ReturnType<typeof convect>;
	outmanifest: string;
};

export async function generateManifest(options: GenerateManifestOptions) {
	const {pipeline, outmanifest} = options;
	const allTxConfigs = pipeline.handlers;

	const allChains = allTxConfigs
		.flatMap(txConfig => txConfig._chains)
		.reduce((acc, curr) => {
			if (!acc.includes(curr)) {
				acc.push(curr);
			}
			return acc;
		}, [] as Array<ConvectChain>);

	const producers = await getProducers(allChains.map(c => c.id));

	const manifest = {
		tx_configs: allTxConfigs.map(v => ({
			name: v._name,
			chains: v._chains.map((c: any) => c.chainId),
		})),
		log_configs: [] as Array<any>,
		chains: producers.producers.map(p => ({
			chainId: p.chainId,
			name: p.name,
		})),
	};

	const allLogConfigs = allTxConfigs.map(
		(txConfig, txConfigIdx) => [txConfig._logs, txConfigIdx] as const,
	);

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

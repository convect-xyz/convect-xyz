import fs from 'fs';
import {encodeEventTopics} from 'viem';

export type GenerateManifestOptions = {
	pipeline: any;
	outmanifest: string;
	chainId: number;
};
export async function generateManifest(options: GenerateManifestOptions) {
	const {pipeline, outmanifest, chainId} = options;

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
			let origin =
				typeof logConfig._origin === 'string'
					? logConfig._origin
					: logConfig._origin[chainId];
			if (!origin) {
				throw new Error(`No contract address defined for chain id: ${chainId}`);
			}

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
}

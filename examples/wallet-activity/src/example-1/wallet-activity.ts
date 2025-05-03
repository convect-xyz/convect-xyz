import {convect, ethSepolia, log, transaction} from 'convect-xyz';
import {db} from '../db';
import {activity} from '../db/schema';

const transferHandler = transaction({
	name: 'transfer',
	chains: [ethSepolia],
	logs: [
		log({
			origin: '0x0000000000000000000000000000000000000000',
			signature:
				'event Transfer(address indexed from, address indexed to, uint256 value)',
		}),
	],
	handler: async transactions => {
		const records = transactions.flatMap(tx => tx.logs);

		await db
			.insert(activity)
			.values(
				records.map(log => ({
					from: log.args.from,
					to: log.args.to,
					value: Number(log.args.value),
					transactionHash: log.transactionHash,
					type: 'TRANSFER' as const,
				})),
			)
			.onConflictDoNothing();
	},
});

export default convect({
	handlers: [transferHandler],
});

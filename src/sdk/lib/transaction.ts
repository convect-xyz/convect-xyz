import {AbiEvent} from 'abitype';
import {Address, Log as ViemLog} from 'viem';
import {Log} from './log';

type InferLogs<TLogs> = TLogs extends
	| [Log<infer U>, ...infer Rest]
	| readonly [Log<infer U>, ...infer Rest]
	? U extends AbiEvent
		? ViemLog<bigint, number, false, U, true> | InferLogs<Rest>
		: never
	: never;

export type InferTransaction<TLogs> = {
	from: Address;
	to: Address;
	logs: InferLogs<TLogs>[];
};

export class Transaction<
	const TLogs extends Log<any>[] | readonly Log<any>[],
	THandler,
> {
	private _logs: TLogs;
	private _handler: THandler;
	private _logMap: Map<string, any>;
	private _startBlock: Record<string, number>;

	constructor(options: {
		logs: TLogs;
		handler: THandler;
		startBlock?: Record<string, number>;
	}) {
		this._logs = options.logs;
		this._handler = options.handler;
		this._startBlock = options.startBlock ?? {};
		this._logMap = new Map<string, any>();

		for (const log of this._logs) {
			this._logMap.set((log as any)._topics.at(0), log);
		}
	}
}

export type HandlerContext = {
	chainId: number;
};

type TransactionOptions<
	TLogs extends Log<any>[] | readonly Log<any>[],
	THandler extends (
		transactions: Array<InferTransaction<TLogs>>,
		ctx: HandlerContext,
	) => Promise<void>,
> = {logs: TLogs; handler: THandler; startBlock?: Record<string, number>};

export function transaction<
	const TLogs extends Log<any>[] | readonly Log<any>[],
	THandler extends (
		transactions: Array<InferTransaction<TLogs>>,
		ctx: HandlerContext,
	) => Promise<void>,
>(options: TransactionOptions<TLogs, THandler>) {
	return new Transaction<TLogs, THandler>(options);
}

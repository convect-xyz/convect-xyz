import {AbiEvent} from 'abitype';
import {Address, Log as ViemLog} from 'viem';
import {custom} from './chains';
import {Log} from './log';

type InferLog<TLog> = TLog extends Log<infer U>
	? U extends AbiEvent
		? ViemLog<bigint, number, false, U, true>
		: never
	: never;

type InferLogs<TLogs> = TLogs extends
	| [Log<infer U>, ...infer Rest]
	| readonly [Log<infer U>, ...infer Rest]
	? U extends AbiEvent
		? ViemLog<bigint, number, false, U, true> | InferLogs<Rest>
		: never
	: never;

export type InferTransaction<TTransactionConfig> =
	TTransactionConfig extends Transaction<infer TLogs, any>
		? {
				from: Address;
				to: Address;
				logs: InferLogs<TLogs>[];
		  }
		: never;

export type InferTransactionLog<
	TTransaction,
	TLogName extends string,
> = TTransaction extends Transaction<infer TLogs, any>
	? TLogs extends readonly Log<any>[] | Log<any>[]
		? InferLog<Extract<TLogs[number], {_event: {name: TLogName}}>>
		: never
	: never;

export class Transaction<
	const TLogs extends Log<any>[] | readonly Log<any>[],
	THandler,
> {
	private _logs: TLogs;
	private _handler: THandler;
	private _logMap: Map<string, any>;
	private _startBlock: Record<string, number>;
	private _name: string;
	private _chains?: Array<ReturnType<typeof custom>>;

	constructor(options: {
		logs: TLogs;
		handler: THandler;
		startBlock?: Record<string, number>;
		chains?: Array<ReturnType<typeof custom>>;
		name: string;
	}) {
		this._logs = options.logs;
		this._handler = options.handler;
		this._startBlock = options.startBlock ?? {};
		this._name = options.name;
		this._chains = options.chains;
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
		transactions: Array<{
			from: Address;
			to: Address;
			logs: InferLogs<TLogs>[];
		}>,
		ctx: HandlerContext,
	) => Promise<void>,
> = {
	name: string;
	chains?: Array<ReturnType<typeof custom>>;
	logs: TLogs;
	handler: THandler;
	startBlock?: Record<string, number>;
};

export function transaction<
	const TLogs extends Log<any>[] | readonly Log<any>[],
	THandler extends (
		transactions: Array<{
			from: Address;
			to: Address;
			logs: InferLogs<TLogs>[];
		}>,
		ctx: HandlerContext,
	) => Promise<void>,
>(options: TransactionOptions<TLogs, THandler>) {
	return new Transaction<TLogs, THandler>(options);
}

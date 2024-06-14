import {AbiEvent} from 'abitype';
import {Address, Log as ViemLog} from 'viem';
import {Log} from './log';

type InferLogs<TLogs> = TLogs extends [Log<infer U>, ...infer Rest]
	? U extends AbiEvent
		? ViemLog<bigint, number, false, U, true> | InferLogs<Rest>
		: never
	: never;

export type InferTransaction<TLogs> = {
	from: Address;
	to: Address;
	logs: InferLogs<TLogs>[];
};

export class Transaction<const TLogs extends Array<any>, THandler> {
	private _logs: TLogs;
	private _handler: THandler;
	private _logMap: Map<string, any>;
	private _startBlock: bigint;

	constructor(options: {logs: TLogs; handler: THandler; startBlock?: bigint}) {
		this._logs = options.logs;
		this._handler = options.handler;
		this._startBlock = options.startBlock ?? BigInt(0);
		this._logMap = this._logs.reduce((acc, curr) => {
			acc.set(curr._topics.at(0), curr);
			return acc;
		}, new Map<string, any>());
	}
}

export function transaction<
	const TLogs extends Array<any>,
	THandler = (v: Array<InferTransaction<TLogs>>) => Promise<void>,
>(v: {logs: TLogs; handler: THandler; startBlock?: bigint}) {
	return new Transaction<TLogs, THandler>(v);
}

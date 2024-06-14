import {transaction} from './transaction';

type IngestOptions<
	TTransactions extends Array<ReturnType<typeof transaction>>,
> = {
	handlers: TTransactions;
};

export function ingest<
	TTransactions extends Array<ReturnType<typeof transaction>>,
>(options: IngestOptions<TTransactions>) {
	return options;
}

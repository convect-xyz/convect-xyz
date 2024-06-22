import {transaction} from './transaction';

type IngestOptions<
	TTransactions extends Array<ReturnType<typeof transaction>>,
> = {
	id: string;
	handlers: TTransactions;
};

export function ingest<
	TTransactions extends Array<ReturnType<typeof transaction>>,
>(options: IngestOptions<TTransactions>) {
	return options;
}

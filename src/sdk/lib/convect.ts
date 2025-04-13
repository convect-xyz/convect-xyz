import {transaction} from './transaction';

type ConvectOptions<
	TTransactions extends Array<ReturnType<typeof transaction>>,
> = {
	handlers: TTransactions;
};

export function convect<
	TTransactions extends Array<ReturnType<typeof transaction>>,
>(options: ConvectOptions<TTransactions>) {
	return options;
}

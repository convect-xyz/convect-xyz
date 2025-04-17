import {Log} from './log';
import {transaction} from './transaction';

type ConvectOptions<
	TTransactions extends Array<ReturnType<typeof transaction>>,
> = {
	handlers: TTransactions;
};

export function convect<
	TTransactions extends Array<
		ReturnType<typeof transaction<Log<any>[] | readonly Log<any>[], any>>
	>,
>(options: ConvectOptions<TTransactions>) {
	return options;
}

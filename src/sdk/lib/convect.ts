import {custom} from './chains';
import {transaction} from './transaction';

type ConvectOptions<
	TTransactions extends Array<ReturnType<typeof transaction>>,
> = {
	chains: Array<ReturnType<typeof custom>>;
	handlers: TTransactions;
};

export function convect<
	TTransactions extends Array<ReturnType<typeof transaction>>,
>(options: ConvectOptions<TTransactions>) {
	return options;
}

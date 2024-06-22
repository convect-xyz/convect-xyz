import {AbiEvent, parseAbiItem} from 'abitype';
import {Address, encodeEventTopics} from 'viem';

type Error<T extends string | string[]> = T extends string
	? [`Error: ${T}`]
	: {
			[K in keyof T]: T[K] extends infer Message extends string
				? `Error: ${Message}`
				: never;
	  };

export type S<
	TSignature extends string | readonly string[] | readonly unknown[],
> = Parameters<typeof parseAbiItem<TSignature>>[0];

export class Log<const TAbiEvent extends AbiEvent = AbiEvent> {
	private _topics: string[];
	private _event: TAbiEvent;
	private _origin: Address | Record<number, Address>;

	constructor(options: {
		event: TAbiEvent;
		origin: Address | Record<number, Address>;
	}) {
		this._event = options.event;
		this._origin = options.origin;
		this._topics = encodeEventTopics({
			abi: [options.event as AbiEvent],
		});
	}
}

export function log<
	const TSignature extends string | readonly string[] | readonly unknown[],
	const TAddress extends Address | Record<number, Address>,
>(options: {signature: S<TSignature>; origin: TAddress}) {
	const parsedSignature = parseAbiItem(options.signature);
	if (parsedSignature.type !== 'event') {
		throw new Error('Only events are supported');
	}

	return new Log<
		typeof parsedSignature extends AbiEvent ? typeof parsedSignature : any
	>({
		event: parsedSignature,
		origin: options.origin,
	});
}

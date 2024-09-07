import {
	Abi,
	AbiEvent,
	ExtractAbiEvent,
	ParseAbiItem,
	parseAbiItem,
} from 'abitype';
import {Address, encodeEventTopics} from 'viem';

type AbiBasedEvent = {
	signature?: never;
	abi: Abi;
	eventName: string;
};

type SignatureBasedEvent = {
	signature: string | readonly string[] | readonly unknown[];
	abi?: never;
	eventName?: never;
};

export class Log<const TAbiEvent extends AbiEvent = AbiEvent> {
	_topics: string[];
	_event: TAbiEvent;
	_origin: Address | Record<number, Address>;

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
	const TAbiEvent extends AbiBasedEvent | SignatureBasedEvent,
	const TAddress extends Address | Record<number, Address>,
>(options: {origin: TAddress} & TAbiEvent) {
	const {signature, abi, origin, eventName} = options;
	const parsedSignature =
		signature === undefined
			? abi.find(v => v.type === 'event' && v.name === eventName)!
			: parseAbiItem(signature as any);

	if (parsedSignature.type !== 'event') {
		throw new Error('Only events are supported');
	}

	return new Log<
		TAbiEvent extends AbiBasedEvent
			? ExtractAbiEvent<TAbiEvent['abi'], TAbiEvent['eventName']>
			: TAbiEvent extends SignatureBasedEvent
			? ParseAbiItem<TAbiEvent['signature']>
			: any
	>({
		event: parsedSignature as any,
		origin,
	});
}

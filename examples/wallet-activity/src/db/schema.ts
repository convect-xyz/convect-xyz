import {integer, pgTable, serial, text, unique} from 'drizzle-orm/pg-core';

export const activity = pgTable(
	'activity',
	{
		id: serial('id').primaryKey(),
		from: text('from').notNull(),
		to: text('to').notNull(),
		value: integer('token_id').notNull(),
		transactionHash: text('transaction_hash').notNull(),
		type: text('type', {enum: ['TRANSFER']}).notNull(),
	},
	t => [unique().on(t.transactionHash, t.type)],
);

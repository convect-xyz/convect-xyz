import path from 'path';
import {z} from 'zod';

export const configSchema = z
	.object({
		src: z.string().describe('Source directory'),
	})
	.transform(config => {
		return {
			...config,
			convectBasePath: path.join(process.cwd(), config.src),
		};
	});

export type ConvectConfig = z.infer<typeof configSchema>;

export const loadConfig = async (): Promise<
	ConvectConfig & {
		convectBasePath: string;
	}
> => {
	const {default: config} = await import(`${process.cwd()}/convect.config.mjs`);

	if (!config) {
		throw new Error(
			'Convect config not found in project root. Please create a `convect.config.mjs` file.',
		);
	}

	return configSchema.parse(config);
};

import fs from 'fs';
import path from 'path';

export const validateFunctionPath = async (
	convectDir: string,
	selector: string,
): Promise<string> => {
	const fnPath = path.join(convectDir, `${selector}.convect.ts`);
	const pathExists = fs.existsSync(
		path.join(convectDir, `${selector}.convect.ts`),
	);

	if (!pathExists) {
		throw new Error(`Function not found for selector: ${selector}
In your base Convect directory, did you create a file named \`${selector}.convect.ts\`?`);
	}

	return fnPath;
};

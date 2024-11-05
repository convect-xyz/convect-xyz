export const custom = (id: string, chainId: number) => {
	return {
		id,
		chainId,
	};
};

export const ethMainnet = custom('eth-mainnet', 1);
export const ethSepolia = custom('eth-sepolia', 11155111);
export const blastMainnet = custom('blast-mainnet', 81457);
export const blastSepolia = custom('blast-sepolia', 168587773);
export const polygonMainnet = custom('polygon-mainnet', 137);
export const polygonAmoy = custom('polygon-amoy', 80002);
export const baseMainnet = custom('base-mainnet', 8453);
export const baseSepolia = custom('base-sepolia', 84532);
export const abstractTestnet = custom('abstract-testnet', 11124);

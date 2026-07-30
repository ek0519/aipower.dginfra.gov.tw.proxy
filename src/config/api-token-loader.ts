type ApiTokenConfig = {
	apiKeys?: unknown;
};

const API_TOKEN_CONFIG_PATH = "./api-token.ts";

export const configuredApiKeys: readonly string[] = await import(
	API_TOKEN_CONFIG_PATH
)
	.then((config: ApiTokenConfig) =>
		Array.isArray(config.apiKeys)
			? config.apiKeys.filter(
					(value): value is string => typeof value === "string",
				)
			: [],
	)
	.catch(() => []);

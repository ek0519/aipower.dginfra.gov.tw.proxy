import type { ChatCompletionsBody } from "./model";

const UPSTREAM_CHAT_COMPLETIONS_URL =
	"https://afspod-llm-api.dginfra.gov.tw/projects/392a1838-7af3-4679-8360-c0e24b4bcf8f/api/models/chat/completions";

export type Fetcher = (
	input: string | URL | Request,
	init?: RequestInit,
) => Promise<Response>;

type OpenAIErrorResponseOptions = {
	code: string;
	headers?: HeadersInit;
	message: string;
	param?: string | null;
	status: number;
	type: "invalid_request_error" | "server_error";
};

export const openAIErrorResponse = ({
	code,
	headers,
	message,
	param = null,
	status,
	type,
}: OpenAIErrorResponseOptions) =>
	Response.json(
		{
			error: {
				message,
				type,
				param,
				code,
			},
		},
		{ status, headers },
	);

type EndpointServiceOptions = {
	fetcher: Fetcher;
	upstreamApiKey?: string;
};

type ForwardChatCompletionInput = {
	accept?: string;
	body: ChatCompletionsBody;
};

export const createEndpointService = ({
	fetcher,
	upstreamApiKey,
}: EndpointServiceOptions) => ({
	async forwardChatCompletion({ accept, body }: ForwardChatCompletionInput) {
		const configuredUpstreamApiKey = upstreamApiKey?.trim();

		if (!configuredUpstreamApiKey) {
			return openAIErrorResponse({
				status: 500,
				message: "Server configuration error: X_API_KEY is not set",
				type: "server_error",
				code: "missing_x_api_key",
			});
		}

		const upstreamHeaders = new Headers({
			"content-type": "application/json",
			"x-api-key": configuredUpstreamApiKey,
		});

		if (accept) {
			upstreamHeaders.set("accept", accept);
		}

		try {
			return await fetcher(UPSTREAM_CHAT_COMPLETIONS_URL, {
				method: "POST",
				headers: upstreamHeaders,
				body: JSON.stringify(body),
			});
		} catch {
			return openAIErrorResponse({
				status: 502,
				message: "Unable to reach the upstream chat completion service",
				type: "server_error",
				code: "upstream_unavailable",
			});
		}
	},
});

import type { ChatCompletionsBody } from "./model";

const UPSTREAM_CHAT_COMPLETIONS_URL =
	"https://afspod-llm-api.dginfra.gov.tw/projects/392a1838-7af3-4679-8360-c0e24b4bcf8f/api/models/chat/completions";

export type Fetcher = (
	input: string | URL | Request,
	init?: RequestInit,
) => Promise<Response>;

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
			return {
				ok: false as const,
				reason: "missing_upstream_api_key" as const,
			};
		}

		const upstreamHeaders = new Headers({
			"content-type": "application/json",
			"x-api-key": configuredUpstreamApiKey,
		});

		if (accept) {
			upstreamHeaders.set("accept", accept);
		}

		try {
			const response = await fetcher(UPSTREAM_CHAT_COMPLETIONS_URL, {
				method: "POST",
				headers: upstreamHeaders,
				body: JSON.stringify({ ...body, stream: body.stream ?? false }),
			});

			return { ok: true as const, response };
		} catch {
			return {
				ok: false as const,
				reason: "upstream_unavailable" as const,
			};
		}
	},
});

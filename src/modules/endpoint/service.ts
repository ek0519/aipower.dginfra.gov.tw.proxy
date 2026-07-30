import type { ChatCompletionsBody } from "./model";



export type Fetcher = (
	input: string | URL | Request,
	init?: RequestInit,
) => Promise<Response>;

type EndpointServiceOptions = {
	fetcher: Fetcher;
	upstreamApiKey?: string;
	upstreamChatCompletionsUrl?: string;
};

type ForwardChatCompletionInput = {
	accept?: string;
	body: ChatCompletionsBody;
};

export const createEndpointService = ({
	fetcher,
	upstreamApiKey,
	upstreamChatCompletionsUrl,
}: EndpointServiceOptions) => ({
	async forwardChatCompletion({ accept, body }: ForwardChatCompletionInput) {
		const configuredUpstreamApiKey = upstreamApiKey?.trim();
		const configuredUpstreamChatCompletionsUrl =
			upstreamChatCompletionsUrl?.trim();

		if (!configuredUpstreamApiKey) {
			return {
				ok: false as const,
				reason: "missing_upstream_api_key" as const,
			};
		}

		if (!configuredUpstreamChatCompletionsUrl) {
			return {
				ok: false as const,
				reason: "missing_upstream_chat_completions_url" as const,
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
			const response = await fetcher(configuredUpstreamChatCompletionsUrl, {
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

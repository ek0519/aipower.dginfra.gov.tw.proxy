import { Elysia } from "elysia";
import { configuredApiKeys } from "../../config/api-token-loader";
import { EndpointModel } from "./model";
import {
	createEndpointService,
	type Fetcher,
	openAIErrorResponse,
} from "./service";

const CHAT_COMPLETIONS_PATH = "/v1/chat/completions";

export type EndpointModuleOptions = {
	allowedApiKeys?: readonly string[];
	fetcher?: Fetcher;
	upstreamApiKey?: string;
};

const bearerTokenFrom = (authorization: string | null) =>
	authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

export const createEndpointModule = ({
	allowedApiKeys = configuredApiKeys,
	fetcher = fetch,
	upstreamApiKey = process.env.X_API_KEY,
}: EndpointModuleOptions = {}) => {
	const allowedApiKeySet = new Set(allowedApiKeys);
	const endpointService = createEndpointService({
		fetcher,
		upstreamApiKey,
	});

	return new Elysia({ name: "module.endpoint" })
		.onRequest(({ request }) => {
			if (
				request.method !== "POST" ||
				new URL(request.url).pathname !== CHAT_COMPLETIONS_PATH
			) {
				return;
			}

			const bearerToken = bearerTokenFrom(request.headers.get("authorization"));

			if (!bearerToken || !allowedApiKeySet.has(bearerToken)) {
				return openAIErrorResponse({
					status: 401,
					message: "Invalid or missing API key",
					type: "invalid_request_error",
					code: "invalid_api_key",
					headers: { "www-authenticate": "Bearer" },
				});
			}
		})
		.onError(({ code }) => {
			if (code === "VALIDATION") {
				return openAIErrorResponse({
					status: 400,
					message: `Invalid model. Supported models: ${Object.values(EndpointModel.ChatModel).join(", ")}`,
					type: "invalid_request_error",
					param: "model",
					code: "model_not_supported",
				});
			}
		})
		.post(
			CHAT_COMPLETIONS_PATH,
			({ body, headers }) =>
				endpointService.forwardChatCompletion({
					body,
					accept: headers.accept,
				}),
			{
				body: EndpointModel.chatCompletionsBody,
				detail: {
					tags: ["chat"],
					summary: "Chat completions",
					description:
						"Generates chat completions using the configured upstream service.",
					security: [{ bearerAuth: [] }],
				},
			},
		);
};

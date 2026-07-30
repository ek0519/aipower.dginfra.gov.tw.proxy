import { Elysia } from "elysia";
import { EndpointModel } from "./model";
import { createEndpointService, type Fetcher } from "./service";

const CHAT_COMPLETIONS_PATH = "/v1/chat/completions";

type OpenAIErrorResponseOptions = {
	code: string;
	headers?: HeadersInit;
	message: string;
	param?: string | null;
	status: number;
	type: "invalid_request_error" | "server_error";
};

const openAIErrorResponse = ({
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

export type EndpointModuleOptions = {
	apiKey?: string;
	fetcher?: Fetcher;
	upstreamApiKey?: string;
	upstreamChatCompletionsUrl?: string;
};

const bearerTokenFrom = (authorization: string | null) =>
	authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

export const createEndpointModule = ({
	apiKey,
	fetcher = fetch,
	upstreamApiKey,
	upstreamChatCompletionsUrl,
}: EndpointModuleOptions = {}) => {
	const configuredBearerToken = process.env.BEARER_TOKEN;
	const endpointService = createEndpointService({
		fetcher,
		upstreamApiKey: upstreamApiKey ?? apiKey ?? process.env.X_API_KEY,
		upstreamChatCompletionsUrl:
			upstreamChatCompletionsUrl ?? process.env.UPSTREAM_CHAT_COMPLETIONS_URL,
	});

	return new Elysia({ name: "module.endpoint" })
		.onRequest(({ request }) => {
			const pathname = new URL(request.url).pathname.replace(/\/+$/, "");

			if (request.method !== "POST" || pathname !== CHAT_COMPLETIONS_PATH) {
				return;
			}

			const bearerToken = bearerTokenFrom(request.headers.get("authorization"));

			if (!bearerToken || bearerToken !== configuredBearerToken) {
				return openAIErrorResponse({
					status: 401,
					message: "Invalid or missing API key",
					type: "invalid_request_error",
					code: "invalid_api_key",
					headers: { "www-authenticate": "Bearer" },
				});
			}
		})
		.onError(({ code, error }) => {
			if (code === "VALIDATION") {
				const value = (error as { value?: unknown }).value;
				const model =
					typeof value === "object" &&
					value !== null &&
					"model" in value &&
					typeof value.model === "string"
						? value.model
						: undefined;

				if (
					model !== undefined &&
					!Object.values(EndpointModel.ChatModel).includes(
						model as (typeof EndpointModel.ChatModel)[keyof typeof EndpointModel.ChatModel],
					)
				) {
					return openAIErrorResponse({
						status: 400,
						message: `Invalid model. Supported models: ${Object.values(EndpointModel.ChatModel).join(", ")}`,
						type: "invalid_request_error",
						param: "model",
						code: "model_not_supported",
					});
				}

				return openAIErrorResponse({
					status: 400,
					message: "Invalid request body",
					type: "invalid_request_error",
					code: "invalid_request",
				});
			}
		})
		.post(
			CHAT_COMPLETIONS_PATH,
			async ({ body, headers }) => {
				const result = await endpointService.forwardChatCompletion({
					body,
					accept: headers.accept,
				});

				if (result.ok) {
					return result.response;
				}

				if (result.reason === "missing_upstream_api_key") {
					return openAIErrorResponse({
						status: 500,
						message: "Server configuration error: X_API_KEY is not set",
						type: "server_error",
						code: "missing_x_api_key",
					});
				}

				if (result.reason === "missing_upstream_chat_completions_url") {
					return openAIErrorResponse({
						status: 500,
						message:
							"Server configuration error: UPSTREAM_CHAT_COMPLETIONS_URL is not set",
						type: "server_error",
						code: "missing_upstream_chat_completions_url",
					});
				}

				return openAIErrorResponse({
					status: 502,
					message: "Unable to reach the upstream chat completion service",
					type: "server_error",
					code: "upstream_unavailable",
				});
			},
			{
				body: EndpointModel.chatCompletionsBody,
				response: {
					200: EndpointModel.chatCompletionsResponse,
				},
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

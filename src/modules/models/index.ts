import { Elysia } from "elysia";
import { ModelsModel } from "./model";
import { createModelsService, type ModelsServiceOptions } from "./service";

const MODELS_PATH = "/v1/models";

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

const bearerTokenFrom = (authorization: string | null) =>
	authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

export type ModelsModuleOptions = ModelsServiceOptions;

export const createModelsModule = (options: ModelsModuleOptions = {}) => {
	const configuredBearerToken = process.env.BEARER_TOKEN;
	const modelsService = createModelsService(options);

	return new Elysia({ name: "module.models" })
		.onRequest(({ request }) => {
			const pathname = new URL(request.url).pathname.replace(/\/+$/, "");

			if (request.method !== "GET" || pathname !== MODELS_PATH) {
				return;
			}

			const bearerToken = bearerTokenFrom(
				request.headers.get("authorization"),
			);

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
		.get(MODELS_PATH, () => modelsService.listModels(), {
			response: {
				200: ModelsModel.listResponse,
			},
			detail: {
				tags: ["models"],
				summary: "List models",
				description: "Lists the models available through this API.",
				security: [{ bearerAuth: [] }],
			},
		});
};

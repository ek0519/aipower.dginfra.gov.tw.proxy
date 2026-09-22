import { describe, expect, it } from "bun:test";
import { createApp } from "../src/index";

describe("OpenAPI documentation", () => {
	it("serves the documentation UI at /docs", async () => {
		const response = await createApp({
			upstreamApiKey: "server-secret",
		}).handle(new Request("http://localhost/docs"));

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(await response.text()).toContain("<!doctype html>");
	});

	it("documents the request enums and Bearer authentication", async () => {
		const response = await createApp({
			upstreamApiKey: "server-secret",
		}).handle(new Request("http://localhost/docs/json"));
		const document = (await response.json()) as {
			components: {
				securitySchemes: {
					bearerAuth: {
						scheme: string;
						type: string;
					};
				};
			};
			paths: {
				"/v1/chat/completions": {
					post: {
						requestBody: {
							content: {
								"application/json": {
									schema: {
										required: string[];
										properties: {
											model: { enum: string[] };
											stream: { default: boolean; type: string };
											temperature: {
												maximum: number;
												minimum: number;
												type: string;
											};
											reasoning_effort: { enum: string[] };
											messages: {
												items: {
													required: string[];
													properties: {
														role: { enum: string[] };
														content: {
															anyOf: Array<{
																type: string;
															}>;
														};
													};
												};
												minItems: number;
												type: string;
											};
										};
									};
								};
							};
						};
						security: Array<{ bearerAuth: [] }>;
					};
				};
			};
		};

		expect(response.status).toBe(200);
		expect(
			document.paths["/v1/chat/completions"].post.requestBody.content[
				"application/json"
			].schema.properties.model.enum,
		).toEqual([
			"bge-m3",
			"gpt-oss-safeguard-120b",
			"gpt-oss-120b",
			"Whisper-Large-V3",
			"gemma-4-E4B-it",
			"Devstral-2-123B-Instruct-2512",
			"jina-embeddings-v4-vllm-code",
			"Gemma-3-TAIDE-12b-Chat",
			"embeddinggemma-300m",
			"BGE-Reranker-V2-M3",
			"Llama-3.1-405B-Instruct-FP8",
			"whisper-Breeze-ASR-25",
			"Microsoft-Phi-4-multimodal-instruct",
			"Llama-3.3-70B-Instruct-MI210",
			"Devstral-Small-2507",
			"Llama-3.3-Nemotron-Super-49B-v1",
			"Mistral-Small-3.2-24B-Instruct-2506",
			"Mistral-Small-3.1-24B-Instruct-2503",
			"Google-Gemma-3-27B",
			"Llama-3.3-70B-Instruct",
			"gpt-oss-20b",
			"Phi-4-Reasoning-Plus",
			"Granite-3.1-8B-Instruct",
			"Whisper-Large-V3-Turbo",
			"Mistral-Small-24B-Instruct-2501",
			"Mistral-Large-3-675B-Instruct-2512",
			"gemma-3-12b-it",
			"Foundation-Sec-8B-Instruct",
			"Llama-4-Maverick-17B-128E-Instruct-FP8",
			"NVIDIA-Nemotron-3-Super-120B-A12B",
			"Gemma-3-TAIDE-12b-Chat-2602",
			"gemma-4-31B-it",
			"gemma-4-26B-A4B-it",
			"Breeze-ASR-26",
			"NVIDIA-Nemotron-3-Ultra-550B-A55B",
			"Taiwan-Tongues-ASR-CE",
			"BreezyVoice",
		]);
		expect(
			document.paths["/v1/chat/completions"].post.requestBody.content[
				"application/json"
			].schema.properties.stream,
		).toEqual({ type: "boolean", default: false });
		expect(
			document.paths["/v1/chat/completions"].post.requestBody.content[
				"application/json"
			].schema.properties.reasoning_effort.enum,
		).toEqual(["none", "minimal", "low", "medium", "high", "xhigh"]);
		expect(
			document.paths["/v1/chat/completions"].post.requestBody.content[
				"application/json"
			].schema.properties.temperature,
		).toEqual({ type: "number", minimum: 0, maximum: 2 });
		const messages =
			document.paths["/v1/chat/completions"].post.requestBody.content[
				"application/json"
			].schema.properties.messages;
		expect(
			document.paths["/v1/chat/completions"].post.requestBody.content[
				"application/json"
			].schema.required,
		).toContain("messages");
		expect(messages.type).toBe("array");
		expect(messages.minItems).toBe(1);
		expect(messages.items.required).toEqual(["role"]);
		expect(messages.items.properties.role.enum).toEqual([
			"system",
			"user",
			"assistant",
			"tool",
		]);
		expect(
			messages.items.properties.content.anyOf.map(({ type }) => type),
		).toEqual(["string", "array", "null"]);
		expect(document.components.securitySchemes.bearerAuth).toEqual({
			type: "http",
			scheme: "bearer",
		});
		expect(document.paths["/v1/chat/completions"].post.security).toEqual([
			{ bearerAuth: [] },
		]);
		const documentedResponse = (
			document.paths["/v1/chat/completions"].post as unknown as {
				responses: Record<
					string,
					{
						content: Record<string, { schema: unknown }>;
					}
				>;
			}
		).responses["200"].content["application/json"].schema;
		expect(JSON.stringify(documentedResponse)).toContain('"reasoning"');
	});

	it("documents the model list endpoint", async () => {
		const response = await createApp().handle(
			new Request("http://localhost/docs/json"),
		);
		const document = (await response.json()) as {
			paths: Record<
				string,
				{
					get?: {
						security?: unknown;
						responses?: Record<string, unknown>;
					};
				}
			>;
		};
		const modelsRoute = document.paths["/v1/models"].get;

		expect(response.status).toBe(200);
		expect(modelsRoute?.security).toEqual([{ bearerAuth: [] }]);
		expect(JSON.stringify(modelsRoute?.responses?.["200"])).toContain(
			'"object"',
		);
		expect(JSON.stringify(modelsRoute?.responses?.["200"])).toContain(
			'"data"',
		);
	});
});

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
			"gemma-4-31b-it",
			"gemma-4-26b-a4b-it",
			"gemma-4-12b-it",
			"gpt-oss-120b-32k",
			"gpt-oss-20b-32k",
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
});

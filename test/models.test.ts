import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createApp } from "../src/index";

const TEST_CLIENT_API_KEY = "test-client-api-key";
const authorizedHeaders = {
	authorization: `Bearer ${TEST_CLIENT_API_KEY}`,
};
const originalBearerToken = process.env.BEARER_TOKEN;

beforeEach(() => {
	process.env.BEARER_TOKEN = TEST_CLIENT_API_KEY;
});

afterEach(() => {
	if (originalBearerToken === undefined) {
		delete process.env.BEARER_TOKEN;
	} else {
		process.env.BEARER_TOKEN = originalBearerToken;
	}
});

describe("GET /v1/models", () => {
	it("returns the available models in OpenAI list format", async () => {
		const response = await createApp().handle(
			new Request("http://localhost/v1/models", {
				headers: authorizedHeaders,
			}),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");

		const body = (await response.json()) as {
			object: string;
			data: Array<{
				id: string;
				object: string;
				created: number;
				owned_by: string;
			}>;
		};

		expect(body.object).toBe("list");
		expect(body.data.map((model) => model.id)).toEqual([
			"gemma-4-31b-it",
			"gemma-4-26b-a4b-it",
			"gemma-4-12b-it",
			"gpt-oss-120b-32k",
			"gpt-oss-20b-32k",
		]);
		expect(
			body.data.every(
				(model) =>
					model.object === "model" &&
					numberIsUnixTimestamp(model.created) &&
					model.owned_by === "ai-power",
			),
		).toBe(true);
	});

	it("requires Bearer authentication", async () => {
		const response = await createApp().handle(
			new Request("http://localhost/v1/models"),
		);

		expect(response.status).toBe(401);
		expect(response.headers.get("www-authenticate")).toBe("Bearer");
		expect(await response.json()).toEqual({
			error: {
				message: "Invalid or missing API key",
				type: "invalid_request_error",
				param: null,
				code: "invalid_api_key",
			},
		});
	});
});

const numberIsUnixTimestamp = (value: number) =>
	Number.isInteger(value) && value >= 0;

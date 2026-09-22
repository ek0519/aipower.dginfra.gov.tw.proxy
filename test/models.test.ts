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

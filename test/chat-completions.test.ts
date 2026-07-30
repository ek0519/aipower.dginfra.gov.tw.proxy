import { describe, expect, it } from "bun:test";
import { createApp } from "../src/index";

describe("POST /v1/chat/completions", () => {
  it("forwards the OpenAI request with the configured X-API-KEY", async () => {
    const requestBody = {
      model: "gemma-4-31b-it",
      messages: [{ role: "user", content: "Hello" }],
      temperature: 0.2,
    };
    let upstreamRequest: Request | undefined;

    const app = createApp({
      apiKey: "server-secret",
      fetcher: async (input, init) => {
        upstreamRequest = new Request(input, init);

        return Response.json({
          id: "chatcmpl-123",
          object: "chat.completion",
          choices: [],
        });
      },
    });

    const response = await app.handle(
      new Request("http://localhost/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": "client-must-not-override-this",
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(200);
    expect(upstreamRequest?.headers.get("x-api-key")).toBe("server-secret");
    expect(upstreamRequest?.headers.get("content-type")).toBe("application/json");
    expect(await upstreamRequest?.json()).toEqual(requestBody);
  });

  it("returns an OpenAI-compatible error when X_API_KEY is missing", async () => {
    let fetchCalled = false;
    const app = createApp({
      apiKey: "",
      fetcher: async () => {
        fetchCalled = true;
        return Response.json({});
      },
    });

    const response = await app.handle(
      new Request("http://localhost/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "gemma-4-31b-it",
          messages: [{ role: "user", content: "Hello" }],
        }),
      }),
    );

    expect(response.status).toBe(500);
    expect(fetchCalled).toBe(false);
    expect(await response.json()).toEqual({
      error: {
        message: "Server configuration error: X_API_KEY is not set",
        type: "server_error",
        param: null,
        code: "missing_x_api_key",
      },
    });
  });

  it("returns an OpenAI-compatible 502 when the upstream is unavailable", async () => {
    const app = createApp({
      apiKey: "server-secret",
      fetcher: async () => {
        throw new Error("connection refused");
      },
    });

    const response = await app.handle(
      new Request("http://localhost/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "gemma-4-31b-it",
          messages: [{ role: "user", content: "Hello" }],
        }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: {
        message: "Unable to reach the upstream chat completion service",
        type: "server_error",
        param: null,
        code: "upstream_unavailable",
      },
    });
  });

  it("passes through streaming responses and the client's Accept header", async () => {
    let upstreamRequest: Request | undefined;
    const encoder = new TextEncoder();
    const app = createApp({
      apiKey: "server-secret",
      fetcher: async (input, init) => {
        upstreamRequest = new Request(input, init);

        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          {
            headers: {
              "content-type": "text/event-stream",
              "x-request-id": "upstream-request-123",
            },
          },
        );
      },
    });

    const response = await app.handle(
      new Request("http://localhost/v1/chat/completions", {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gemma-4-31b-it",
          messages: [{ role: "user", content: "Hello" }],
          stream: true,
        }),
      }),
    );

    expect(upstreamRequest?.headers.get("accept")).toBe("text/event-stream");
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("x-request-id")).toBe("upstream-request-123");
    expect(await response.text()).toBe(
      'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n',
    );
  });

  it("rejects a model outside the supported enum", async () => {
    let fetchCalled = false;
    const app = createApp({
      apiKey: "server-secret",
      fetcher: async () => {
        fetchCalled = true;
        return Response.json({});
      },
    });

    const response = await app.handle(
      new Request("http://localhost/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "unsupported-model",
          messages: [{ role: "user", content: "Hello" }],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchCalled).toBe(false);
    expect(await response.json()).toEqual({
      error: {
        message:
          "Invalid model. Supported models: gemma-4-31b-it, gemma-4-26b-a4b-it, gemma-4-12b-it, gpt-oss-120b-32k, gpt-oss-20b-32k",
        type: "invalid_request_error",
        param: "model",
        code: "model_not_supported",
      },
    });
  });

  it("accepts every supported model", async () => {
    const supportedModels = [
      "gemma-4-31b-it",
      "gemma-4-26b-a4b-it",
      "gemma-4-12b-it",
      "gpt-oss-120b-32k",
      "gpt-oss-20b-32k",
    ];
    const forwardedModels: string[] = [];
    const app = createApp({
      apiKey: "server-secret",
      fetcher: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { model: string };
        forwardedModels.push(body.model);
        return Response.json({ choices: [] });
      },
    });

    for (const model of supportedModels) {
      const response = await app.handle(
        new Request("http://localhost/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Hello" }],
          }),
        }),
      );

      expect(response.status).toBe(200);
    }

    expect(forwardedModels).toEqual(supportedModels);
  });
});

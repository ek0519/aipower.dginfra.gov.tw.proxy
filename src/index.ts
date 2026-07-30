import { Elysia, t, type Static } from "elysia";
import { openapi } from "@elysia/openapi";
import { apiKeys } from "./config/api-token";

const UPSTREAM_CHAT_COMPLETIONS_URL =
  "https://afspod-llm-api.dginfra.gov.tw/projects/392a1838-7af3-4679-8360-c0e24b4bcf8f/api/models/chat/completions";

export enum ChatModel {
  Gemma4_31BIt = "gemma-4-31b-it",
  Gemma4_26BA4BIt = "gemma-4-26b-a4b-it",
  Gemma4_12BIt = "gemma-4-12b-it",
  GptOss120B32K = "gpt-oss-120b-32k",
  GptOss20B32K = "gpt-oss-20b-32k",
}

export const ChatCompletionsBodySchema = t.Object(
  {
    model: t.Enum(ChatModel),
  },
  { additionalProperties: true },
);

export type ChatCompletionsBody = Static<typeof ChatCompletionsBodySchema>;

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type AppOptions = {
  allowedApiKeys?: readonly string[];
  apiKey?: string;
  fetcher?: Fetcher;
};

const openAIError = (status: number, message: string, code: string) =>
  Response.json(
    {
      error: {
        message,
        type: "server_error",
        param: null,
        code,
      },
    },
    { status },
  );

const bearerTokenFrom = (authorization: string | undefined) =>
  authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

const invalidApiKeyResponse = () =>
  Response.json(
    {
      error: {
        message: "Invalid or missing API key",
        type: "invalid_request_error",
        param: null,
        code: "invalid_api_key",
      },
    },
    {
      status: 401,
      headers: { "www-authenticate": "Bearer" },
    },
  );

export const createApp = ({
  allowedApiKeys = apiKeys,
  apiKey = process.env.X_API_KEY,
  fetcher = fetch,
}: AppOptions = {}) => {
  const allowedApiKeySet = new Set(allowedApiKeys);

  return new Elysia()
    .use(
      openapi({
        path: "/docs",
        documentation: {
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
              },
            },
          },
        },
      }),
    )
    .onError(({ code }) => {
      if (code === "VALIDATION") {
        return Response.json(
          {
            error: {
              message: `Invalid model. Supported models: ${Object.values(ChatModel).join(", ")}`,
              type: "invalid_request_error",
              param: "model",
              code: "model_not_supported",
            },
          },
          { status: 400 },
        );
      }
    })
    .get("/", () => "Hello Elysia")
    .post("/v1/chat/completions", async ({ body, headers }) => {
      const configuredApiKey = apiKey?.trim();

      if (!configuredApiKey) {
        return openAIError(
          500,
          "Server configuration error: X_API_KEY is not set",
          "missing_x_api_key",
        );
      }

      const upstreamHeaders = new Headers({
        "content-type": "application/json",
        "x-api-key": configuredApiKey,
      });

      if (headers.accept) {
        upstreamHeaders.set("accept", headers.accept);
      }

      try {
        return await fetcher(UPSTREAM_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: upstreamHeaders,
          body: JSON.stringify(body),
        });
      } catch {
        return openAIError(
          502,
          "Unable to reach the upstream chat completion service",
          "upstream_unavailable",
        );
      }
    }, {
      beforeHandle: ({ headers }) => {
        const bearerToken = bearerTokenFrom(headers.authorization);

        if (!bearerToken || !allowedApiKeySet.has(bearerToken)) {
          return invalidApiKeyResponse();
        }
      },
      body: ChatCompletionsBodySchema,
      detail: {
        tags: ["chat"],
        summary: "Chat completions",
        description: "Generates chat completions using the configured upstream service.",
        security: [{ bearerAuth: [] }],
      },
    });
};

if (import.meta.main) {
  const app = createApp().listen(Number(process.env.PORT ?? 3000));

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

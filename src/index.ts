import { Elysia } from "elysia";

const UPSTREAM_CHAT_COMPLETIONS_URL =
  "https://afspod-llm-api.dginfra.gov.tw/projects/392a1838-7af3-4679-8360-c0e24b4bcf8f/api/models/chat/completions";

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type AppOptions = {
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

export const createApp = ({
  apiKey = process.env.X_API_KEY,
  fetcher = fetch,
}: AppOptions = {}) =>
  new Elysia()
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
    });

if (import.meta.main) {
  const app = createApp().listen(Number(process.env.PORT ?? 3000));

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

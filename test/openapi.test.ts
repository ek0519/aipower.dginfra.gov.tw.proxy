import { describe, expect, it } from "bun:test";
import { createApp } from "../src/index";

describe("OpenAPI documentation", () => {
  it("serves the documentation UI at /docs", async () => {
    const response = await createApp({ apiKey: "server-secret" }).handle(
      new Request("http://localhost/docs"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("<!doctype html>");
  });

  it("documents the supported model enum and Bearer authentication", async () => {
    const response = await createApp({ apiKey: "server-secret" }).handle(
      new Request("http://localhost/docs/json"),
    );
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
                    properties: {
                      model: { enum: string[] };
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
    expect(document.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
    });
    expect(
      document.paths["/v1/chat/completions"].post.security,
    ).toEqual([{ bearerAuth: [] }]);
  });
});

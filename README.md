# OpenAI-compatible API proxy

這個 Elysia API 會接受 OpenAI Chat Completions 格式的請求，並代理至：

```text
POST https://afspod-llm-api.dginfra.gov.tw/projects/392a1838-7af3-4679-8360-c0e24b4bcf8f/api/models/chat/completions
```

代理伺服器會自動從 `.env` 讀取 `X_API_KEY`，再以 `X-API-KEY` header 傳給上游。呼叫端不需要知道真正的 API key。

## 啟動

```bash
cp .env.example .env
cp src/config/api-token.example.ts src/config/api-token.ts
```

在 `.env` 填入：

```dotenv
X_API_KEY=your_api_key
PORT=3000
```

在 `src/config/api-token.ts` 加入可使用代理 API 的 Bearer token：

```ts
export const apiKeys = [
  "replace-with-a-client-api-key",
];
```

安裝並啟動：

```bash
bun install
bun run dev
```

OpenAPI 文件：

```text
http://localhost:3000/docs
```

## 呼叫 API

API endpoint：

```text
POST http://localhost:3000/v1/chat/completions
```

支援的 model：

- `gemma-4-31b-it`
- `gemma-4-26b-a4b-it`
- `gemma-4-12b-it`
- `gpt-oss-120b-32k`
- `gpt-oss-20b-32k`

`messages` 至少需要一筆，`role` 支援 `developer`、`system`、`user`、`assistant`、`tool` 與 `function`。`content` 可使用字串、OpenAI content parts 陣列或 `null`，assistant tool-call 訊息也可省略 `content`。`stream` 預設為 `false`；另外支援 `temperature` 與 `reasoning_effort`（`none`、`minimal`、`low`、`medium`、`high`、`xhigh`）。

使用 curl：

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer <api-key-from-api-token.ts>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma-4-31b-it",
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ]
  }'
```

使用 OpenAI JavaScript SDK：

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "<api-key-from-api-token.ts>",
  baseURL: "http://localhost:3000/v1",
});

const response = await client.chat.completions.create({
  model: "gemma-4-31b-it",
  messages: [{ role: "user", content: "你好" }],
});

console.log(response.choices[0]?.message);
```

可用的 Bearer token 定義在 `src/config/api-token.ts` 的 `apiKeys`。缺少 token 或 token 不在清單內時，API 會回傳 HTTP 401 與 OpenAI-compatible `invalid_api_key` error。

串流請求同樣支援，只要在 OpenAI request body 加上 `"stream": true`。

## 驗證

```bash
bun run test
bun run typecheck
```

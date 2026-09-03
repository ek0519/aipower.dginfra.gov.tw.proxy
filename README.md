# OpenAI-compatible API proxy

這是 115年「數位產業跨域軟體基盤暨數位服務躍升計畫」第一梯次算力平台使用的 OpenAI-compatible 代理。

這個 Elysia API 會接受 OpenAI Chat Completions 格式的請求，並代理至：

```text
POST <government-upstream-chat-completions-url>
```

代理伺服器會自動從 `.env` 讀取 `X_API_KEY` 與 `UPSTREAM_CHAT_COMPLETIONS_URL`，分別用來存取上游 API 與指定上游 chat completions 端點。呼叫端不需要知道真正的 API key。

## 啟動

```bash
cp .env.example .env
```

在 `.env` 填入：

```dotenv
X_API_KEY=your_api_key
UPSTREAM_CHAT_COMPLETIONS_URL=<government-upstream-chat-completions-url>
BEARER_TOKEN=your_client_bearer_token
PORT=3000
```

這三個變數的用途如下：

- `X_API_KEY`：政府端給的金鑰
- `UPSTREAM_CHAT_COMPLETIONS_URL`：政府的端點
- `BEARER_TOKEN`：自己用來呼叫代理服務的金鑰

安裝並啟動：

```bash
bun install
bun run dev
```

## Docker binary hosting

Docker build 會在 build stage 將 Elysia 編譯成 `server` binary，runtime image 不需要安裝 Bun。請先準備 `.env`，再執行：

```bash
docker compose up --build -d
```

查看服務狀態與 logs：

```bash
docker compose ps
docker compose logs -f api
```

Docker Compose 服務會暴露在 `http://localhost:3001`；要停止服務：

```bash
docker compose down
```

OpenAPI 文件：

```text
http://localhost:3000/docs
```

`/docs` 會顯示這個代理的 API 文件；`/v1/chat/completions` 的請求格式、Bearer 認證，以及相關設定概念都可以在這裡對照查看。

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

`messages` 至少需要一筆，請求的 `role` 支援 `system`、`user`、`assistant` 與 `tool`。`content` 可使用字串或 OpenAI content parts 陣列；tool message 也可帶有 `tool_call_id`，assistant message 可帶有 `tool_calls`。`stream` 預設為 `false`；`temperature` 限制在 `0` 到 `2`（含邊界），並支援 `reasoning_effort`（`none`、`minimal`、`low`、`medium`、`high`、`xhigh`）。

使用 curl：

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer <api-key-from-env>" \
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
  apiKey: "<api-key-from-env>",
  baseURL: "http://localhost:3000/v1",
});

const response = await client.chat.completions.create({
  model: "gemma-4-31b-it",
  messages: [{ role: "user", content: "你好" }],
});

console.log(response.choices[0]?.message);
```

可用的 Bearer token 來自 `.env` 的 `BEARER_TOKEN`。缺少 token 或 token 不相符時，API 會回傳 HTTP 401 與 OpenAI-compatible `invalid_api_key` error。

串流請求同樣支援，只要在 OpenAI request body 加上 `"stream": true`。

## 驗證

```bash
bun run test
bun run typecheck
```

import { type Static, t } from "elysia";

export enum ChatModel {
	BgeM3 = "bge-m3",
	GptOssSafeguard120B = "gpt-oss-safeguard-120b",
	GptOss120B = "gpt-oss-120b",
	WhisperLargeV3 = "Whisper-Large-V3",
	Gemma4E4BIt = "gemma-4-E4B-it",
	Devstral2_123BInstruct2512 = "Devstral-2-123B-Instruct-2512",
	JinaEmbeddingsV4VllmCode = "jina-embeddings-v4-vllm-code",
	Gemma3Taide12BChat = "Gemma-3-TAIDE-12b-Chat",
	Embeddinggemma300M = "embeddinggemma-300m",
	BgeRerankerV2M3 = "BGE-Reranker-V2-M3",
	Llama3_1_405BInstructFp8 = "Llama-3.1-405B-Instruct-FP8",
	WhisperBreezeAsr25 = "whisper-Breeze-ASR-25",
	MicrosoftPhi4MultimodalInstruct = "Microsoft-Phi-4-multimodal-instruct",
	Llama3_3_70BInstructMi210 = "Llama-3.3-70B-Instruct-MI210",
	DevstralSmall2507 = "Devstral-Small-2507",
	Llama3_3NemotronSuper49Bv1 = "Llama-3.3-Nemotron-Super-49B-v1",
	MistralSmall3_2_24BInstruct2506 = "Mistral-Small-3.2-24B-Instruct-2506",
	MistralSmall3_1_24BInstruct2503 = "Mistral-Small-3.1-24B-Instruct-2503",
	GoogleGemma3_27B = "Google-Gemma-3-27B",
	Llama3_3_70BInstruct = "Llama-3.3-70B-Instruct",
	GptOss20B = "gpt-oss-20b",
	Phi4ReasoningPlus = "Phi-4-Reasoning-Plus",
	Granite3_1_8BInstruct = "Granite-3.1-8B-Instruct",
	WhisperLargeV3Turbo = "Whisper-Large-V3-Turbo",
	MistralSmall24BInstruct2501 = "Mistral-Small-24B-Instruct-2501",
	MistralLarge3_675BInstruct2512 = "Mistral-Large-3-675B-Instruct-2512",
	Gemma3_12BIt = "gemma-3-12b-it",
	FoundationSec8BInstruct = "Foundation-Sec-8B-Instruct",
	Llama4Maverick17B128EInstructFp8 = "Llama-4-Maverick-17B-128E-Instruct-FP8",
	NvidiaNemotron3Super120BA12B = "NVIDIA-Nemotron-3-Super-120B-A12B",
	Gemma3Taide12BChat2602 = "Gemma-3-TAIDE-12b-Chat-2602",
	Gemma4_31BIt = "gemma-4-31B-it",
	Gemma4_26BA4BIt = "gemma-4-26B-A4B-it",
	BreezeAsr26 = "Breeze-ASR-26",
	NvidiaNemotron3Ultra550BA55B = "NVIDIA-Nemotron-3-Ultra-550B-A55B",
	TaiwanTonguesAsrCe = "Taiwan-Tongues-ASR-CE",
	BreezyVoice = "BreezyVoice",
}

export enum ChatMessageRole {
	System = "system",
	User = "user",
	Assistant = "assistant",
	Tool = "tool",
}

export enum ReasoningEffort {
	None = "none",
	Minimal = "minimal",
	Low = "low",
	Medium = "medium",
	High = "high",
	XHigh = "xhigh",
}

export enum ChatCompletionFinishReason {
	Stop = "stop",
	Length = "length",
	ToolCalls = "tool_calls",
	ContentFilter = "content_filter",
	FunctionCall = "function_call",
}

const ChatMessageContentPartSchema = t.Object(
	{
		type: t.String(),
	},
	{ additionalProperties: true },
);

const ChatMessageContentSchema = t.Union([
	t.String(),
	t.Array(ChatMessageContentPartSchema),
	t.Null(),
]);

const ChatCompletionFunctionSchema = t.Object(
	{
		name: t.String(),
		arguments: t.String(),
	},
	{ additionalProperties: true },
);

const ChatCompletionToolCallSchema = t.Object(
	{
		id: t.String(),
		type: t.String(),
		function: t.Optional(ChatCompletionFunctionSchema),
	},
	{ additionalProperties: true },
);

const ChatMessageSchema = t.Object(
	{
		role: t.Enum(ChatMessageRole),
		content: t.Optional(ChatMessageContentSchema),
		tool_call_id: t.Optional(t.String()),
		tool_calls: t.Optional(t.Array(ChatCompletionToolCallSchema)),
	},
	{ additionalProperties: true },
);

const ChatCompletionMessageSchema = t.Object(
	{
		role: t.Literal("assistant"),
		content: t.Optional(ChatMessageContentSchema),
		reasoning: t.Optional(t.String()),
		tool_calls: t.Optional(t.Array(ChatCompletionToolCallSchema)),
	},
	{ additionalProperties: true },
);

const ChatCompletionChoiceSchema = t.Object(
	{
		index: t.Number(),
		message: ChatCompletionMessageSchema,
		logprobs: t.Optional(t.Unknown()),
		finish_reason: t.Union([t.Enum(ChatCompletionFinishReason), t.Null()]),
		stop_reason: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
	},
	{ additionalProperties: true },
);

const ChatCompletionUsageSchema = t.Object(
	{
		prompt_tokens: t.Number(),
		total_tokens: t.Number(),
		completion_tokens: t.Number(),
	},
	{ additionalProperties: true },
);

const ChatCompletionsResponseSchema = t.Object(
	{
		id: t.String(),
		object: t.Literal("chat.completion"),
		created: t.Number(),
		model: t.String(),
		system_fingerprint: t.Optional(t.Union([t.String(), t.Null()])),
		choices: t.Array(ChatCompletionChoiceSchema),
		usage: t.Optional(t.Union([ChatCompletionUsageSchema, t.Null()])),
		total_time_taken: t.Optional(t.String()),
	},
	{ additionalProperties: true },
);

export const EndpointModel = {
	ChatModel,
	ChatMessageRole,
	ReasoningEffort,
	ChatCompletionFinishReason,
	chatMessageContent: ChatMessageContentSchema,
	chatMessageContentPart: ChatMessageContentPartSchema,
	chatMessage: ChatMessageSchema,
	chatCompletionMessage: ChatCompletionMessageSchema,
	chatCompletionChoice: ChatCompletionChoiceSchema,
	chatCompletionUsage: ChatCompletionUsageSchema,
	chatCompletionsResponse: ChatCompletionsResponseSchema,
	chatCompletionsBody: t.Object(
		{
			model: t.Enum(ChatModel),
			messages: t.Array(ChatMessageSchema, { minItems: 1 }),
			stream: t.Optional(t.Boolean({ default: false })),
			temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
			reasoning_effort: t.Optional(t.Enum(ReasoningEffort)),
		},
		{ additionalProperties: true },
	),
} as const;

export type ChatMessage = Static<typeof EndpointModel.chatMessage>;
export type ChatCompletionMessage = Static<
	typeof EndpointModel.chatCompletionMessage
>;
export type ChatCompletionChoice = Static<
	typeof EndpointModel.chatCompletionChoice
>;
export type ChatCompletionUsage = Static<
	typeof EndpointModel.chatCompletionUsage
>;
export type ChatCompletionsResponse = Static<
	typeof EndpointModel.chatCompletionsResponse
>;
export type ChatCompletionsBody = Static<
	typeof EndpointModel.chatCompletionsBody
>;

import { type Static, t } from "elysia";

export enum ChatModel {
	Gemma4_31BIt = "gemma-4-31b-it",
	Gemma4_26BA4BIt = "gemma-4-26b-a4b-it",
	Gemma4_12BIt = "gemma-4-12b-it",
	GptOss120B32K = "gpt-oss-120b-32k",
	GptOss20B32K = "gpt-oss-20b-32k",
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

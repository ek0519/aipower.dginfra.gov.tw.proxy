import { type Static, t } from "elysia";

export enum ChatModel {
	Gemma4_31BIt = "gemma-4-31b-it",
	Gemma4_26BA4BIt = "gemma-4-26b-a4b-it",
	Gemma4_12BIt = "gemma-4-12b-it",
	GptOss120B32K = "gpt-oss-120b-32k",
	GptOss20B32K = "gpt-oss-20b-32k",
}

export enum ChatMessageRole {
	Developer = "developer",
	System = "system",
	User = "user",
	Assistant = "assistant",
	Tool = "tool",
	Function = "function",
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

const ChatMessageSchema = t.Object(
	{
		role: t.Enum(ChatMessageRole),
		content: t.Optional(ChatMessageContentSchema),
	},
	{ additionalProperties: true },
);

export const EndpointModel = {
	ChatModel,
	ChatMessageRole,
	chatMessageContent: ChatMessageContentSchema,
	chatMessageContentPart: ChatMessageContentPartSchema,
	chatMessage: ChatMessageSchema,
	chatCompletionsBody: t.Object(
		{
			model: t.Enum(ChatModel),
			messages: t.Array(ChatMessageSchema, { minItems: 1 }),
		},
		{ additionalProperties: true },
	),
} as const;

export type ChatMessage = Static<typeof EndpointModel.chatMessage>;
export type ChatCompletionsBody = Static<
	typeof EndpointModel.chatCompletionsBody
>;

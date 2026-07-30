import { type Static, t } from "elysia";

export enum ChatModel {
	Gemma4_31BIt = "gemma-4-31b-it",
	Gemma4_26BA4BIt = "gemma-4-26b-a4b-it",
	Gemma4_12BIt = "gemma-4-12b-it",
	GptOss120B32K = "gpt-oss-120b-32k",
	GptOss20B32K = "gpt-oss-20b-32k",
}

export const EndpointModel = {
	ChatModel,
	chatCompletionsBody: t.Object(
		{
			model: t.Enum(ChatModel),
		},
		{ additionalProperties: true },
	),
} as const;

export type ChatCompletionsBody = Static<
	typeof EndpointModel.chatCompletionsBody
>;

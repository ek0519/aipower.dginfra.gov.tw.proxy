import { type Static, t } from "elysia";

const ModelObjectSchema = t.Object(
	{
		id: t.String(),
		object: t.Literal("model"),
		created: t.Number(),
		owned_by: t.String(),
	},
	{ additionalProperties: true },
);

const ModelsListResponseSchema = t.Object(
	{
		object: t.Literal("list"),
		data: t.Array(ModelObjectSchema),
	},
	{ additionalProperties: true },
);

export const ModelsModel = {
	model: ModelObjectSchema,
	listResponse: ModelsListResponseSchema,
} as const;

export type ModelObject = Static<typeof ModelsModel.model>;
export type ModelsListResponse = Static<typeof ModelsModel.listResponse>;

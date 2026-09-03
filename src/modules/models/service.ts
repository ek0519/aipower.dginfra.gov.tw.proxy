import { ChatModel } from "../endpoint/model";
import type { ModelObject, ModelsListResponse } from "./model";

export type ModelsServiceOptions = {
	created?: number;
	ownedBy?: string;
};

export const createModelsService = ({
	created = Math.floor(Date.now() / 1000),
	ownedBy = "ai-power",
}: ModelsServiceOptions = {}) => {
	const models: ModelObject[] = Object.values(ChatModel).map((id) => ({
		id,
		object: "model",
		created,
		owned_by: ownedBy,
	}));

	return {
		listModels: (): ModelsListResponse => ({
			object: "list",
			data: models,
		}),
	};
};

export type ModelsService = ReturnType<typeof createModelsService>;

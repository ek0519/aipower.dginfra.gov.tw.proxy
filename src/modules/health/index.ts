import { Elysia } from "elysia";

export const createHealthModule = () =>
	new Elysia({ name: "module.health" }).get(
		"/",
		() => "Hello Elysia",
		{
			detail: {
				tags: ["health"],
				summary: "Health check",
				description: "Returns a simple response to confirm the service is running.",
				security: [],
			},
		},
	);

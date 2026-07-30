import { openapi } from "@elysia/openapi";
import { Elysia } from "elysia";

export const createDocumentationModule = () =>
	new Elysia({
		name: "module.documentation",
	}).use(
		openapi({
			path: "/docs",
			documentation: {
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
						},
					},
				},
			},
		}),
	);

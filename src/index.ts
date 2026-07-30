import { Elysia } from "elysia";
import { createDocumentationModule } from "./modules/documentation";
import {
	createEndpointModule,
	type EndpointModuleOptions,
} from "./modules/endpoint";
import { createHealthModule } from "./modules/health";

export type AppOptions = EndpointModuleOptions;

export const createApp = (options: AppOptions = {}) =>
	new Elysia()
		.use(createDocumentationModule())
		.use(createHealthModule())
		.use(createEndpointModule(options));

if (import.meta.main) {
	const app = createApp().listen(Number(process.env.PORT ?? 3000));

	console.log(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	);
}

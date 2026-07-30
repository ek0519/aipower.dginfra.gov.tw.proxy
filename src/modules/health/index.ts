import { Elysia } from "elysia";

export const createHealthModule = () =>
	new Elysia({ name: "module.health" }).get("/", () => "Hello Elysia");

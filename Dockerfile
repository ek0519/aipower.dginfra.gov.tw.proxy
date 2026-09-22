FROM oven/bun:1.4.2 AS build

WORKDIR /app

# Install dependencies in a cache-friendly layer.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src ./src

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	src/index.ts

FROM gcr.io/distroless/base AS runtime

WORKDIR /app

COPY --from=build /app/server ./server

ENV NODE_ENV=production

USER nonroot:nonroot
EXPOSE 3000

ENTRYPOINT ["./server"]

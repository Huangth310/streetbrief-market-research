FROM node:22-alpine AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack pnpm install --frozen-lockfile

COPY . .
RUN corepack pnpm build

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["corepack", "pnpm", "start"]

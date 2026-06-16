FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/bot-toolkit/package.json ./packages/bot-toolkit/
RUN npm ci

COPY tsconfig.json ./
COPY packages ./packages
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/bot-toolkit/package.json ./packages/bot-toolkit/
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]

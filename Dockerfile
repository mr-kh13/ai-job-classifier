FROM node:26-slim

RUN npm install --global pnpm@12.11.2

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 2024

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--no-browser"]

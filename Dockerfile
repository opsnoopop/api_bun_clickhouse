# ใช้ Bun official image
FROM oven/bun:1-alpine

# Create app directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies (ถ้ามี)
RUN bun install
RUN bun add @clickhouse/client


# Run API
# bun run index.ts
CMD ["bun", "index.ts"]

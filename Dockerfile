# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build TypeScript
RUN pnpm db:generate
RUN pnpm run build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install pnpm for production deps
RUN npm install -g pnpm

# Copy only production files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 5000

# Start the application
CMD ["pnpm", "start"]

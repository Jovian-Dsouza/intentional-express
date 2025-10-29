FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and other required dependencies
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY src ./src
COPY prisma ./prisma

ARG DATABASE_URL
ARG NODE_ENV
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=${NODE_ENV}

# Generate Prisma Client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL and required runtime libraries
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies and Prisma CLI for migrations
RUN npm ci --omit=dev && \
    npm install -g prisma

# Copy built application and Prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN groupadd -r nodejs -g 1001 && \
    useradd -r -g nodejs -u 1001 nodejs

USER nodejs

EXPOSE 3000

# Start production server with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

# Multi-stage Dockerfile for Production / Staging
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy application source
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built dist from builder stage
COPY --from=builder /app/dist ./dist

# Create persistent data directory
RUN mkdir -p /app/.data

# Expose port 3000
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]

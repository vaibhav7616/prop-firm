# Multi-stage Dockerfile for Production / Staging
# Upgraded to Node 22 to satisfy engine requirements (@supabase >= 22.0.0)
FROM node:22-alpine AS builder

WORKDIR /app

# Configure npm for high resilience against network timeouts and slow mirrors
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 600000

# Copy package manifests first for optimal layer caching
COPY package*.json ./

# Single installation of dependencies
RUN npm install --no-audit --no-fund

# Copy application source
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Prune devDependencies in-place (takes ~2 seconds, ZERO extra network requests)
RUN npm prune --omit=dev

# -------------------------------------------------------------
# Runner stage (Clean, lean production container)
# -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests
COPY package*.json ./

# Copy pre-installed and pruned production node_modules from builder (NO re-downloading from internet!)
COPY --from=builder /app/node_modules ./node_modules

# Copy built distribution (static client assets + server.cjs bundle)
COPY --from=builder /app/dist ./dist

# Create persistent data directory
RUN mkdir -p /app/.data

# Expose port 3000
EXPOSE 3000

# Native Node 22 health check (zero external tools required)
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start server
CMD ["node", "dist/server.cjs"]

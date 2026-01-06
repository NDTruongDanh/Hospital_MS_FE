# ============================================
# OPTIMIZED Next.js 16 Dockerfile (using npm)
# Multi-stage build with standalone output
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (will update lock file if needed)
RUN npm install

# ============================================
# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_BE_BASE_URL=http://localhost:8080/api
ENV NEXT_PUBLIC_BE_BASE_URL=${NEXT_PUBLIC_BE_BASE_URL}

# Build the application (standalone mode enabled in next.config.ts)
RUN npm run build

# ============================================
# Stage 3: Runner (MINIMAL - production only)
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install curl for health check
RUN apk add --no-cache curl

# Copy only necessary files from builder
# public folder for static assets
COPY --from=builder /app/public ./public

# Standalone output (minimal footprint)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]

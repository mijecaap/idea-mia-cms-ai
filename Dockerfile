# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time argument for Prisma generate (provided by Dokploy)
ARG DATABASE_URL

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/src/generated ./src/generated

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname for Next.js
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/webhooks/strapi || exit 1

# Start the application
CMD ["node", "server.js"]

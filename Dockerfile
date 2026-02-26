FROM node:20-alpine AS builder
WORKDIR /app

# Copy root and all workspace package files first
COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/package-lock.json* ./frontend/
COPY server/package.json server/package-lock.json* ./server/

# Install ALL dependencies (including dev deps for building)
RUN npm install --no-audit --no-fund

# Copy frontend source and build
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Copy root and server package files
COPY package.json package-lock.json* ./
COPY server/package.json server/package-lock.json* ./server/

# Install only production dependencies
RUN npm install --production --no-audit --no-fund --workspace=server

# Copy server source
COPY server/ ./server/

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/dist ./server/public

WORKDIR /app/server
ENV PORT 8080
ENV NODE_ENV production
EXPOSE 8080

CMD ["node", "index.js"]

FROM node:20-alpine AS builder
WORKDIR /app

# Install root deps (for workspaces/concurrently if needed)
COPY package.json package-lock.json* ./
# Install frontend deps and build
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN npm install --no-audit --no-fund
COPY frontend ./frontend
RUN npm run build --workspace=frontend

FROM node:20-alpine
WORKDIR /app

# Install server deps
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production --no-audit --no-fund

# Copy server code
COPY server ./server

# Copy built frontend into server/public
COPY --from=builder /app/frontend/dist ./server/public

WORKDIR /app/server
ENV PORT 8080
EXPOSE 8080
CMD ["node", "index.js"]

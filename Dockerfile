# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies (including devDependencies for build)
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Build server
RUN cd server && npm run build

# Copy frontend to server dist
RUN cp -r dist server/dist/dist

# Production stage
FROM node:20-slim

WORKDIR /app

# Install build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy server package files
COPY server/package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy built application
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/dist/dist ./dist/dist

# Create data directory for SQLite
RUN mkdir -p data

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]

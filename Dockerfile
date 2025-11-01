# Use the official Node.js 20 image as the base image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client using a dummy database URL
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --no-optional

# Copy the built application from the base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/prisma ./prisma

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start:prod"]
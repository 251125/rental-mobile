FROM node:20-alpine AS builder

# Build-time env: set to domain in production, IP in development
ARG EXPO_PUBLIC_API_HOST
ENV EXPO_PUBLIC_API_HOST=${EXPO_PUBLIC_API_HOST}

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx expo export --platform web

# ── serve stage ──────────────────────────────────────────────────
FROM node:20-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 8082

CMD ["serve", "dist", "-p", "8082", "-s"]

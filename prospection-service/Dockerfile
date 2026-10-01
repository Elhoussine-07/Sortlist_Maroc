FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src ./src

ENV PORT=8084
EXPOSE 8084

CMD ["sh", "-c", "node src/models/migrate.js && node src/index.js"]

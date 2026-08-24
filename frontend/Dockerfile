FROM node:22-slim

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json* ./
RUN npm install --include=dev

# Copier le code source
COPY . .

ARG VITE_GATEWAY_URL=http://localhost:8080
ARG VITE_NOTIFICATIONS_URL=http://localhost:8085
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_NOTIFICATIONS_URL=$VITE_NOTIFICATIONS_URL

EXPOSE 3000

# Démarrer en mode développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

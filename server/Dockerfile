# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer le dossier logs
RUN mkdir -p logs logs/audit

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "server.js"]

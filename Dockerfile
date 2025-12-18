FROM node:18-alpine

WORKDIR /app

# Installer OpenSSL (recommandé pour Prisma)
RUN apk add --no-cache openssl

# Copier package.json et lock
COPY package*.json ./

# Copier Prisma AVANT npm install
COPY prisma ./prisma

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le reste du code
COPY . .

# Accepter les arguments de build
ARG AUTH_SECRET
ARG DATABASE_URL

# Définir les variables d'environnement
ENV AUTH_SECRET=$AUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL

# Générer Prisma
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]

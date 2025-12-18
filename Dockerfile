FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Copier le dossier prisma (si existe)
COPY prisma ./prisma/ 2>/dev/null || echo "No prisma folder"

# Installer les dépendances
RUN npm install --legacy-peer-deps || npm install

# Copier tout le reste du code
COPY . .

# Générer Prisma (optionnel, peut échouer sans erreur)
RUN npx prisma generate 2>/dev/null || echo "Prisma generation skipped"

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

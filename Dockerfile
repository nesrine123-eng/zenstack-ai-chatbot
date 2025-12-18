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

# Générer Prisma
RUN npx prisma generate

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]



FROM node:18-alpine

WORKDIR /app

# Copier package.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code
COPY . .

# Build Vite
RUN npm run build

# Installer un serveur simple pour servir le build
RUN npm install -g serve

# Exposer le port
EXPOSE 3000

# Lancer l'application avec serve
CMD ["serve", "-s", "dist", "-l", "3000"]

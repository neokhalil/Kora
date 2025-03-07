#!/bin/bash
# Script pour démarrer l'application en environnement de production

# Définir l'environnement
export NODE_ENV=production

# S'assurer que la configuration de production est définie
node scripts/setup-env.js setup-prod

# Construire l'application
echo "Construction de l'application pour la production..."
npm run build

# Démarrer l'application
echo "Démarrage de Kora en environnement de production..."
node dist/index.js
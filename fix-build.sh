#!/bin/bash

# Script de build consolidé qui contourne les problèmes de résolution de modules
export NODE_ENV=production

echo "=== Démarrage du build consolidé ==="

# 1. Nettoyage des fichiers temporaires
echo "1. Nettoyage des fichiers temporaires..."
rm -rf .vite-temp
rm -rf node_modules/.vite
rm -rf node_modules/.vite-temp
mkdir -p dist/public

# 2. Forcer l'environnement de production
echo "2. Environnement défini: NODE_ENV=${NODE_ENV}"

# 3. Compilation manuelle du frontend
echo "3. Compilation du frontend..."
# Utiliser npx pour exécuter vite directement
npx vite build

# 4. Compilation du backend
echo "4. Compilation du backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 5. Configuration du répertoire server/public
echo "5. Configuration du répertoire server/public..."
rm -rf server/public
mkdir -p server/public
cp -r dist/public/* server/public/

echo "=== Build terminé avec succès ==="
echo "Pour démarrer l'application en production:"
echo "NODE_ENV=production node dist/index.js"

#!/bin/bash

# Script pour synchroniser l'environnement de production avec l'environnement de test
# À exécuter dans l'environnement de production

echo "===== Synchronisation de l'environnement de production depuis l'environnement de test ====="

# 1. Sauvegarde des fichiers de configuration spécifiques à l'environnement de production
echo "1. Sauvegarde des fichiers de configuration de production..."
cp .env .env.backup.$(date +%Y%m%d%H%M%S)
cp server/config/env.production.ts server/config/env.production.ts.backup.$(date +%Y%m%d%H%M%S)

# 2. Récupération des derniers changements de l'environnement de test
# Remplacez l'URL ci-dessous par l'URL réelle de votre environnement de test
echo "2. Récupération des derniers changements depuis l'environnement de test..."

# Configuration Git pour récupération depuis le dépôt partagé
git remote -v | grep -q origin || git remote add origin https://github.com/neokhalil/Kora.git
git fetch origin
git merge origin/main

# 3. Réappliquer les configurations spécifiques à l'environnement de production
echo "3. Réapplication des configurations de production..."
# Cette étape est déjà gérée par la préservation des fichiers .env et env.production.ts

# 4. Mise à jour des dépendances
echo "4. Mise à jour des dépendances..."
npm ci

# 5. Construction de l'application pour la production
echo "5. Construction de l'application..."
npm run build

# 6. Vérification du répertoire de build
echo "6. Vérification du répertoire de build..."
if [ ! -d "server/public" ] || [ -z "$(ls -A server/public 2>/dev/null)" ]; then
  echo "Le répertoire de build est vide, exécution du script de correction..."
  ./scripts/fix-build-directory.sh
fi

# 7. Application des migrations de base de données si nécessaire
echo "7. Application des migrations de base de données..."
npm run db:push

echo "===== Synchronisation terminée ====="
echo "L'environnement de production est maintenant synchronisé avec l'environnement de test."
echo "Vous pouvez démarrer l'application avec 'npm run start'."
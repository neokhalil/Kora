#!/bin/bash

# Script pour synchroniser l'environnement de test avec l'environnement de développement
# À exécuter dans l'environnement de test

echo "===== Synchronisation de l'environnement de test depuis l'environnement de développement ====="

# 1. Sauvegarde des fichiers de configuration spécifiques à l'environnement de test
echo "1. Sauvegarde des fichiers de configuration de test..."
cp .env .env.backup.$(date +%Y%m%d%H%M%S)
cp server/config/env.test.ts server/config/env.test.ts.backup.$(date +%Y%m%d%H%M%S)

# 2. Récupération des derniers changements de l'environnement de développement
# Remplacez l'URL ci-dessous par l'URL réelle de votre environnement de développement
echo "2. Récupération des derniers changements depuis l'environnement de développement..."

# Configuration Git pour récupération depuis le dépôt partagé
git remote -v | grep -q origin || git remote add origin https://github.com/neokhalil/Kora.git
git fetch origin
git merge origin/main

# 3. Réappliquer les configurations spécifiques à l'environnement de test
echo "3. Réapplication des configurations de test..."
# Cette étape est déjà gérée par la préservation des fichiers .env et env.test.ts

# 4. Mise à jour des dépendances
echo "4. Mise à jour des dépendances..."
npm ci

# 5. Construction de l'application pour l'environnement de test
echo "5. Construction de l'application..."

# Vérification de l'existence du script de build amélioré
if [ -f "scripts/build-with-fix.sh" ]; then
  echo "Utilisation du script build-with-fix.sh pour une meilleure gestion des dossiers..."
  chmod +x scripts/build-with-fix.sh
  NODE_ENV=production ./scripts/build-with-fix.sh
else
  # Méthode traditionnelle
  npm run build
  
  # 6. Vérification du répertoire de build
  echo "6. Vérification du répertoire de build..."
  if [ ! -d "server/public" ] || [ -z "$(ls -A server/public 2>/dev/null)" ]; then
    echo "Le répertoire de build est vide, exécution du script de correction..."
    ./scripts/fix-build-directory.sh
  fi
fi

# 7. Application des migrations de base de données si nécessaire
echo "7. Application des migrations de base de données..."
NODE_ENV=test npm run db:push

echo "===== Synchronisation terminée ====="
echo "L'environnement de test est maintenant synchronisé avec l'environnement de développement."
echo "Vous pouvez démarrer l'application avec 'NODE_ENV=test npm run dev'."
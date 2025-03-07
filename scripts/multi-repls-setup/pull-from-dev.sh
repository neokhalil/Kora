#!/bin/bash
# Script pour récupérer les mises à jour de l'environnement de développement

echo "=== Mise à jour depuis l'environnement de développement ==="

# Vérifier si Git est initialisé
if [ ! -d .git ]; then
  echo "❌ Erreur: Dépôt Git non initialisé"
  exit 1
fi

# Sauvegarder les fichiers de configuration spécifiques à l'environnement
echo "🔄 Sauvegarde des configurations spécifiques à cet environnement..."
cp -f .env .env.backup 2>/dev/null || :
cp -f server/config/environments.ts server/config/environments.ts.backup 2>/dev/null || :

# Récupérer les derniers changements
echo "🔄 Récupération des derniers changements depuis GitHub..."
git fetch origin main

# Vérifier s'il y a des différences
if git diff --quiet HEAD origin/main; then
  echo "✅ Déjà à jour avec la dernière version"
else
  echo "🔄 Mise à jour avec la dernière version..."
  git pull origin main

  # Restaurer les fichiers de configuration spécifiques
  echo "🔄 Restauration des configurations spécifiques à cet environnement..."
  [ -f .env.backup ] && cp -f .env.backup .env
  [ -f server/config/environments.ts.backup ] && cp -f server/config/environments.ts.backup server/config/environments.ts
  
  # Mettre à jour les dépendances si nécessaire
  if git diff --name-only HEAD@{1} HEAD | grep -q "package.json"; then
    echo "🔄 Mise à jour des dépendances..."
    npm ci
  fi
  
  # Appliquer les migrations de base de données si nécessaire
  if git diff --name-only HEAD@{1} HEAD | grep -q "shared/schema.ts"; then
    echo "🔄 Application des migrations de base de données..."
    npm run db:push
  fi
  
  # Reconstruire l'application
  echo "🔄 Reconstruction de l'application..."
  npm run build
fi

# Supprimer les sauvegardes
rm -f .env.backup server/config/environments.ts.backup

echo ""
echo "✅ Mise à jour terminée avec succès!"
echo ""
echo "ÉTAPES SUIVANTES:"
echo "1. Testez l'application localement: npm run dev"
echo "2. Si tout fonctionne correctement, cliquez sur 'Deploy' dans Replit"
echo ""
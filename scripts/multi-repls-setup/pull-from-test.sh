#!/bin/bash
# Script pour récupérer une version spécifique depuis l'environnement de test

# Vérifier si une version est spécifiée
version=$1
if [ -z "$version" ]; then
  echo "❌ Erreur: Version non spécifiée"
  echo "   Usage: $0 <version>"
  echo "   Exemple: $0 v1.0.0"
  exit 1
fi

echo "=== Déploiement de la version $version en production ==="

# Vérifier si Git est initialisé
if [ ! -d .git ]; then
  echo "❌ Erreur: Dépôt Git non initialisé"
  exit 1
fi

# Sauvegarder les fichiers de configuration spécifiques à la production
echo "🔄 Sauvegarde des configurations spécifiques à l'environnement de production..."
cp -f .env .env.backup 2>/dev/null || :
cp -f server/config/environments.ts server/config/environments.ts.backup 2>/dev/null || :

# Vérifier si le tag existe
echo "🔄 Vérification de la version $version..."
git fetch --tags
if ! git tag | grep -q "$version"; then
  echo "❌ Erreur: Version $version introuvable"
  echo "   Vérifiez que le tag a bien été poussé vers GitHub"
  exit 1
fi

# Créer une branche de sauvegarde avant de checkout
current_branch=$(git branch --show-current)
backup_branch="backup-$(date +%Y%m%d-%H%M%S)"
echo "🔄 Création d'une branche de sauvegarde $backup_branch..."
git branch "$backup_branch"

# Checkout la version spécifiée
echo "🔄 Basculement vers la version $version..."
git checkout "$version"

# Restaurer les fichiers de configuration spécifiques
echo "🔄 Restauration des configurations spécifiques à la production..."
[ -f .env.backup ] && cp -f .env.backup .env
[ -f server/config/environments.ts.backup ] && cp -f server/config/environments.ts.backup server/config/environments.ts

# Mettre à jour les dépendances
echo "🔄 Mise à jour des dépendances..."
npm ci

# Appliquer les migrations de base de données
echo "🔄 Application des migrations de base de données..."
npm run db:push

# Reconstruire l'application
echo "🔄 Reconstruction de l'application..."
npm run build

# Supprimer les sauvegardes
rm -f .env.backup server/config/environments.ts.backup

echo ""
echo "✅ Déploiement de la version $version préparé avec succès!"
echo ""
echo "ÉTAPES SUIVANTES:"
echo "1. Testez l'application localement: npm run dev"
echo "2. Si tout fonctionne correctement, cliquez sur 'Deploy' dans Replit"
echo ""
echo "Note: Une branche de sauvegarde '$backup_branch' a été créée."
echo "      Pour revenir à l'état précédent, exécutez: git checkout $backup_branch"
echo ""
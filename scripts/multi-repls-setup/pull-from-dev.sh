#!/bin/bash
# Script pour récupérer les changements depuis l'environnement de développement

echo "=== Récupération des changements depuis l'environnement de développement ==="

# Vérifier si Git est initialisé
if [ ! -d .git ]; then
  echo "❌ Erreur: Dépôt Git non initialisé"
  echo "   Suivez les instructions dans scripts/multi-repls-setup/git-setup.md"
  exit 1
fi

# Sauvegarder les fichiers de configuration spécifiques à l'environnement de test
echo "🔄 Sauvegarde des configurations spécifiques à l'environnement de test..."
cp -f .env .env.backup 2>/dev/null || :
cp -f server/config/environments.ts server/config/environments.ts.backup 2>/dev/null || :

# Vérifier s'il y a des modifications locales non committées
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Vous avez des changements locaux non committés"
  echo "   Ces changements seront temporairement mis de côté"
  
  # Stash les changements locaux
  git stash save "Changements avant pull depuis dev - $(date +%Y-%m-%d)"
  stashed=true
else
  stashed=false
fi

# S'assurer que nous sommes sur la branche main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
  echo "⚠️ Vous n'êtes pas sur la branche main (branche actuelle: $current_branch)"
  read -p "Voulez-vous basculer vers la branche main? (o/n): " should_switch
  
  if [[ $should_switch == "o" || $should_switch == "O" ]]; then
    git checkout main
    echo "✅ Basculé vers la branche main"
  else
    echo "⚠️ Récupération sur la branche $current_branch (non main)"
  fi
fi

# Récupérer les derniers changements
echo "🔄 Récupération des derniers changements depuis le dépôt distant..."
git fetch origin
git pull origin $(git branch --show-current)

# Restaurer les fichiers de configuration spécifiques
echo "🔄 Restauration des configurations spécifiques à l'environnement de test..."
[ -f .env.backup ] && cp -f .env.backup .env
[ -f server/config/environments.ts.backup ] && cp -f server/config/environments.ts.backup server/config/environments.ts

# Mettre à jour les dépendances
echo "🔄 Mise à jour des dépendances..."
npm ci

# Appliquer les migrations de base de données
echo "🔄 Application des migrations de base de données..."
npm run db:push

# Restaurer les changements locaux si nécessaire
if [ "$stashed" = true ]; then
  echo "🔄 Restauration des changements locaux..."
  git stash pop
fi

# Supprimer les sauvegardes
rm -f .env.backup server/config/environments.ts.backup

echo ""
echo "✅ Récupération terminée avec succès!"
echo ""
echo "ÉTAPES SUIVANTES:"
echo "1. Vérifiez que l'application fonctionne correctement: npm run dev"
echo "2. Si tout est OK, cliquez sur 'Deploy' dans Replit"
echo ""
#!/bin/bash
# Script pour synchroniser le code de l'environnement de développement vers test

echo "=== Préparation pour la synchronisation vers l'environnement de test ==="

# Vérifier si Git est initialisé
if [ ! -d .git ]; then
  echo "❌ Erreur: Dépôt Git non initialisé"
  echo "   Suivez les instructions dans scripts/multi-repls-setup/git-setup.md"
  exit 1
fi

# Vérifier s'il y a des modifications non committées
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Vous avez des changements non committés"
  
  # Demander si l'utilisateur veut continuer
  read -p "Voulez-vous committer ces changements avant de synchroniser? (o/n): " should_commit
  
  if [[ $should_commit == "o" || $should_commit == "O" ]]; then
    read -p "Message de commit: " commit_message
    
    if [ -z "$commit_message" ]; then
      commit_message="Synchronisation vers test - $(date +%Y-%m-%d)"
    fi
    
    git add .
    git commit -m "$commit_message"
    echo "✅ Changements committés avec succès!"
  else
    echo "❌ Synchronisation annulée. Committez vos changements avant de réessayer."
    exit 1
  fi
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
    echo "⚠️ Synchronisation avec la branche $current_branch (non main)"
  fi
fi

# Récupérer les derniers changements
echo "🔄 Récupération des derniers changements depuis le dépôt distant..."
git pull origin $(git branch --show-current)

# Pousser les changements vers Github
echo "🔄 Envoi des changements vers le dépôt distant..."
git push origin $(git branch --show-current)

echo ""
echo "✅ Synchronisation terminée!"
echo ""
echo "ÉTAPES SUIVANTES:"
echo "1. Allez dans votre Repl de test"
echo "2. Exécutez: ./scripts/multi-repls-setup/pull-from-dev.sh"
echo ""
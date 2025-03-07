#!/bin/bash
# Script pour synchroniser le code de l'environnement de développement vers test

echo "=== Synchronisation vers l'environnement de test ==="

# Vérifier si Git est initialisé
if [ ! -d .git ]; then
  echo "❌ Erreur: Dépôt Git non initialisé"
  echo "   Exécutez les commandes suivantes pour configurer Git:"
  echo "   git init"
  echo "   git remote add origin https://github.com/VOTRE_USERNAME/kora-app.git"
  exit 1
fi

# Vérifier si des changements sont en attente
if [ -n "$(git status --porcelain)" ]; then
  echo "🔄 Changements détectés, préparation du commit..."
  
  # Ajouter les fichiers modifiés
  git add .
  
  # Demander un message de commit ou utiliser un par défaut
  read -p "Message de commit (ou Entrée pour utiliser la date): " commit_msg
  if [ -z "$commit_msg" ]; then
    commit_msg="Mise à jour pour test - $(date +%Y-%m-%d_%H-%M-%S)"
  fi
  
  # Commit des changements
  git commit -m "$commit_msg"
else
  echo "✅ Aucun changement détecté dans le code source"
fi

# Pousser vers GitHub
echo "🔄 Envoi des changements vers le dépôt distant..."
git push origin main

echo ""
echo "✅ Synchronisation terminée avec succès!"
echo ""
echo "ÉTAPES SUIVANTES:"
echo "1. Allez dans votre Repl de test"
echo "2. Exécutez: ./scripts/multi-repls-setup/pull-from-dev.sh"
echo "3. Après, cliquez sur le bouton 'Deploy' dans Replit"
echo ""
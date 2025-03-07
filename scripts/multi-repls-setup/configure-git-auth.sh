#!/bin/bash
# Script pour configurer l'authentification Git avec GitHub

# Vérifier si le token est défini
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Erreur: Token GitHub non défini"
  echo "   Ajoutez le secret GITHUB_TOKEN dans les paramètres du Repl"
  exit 1
fi

# Configurer git pour utiliser le token
git config --global credential.helper store
echo "https://oauth2:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

echo "✅ Authentification Git configurée avec succès!"

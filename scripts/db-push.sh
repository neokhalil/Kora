#!/bin/bash

# Script pour contourner l'erreur "drizzle-kit: command not found"
# Utilise npx pour exécuter drizzle-kit même si la commande n'est pas trouvée directement

echo "=== Exécution de drizzle-kit push avec npx ==="

# Vérification si NODE_ENV est défini, sinon utiliser l'environnement de développement
if [ -z "$NODE_ENV" ]; then
  echo "Aucun environnement spécifié, utilisation de l'environnement de développement par défaut"
  NODE_ENV="development"
else
  echo "Utilisation de l'environnement: $NODE_ENV"
fi

# Exécution de la commande avec npx
echo "Exécution de la migration avec npx drizzle-kit push:pg..."
NODE_ENV=$NODE_ENV npx drizzle-kit push:pg

# Vérification du statut de la commande
if [ $? -eq 0 ]; then
  echo "✅ Migration réussie!"
else
  echo "❌ Erreur lors de la migration. Vérifiez les messages d'erreur ci-dessus."
  
  # Vérification de l'installation de drizzle-kit
  if ! npm list -g drizzle-kit > /dev/null 2>&1 && ! npm list drizzle-kit > /dev/null 2>&1; then
    echo "⚠️ drizzle-kit ne semble pas être installé. Tentative d'installation..."
    npm install -D drizzle-kit
    
    echo "Nouvelle tentative de migration après installation..."
    NODE_ENV=$NODE_ENV npx drizzle-kit push:pg
  fi
fi

echo "=== Fin du script ==="
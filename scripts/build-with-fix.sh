#!/bin/bash

# Script pour construire l'application et corriger automatiquement le problème de dossier public

echo "=== Construction de l'application avec correction automatique ==="

# Construction avec le bon environnement
echo "Démarrage du build..."
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV non défini, utilisation de NODE_ENV=production"
  NODE_ENV=production npm run build
else
  echo "Utilisation de NODE_ENV=$NODE_ENV"
  npm run build
fi

# Exécution du script post-build pour créer le lien symbolique
echo "Exécution du script post-build pour corriger le dossier public..."
node scripts/post-build.js

echo "=== Build terminé ==="
echo "Vous pouvez maintenant démarrer l'application avec 'npm run dev' ou 'npm run start'"
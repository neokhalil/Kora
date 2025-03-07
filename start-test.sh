#!/bin/bash
# Script pour démarrer l'application en environnement de test

# Définir l'environnement
export NODE_ENV=test

# S'assurer que la configuration de test est définie
node scripts/setup-env.js setup-test

# Démarrer l'application
echo "Démarrage de Kora en environnement de test..."
tsx server/index.ts
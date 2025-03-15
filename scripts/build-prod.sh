#!/bin/bash

# Script pour effectuer un build de production complet avec correction du répertoire de build
# Version: 1.0 - 15 mars 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Démarrage du build de production complet ===${NC}"

# 1. Force l'environnement de production
export NODE_ENV=production
echo -e "${YELLOW}Environnement défini: NODE_ENV=${NODE_ENV}${NC}"

# 2. Exécution du build standard
echo -e "${YELLOW}Exécution du build Vite et ESBuild...${NC}"
npm run build || {
  echo -e "${RED}Erreur lors du build. Vérifiez les logs ci-dessus.${NC}"
  exit 1
}

# 3. Exécution du script post-build pour corriger le répertoire server/public
echo -e "${YELLOW}Exécution du script post-build pour la correction des répertoires...${NC}"
node scripts/post-build.js || {
  echo -e "${RED}Erreur lors de l'exécution du script post-build.${NC}"
  
  # Tentative de correction manuelle
  echo -e "${YELLOW}Tentative de correction manuelle...${NC}"
  
  if [ -d "dist/public" ] && [ ! -d "server/public" ]; then
    echo -e "${YELLOW}Création du lien symbolique server/public -> dist/public${NC}"
    mkdir -p server
    ln -sf ../dist/public server/public || {
      echo -e "${YELLOW}Impossible de créer le lien symbolique, copie des fichiers à la place...${NC}"
      mkdir -p server/public
      cp -r dist/public/* server/public/
    }
  fi
}

# 4. Vérification finale
if [ -d "server/public" ] && [ -n "$(ls -A server/public 2>/dev/null)" ]; then
  echo -e "${GREEN}Vérification finale: répertoire server/public correctement configuré.${NC}"
  echo -e "${GREEN}=== Build de production terminé avec succès ===${NC}"
  echo -e "${BLUE}Pour démarrer l'application en production:${NC}"
  echo -e "${YELLOW}NODE_ENV=production npm start${NC}"
else
  echo -e "${RED}Erreur: Le répertoire server/public est absent ou vide après le build.${NC}"
  exit 1
fi
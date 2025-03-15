#!/bin/bash

# Script de build optimisé avec correction automatique des répertoires
# Version: 1.0 - 15 mars 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Début du processus de build optimisé ===${NC}"

# 1. Détection de l'environnement
if [ -z "$NODE_ENV" ]; then
  echo -e "${YELLOW}Aucun environnement NODE_ENV défini, utilisation de 'production' par défaut${NC}"
  export NODE_ENV=production
else
  echo -e "${YELLOW}Environnement détecté: $NODE_ENV${NC}"
fi

# 2. Construction de l'application
echo -e "${YELLOW}1. Exécution du build Vite...${NC}"
npm run build || {
  echo -e "${RED}Erreur lors du build. Vérifiez les logs ci-dessus.${NC}"
  exit 1
}

# 3. Vérification et correction du répertoire server/public
echo -e "${YELLOW}2. Vérification du répertoire server/public...${NC}"

if [ ! -d "server/public" ] || [ -z "$(ls -A server/public 2>/dev/null)" ]; then
  echo -e "${YELLOW}Le répertoire server/public est absent ou vide. Correction...${NC}"
  
  # Vérifier si le répertoire dist/public existe et contient des fichiers
  if [ -d "dist/public" ] && [ -n "$(ls -A dist/public 2>/dev/null)" ]; then
    echo -e "${YELLOW}Le répertoire dist/public existe avec des fichiers. Création du lien symbolique...${NC}"
    
    # Supprimer server/public s'il existe
    if [ -d "server/public" ]; then
      echo -e "${YELLOW}Suppression du répertoire server/public existant...${NC}"
      rm -rf server/public
    fi
    
    # Création du répertoire server si nécessaire
    if [ ! -d "server" ]; then
      echo -e "${YELLOW}Création du répertoire server...${NC}"
      mkdir -p server
    fi
    
    # Essayer de créer un lien symbolique
    if ln -sf ../dist/public server/public; then
      echo -e "${GREEN}Lien symbolique créé avec succès.${NC}"
    else
      echo -e "${YELLOW}Impossible de créer le lien symbolique. Copie des fichiers...${NC}"
      mkdir -p server/public
      cp -r dist/public/* server/public/
      echo -e "${GREEN}Fichiers copiés avec succès.${NC}"
    fi
  else
    echo -e "${RED}Le répertoire dist/public n'existe pas ou est vide. Build incorrect.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Le répertoire server/public existe et contient des fichiers. Aucune correction nécessaire.${NC}"
fi

# 4. Vérification de l'état du build
if [ -d "server/public" ] && [ -n "$(ls -A server/public 2>/dev/null)" ]; then
  echo -e "${GREEN}Vérification finale: répertoire server/public correctement configuré.${NC}"
  echo -e "${GREEN}=== Build terminé avec succès ===${NC}"
  
  # Si nous sommes en environnement de production, afficher un message supplémentaire
  if [ "$NODE_ENV" = "production" ]; then
    echo -e "${BLUE}Pour démarrer l'application en production:${NC}"
    echo -e "${YELLOW}NODE_ENV=production npm start${NC}"
  fi
else
  echo -e "${RED}Échec de la vérification finale: le répertoire server/public est absent ou vide.${NC}"
  exit 1
fi
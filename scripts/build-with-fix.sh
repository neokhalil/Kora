#!/bin/bash

# Script pour construire l'application et corriger automatiquement le problème de dossier public
# Version: 2.0 - Mise à jour du 15 mars 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Construction de l'application avec correction automatique ===${NC}"

# Construction avec le bon environnement
echo -e "${YELLOW}Démarrage du build...${NC}"
if [ -z "$NODE_ENV" ]; then
  echo -e "${YELLOW}NODE_ENV non défini, utilisation de NODE_ENV=production${NC}"
  NODE_ENV=production npm run build
else
  echo -e "${YELLOW}Utilisation de NODE_ENV=$NODE_ENV${NC}"
  npm run build
fi

# Vérification du résultat du build
if [ $? -ne 0 ]; then
  echo -e "${RED}Erreur lors de la construction. Vérifiez les logs ci-dessus pour plus de détails.${NC}"
  exit 1
fi

# Vérification si le script fix-build-directory.sh existe et est exécutable
if [ -f "./scripts/fix-build-directory.sh" ]; then
  echo -e "${YELLOW}Exécution du script fix-build-directory.sh pour corriger le dossier public...${NC}"
  chmod +x ./scripts/fix-build-directory.sh
  ./scripts/fix-build-directory.sh
else
  echo -e "${RED}Erreur: Le script fix-build-directory.sh n'a pas été trouvé.${NC}"
  echo -e "${YELLOW}Tentative de création du lien symbolique manuellement...${NC}"
  
  if [ -d "dist/public" ] && [ ! -z "$(ls -A dist/public 2>/dev/null)" ]; then
    echo -e "${GREEN}Build trouvée dans dist/public, création d'un lien symbolique vers server/public...${NC}"
    
    # Supprimer server/public s'il existe déjà
    rm -rf server/public
    
    # Créer le dossier parent si nécessaire
    mkdir -p server
    
    # Créer un lien symbolique de server/public vers dist/public
    ln -sf $(pwd)/dist/public server/public
    
    echo -e "${GREEN}Lien symbolique créé avec succès.${NC}"
  else
    echo -e "${RED}Erreur: Aucun fichier trouvé dans dist/public. Le build semble avoir échoué.${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}=== Build terminé ===${NC}"
echo -e "${GREEN}Vous pouvez maintenant démarrer l'application avec 'npm run dev' ou 'npm run start'${NC}"
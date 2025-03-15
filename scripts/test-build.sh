#!/bin/bash

# Script de test de build complet pour vérifier l'intégrité du processus de build
# À utiliser pour tester le pipeline de build sans affecter l'environnement de production
# Version: 1.0 - 15 mars 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test du processus de build complet ===${NC}"

# 1. Sauvegarde de l'environnement actuel
echo -e "${YELLOW}1. Sauvegarde de l'environnement actuel...${NC}"
ORIGINAL_NODE_ENV=$NODE_ENV
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR=".backup-build-test-${TIMESTAMP}"

mkdir -p "$BACKUP_DIR"

# Sauvegarde des dossiers importants (si nécessaire)
if [ -d "dist" ]; then
  echo -e "${YELLOW}Sauvegarde du dossier dist...${NC}"
  cp -r dist "$BACKUP_DIR/dist_backup"
fi

if [ -d "server/public" ]; then
  echo -e "${YELLOW}Sauvegarde du dossier server/public...${NC}"
  cp -r server/public "$BACKUP_DIR/server_public_backup"
fi

# 2. Test du build en environnement test
echo -e "${YELLOW}2. Test du build en environnement test...${NC}"
export NODE_ENV=test

echo -e "${YELLOW}Nettoyage des anciens builds...${NC}"
rm -rf dist server/public

echo -e "${YELLOW}Exécution du build avec NODE_ENV=test...${NC}"
npm run build || {
  echo -e "${RED}Erreur lors du build en environnement test.${NC}"
  echo -e "${YELLOW}Vérifiez les logs ci-dessus pour plus de détails.${NC}"
  
  echo -e "${YELLOW}Tentative de correction avec scripts/fix-build-directory.sh...${NC}"
  ./scripts/fix-build-directory.sh
}

# 3. Vérification des résultats du build en test
echo -e "${YELLOW}3. Vérification des résultats du build en test...${NC}"
echo -e "${YELLOW}Vérification du dossier dist/public...${NC}"
if [ -d "dist/public" ] && [ -n "$(ls -A dist/public 2>/dev/null)" ]; then
  echo -e "${GREEN}✓ Le dossier dist/public existe et contient des fichiers.${NC}"
  find dist/public -type f | wc -l | xargs -I{} echo -e "${GREEN}  - Nombre de fichiers: {}${NC}"
else
  echo -e "${RED}✗ Le dossier dist/public n'existe pas ou est vide.${NC}"
fi

echo -e "${YELLOW}Vérification du dossier server/public...${NC}"
if [ -d "server/public" ] && [ -n "$(ls -A server/public 2>/dev/null)" ]; then
  echo -e "${GREEN}✓ Le dossier server/public existe et contient des fichiers.${NC}"
  find server/public -type f | wc -l | xargs -I{} echo -e "${GREEN}  - Nombre de fichiers: {}${NC}"
  
  if [ -L "server/public" ]; then
    echo -e "${GREEN}✓ server/public est un lien symbolique.${NC}"
    ls -la server/public | awk '{print $9, $10, $11}' | xargs -I{} echo -e "${GREEN}  - {}${NC}"
  else
    echo -e "${YELLOW}⚠ server/public n'est pas un lien symbolique mais contient des fichiers.${NC}"
  fi
else
  echo -e "${RED}✗ Le dossier server/public n'existe pas ou est vide.${NC}"
fi

# 4. Test du build en environnement production
echo -e "${YELLOW}4. Test du build en environnement production...${NC}"
export NODE_ENV=production

echo -e "${YELLOW}Nettoyage des anciens builds...${NC}"
rm -rf dist server/public

echo -e "${YELLOW}Exécution du build avec NODE_ENV=production...${NC}"
npm run build || {
  echo -e "${RED}Erreur lors du build en environnement production.${NC}"
  echo -e "${YELLOW}Vérifiez les logs ci-dessus pour plus de détails.${NC}"
  
  echo -e "${YELLOW}Tentative de correction avec scripts/fix-build-directory.sh...${NC}"
  ./scripts/fix-build-directory.sh
}

# 5. Vérification des résultats du build en production
echo -e "${YELLOW}5. Vérification des résultats du build en production...${NC}"
echo -e "${YELLOW}Vérification du dossier dist/public...${NC}"
if [ -d "dist/public" ] && [ -n "$(ls -A dist/public 2>/dev/null)" ]; then
  echo -e "${GREEN}✓ Le dossier dist/public existe et contient des fichiers.${NC}"
  find dist/public -type f | wc -l | xargs -I{} echo -e "${GREEN}  - Nombre de fichiers: {}${NC}"
else
  echo -e "${RED}✗ Le dossier dist/public n'existe pas ou est vide.${NC}"
fi

echo -e "${YELLOW}Vérification du dossier server/public...${NC}"
if [ -d "server/public" ] && [ -n "$(ls -A server/public 2>/dev/null)" ]; then
  echo -e "${GREEN}✓ Le dossier server/public existe et contient des fichiers.${NC}"
  find server/public -type f | wc -l | xargs -I{} echo -e "${GREEN}  - Nombre de fichiers: {}${NC}"
  
  if [ -L "server/public" ]; then
    echo -e "${GREEN}✓ server/public est un lien symbolique.${NC}"
    ls -la server/public | awk '{print $9, $10, $11}' | xargs -I{} echo -e "${GREEN}  - {}${NC}"
  else
    echo -e "${YELLOW}⚠ server/public n'est pas un lien symbolique mais contient des fichiers.${NC}"
  fi
else
  echo -e "${RED}✗ Le dossier server/public n'existe pas ou est vide.${NC}"
fi

# 6. Test du script build-with-fix.sh
if [ -f "scripts/build-with-fix.sh" ]; then
  echo -e "${YELLOW}6. Test du script build-with-fix.sh...${NC}"
  
  echo -e "${YELLOW}Nettoyage des anciens builds...${NC}"
  rm -rf dist server/public
  
  echo -e "${YELLOW}Exécution du script build-with-fix.sh...${NC}"
  ./scripts/build-with-fix.sh || {
    echo -e "${RED}Erreur lors de l'exécution de scripts/build-with-fix.sh.${NC}"
    echo -e "${YELLOW}Vérifiez les logs ci-dessus pour plus de détails.${NC}"
  }
  
  echo -e "${YELLOW}Vérification des résultats...${NC}"
  if [ -d "server/public" ] && [ -n "$(ls -A server/public 2>/dev/null)" ]; then
    echo -e "${GREEN}✓ Le script build-with-fix.sh a correctement créé server/public.${NC}"
  else
    echo -e "${RED}✗ Le script build-with-fix.sh n'a pas créé server/public correctement.${NC}"
  fi
else
  echo -e "${YELLOW}Script build-with-fix.sh non trouvé, étape ignorée.${NC}"
fi

# 7. Résumé et restauration
echo -e "${YELLOW}7. Résumé des tests...${NC}"

if [ -d "dist/public" ] && [ -d "server/public" ]; then
  echo -e "${GREEN}✓ Le processus de build semble fonctionner correctement.${NC}"
  echo -e "${GREEN}✓ Les dossiers dist/public et server/public sont présents.${NC}"
else
  echo -e "${RED}✗ Le processus de build présente des problèmes.${NC}"
  if [ ! -d "dist/public" ]; then
    echo -e "${RED}  - Le dossier dist/public n'existe pas ou est vide.${NC}"
  fi
  if [ ! -d "server/public" ]; then
    echo -e "${RED}  - Le dossier server/public n'existe pas ou est vide.${NC}"
  fi
fi

echo -e "${YELLOW}Voulez-vous restaurer l'état initial? (O/n)${NC}"
read -n 1 -r RESPONSE
echo
if [[ $RESPONSE =~ ^[Nn]$ ]]; then
  echo -e "${YELLOW}Conservation de l'état actuel.${NC}"
else
  echo -e "${YELLOW}Restauration de l'état initial...${NC}"
  
  # Restaurer les dossiers sauvegardés
  if [ -d "$BACKUP_DIR/dist_backup" ]; then
    echo -e "${YELLOW}Restauration du dossier dist...${NC}"
    rm -rf dist
    cp -r "$BACKUP_DIR/dist_backup" dist
  fi
  
  if [ -d "$BACKUP_DIR/server_public_backup" ]; then
    echo -e "${YELLOW}Restauration du dossier server/public...${NC}"
    rm -rf server/public
    cp -r "$BACKUP_DIR/server_public_backup" server/public
  fi
  
  # Restaurer l'environnement d'origine
  if [ -n "$ORIGINAL_NODE_ENV" ]; then
    export NODE_ENV=$ORIGINAL_NODE_ENV
    echo -e "${YELLOW}Environnement NODE_ENV restauré à $ORIGINAL_NODE_ENV.${NC}"
  else
    unset NODE_ENV
    echo -e "${YELLOW}Variable NODE_ENV supprimée.${NC}"
  fi
  
  echo -e "${GREEN}Restauration terminée.${NC}"
fi

echo -e "${BLUE}=== Test du processus de build terminé ===${NC}"
echo -e "${YELLOW}Une sauvegarde a été créée dans le dossier $BACKUP_DIR au cas où vous en auriez besoin.${NC}"
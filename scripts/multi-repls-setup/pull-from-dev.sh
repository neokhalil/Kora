#!/bin/bash

# Script pour synchroniser l'environnement de test avec l'environnement de développement
# À exécuter dans l'environnement de test
# Version: 2.0 - Mise à jour du 15 mars 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Synchronisation de l'environnement de test depuis l'environnement de développement =====${NC}"

# 1. Sauvegarde des fichiers de configuration spécifiques à l'environnement de test
echo -e "${YELLOW}1. Sauvegarde des fichiers de configuration de test...${NC}"
BACKUP_TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Création d'un répertoire de sauvegarde pour cette session
BACKUP_DIR=".backup-sync-${BACKUP_TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

# Sauvegarde avec gestion des erreurs
cp .env "$BACKUP_DIR/.env.backup" 2>/dev/null || echo -e "${YELLOW}Pas de fichier .env à sauvegarder${NC}"
cp server/config/env.test.ts "$BACKUP_DIR/env.test.ts.backup" 2>/dev/null || echo -e "${YELLOW}Pas de fichier env.test.ts à sauvegarder${NC}"
echo -e "${GREEN}Sauvegarde effectuée dans $BACKUP_DIR${NC}"

# 2. Récupération des derniers changements de l'environnement de développement
# Remplacez l'URL ci-dessous par l'URL réelle de votre environnement de développement
echo -e "${YELLOW}2. Récupération des derniers changements depuis l'environnement de développement...${NC}"

# Configuration Git pour récupération depuis le dépôt partagé
if ! git remote -v | grep -q origin; then
  echo -e "${YELLOW}Configuration du dépôt distant origin...${NC}"
  git remote add origin https://github.com/neokhalil/Kora.git || { 
    echo -e "${RED}Erreur lors de la configuration du dépôt distant. Vérifiez l'URL et les droits d'accès.${NC}"
    exit 1
  }
fi

# Récupération des changements
echo -e "${YELLOW}Récupération des derniers changements depuis le dépôt distant...${NC}"
git fetch origin || {
  echo -e "${RED}Erreur lors de la récupération des changements. Vérifiez votre connexion et l'authentification Git.${NC}"
  exit 1
}

# Sauvegarde des modifications locales non commises
echo -e "${YELLOW}Sauvegarde des modifications locales...${NC}"
git stash || echo -e "${YELLOW}Aucune modification locale à sauvegarder.${NC}"

# Fusion avec la branche principale
echo -e "${YELLOW}Fusion avec la branche principale...${NC}"
git merge origin/main || {
  echo -e "${RED}Erreur lors de la fusion. Résolvez les conflits manuellement.${NC}"
  echo -e "${YELLOW}Vous pouvez utiliser 'git status' pour voir les fichiers en conflit.${NC}"
  echo -e "${YELLOW}Après résolution, utilisez 'git add [fichiers]' puis 'git commit' pour terminer la fusion.${NC}"
  exit 1
}

# 3. Réappliquer les configurations spécifiques à l'environnement de test
echo -e "${YELLOW}3. Réapplication des configurations de test...${NC}"

# Restauration des fichiers de configuration
if [ -f "$BACKUP_DIR/.env.backup" ]; then
  echo -e "${YELLOW}Restauration du fichier .env...${NC}"
  cp "$BACKUP_DIR/.env.backup" .env
  echo -e "${GREEN}Fichier .env restauré.${NC}"
fi

if [ -f "$BACKUP_DIR/env.test.ts.backup" ]; then
  echo -e "${YELLOW}Restauration du fichier env.test.ts...${NC}"
  cp "$BACKUP_DIR/env.test.ts.backup" server/config/env.test.ts
  echo -e "${GREEN}Fichier env.test.ts restauré.${NC}"
fi

# 4. Mise à jour des dépendances
echo -e "${YELLOW}4. Mise à jour des dépendances...${NC}"
echo -e "${YELLOW}Installation des dépendances avec npm ci (installation propre)...${NC}"
npm ci || {
  echo -e "${RED}Erreur lors de l'installation des dépendances avec npm ci.${NC}"
  echo -e "${YELLOW}Tentative avec npm install comme solution de repli...${NC}"
  npm install || {
    echo -e "${RED}Erreur lors de l'installation des dépendances. Vérifiez le fichier package.json et les logs.${NC}"
    exit 1
  }
}

# 5. Construction de l'application pour l'environnement de test
echo "5. Construction de l'application..."

# Vérification de l'existence du script de build amélioré
if [ -f "scripts/build-with-fix.sh" ]; then
  echo "Utilisation du script build-with-fix.sh pour une meilleure gestion des dossiers..."
  chmod +x scripts/build-with-fix.sh
  NODE_ENV=production ./scripts/build-with-fix.sh
else
  # Méthode traditionnelle
  npm run build
  
  # 6. Vérification du répertoire de build
  echo "6. Vérification du répertoire de build..."
  if [ ! -d "server/public" ] || [ -z "$(ls -A server/public 2>/dev/null)" ]; then
    echo "Le répertoire de build est vide, exécution du script de correction..."
    ./scripts/fix-build-directory.sh
  fi
fi

# 7. Application des migrations de base de données si nécessaire
echo "7. Application des migrations de base de données..."
NODE_ENV=test npm run db:push

echo "===== Synchronisation terminée ====="
echo "L'environnement de test est maintenant synchronisé avec l'environnement de développement."
echo "Vous pouvez démarrer l'application avec 'NODE_ENV=test npm run dev'."
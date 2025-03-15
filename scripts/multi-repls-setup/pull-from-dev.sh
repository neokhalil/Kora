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
echo -e "${YELLOW}5. Construction de l'application...${NC}"

# Vérification et création du script de build amélioré s'il n'existe pas
if [ ! -f "scripts/build-with-fix.sh" ]; then
  echo -e "${YELLOW}Le script build-with-fix.sh n'existe pas. Création du script...${NC}"
  
  # Créer le script build-with-fix.sh
  cat > scripts/build-with-fix.sh << 'EOF'
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

# 1. Construction de l'application
echo -e "${YELLOW}1. Exécution du build Vite...${NC}"
NODE_ENV=production npm run build || {
  echo -e "${RED}Erreur lors du build. Vérifiez les logs ci-dessus.${NC}"
  exit 1
}

# 2. Vérification et correction du répertoire server/public
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

echo -e "${GREEN}=== Build terminé avec succès ===${NC}"
EOF

  # Rendre le script exécutable
  chmod +x scripts/build-with-fix.sh
  echo -e "${GREEN}Script build-with-fix.sh créé avec succès.${NC}"
fi

# Exécution du script de build
echo -e "${YELLOW}Exécution du script de build optimisé...${NC}"
chmod +x scripts/build-with-fix.sh
NODE_ENV=production ./scripts/build-with-fix.sh || {
  echo -e "${RED}Erreur lors du build. Tentative avec la méthode traditionnelle...${NC}"
  
  # Méthode traditionnelle en cas d'échec
  echo -e "${YELLOW}Exécution du build standard...${NC}"
  NODE_ENV=production npm run build || {
    echo -e "${RED}Échec du build. Vérifiez les logs pour plus d'informations.${NC}"
    exit 1
  }
  
  # Vérification du répertoire de build
  echo -e "${YELLOW}Vérification du répertoire de build...${NC}"
  if [ ! -d "server/public" ] || [ -z "$(ls -A server/public 2>/dev/null)" ]; then
    echo -e "${YELLOW}Le répertoire server/public est absent ou vide. Exécution du script de correction...${NC}"
    if [ -f "scripts/fix-build-directory.sh" ]; then
      chmod +x scripts/fix-build-directory.sh
      ./scripts/fix-build-directory.sh || {
        echo -e "${RED}Erreur lors de la correction du répertoire de build.${NC}"
        exit 1
      }
    else
      echo -e "${RED}Script de correction non trouvé. Impossible de continuer.${NC}"
      exit 1
    fi
  fi
}

# 7. Application des migrations de base de données si nécessaire
echo -e "${YELLOW}7. Application des migrations de base de données...${NC}"

# Vérification de la disponibilité de la base de données
echo -e "${YELLOW}Vérification de la connexion à la base de données...${NC}"
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Variable DATABASE_URL non définie. Vérifiez votre fichier .env${NC}"
  echo -e "${YELLOW}Les migrations de base de données seront ignorées.${NC}"
else
  echo -e "${YELLOW}Exécution des migrations avec npm run db:push...${NC}"
  NODE_ENV=test npm run db:push || {
    echo -e "${RED}Erreur lors de l'application des migrations.${NC}"
    echo -e "${YELLOW}Vérifiez la connexion à la base de données et les logs.${NC}"
    echo -e "${YELLOW}Vous pourrez les appliquer manuellement plus tard avec 'NODE_ENV=test npm run db:push'${NC}"
  }
fi

# 8. Nettoyage
echo -e "${YELLOW}8. Nettoyage...${NC}"

# Vérifier si nous avons appliqué des modifications locales (git stash)
if git stash list | grep -q "stash@{0}"; then
  echo -e "${YELLOW}Application des modifications locales sauvegardées...${NC}"
  git stash pop || echo -e "${YELLOW}Conflit lors de l'application des modifications locales. Résolution manuelle nécessaire.${NC}"
fi

echo -e "${GREEN}===== Synchronisation terminée =====${NC}"
echo -e "${GREEN}L'environnement de test est maintenant synchronisé avec l'environnement de développement.${NC}"
echo -e "${BLUE}Vous pouvez démarrer l'application avec 'NODE_ENV=test npm run dev'.${NC}"
echo -e "${YELLOW}Pour un déploiement en production, utilisez 'NODE_ENV=production npm run build' suivi de 'NODE_ENV=production npm start'.${NC}"
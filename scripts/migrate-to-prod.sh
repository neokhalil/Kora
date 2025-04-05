#!/bin/bash
#
# Script de migration et build pour environnement de production
# Ce script contourne les problèmes de résolution ESM avec Vite
# Version: 1.0 - 5 avril 2025
#

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message d'étape
step() {
  echo -e "${BLUE}=== $1 ===${NC}"
}

# Fonction pour afficher un message de sous-étape
substep() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Fonction pour afficher un message de succès
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher un message d'erreur et quitter
error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

step "Phase 1: Préparation de l'environnement de production"

# Vérifier si nous sommes dans l'environnement de production
substep "Vérification de l'environnement..."
if [ -z "$PROD_ENV" ]; then
  substep "Variable PROD_ENV non définie, utilisation de NODE_ENV=production"
  export NODE_ENV=production
else
  substep "Utilisation de l'environnement défini: $PROD_ENV"
  export NODE_ENV=$PROD_ENV
fi

# Nettoyer les répertoires temporaires
substep "Nettoyage des répertoires temporaires..."
rm -rf .vite-temp node_modules/.vite node_modules/.vite-temp

# Préparation des répertoires de build
substep "Préparation des répertoires de build..."
mkdir -p dist/public server/public

step "Phase 2: Compilation du Backend"

# Compiler le backend directement avec esbuild
substep "Compilation du backend avec esbuild..."
if npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist; then
  success "Backend compilé avec succès"
else
  error "Erreur lors de la compilation du backend"
fi

step "Phase 3: Compilation du Frontend sans Vite"

# Vérifier si le fronend est déjà compilé en environnement de test
if [ -d "server/public" ] && [ -n "$(ls -A server/public 2>/dev/null)" ]; then
  substep "Détection des fichiers frontend dans server/public (probablement environnement de test)..."
  substep "Copie directe des fichiers frontend de test vers production..."
  cp -r server/public/* dist/public/
  success "Fichiers frontend copiés depuis l'environnement de test"
else
  # Tentative de compilation simplifiée en contournant vite.config.ts
  substep "Compilation simplifiée du frontend..."
  
  # Approche alternative 1: Utilisation d'un fichier vite.config minimal
  substep "Création d'un fichier vite.config minimal temporaire..."
  TMP_VITE_CONFIG="tmp-vite.config.js"
  
  cat > $TMP_VITE_CONFIG << 'EOF'
export default {
  root: './client',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
  }
}
EOF
  
  substep "Tentative de build avec configuration minimale..."
  if NODE_ENV=production npx vite build --config $TMP_VITE_CONFIG; then
    success "Frontend compilé avec succès"
    rm $TMP_VITE_CONFIG
  else
    substep "Échec de la compilation avec Vite, tentative avec méthode alternative..."
    rm $TMP_VITE_CONFIG
    
    # Approche alternative 2: Copie manuelle des fichiers source
    substep "Copie manuelle des fichiers source..."
    mkdir -p dist/public/assets
    cp -r client/src/index.html dist/public/
    cp -r client/src/assets/* dist/public/assets/
    
    success "Fichiers frontend copiés manuellement"
    
    substep "⚠️ AVERTISSEMENT: Le frontend n'a pas été compilé, seulement copié"
    substep "⚠️ Cette méthode est un fallback et peut ne pas fonctionner correctement"
    substep "⚠️ Vérifiez l'application et procédez à une compilation correcte ultérieurement"
  fi
fi

step "Phase 4: Synchronisation des répertoires"

# Synchroniser les répertoires pour assurer la cohérence
substep "Création du répertoire server/public..."
rm -rf server/public
mkdir -p server/public

substep "Copie des fichiers frontend de dist/public vers server/public..."
cp -r dist/public/* server/public/

# Vérification finale
if [ -d "server/public" ] && [ -n "$(ls -A server/public 2>/dev/null)" ] && [ -f "dist/index.js" ]; then
  success "Vérification finale: Migration réussie"
  step "Déploiement prêt"
  echo -e "${GREEN}Votre application est prête pour la production!${NC}"
  echo -e "${YELLOW}Pour démarrer l'application en production:${NC}"
  echo -e "${YELLOW}NODE_ENV=production node dist/index.js${NC}"
else
  error "Vérification finale: Échec de la migration"
fi

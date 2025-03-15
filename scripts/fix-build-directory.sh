#!/bin/bash

# Script amélioré de correction pour l'erreur "Could not find the build directory"
# À utiliser dans les environnements de test et production
# Version: 2.0 - Mise à jour du 15 mars 2025 - Ajout de la détection d'environnement et compatibilité lien symbolique

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Vérification et correction du répertoire de build ===${NC}"

# Fonction pour créer un lien symbolique de façon robuste
create_symlink() {
  local source_dir=$1
  local target_dir=$2
  
  # Supprimer la cible si elle existe déjà
  if [ -d "$target_dir" ]; then
    echo -e "${YELLOW}Suppression du répertoire ou lien cible existant...${NC}"
    rm -rf "$target_dir"
  fi
  
  # Créer le dossier parent si nécessaire
  mkdir -p "$(dirname "$target_dir")"
  
  # Déterminer si nous pouvons utiliser un lien symbolique
  if ln -sf "$source_dir" "$target_dir" 2>/dev/null; then
    echo -e "${GREEN}Lien symbolique créé avec succès.${NC}"
    return 0
  else
    echo -e "${YELLOW}Impossible de créer un lien symbolique, utilisation de la copie...${NC}"
    mkdir -p "$target_dir"
    cp -R "$source_dir"/* "$target_dir"/
    echo -e "${GREEN}Copie des fichiers effectuée avec succès.${NC}"
    return 1
  fi
}

# Fonction pour créer des fichiers minimaux dans le répertoire public
create_minimal_files() {
  local target_dir=$1
  
  echo -e "${YELLOW}Création de fichiers minimaux dans $target_dir...${NC}"
  
  # Création du répertoire s'il n'existe pas
  mkdir -p "$target_dir"
  
  # Création d'un fichier HTML minimal
  cat > "$target_dir/index.html" << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kora - Assistant d'apprentissage</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f8f9fa;
      color: #333;
      line-height: 1.6;
    }
    .loader {
      text-align: center;
      max-width: 600px;
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #09f;
      margin: 0 auto 20px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .note {
      margin-top: 20px;
      padding: 10px;
      background: #fff8e1;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
    }
    .error {
      color: #d32f2f;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h2>Chargement de Kora...</h2>
    <p>Veuillez patienter pendant que l'application se prépare.</p>
    <div class="note">
      <p><strong>Note technique :</strong> Les fichiers de l'interface utilisateur ne sont pas disponibles.</p>
      <p>Cela peut être dû à un problème lors de la construction de l'application.</p>
      <p>Solutions possibles :</p>
      <ul>
        <li>Exécuter <code>NODE_ENV=production npm run build</code></li>
        <li>Exécuter <code>./scripts/build-with-fix.sh</code></li>
        <li>Vérifier les logs pour plus de détails</li>
      </ul>
    </div>
  </div>
  <script src="index.js"></script>
</body>
</html>
EOF

  # Création d'un fichier JS minimal
  cat > "$target_dir/index.js" << EOF
console.log('Kora - Application en cours de chargement...');
console.log('Dette technique : Les fichiers statiques ne sont pas disponibles correctement.');
console.log('Solutions possibles :');
console.log('1. Exécuter NODE_ENV=production npm run build');
console.log('2. Exécuter ./scripts/build-with-fix.sh');
console.log('3. Vérifier que le lien symbolique server/public -> dist/public existe');
// Ce fichier est un placeholder pour permettre au serveur de démarrer
// Il sera remplacé par la build complète lors du prochain build
EOF

  echo -e "${GREEN}Fichiers minimaux créés avec succès.${NC}"
}

# Déterminer l'environnement actuel
if [ -z "$NODE_ENV" ]; then
  echo -e "${YELLOW}NODE_ENV non défini, détection automatique...${NC}"
  if [ -f "server/config/env.test.ts" ]; then
    ENV_TYPE="test"
  elif [ -f "server/config/env.production.ts" ]; then
    ENV_TYPE="production"
  else
    ENV_TYPE="development"
  fi
  echo -e "${YELLOW}Environnement détecté : ${ENV_TYPE}${NC}"
else
  ENV_TYPE=$NODE_ENV
  echo -e "${YELLOW}Environnement défini par NODE_ENV : ${ENV_TYPE}${NC}"
fi

# Vérifier si une build existe déjà dans dist/public (selon vite.config.ts)
if [ -d "dist/public" ] && [ ! -z "$(ls -A dist/public 2>/dev/null)" ]; then
  echo -e "${GREEN}Build trouvée dans dist/public...${NC}"
  
  # Créer un lien symbolique de server/public vers dist/public
  create_symlink "$(pwd)/dist/public" "$(pwd)/server/public"
else
  echo -e "${YELLOW}Aucune build trouvée dans dist/public, essai de build...${NC}"
  
  # Tenter de construire l'application avec le bon environnement
  echo -e "${YELLOW}Tentative de build avec NODE_ENV=${ENV_TYPE}...${NC}"
  NODE_ENV=${ENV_TYPE} npm run build
  
  # Vérifier si la build a réussi
  if [ -d "dist/public" ] && [ ! -z "$(ls -A dist/public 2>/dev/null)" ]; then
    echo -e "${GREEN}Build réussie, création d'un lien symbolique...${NC}"
    
    # Créer un lien symbolique de server/public vers dist/public
    create_symlink "$(pwd)/dist/public" "$(pwd)/server/public"
  else
    echo -e "${RED}La build a échoué ou n'a pas généré de fichiers, création de fichiers temporaires...${NC}"
    create_minimal_files "$(pwd)/server/public"
  fi
fi

# Vérification des permissions
echo -e "${YELLOW}Vérification des permissions...${NC}"
chmod -R 755 server/public

echo -e "${BLUE}=== Opération terminée ===${NC}"
echo -e "${GREEN}Vous pouvez maintenant démarrer le serveur avec 'npm run dev' ou 'npm run start'${NC}"
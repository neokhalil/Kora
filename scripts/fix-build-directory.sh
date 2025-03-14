#!/bin/bash

# Script de correction pour l'erreur "Could not find the build directory"
# À utiliser dans les environnements de test et production

echo "=== Vérification et correction du répertoire de build ==="

# Création du répertoire public s'il n'existe pas
if [ ! -d "server/public" ]; then
  echo "Création du répertoire server/public..."
  mkdir -p server/public
fi

# Vérification si le répertoire est vide
if [ -z "$(ls -A server/public 2>/dev/null)" ]; then
  echo "Le répertoire server/public est vide, création de fichiers minimaux..."
  
  # Création d'un fichier HTML minimal
  cat > server/public/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kora - Chargement...</title>
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
    }
    .loader {
      text-align: center;
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
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h2>Chargement de Kora...</h2>
    <p>Veuillez patienter pendant que l'application se prépare.</p>
  </div>
  <script src="index.js"></script>
</body>
</html>
EOF

  # Création d'un fichier JS minimal
  cat > server/public/index.js << EOF
console.log('Kora - Application en cours de chargement...');
// Ce fichier est un placeholder pour permettre au serveur de démarrer
// Il sera remplacé par la build complète lors du prochain build
EOF

  echo "Fichiers minimaux créés avec succès."
else
  echo "Le répertoire server/public contient déjà des fichiers."
fi

# Vérification des permissions
echo "Vérification des permissions..."
chmod -R 755 server/public

echo "=== Opération terminée ==="
echo "Vous pouvez maintenant démarrer le serveur avec 'npm run dev'"
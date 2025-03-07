#!/bin/bash
# Script pour synchroniser le code de l'environnement de test vers production

echo "=== Préparation pour la synchronisation vers production ==="

# Vérifier si Git est initialisé
if [ ! -d .git ]; then
  echo "❌ Erreur: Dépôt Git non initialisé"
  echo "   Exécutez les commandes suivantes pour configurer Git:"
  echo "   git init"
  echo "   git remote add origin https://github.com/VOTRE_USERNAME/kora-app.git"
  exit 1
fi

# Vérifier s'il y a des modifications non committées
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Vous avez des changements non committés"
  echo "   Veuillez les committer ou les stasher avant de continuer"
  exit 1
fi

# Demander la version à tagger
read -p "Version à déployer en production (ex: v1.0.0): " version
if [ -z "$version" ]; then
  echo "❌ Erreur: Version non spécifiée"
  exit 1
fi

# Valider le format de la version (optionnel)
if ! [[ $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\.]+)?$ ]]; then
  echo "⚠️ Format de version non standard (devrait être comme v1.0.0)"
  read -p "Continuer quand même? (o/n): " confirm
  if [[ $confirm != "o" && $confirm != "O" ]]; then
    echo "❌ Opération annulée"
    exit 1
  fi
fi

# Créer un tag pour cette version
echo "🔄 Création d'un tag pour la version $version..."
git tag -a "$version" -m "Version $version prête pour la production"

# Pousser le tag vers GitHub
echo "🔄 Envoi du tag vers le dépôt distant..."
git push origin "$version"

echo ""
echo "✅ Version $version prête pour la production!"
echo ""
echo "ÉTAPES SUIVANTES:"
echo "1. Allez dans votre Repl de production"
echo "2. Exécutez: ./scripts/multi-repls-setup/pull-from-test.sh $version"
echo "3. Après, cliquez sur le bouton 'Deploy' dans Replit"
echo ""
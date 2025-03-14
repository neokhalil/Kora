#!/bin/bash
# Script pour gérer les configurations d'environnement

# Définir les chemins des fichiers
ENV_FILE="./server/config/environments.ts"
BACKUP_FILE="./server/config/environments.backup.ts"
TEST_FILE="./server/config/environments.test.ts"
DEV_FILE="./server/config/environments.dev.ts"

# Fonction pour afficher l'aide
show_help() {
  echo "Usage: ./scripts/env-manager.sh [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  backup          Crée une sauvegarde de la configuration actuelle"
  echo "  restore         Restaure la configuration depuis la sauvegarde"
  echo "  set-dev         Configure l'environnement de développement"
  echo "  set-test        Configure l'environnement de test"
  echo "  save-dev        Enregistre la configuration actuelle comme développement"
  echo "  save-test       Enregistre la configuration actuelle comme test"
  echo "  help            Affiche cette aide"
}

# Fonction pour sauvegarder la configuration actuelle
backup_config() {
  echo "📥 Sauvegarde de la configuration actuelle..."
  cp "$ENV_FILE" "$BACKUP_FILE"
  echo "✅ Configuration sauvegardée dans $BACKUP_FILE"
}

# Fonction pour restaurer depuis la sauvegarde
restore_config() {
  if [ -f "$BACKUP_FILE" ]; then
    echo "📤 Restauration de la configuration depuis la sauvegarde..."
    cp "$BACKUP_FILE" "$ENV_FILE"
    echo "✅ Configuration restaurée"
  else
    echo "❌ Erreur: Aucune sauvegarde trouvée à $BACKUP_FILE"
    exit 1
  fi
}

# Fonction pour configurer l'environnement de développement
set_dev_config() {
  if [ -f "$DEV_FILE" ]; then
    echo "📝 Configuration de l'environnement de développement..."
    cp "$DEV_FILE" "$ENV_FILE"
    echo "✅ Environnement de développement configuré"
  else
    echo "❌ Erreur: Fichier de configuration dev non trouvé à $DEV_FILE"
    exit 1
  fi
}

# Fonction pour configurer l'environnement de test
set_test_config() {
  if [ -f "$TEST_FILE" ]; then
    echo "📝 Configuration de l'environnement de test..."
    cp "$TEST_FILE" "$ENV_FILE"
    echo "✅ Environnement de test configuré"
  else
    echo "❌ Erreur: Fichier de configuration test non trouvé à $TEST_FILE"
    exit 1
  fi
}

# Fonction pour enregistrer la configuration actuelle comme développement
save_dev_config() {
  echo "💾 Enregistrement de la configuration actuelle comme développement..."
  cp "$ENV_FILE" "$DEV_FILE"
  echo "✅ Configuration de développement enregistrée dans $DEV_FILE"
}

# Fonction pour enregistrer la configuration actuelle comme test
save_test_config() {
  echo "💾 Enregistrement de la configuration actuelle comme test..."
  cp "$ENV_FILE" "$TEST_FILE"
  echo "✅ Configuration de test enregistrée dans $TEST_FILE"
}

# Traitement des commandes
case "$1" in
  backup)
    backup_config
    ;;
  restore)
    restore_config
    ;;
  set-dev)
    set_dev_config
    ;;
  set-test)
    set_test_config
    ;;
  save-dev)
    save_dev_config
    ;;
  save-test)
    save_test_config
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Commande non reconnue: $1"
    show_help
    exit 1
    ;;
esac

exit 0
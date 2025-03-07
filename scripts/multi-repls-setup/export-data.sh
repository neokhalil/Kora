#!/bin/bash
# Script pour exporter des données d'une table spécifique

# Vérifier si une table est spécifiée
table_name=$1
if [ -z "$table_name" ]; then
  echo "❌ Erreur: Nom de table non spécifié"
  echo "   Usage: $0 <table_name>"
  echo "   Exemple: $0 users"
  exit 1
fi

echo "=== Exportation des données de la table $table_name ==="

# Vérifier si les variables d'environnement de base de données sont définies
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur: Variable DATABASE_URL non définie"
  exit 1
fi

# Créer le dossier d'exportation s'il n'existe pas
mkdir -p ./data/exports

# Générer le nom du fichier avec horodatage
timestamp=$(date +%Y%m%d_%H%M%S)
output_file="./data/exports/${table_name}_${timestamp}.sql"

# Exportation des données
echo "🔄 Exportation des données de la table $table_name..."
pg_dump -d "$DATABASE_URL" -t "$table_name" -a > "$output_file"

# Vérifier si l'exportation a réussi
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de l'exportation des données"
  exit 1
fi

echo "✅ Données exportées avec succès dans $output_file"
echo ""
echo "Pour importer ces données dans un autre environnement:"
echo "1. Copiez le fichier $output_file dans l'autre Repl"
echo "2. Exécutez: ./scripts/multi-repls-setup/import-data.sh $output_file"
echo ""
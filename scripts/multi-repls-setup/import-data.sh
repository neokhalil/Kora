#!/bin/bash
# Script pour importer des données d'un fichier SQL

# Vérifier si un fichier est spécifié
sql_file=$1
if [ -z "$sql_file" ]; then
  echo "❌ Erreur: Fichier SQL non spécifié"
  echo "   Usage: $0 <sql_file>"
  echo "   Exemple: $0 ./data/exports/users_20250307_123456.sql"
  exit 1
fi

# Vérifier si le fichier existe
if [ ! -f "$sql_file" ]; then
  echo "❌ Erreur: Fichier $sql_file introuvable"
  exit 1
fi

echo "=== Importation des données depuis $sql_file ==="

# Vérifier si les variables d'environnement de base de données sont définies
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur: Variable DATABASE_URL non définie"
  exit 1
fi

# Demander confirmation avant d'importer
read -p "⚠️ Attention: Cette opération peut écraser des données existantes. Continuer? (o/n): " confirm
if [[ $confirm != "o" && $confirm != "O" ]]; then
  echo "❌ Importation annulée"
  exit 1
fi

# Extraire le nom de la table à partir du nom du fichier
table_name=$(basename "$sql_file" | cut -d'_' -f1)
echo "🔄 Table identifiée: $table_name"

# Créer une sauvegarde avant l'importation
echo "🔄 Création d'une sauvegarde de la table $table_name..."
backup_file="./data/backups/${table_name}_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p ./data/backups
pg_dump -d "$DATABASE_URL" -t "$table_name" -a > "$backup_file"

# Importer les données
echo "🔄 Importation des données..."
psql -d "$DATABASE_URL" -f "$sql_file"

# Vérifier si l'importation a réussi
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de l'importation des données"
  echo "   Une sauvegarde a été créée dans $backup_file"
  exit 1
fi

echo "✅ Données importées avec succès!"
echo "   Une sauvegarde des données précédentes a été créée dans $backup_file"
echo ""
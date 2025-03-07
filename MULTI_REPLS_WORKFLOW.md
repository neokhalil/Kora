# Guide simplifié pour la configuration multi-environnements Kora

Ce guide vous explique comment configurer et utiliser les trois environnements Replit pour Kora : développement, test et production.

## Étape 1 : Initialiser Git dans votre Repl actuel

Vérifiez si Git est déjà initialisé :
```bash
git status
```

Si Git n'est pas initialisé, exécutez :
```bash
git init
git branch -M main
```

## Étape 2 : Créer le dépôt GitHub

1. Créez un nouveau dépôt sur GitHub (par exemple `kora-app`)
2. Configurez votre Repl pour communiquer avec GitHub :

```bash
# Ajouter le dépôt distant
git remote add origin https://github.com/VOTRE_USERNAME/kora-app.git

# Créer un fichier .gitignore
echo ".env\nnode_modules/\ndist/\nbuild/\ndata/exports/\ndata/backups/\n*.log" > .gitignore

# Premier commit
git add .
git commit -m "Initial commit"
```

## Étape 3 : Configurer l'authentification GitHub

1. Créez un token d'accès personnel sur GitHub :
   - Allez dans Settings > Developer settings > Personal access tokens
   - Générez un nouveau token avec les permissions pour votre dépôt

2. Dans votre Repl, ajoutez ce token comme secret :
   - Ouvrez les paramètres du Repl (⚙️)
   - Allez à la section "Secrets"
   - Ajoutez un secret `GITHUB_TOKEN` avec votre token GitHub

3. Configurez Git :
```bash
git config user.name "Votre Nom"
git config user.email "votre.email@exemple.com"
chmod +x scripts/multi-repls-setup/configure-git-auth.sh
./scripts/multi-repls-setup/configure-git-auth.sh
```

4. Poussez votre code sur GitHub :
```bash
git push -u origin main
```

## Étape 4 : Créer les Repls de test et production

1. Créez deux nouveaux Repls en important depuis GitHub :
   - URL : `https://github.com/VOTRE_USERNAME/kora-app.git`
   - Noms : `kora-test` et `kora-prod`

2. Dans chaque Repl :
   - Configurez l'authentification Git comme à l'étape 3
   - Créez un fichier `.env` basé sur les modèles fournis
   - Créez une base de données avec `create_postgresql_database_tool`
   - Mettez à jour le fichier `server/config/environments.ts` avec le bon environnement

## Étape 5 : Flux de travail quotidien

### Dans l'environnement de développement :
```bash
# Quand vous êtes prêt à tester une version
./scripts/multi-repls-setup/sync-to-test.sh
```

### Dans l'environnement de test :
```bash
# Pour récupérer les changements depuis l'environnement de développement
./scripts/multi-repls-setup/pull-from-dev.sh

# Quand vous êtes prêt à mettre en production
./scripts/multi-repls-setup/sync-to-prod.sh
# (indiquez un numéro de version, ex: v1.0.0)
```

### Dans l'environnement de production :
```bash
# Pour déployer une version spécifique
./scripts/multi-repls-setup/pull-from-test.sh v1.0.0
```

## Aide supplémentaire

Pour des instructions plus détaillées, consultez :
- `scripts/multi-repls-setup/README.md` - Vue d'ensemble
- `scripts/multi-repls-setup/git-setup.md` - Configuration Git détaillée
- `scripts/multi-repls-setup/repl-setup.md` - Configuration des Repls
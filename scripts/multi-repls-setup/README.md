# Guide de Configuration Multi-Repls pour Kora

Ce guide explique comment configurer et maintenir Kora à travers plusieurs Repls pour les environnements de développement, test et production.

## Table des matières

1. [Création du dépôt Git](#1-création-du-dépôt-git)
2. [Configuration des Repls](#2-configuration-des-repls)
3. [Synchronisation entre environnements](#3-synchronisation-entre-environnements)
4. [Déploiement](#4-déploiement)
5. [Base de données](#5-base-de-données)

## 1. Création du dépôt Git

### 1.1 Création d'un nouveau dépôt sur GitHub

1. Connectez-vous à votre compte GitHub
2. Cliquez sur le bouton "+" en haut à droite, puis "New repository"
3. Nommez le dépôt "kora-app" (ou le nom de votre choix)
4. Laissez-le en public ou privé selon vos préférences
5. Initialisez avec un README si vous le souhaitez
6. Cliquez sur "Create repository"

### 1.2 Connecter le Repl de développement au dépôt Git

```bash
# Dans le Repl de développement
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/kora-app.git
git push -u origin main
```

## 2. Configuration des Repls

### 2.1 Création du Repl de test

1. Rendez-vous sur [Replit.com](https://replit.com)
2. Cliquez sur "Create Repl"
3. Sélectionnez l'option "Import from GitHub"
4. Entrez l'URL du dépôt: `https://github.com/VOTRE_USERNAME/kora-app.git`
5. Nommez le Repl "kora-test"
6. Configurez comme suit:
   - Activez "Enable Git Version Control" dans les paramètres
   - Configurez les secrets (OPENAI_API_KEY, etc.)
   - Créez un fichier `.env` avec la configuration de test

### 2.2 Création du Repl de production

1. Rendez-vous sur [Replit.com](https://replit.com)
2. Cliquez sur "Create Repl"
3. Sélectionnez l'option "Import from GitHub"
4. Entrez l'URL du dépôt: `https://github.com/VOTRE_USERNAME/kora-app.git`
5. Nommez le Repl "kora-prod"
6. Configurez comme suit:
   - Activez "Enable Git Version Control" dans les paramètres
   - Configurez les secrets (OPENAI_API_KEY, etc.)
   - Créez un fichier `.env` avec la configuration de production

### 2.3 Configuration spécifique par environnement

#### Pour le Repl de développement (existant)
- Modifiez `server/config/environments.ts` avec:
  ```typescript
  environment: 'development'
  ```

#### Pour le Repl de test
- Modifiez `server/config/environments.ts` avec:
  ```typescript
  environment: 'test'
  ```

#### Pour le Repl de production
- Modifiez `server/config/environments.ts` avec:
  ```typescript
  environment: 'production',
  debug: false,
  database: {
    url: process.env.DATABASE_URL,
    ssl: true,
    logging: false,
  }
  ```

## 3. Synchronisation entre environnements

### 3.1 Flux de développement vers test

Utilisez les scripts fournis dans ce dossier:

1. Dans le Repl de développement:
   ```bash
   ./scripts/multi-repls-setup/sync-to-test.sh
   ```

2. Dans le Repl de test:
   ```bash
   ./scripts/multi-repls-setup/pull-from-dev.sh
   ```

### 3.2 Flux de test vers production

1. Dans le Repl de test:
   ```bash
   ./scripts/multi-repls-setup/sync-to-prod.sh
   ```

2. Dans le Repl de production:
   ```bash
   ./scripts/multi-repls-setup/pull-from-test.sh
   ```

## 4. Déploiement

### 4.1 Déploiement en test

1. Après avoir exécuté `pull-from-dev.sh` dans le Repl de test
2. Cliquez sur le bouton "Deploy" dans l'interface Replit

### 4.2 Déploiement en production

1. Après avoir exécuté `pull-from-test.sh` dans le Repl de production
2. Cliquez sur le bouton "Deploy" dans l'interface Replit

## 5. Base de données

### 5.1 Configuration de la base de données par environnement

1. Créez une base de données PostgreSQL séparée pour chaque environnement
2. Dans chaque Repl, exécutez:
   ```bash
   npm run db:push
   ```

### 5.2 Migration de données importantes

Pour migrer des données spécifiques d'un environnement à un autre:

1. Exportation:
   ```bash
   ./scripts/multi-repls-setup/export-data.sh table_name
   ```

2. Importation:
   ```bash
   ./scripts/multi-repls-setup/import-data.sh table_name
   ```

## Bonnes pratiques

1. **Versionnage**: Utilisez des tags Git pour marquer les versions stables
2. **Tests**: Testez rigoureusement en environnement de test avant de passer en production
3. **Rollbacks**: Conservez des tags de versions pour pouvoir revenir en arrière si nécessaire
4. **Secrets**: Ne stockez jamais les secrets dans Git, utilisez les variables d'environnement Replit
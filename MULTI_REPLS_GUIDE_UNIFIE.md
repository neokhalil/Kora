# Guide unifié de configuration multi-environnements pour Kora

Ce guide explique en détail comment configurer, synchroniser et gérer les différents environnements de l'application Kora, en couvrant la mise en place des Repls et le workflow de développement.

## Table des matières

1. [Guide rapide](#guide-rapide)
2. [Architecture des environnements](#architecture-des-environnements)
3. [Configuration initiale](#configuration-initiale)
   - [Configuration de l'authentification Git](#configuration-de-lauthentification-git)
   - [Création et configuration des Repls](#création-et-configuration-des-repls)
     - [Environnement de développement](#configuration-de-lenvironnement-de-développement)
     - [Environnement de test](#configuration-de-lenvironnement-de-test)
     - [Environnement de production](#configuration-de-lenvironnement-de-production)
   - [Configuration des workflows Replit](#configuration-des-workflows-replit)
4. [Workflow de développement et migration](#workflow-de-développement-et-migration)
   - [Développement en environnement DEV](#1-développement-et-validation-en-environnement-dev)
   - [Migration vers l'environnement TEST](#2-migration-vers-lenvironnement-test)
   - [Migration vers l'environnement PROD](#3-migration-vers-lenvironnement-production)
5. [Vérification de la configuration](#vérification-de-la-configuration)
6. [URLs des environnements](#urls-des-environnements)
7. [Bonnes pratiques](#bonnes-pratiques)
8. [Résolution des problèmes courants](#résolution-des-problèmes-courants)

---

## Guide rapide

### Commandes essentielles

#### Pour migrer de DEV vers TEST
1. Se connecter à l'environnement TEST
2. Exécuter : `./scripts/multi-repls-setup/pull-from-dev.sh`
3. Démarrer l'application : `npm run dev` ou utiliser le workflow Replit "Start application"
4. Initialiser ou mettre à jour la base de données : `npm run db:push`

#### Pour migrer de TEST vers PROD
1. Se connecter à l'environnement PROD
2. Exécuter : `./scripts/multi-repls-setup/pull-from-test.sh`
3. Démarrer l'application : `npm run start` ou utiliser le workflow Replit "Start application"
4. Initialiser ou mettre à jour la base de données : `npm run db:push`
5. Déployer (si nécessaire) en cliquant sur le bouton "Deploy" dans l'interface Replit

### Vue d'ensemble du processus complet

1. **Développement (DEV)**
   - Développer la fonctionnalité
   - Tester localement
   - Commiter les changements
   - Pousser vers le dépôt GitHub principal : `git push origin main`

2. **Test (TEST)**
   - Se connecter à l'environnement TEST
   - Exécuter `./scripts/multi-repls-setup/pull-from-dev.sh`
   - Tester de manière approfondie
   - Corriger les problèmes si nécessaire

3. **Production (PROD)**
   - Se connecter à l'environnement PROD
   - Exécuter `./scripts/multi-repls-setup/pull-from-test.sh`
   - Vérifier et surveiller après déploiement

> **Note importante** : Les anciens scripts `sync-to-test.sh` et `sync-to-prod.sh` ne sont plus utilisés. Ils ont été remplacés par les scripts `pull-from-dev.sh` et `pull-from-test.sh`

---

## Architecture des environnements

L'application Kora utilise trois environnements distincts :

- **Développement (DEV)** : Environnement local pour le développement initial des fonctionnalités
- **Test (TEST)** : Environnement intermédiaire pour les tests d'intégration et la validation
- **Production (PROD)** : Environnement final accessible aux utilisateurs

Chaque environnement possède sa propre instance Replit, sa propre base de données et ses propres variables d'environnement.

---

## Configuration initiale

### Configuration de l'authentification Git

Avant de commencer, configurez l'authentification Git pour permettre les synchronisations entre environnements :

```bash
# Rendez le script exécutable
chmod +x scripts/multi-repls-setup/configure-git-auth.sh

# Exécutez le script de configuration
./scripts/multi-repls-setup/configure-git-auth.sh
```

Pour plus de détails, consultez le guide de configuration Git (`./scripts/multi-repls-setup/git-setup.md`).

### Création et configuration des Repls

#### Création des Repls de test et production

1. **Créez un Repl de développement** (`kora-dev`) :
   - Connectez-vous à votre compte Replit
   - Cliquez sur "+ Create Repl"
   - Sélectionnez "Node.js" comme template
   - Nommez votre Repl "kora-dev"
   - Importez depuis GitHub : `https://github.com/votre-username/Kora.git`
   - Cliquez sur "Create Repl"

2. **Créez un Repl de test** (`kora-test`) :
   - Suivez les mêmes étapes que pour le Repl de dev, mais nommez-le "kora-test"

3. **Créez un Repl de production** (`kora-prod`) :
   - Suivez les mêmes étapes que pour le Repl de dev, mais nommez-le "kora-prod"

#### Configuration de l'environnement de développement

1. Configuration de l'environnement :
   - Créez un fichier `.env` basé sur le modèle :
     ```bash
     cp scripts/multi-repls-setup/env-template.dev .env
     ```
   - Ajoutez la variable d'environnement NODE_ENV=development dans les Secrets du Repl

2. Configurez les secrets dans les paramètres du Repl :
   - `OPENAI_API_KEY` : Votre clé API OpenAI
   - `NODE_ENV` : development

3. Créez une base de données dédiée pour l'environnement de développement :
   - Utilisez l'outil create_postgresql_database_tool dans Replit
   - Mettez à jour le fichier `.env` avec l'URL de connexion dans DATABASE_URL

4. Préparez l'environnement de build et initialisez la base de données :
   ```bash
   # Créer le dossier public requis par Vite
   mkdir -p server/public
   
   # Installer les dépendances
   npm install
   
   # Initialiser la base de données
   npm run db:push
   ```

#### Configuration de l'environnement de test

1. Configuration de l'environnement :
   - Créez un fichier `.env` basé sur le modèle :
     ```bash
     cp scripts/multi-repls-setup/env-template.test .env
     ```
   - Ajoutez la variable d'environnement NODE_ENV=test dans les Secrets du Repl

2. Configurez les secrets dans les paramètres du Repl :
   - `OPENAI_API_KEY` : Votre clé API OpenAI
   - `NODE_ENV` : test

3. Créez une base de données dédiée pour l'environnement de test :
   - Utilisez l'outil create_postgresql_database_tool dans Replit
   - Mettez à jour le fichier `.env` avec l'URL de connexion dans DATABASE_URL
   - Vous pouvez également définir TEST_DATABASE_URL qui sera prioritaire sur DATABASE_URL

4. Préparez l'environnement de build et initialisez la base de données :
   ```bash
   # Créer le dossier public requis par Vite
   mkdir -p server/public
   
   # Installer les dépendances
   npm install
   
   # Construire le client
   npm run build
   
   # Initialiser la base de données
   npm run db:push
   ```

5. Configurez l'authentification Git :
   ```bash
   # Rendez les scripts exécutables
   chmod +x scripts/multi-repls-setup/*.sh
   
   # Configurez l'authentification Git
   ./scripts/multi-repls-setup/configure-git-auth.sh
   ```

#### Configuration de l'environnement de production

1. Configuration de l'environnement :
   - Créez un fichier `.env` basé sur le modèle :
     ```bash
     cp scripts/multi-repls-setup/env-template.prod .env
     ```
   - Ajoutez la variable d'environnement NODE_ENV=production dans les Secrets du Repl

2. Configurez les secrets dans les paramètres du Repl :
   - `OPENAI_API_KEY` : Votre clé API OpenAI
   - `NODE_ENV` : production

3. Créez une base de données dédiée pour l'environnement de production :
   - Utilisez l'outil create_postgresql_database_tool dans Replit
   - Mettez à jour le fichier `.env` avec l'URL de connexion dans DATABASE_URL
   - Vous pouvez également définir PROD_DATABASE_URL qui sera prioritaire sur DATABASE_URL

4. Préparez l'environnement de build et initialisez la base de données :
   ```bash
   # Créer le dossier public requis par Vite
   mkdir -p server/public
   
   # Installer les dépendances
   npm install
   
   # Construire le client
   npm run build
   
   # Initialiser la base de données
   npm run db:push
   ```

5. Configurez l'authentification Git :
   ```bash
   # Rendez les scripts exécutables
   chmod +x scripts/multi-repls-setup/*.sh
   
   # Configurez l'authentification Git
   ./scripts/multi-repls-setup/configure-git-auth.sh
   ```

### Configuration des workflows Replit

Dans chaque environnement (dev, test, prod), configurez les workflows Replit pour faciliter le démarrage de l'application :

1. Cliquez sur l'icône "Outils" dans la barre latérale de Replit
2. Sélectionnez "Workflows"
3. Créez un workflow "Start application" avec la commande `npm run dev` pour les environnements dev et test
4. Pour l'environnement de production, créez un workflow "Start application" avec la commande `npm run start`
5. Enregistrez le workflow

---

## Workflow de développement et migration

### 1. Développement et validation en environnement DEV

1. **Développer et tester** la nouvelle fonctionnalité dans l'environnement DEV
2. **Valider** le bon fonctionnement de la fonctionnalité
3. **Commiter** les changements dans le dépôt Git
4. **Pousser** vers le dépôt GitHub principal : `git push origin main`

### 2. Migration vers l'environnement TEST

1. Se connecter à l'environnement TEST
2. Exécuter la commande de synchronisation : `./scripts/multi-repls-setup/pull-from-dev.sh`
3. Mettre à jour la base de données (si nécessaire) : `npm run db:push`
4. Démarrer l'application : `npm run dev` ou utiliser le workflow Replit "Start application"
5. Tester de manière approfondie
6. Corriger les problèmes si nécessaire (retourner à l'étape 1 du développement)

### 3. Migration vers l'environnement PRODUCTION

1. Se connecter à l'environnement PROD
2. Exécuter la commande de synchronisation : `./scripts/multi-repls-setup/pull-from-test.sh`
3. Mettre à jour la base de données (si nécessaire) : `npm run db:push`
4. Construire le client : `npm run build`
5. Démarrer l'application : `npm run start` ou utiliser le workflow Replit "Start application"
6. Déployer (si nécessaire) en cliquant sur le bouton "Deploy" dans l'interface Replit
7. Vérifier et surveiller après déploiement

---

## Vérification de la configuration

Pour chaque Repl, vérifiez que :

1. Le versionnement Git est correctement configuré avec le bon dépôt distant
2. La variable d'environnement NODE_ENV est définie avec la bonne valeur dans les Secrets
3. Le fichier `.env` contient les bonnes informations, notamment l'URL de la base de données
4. Les scripts de synchronisation sont présents et exécutables :
   ```bash
   chmod +x scripts/multi-repls-setup/*.sh
   ```
5. Le workflow "Start application" est configuré avec la commande appropriée

---

## URLs des environnements

Chaque Repl aura sa propre URL publique :

- Développement : `https://kora-dev.votre-nom-utilisateur.repl.co`
- Test : `https://kora-test.votre-nom-utilisateur.repl.co`
- Production : `https://kora-prod.votre-nom-utilisateur.repl.co` ou un domaine personnalisé

Vous pouvez également configurer un domaine personnalisé pour l'environnement de production dans les paramètres du Repl.

---

## Bonnes pratiques

1. **Segmentation claire**
   - Maintenez une séparation stricte entre les environnements
   - Ne développez jamais directement en production
   - Utilisez des bases de données distinctes pour chaque environnement

2. **Gestion des variables d'environnement**
   - Utilisez des fichiers `.env` spécifiques à chaque environnement
   - Stockez les secrets sensibles dans les Secrets Replit
   - Documentez toutes les variables d'environnement requises

3. **Collaboration dans Replit**
   - Utilisez les fonctionnalités de collaboration pour les revues de code avant migration
   - Partagez les environnements avec les membres de l'équipe pour validation
   - Utilisez les commentaires et les discussions pour documenter les décisions

4. **Résilience**
   - Configurez des sauvegardes automatiques dans Replit
   - Utilisez la fonctionnalité de versionnage pour revenir à des états précédents
   - Documentez clairement les URL et accès pour chaque environnement

---

## Résolution des problèmes courants

### Problèmes de synchronisation Git

Si vous rencontrez des problèmes lors de la synchronisation entre environnements :

1. Vérifiez que l'authentification Git est correctement configurée :
   ```bash
   ./scripts/multi-repls-setup/configure-git-auth.sh
   ```

2. Assurez-vous que les scripts sont exécutables :
   ```bash
   chmod +x scripts/multi-repls-setup/*.sh
   ```

3. Si les erreurs persistent, essayez de cloner à nouveau le dépôt :
   ```bash
   # Sauvegardez d'abord votre fichier .env
   cp .env ~/.env-backup
   
   # Nettoyez et clonez à nouveau
   cd ~
   rm -rf *
   git clone https://github.com/votre-username/Kora.git .
   
   # Restaurez votre fichier .env
   cp ~/.env-backup .env
   
   # Réinstallez les dépendances
   npm install
   ```

### Problèmes de base de données

Si vous rencontrez des problèmes avec la base de données :

1. Vérifiez que l'URL de connexion dans `.env` est correcte
2. Assurez-vous que la base de données existe et est accessible
3. En cas de problème de migration, essayez de réinitialiser la base de données (attention : perte de données)

### Problèmes de build

Si vous rencontrez des problèmes lors du build :

1. Assurez-vous que le dossier `server/public` existe :
   ```bash
   mkdir -p server/public
   ```

2. Nettoyez les caches et réinstallez les dépendances :
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

3. Vérifiez les logs de build pour identifier les erreurs spécifiques
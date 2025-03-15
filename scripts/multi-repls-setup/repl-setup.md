# Configuration des Repls pour Kora

Ce guide détaille la procédure pour configurer vos Repls d'environnement de test et de production en cohérence avec l'architecture actuelle de Kora.

## Vérification du versionnement Git

Pour chaque Repl (développement, test, production), assurez-vous que Git est correctement configuré:

1. Ouvrez un terminal dans votre Repl
2. Vérifiez que Git est déjà initialisé:
   ```bash
   git status
   ```
3. Si vous obtenez une erreur indiquant que ce n'est pas un dépôt Git, initialisez-le:
   ```bash
   git init
   git branch -M main
   ```
4. Configurez le dépôt distant:
   ```bash
   git remote add origin https://github.com/neokhalil/Kora.git
   ```

Cette étape est **essentielle** pour permettre la synchronisation entre les environnements.

## Configuration de l'environnement de test

1. Créez un nouveau Repl en important depuis GitHub:
   - URL: `https://github.com/neokhalil/Kora.git`
   - Nom: `kora-test`
   - Type: Node.js

2. Configuration de l'environnement:
   - Créez un fichier `.env` basé sur le modèle:
     ```bash
     cp scripts/multi-repls-setup/env-template.test .env
     ```
   - Ajoutez la variable d'environnement NODE_ENV=test dans les Secrets du Repl

3. Configurez les secrets dans les paramètres du Repl:
   - `OPENAI_API_KEY`: Votre clé API OpenAI
   - `NODE_ENV`: test

4. Créez une base de données dédiée pour l'environnement de test:
   - Utilisez l'outil create_postgresql_database_tool dans Replit
   - Mettez à jour le fichier `.env` avec l'URL de connexion dans DATABASE_URL
   - Vous pouvez également définir TEST_DATABASE_URL qui sera prioritaire sur DATABASE_URL

5. Préparez l'environnement de build et initialisez la base de données:
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

## Configuration de l'environnement de production

1. Créez un nouveau Repl en important depuis GitHub:
   - URL: `https://github.com/neokhalil/Kora.git`
   - Nom: `kora-prod`
   - Type: Node.js

2. Configuration de l'environnement:
   - Créez un fichier `.env` basé sur le modèle:
     ```bash
     cp scripts/multi-repls-setup/env-template.prod .env
     ```
   - Ajoutez la variable d'environnement NODE_ENV=production dans les Secrets du Repl

3. Configurez les secrets dans les paramètres du Repl:
   - `OPENAI_API_KEY`: Votre clé API OpenAI
   - `NODE_ENV`: production

4. Créez une base de données dédiée pour l'environnement de production:
   - Utilisez l'outil create_postgresql_database_tool dans Replit
   - Mettez à jour le fichier `.env` avec l'URL de connexion dans DATABASE_URL
   - Vous pouvez également définir PROD_DATABASE_URL qui sera prioritaire sur DATABASE_URL

5. Préparez l'environnement de build et initialisez la base de données:
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

## Synchronisation entre environnements

Kora dispose de scripts pour synchroniser le code entre les environnements:

1. Pour déployer depuis le développement vers le test:
   - Sur l'environnement de test, exécutez:
     ```bash
     ./scripts/multi-repls-setup/pull-from-dev.sh
     ```

2. Pour déployer depuis le test vers la production:
   - Sur l'environnement de production, exécutez:
     ```bash
     ./scripts/multi-repls-setup/pull-from-test.sh
     ```

Ces scripts vont automatiquement:
- Sauvegarder les fichiers de configuration locaux
- Tirer les dernières modifications du dépôt Git
- Restaurer les fichiers de configuration locaux
- Installer les dépendances
- Construire l'application
- Vérifier et réparer le répertoire de build si nécessaire
- Appliquer les migrations de base de données
- Préparer l'application pour le démarrage

## Gestion des erreurs courantes

Si vous rencontrez l'erreur "Could not find the build directory", le script de synchronisation lancera automatiquement la correction. Vous pouvez également exécuter manuellement:

```bash
./scripts/fix-build-directory.sh
```

Ce script:
- Crée le répertoire `server/public` s'il n'existe pas
- Ajoute des fichiers minimaux pour permettre au serveur de démarrer
- Configure les permissions appropriées

Pour les erreurs TypeScript lors du build, essayez ces solutions:
1. Nettoyez le cache de build:
   ```bash
   rm -rf node_modules/.vite
   ```

2. Si l'erreur persiste, essayez de reconstruire avec:
   ```bash
   NODE_ENV=production npm run build
   ```

## Gestion des schémas de base de données

Lors de modifications du schéma de base de données:

1. Modifiez les modèles dans `shared/schema.ts` sur l'environnement de développement
2. Exécutez `npm run db:push` pour appliquer les changements
3. Après avoir testé les changements, utilisez les scripts de synchronisation pour déployer vers test puis production
4. Sur chaque environnement cible, exécutez également `npm run db:push` après la synchronisation

## Vérification de la configuration

Pour chaque Repl, vérifiez que:

1. Le versionnement Git est correctement configuré avec le bon dépôt distant
2. La variable d'environnement NODE_ENV est définie avec la bonne valeur dans les Secrets
3. Le fichier `.env` contient les bonnes informations, notamment l'URL de la base de données
4. Les scripts de synchronisation sont présents et exécutables:
   ```bash
   chmod +x scripts/multi-repls-setup/*.sh
   ```
5. Le workflow "Start application" est configuré pour exécuter `npm run dev`

## URLs des environnements

Chaque Repl aura sa propre URL publique:

- Développement: `https://kora-dev.votre-nom-utilisateur.repl.co`
- Test: `https://kora-test.votre-nom-utilisateur.repl.co`
- Production: `https://kora-prod.votre-nom-utilisateur.repl.co` ou un domaine personnalisé

Vous pouvez configurer un domaine personnalisé pour l'environnement de production dans les paramètres du Repl.
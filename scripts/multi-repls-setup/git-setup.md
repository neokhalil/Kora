# Configuration Git pour le projet Kora

Ce guide explique comment configurer Git pour permettre la synchronisation entre vos différents environnements Replit.

## Création du dépôt GitHub

1. Connectez-vous à votre compte GitHub
2. Créez un nouveau dépôt (repository):
   - Nom: `kora-app` (ou un autre nom de votre choix)
   - Visibilité: Public ou Private (selon vos préférences)
   - N'initialisez pas le dépôt avec un README, .gitignore ou license

## Configuration initiale dans le Repl de développement

1. Ouvrez votre Repl de développement (où vous travaillez actuellement)

2. Replit intègre désormais Git automatiquement. Pour initialiser Git dans votre projet:
   ```bash
   git init
   git branch -M main
   ```

   Si vous voyez une erreur indiquant que le dépôt Git existe déjà, c'est que Git est déjà initialisé dans votre Repl, vous pouvez passer à l'étape suivante.

4. Créez un fichier `.gitignore` pour exclure les fichiers sensibles:
   ```bash
   cat > .gitignore << 'EOL'
   # Environment variables
   .env

   # Node.js
   node_modules/
   npm-debug.log
   yarn-debug.log
   yarn-error.log

   # Build
   dist/
   build/

   # Database
   data/exports/
   data/backups/

   # Logs
   logs/
   *.log

   # Temp files
   .DS_Store
   Thumbs.db
   .tmp/
   temp/
   EOL
   ```

5. Ajoutez votre dépôt GitHub comme remote:
   ```bash
   git remote add origin https://github.com/VOTRE_USERNAME/kora-app.git
   ```

6. Faites votre premier commit:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

7. Poussez vers GitHub:
   ```bash
   git push -u origin main
   ```

## Configuration du Personal Access Token (PAT)

Pour permettre à Replit de pousser vers GitHub, vous aurez besoin d'un token d'accès personnel:

1. Sur GitHub, allez dans Settings > Developer settings > Personal access tokens
2. Cliquez sur "Generate new token" (Fine-grained tokens)
3. Donnez un nom descriptif comme "Kora Replit Integration"
4. Sélectionnez le repo que vous venez de créer
5. Accordez les permissions suivantes:
   - Contents: Read and write
   - Metadata: Read-only
6. Cliquez sur "Generate token"
7. **Important**: Copiez le token généré, vous ne pourrez plus le voir après avoir quitté cette page

## Configuration de l'authentification dans Replit

1. Dans chaque Repl (développement, test, production), configurez l'authentification Git:
   ```bash
   git config user.name "Votre Nom"
   git config user.email "votre.email@exemple.com"
   ```

2. Configurez le token comme secret dans Replit:
   - Ouvrez les paramètres du Repl (icône ⚙️)
   - Allez à la section "Secrets"
   - Ajoutez un nouveau secret:
     - Key: `GITHUB_TOKEN`
     - Value: Votre token d'accès personnel
   - Cliquez sur "Add Secret"

3. Créez un script pour configurer l'authentification:
   ```bash
   cat > scripts/multi-repls-setup/configure-git-auth.sh << 'EOL'
   #!/bin/bash
   # Script pour configurer l'authentification Git avec GitHub

   # Vérifier si le token est défini
   if [ -z "$GITHUB_TOKEN" ]; then
     echo "❌ Erreur: Token GitHub non défini"
     echo "   Ajoutez le secret GITHUB_TOKEN dans les paramètres du Repl"
     exit 1
   fi

   # Configurer git pour utiliser le token
   git config --global credential.helper store
   echo "https://oauth2:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
   chmod 600 ~/.git-credentials

   echo "✅ Authentification Git configurée avec succès!"
   EOL
   ```

4. Rendez le script exécutable:
   ```bash
   chmod +x scripts/multi-repls-setup/configure-git-auth.sh
   ```

5. Exécutez le script:
   ```bash
   ./scripts/multi-repls-setup/configure-git-auth.sh
   ```

## Test de la configuration

Pour vérifier que tout fonctionne correctement:

1. Faites une modification mineure dans un fichier
2. Committez et poussez:
   ```bash
   git add .
   git commit -m "Test commit"
   git push
   ```

3. Vérifiez sur GitHub que le commit apparaît dans votre dépôt

## Configuration des Repls de test et production

Une fois que vous avez configuré votre dépôt et poussé le code initial:

1. Créez vos Repls de test et production en important depuis GitHub:
   - Utilisez l'URL de votre dépôt: `https://github.com/VOTRE_USERNAME/kora-app.git`
   - Suivez les instructions détaillées dans `repl-setup.md`

2. Pour chaque nouveau Repl, n'oubliez pas:
   - D'activer Git dans les paramètres
   - De configurer le secret GITHUB_TOKEN
   - D'exécuter le script `configure-git-auth.sh`

## Flux de travail quotidien

1. Dans le Repl de développement:
   - Travaillez normalement, faites des commits réguliers
   - Poussez vos changements vers GitHub
   - Utilisez `sync-to-test.sh` quand vous êtes prêt à tester

2. Dans le Repl de test:
   - Utilisez `pull-from-dev.sh` pour récupérer les changements
   - Testez l'application
   - Utilisez `sync-to-prod.sh` quand vous êtes prêt à déployer

3. Dans le Repl de production:
   - Utilisez `pull-from-test.sh v1.0.0` pour déployer une version spécifique
   - Vérifiez que tout fonctionne correctement
   - Déployez l'application

## Branches Git et stratégie de versionnement

Pour une gestion plus avancée, envisagez d'adopter une stratégie de branches:

- `main`: Code stable, prêt pour la production
- `develop`: Développement actif, intégration continue
- Branches de fonctionnalités: Pour chaque nouvelle fonctionnalité

Pour plus d'informations sur les stratégies de branches Git, consultez le modèle [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/) ou [GitHub Flow](https://guides.github.com/introduction/flow/).
# Configuration des Repls pour Kora

Ce guide détaille la procédure pour configurer vos Repls d'environnement de test et de production.

## Configuration du versionnement Git

Pour chaque Repl (développement, test, production), vous devez activer le versionnement Git:

1. Ouvrez les paramètres du Repl (icône ⚙️)
2. Naviguez à la section "Version Control"
3. Activez l'option "Enable Git Version Control"
4. Cliquez sur "Apply"

Cette étape est **essentielle** pour permettre la synchronisation entre les environnements.

## Configuration de l'environnement de test

1. Créez un nouveau Repl en important depuis GitHub:
   - URL: `https://github.com/VOTRE_USERNAME/kora-app.git`
   - Nom: `kora-test`
   - Type: Node.js

2. Après création, modifiez le fichier `server/config/environments.ts`:
   ```typescript
   // Base configuration
   const config = {
     environment: 'test', // Changer cette ligne
     // ... reste du fichier inchangé
   };
   ```

3. Créez un fichier `.env` basé sur le modèle:
   ```bash
   cp scripts/multi-repls-setup/env-template.test .env
   ```

4. Configurez les secrets dans les paramètres du Repl:
   - `OPENAI_API_KEY`: Votre clé API OpenAI

5. Créez une base de données dédiée pour l'environnement de test:
   - Utilisez l'outil create_postgresql_database_tool dans Replit
   - Mettez à jour le fichier `.env` avec l'URL de connexion

6. Initialisez la base de données:
   ```bash
   npm run db:push
   ```

## Configuration de l'environnement de production

1. Créez un nouveau Repl en important depuis GitHub:
   - URL: `https://github.com/VOTRE_USERNAME/kora-app.git`
   - Nom: `kora-prod`
   - Type: Node.js

2. Après création, modifiez le fichier `server/config/environments.ts`:
   ```typescript
   // Base configuration
   const config = {
     environment: 'production', // Changer cette ligne
     // ... puis modifier ces configurations
     database: {
       url: process.env.DATABASE_URL,
       ssl: true, // Activer SSL pour la production
       logging: false,
     },
     debug: false,
   };
   ```

3. Créez un fichier `.env` basé sur le modèle:
   ```bash
   cp scripts/multi-repls-setup/env-template.prod .env
   ```

4. Configurez les secrets dans les paramètres du Repl:
   - `OPENAI_API_KEY`: Votre clé API OpenAI

5. Créez une base de données dédiée pour l'environnement de production:
   - Utilisez l'outil create_postgresql_database_tool dans Replit
   - Mettez à jour le fichier `.env` avec l'URL de connexion

6. Initialisez la base de données:
   ```bash
   npm run db:push
   ```

## Vérification de la configuration

Pour chaque Repl, vérifiez que:

1. Le versionnement Git est activé
2. L'environnement est correctement configuré dans `server/config/environments.ts`
3. Le fichier `.env` contient les bonnes informations
4. Les scripts de synchronisation sont présents dans `scripts/multi-repls-setup/`
5. Les permissions d'exécution sont configurées sur les scripts:
   ```bash
   chmod +x scripts/multi-repls-setup/*.sh
   ```

## URLs des environnements

Chaque Repl aura sa propre URL publique:

- Développement: `https://kora-dev.VOTRE_USERNAME.repl.co`
- Test: `https://kora-test.VOTRE_USERNAME.repl.co`
- Production: `https://kora-prod.VOTRE_USERNAME.repl.co` ou un domaine personnalisé

Vous pouvez également configurer un domaine personnalisé pour l'environnement de production dans les paramètres du Repl.
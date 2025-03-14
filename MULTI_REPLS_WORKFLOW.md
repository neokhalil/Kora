# Guide de configuration multi-environnement pour Kora

Ce document explique comment gérer et synchroniser plusieurs environnements Replit pour l'application Kora.

## Structure des environnements

L'application Kora utilise trois environnements distincts :

1. **Développement (dev)** : Pour le développement actif et les tests rapides
2. **Test (test)** : Pour les tests plus approfondis avant déploiement
3. **Production (prod)** : Pour l'application en production accessible aux utilisateurs

## Architecture de configuration

La configuration de l'application a été modularisée pour faciliter la gestion multi-environnement :

```
server/config/
├── environments.ts       # Point d'entrée principal qui charge la configuration appropriée
├── env.common.ts         # Configuration commune à tous les environnements
├── env.development.ts    # Configuration spécifique à l'environnement de développement
├── env.test.ts           # Configuration spécifique à l'environnement de test
└── env.production.ts     # Configuration spécifique à l'environnement de production
```

### Fonctionnement

- `environments.ts` charge la configuration appropriée en fonction de la variable d'environnement `NODE_ENV`
- Les variables sensibles sont stockées dans des fichiers `.env` et ne sont jamais versionnées
- Chaque environnement peut avoir ses propres valeurs pour les paramètres comme le niveau de journalisation, le SSL, etc.

## Procédure de synchronisation

### Synchronisation de Test depuis Développement

Pour synchroniser l'environnement de test avec la dernière version de développement :

1. Dans l'environnement de test, exécutez le script :
   ```bash
   ./scripts/multi-repls-setup/pull-from-dev.sh
   ```

2. Ce script effectue automatiquement les opérations suivantes :
   - Sauvegarde les configurations spécifiques à l'environnement de test
   - Récupère les derniers changements depuis le dépôt de développement
   - Réapplique les configurations spécifiques à l'environnement de test
   - Met à jour les dépendances
   - Applique les migrations de base de données si nécessaire

3. En cas de conflit, le script crée des fichiers `.backup` et vous informe des fichiers concernés

### Synchronisation de Production depuis Test

Pour synchroniser l'environnement de production avec la version testée :

1. Dans l'environnement de production, exécutez :
   ```bash
   ./scripts/multi-repls-setup/pull-from-test.sh
   ```

Si ce script n'existe pas encore, vous pouvez le créer en suivant le modèle de `pull-from-dev.sh` mais en ajustant les URLs des dépôts.

### Résolution de l'erreur "Could not find the build directory"

Si vous rencontrez cette erreur dans l'environnement de test après une synchronisation :
```
Error: Could not find the build directory: /home/runner/workspace/server/public, make sure to build the client first
```

C'est généralement parce que les fichiers client n'ont pas été compilés. Suivez ces étapes :

1. Assurez-vous que le dossier existe :
   ```bash
   mkdir -p server/public
   ```

2. Construisez explicitement le client :
   ```bash
   npm run build
   ```

3. Si l'erreur persiste, vous pouvez forcer la génération des fichiers statiques :
   ```bash
   # Option 1: Copier depuis l'environnement de développement si disponible
   cp -r ../dev-environment/server/public/* server/public/
   
   # Option 2: Créer un fichier minimal pour que le serveur démarre
   echo "console.log('Client loading...');" > server/public/index.js
   echo "<html><body>Loading...</body></html>" > server/public/index.html
   ```

4. Redémarrez ensuite le serveur :
   ```bash
   npm run dev
   ```

### Résolution de l'erreur "drizzle-kit: command not found"

Si vous rencontrez cette erreur lors de l'exécution de `npm run db:push` :
```
drizzle-kit: command not found
```

C'est généralement parce que le module `drizzle-kit` n'est pas correctement installé ou accessible globalement. Suivez ces étapes :

1. Réinstallez spécifiquement drizzle-kit :
   ```bash
   npm install -D drizzle-kit
   ```

2. Vérifiez que le script est correctement défini dans votre package.json :
   ```bash
   cat package.json | grep db:push
   ```
   
   Il devrait ressembler à :
   ```json
   "db:push": "drizzle-kit push:pg"
   ```

3. Si le problème persiste, utilisez npx pour exécuter la commande :
   ```bash
   npx drizzle-kit push:pg
   ```

4. Vous pouvez aussi créer un script temporaire pour contourner ce problème :
   ```bash
   # Créer un script temporaire
   echo '#!/bin/bash
   npx drizzle-kit push:pg
   ' > ./scripts/db-push.sh
   
   # Rendre le script exécutable
   chmod +x ./scripts/db-push.sh
   
   # Exécuter le script
   ./scripts/db-push.sh
   ```

### Résolution des conflits

Si des conflits surviennent pendant la synchronisation :

1. **Conflit dans les fichiers de configuration** :
   - Vérifiez les fichiers `.backup` créés par le script
   - Comparez les changements avec les nouveaux fichiers
   - Fusionnez manuellement les modifications pertinentes

2. **Conflit dans d'autres fichiers** :
   - Utilisez `git diff` pour examiner les différences
   - Décidez quelles modifications conserver en fonction des besoins de l'environnement actuel
   - Mettez à jour les fichiers manuellement

## Bonnes pratiques

1. **Toujours tester après synchronisation** :
   ```bash
   npm run dev
   ```

2. **Ne modifiez pas directement** `environments.ts` :
   - Ajoutez vos configurations spécifiques dans le fichier d'environnement approprié
   - Cette approche évite les conflits lors de la synchronisation

3. **Tenez un journal des changements spécifiques à l'environnement** :
   - Notez les configurations particulières à chaque environnement
   - Documentez les raisons de ces différences

4. **Utilisez des variables d'environnement** pour les valeurs sensibles ou spécifiques à l'environnement :
   - Clés API
   - Paramètres de connexion à la base de données
   - Niveaux de journalisation

## Utilisation des environnements lors du développement

- Pour forcer l'utilisation d'un environnement spécifique, définissez `NODE_ENV` :
  ```bash
  # En ligne de commande :
  NODE_ENV=test npm run dev
  
  # Ou dans le fichier .env :
  NODE_ENV=test
  ```

- Par défaut, si aucun environnement n'est spécifié, l'application utilise l'environnement de développement
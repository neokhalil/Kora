# Guide de configuration multi-environnement pour Kora

Ce document explique comment gérer et synchroniser plusieurs environnements Replit pour l'application Kora.

## Structure des environnements

L'application Kora utilise trois environnements distincts :

1. **Développement (dev)** : Pour le développement actif et les tests rapides
2. **Test (test)** : Pour les tests plus approfondis avant déploiement
3. **Production (prod)** : Pour l'application en production accessible aux utilisateurs

## Workflow de migration entre environnements

Le processus de migration d'une fonctionnalité entre les différents environnements suit un workflow précis pour garantir la stabilité et la qualité du code.

### 1. Développement et validation en environnement DEV

1. **Développer et tester** la nouvelle fonctionnalité dans l'environnement de développement
2. **Effectuer des tests unitaires** et des tests manuels pour s'assurer que tout fonctionne comme prévu
3. **Valider avec les parties prenantes** si nécessaire

### 2. Préparation au commit en environnement DEV

Avant de migrer vers l'environnement de test, suivez ces étapes dans l'environnement DEV :

1. **Vérifiez les fichiers modifiés** :
   ```bash
   git status
   ```

2. **Examinez en détail les changements** :
   ```bash
   git diff
   ```

3. **Ajoutez les fichiers à committer** :
   ```bash
   # Pour ajouter des fichiers spécifiques
   git add chemin/vers/fichier1 chemin/vers/fichier2
   
   # Pour ajouter tous les fichiers modifiés (à utiliser avec précaution)
   git add .
   ```

4. **Créez un commit descriptif** :
   ```bash
   git commit -m "Description détaillée des changements apportés"
   ```
   
   Exemple de message de commit efficace :
   ```
   Implémentation du rendu d'équations mathématiques avec ContentRenderer
   
   - Remplacé MathJaxRenderer par ContentRenderer
   - Ajouté styles CSS dédiés pour le rendu mathématique
   - Optimisé l'affichage sur mobile
   - Corrigé problèmes d'espacement avec les formules longues
   ```

5. **Poussez les changements** vers le dépôt Git principal :
   ```bash
   git push origin main
   ```

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

### 3. Migration vers l'environnement TEST

Une fois que les changements sont validés en environnement de développement et que vous avez effectué un commit, suivez ces étapes simplifiées pour migrer vers l'environnement de test :

1. **Connectez-vous à l'environnement de test** via Replit

2. **Exécutez le script automatisé** qui gère la sauvegarde, la récupération des changements et la restauration :
   ```bash
   ./scripts/multi-repls-setup/pull-from-dev.sh
   ```

   Ce script effectue automatiquement toutes les opérations nécessaires :
   - Sauvegarde des fichiers de configuration spécifiques à TEST
   - Récupération des derniers changements depuis le dépôt GitHub partagé
   - Préservation des configurations spécifiques à TEST
   - Mise à jour des dépendances
   - Construction de l'application
   - Application des migrations de base de données

3. **Testez les nouvelles fonctionnalités** dans l'environnement de test:
   - Vérifiez que toutes les fonctionnalités migrées fonctionnent correctement
   - Réalisez des tests approfondis de régression
   - Documentez tout problème identifié

4. **En cas de problème** :
   - Si des problèmes sont identifiés, retournez en environnement DEV, corrigez-les et répétez le processus de migration

### 4. Migration vers l'environnement PRODUCTION

Une fois que vous avez validé les changements dans l'environnement de test et que tout fonctionne comme prévu, vous pouvez procéder à la migration vers l'environnement de production avec ces étapes simplifiées :

1. **Connectez-vous à l'environnement de production** via Replit

2. **Exécutez le script automatisé** qui gère tout le processus de migration :
   ```bash
   ./scripts/multi-repls-setup/pull-from-test.sh
   ```

   Ce script effectue automatiquement toutes les opérations nécessaires :
   - Sauvegarde des fichiers de configuration spécifiques à PRODUCTION
   - Récupération des derniers changements depuis le dépôt GitHub partagé
   - Préservation des configurations spécifiques à PRODUCTION
   - Mise à jour des dépendances
   - Construction de l'application
   - Application des migrations de base de données

3. **Vérifiez que l'application fonctionne correctement** :
   - Testez les principales fonctionnalités
   - Vérifiez les journaux pour détecter d'éventuelles erreurs
   - Surveillez les performances pendant quelques minutes

4. **En cas de problème** :
   Si des problèmes critiques sont détectés en production, vous pouvez revenir à l'état précédent en exécutant :
   
   ```bash
   # 1. Revenez au commit précédent
   git reset --hard HEAD~1
   
   # 2. Restaurez les configurations sauvegardées par le script
   cp .env.backup.* .env
   cp server/config/env.production.ts.backup.* server/config/env.production.ts
   
   # 3. Reconstruisez et redémarrez
   npm run build
   npm run start
   ```

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

### Gestion des fichiers spécifiques à l'environnement

Lors de la migration entre environnements, les fichiers de configuration spécifiques à chaque environnement nécessitent une attention particulière :

1. **Fichiers à protéger lors de la migration** :
   - `.env` - Contient les variables d'environnement et les secrets
   - `server/config/env.[environment].ts` - Configuration spécifique à l'environnement
   - Tout fichier contenant des informations spécifiques à l'environnement (certificats, clés, etc.)

2. **Procédure recommandée** :
   ```bash
   # 1. Avant la migration, sauvegardez les fichiers
   mkdir -p /tmp/env-backup-$(date +%Y%m%d)
   cp .env /tmp/env-backup-$(date +%Y%m%d)/
   cp server/config/env.test.ts /tmp/env-backup-$(date +%Y%m%d)/  # pour l'environnement TEST
   
   # 2. Après la migration, restaurez les fichiers
   cp /tmp/env-backup-$(date +%Y%m%d)/.env .
   cp /tmp/env-backup-$(date +%Y%m%d)/env.test.ts server/config/
   ```

3. **Utilisation du fichier `.gitignore`** :
   - Assurez-vous que `.env` est inclus dans `.gitignore`
   - Ne versionnez jamais les fichiers contenant des secrets
   - Utilisez un fichier `.env.example` comme modèle versionné sans valeurs sensibles

4. **Solution pour les workflows automatisés** :
   - Les scripts de migration (`pull-from-dev.sh` et `pull-from-test.sh`) doivent sauvegarder et restaurer automatiquement ces fichiers
   - Surveillez les messages d'erreur indiquant des problèmes avec ces fichiers

### Résolution des conflits

Si des conflits surviennent pendant la synchronisation :

1. **Conflit dans les fichiers de configuration** :
   - Vérifiez les fichiers `.backup` créés par le script
   - Comparez les changements avec les nouveaux fichiers
   - Fusionnez manuellement les modifications pertinentes
   - Pour les fichiers `.env`, privilégiez toujours la version de l'environnement cible

2. **Conflit dans d'autres fichiers** :
   - Utilisez `git diff` pour examiner les différences
   - Décidez quelles modifications conserver en fonction des besoins de l'environnement actuel
   - Mettez à jour les fichiers manuellement

## Bonnes pratiques pour les migrations entre environnements

### Planification et communication

1. **Planifiez les déploiements** :
   - Évitez les déploiements en production le vendredi après-midi ou juste avant les congés
   - Établissez un calendrier régulier de déploiement pour créer des habitudes
   - Prévoyez des fenêtres de maintenance pour les mises à jour importantes

2. **Documentez chaque migration** :
   - Créez un journal de déploiement avec la date, les fonctionnalités déployées et les problèmes rencontrés
   - Utilisez un système de gestion des tickets pour suivre les demandes de déploiement
   - Documentez les décisions prises pendant le processus de migration

3. **Communiquez avec toutes les parties prenantes** :
   - Informez les utilisateurs en avance des interruptions de service prévues
   - Partagez les notes de version décrivant les nouvelles fonctionnalités et corrections
   - Établissez un canal de communication pour signaler les problèmes après déploiement

### Préparation technique

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

5. **Automatisez autant que possible** :
   - Créez des scripts pour les tâches répétitives
   - Standardisez le processus de déploiement
   - Utilisez des listes de contrôle pour ne rien oublier

### Sécurité et récupération

1. **Effectuez toujours des sauvegardes avant migration** :
   - Base de données
   - Fichiers de configuration
   - Code source

2. **Préparez une stratégie de rollback** :
   - Sauvegardez l'état avant déploiement
   - Testez la procédure de rollback avant d'en avoir besoin
   - Documentez clairement les étapes de récupération

3. **Surveillez attentivement après déploiement** :
   - Vérifiez les journaux d'erreurs
   - Surveillez les performances de l'application
   - Configurez des alertes pour les problèmes critiques

## Utilisation des environnements lors du développement

- Pour forcer l'utilisation d'un environnement spécifique, définissez `NODE_ENV` :
  ```bash
  # En ligne de commande :
  NODE_ENV=test npm run dev
  
  # Ou dans le fichier .env :
  NODE_ENV=test
  ```

- Par défaut, si aucun environnement n'est spécifié, l'application utilise l'environnement de développement

## Résumé du workflow complet de migration

### Vue d'ensemble du processus

Pour synchroniser entre les environnements, il n'y a qu'une seule commande à exécuter sur chaque environnement cible :

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

### Conseil spécifiques à Replit

1. **Gestion des Secrets**
   - Utilisez la fonction Secrets de Replit pour stocker les variables d'environnement sensibles
   - Ne jamais stocker les clés API ou informations d'identification dans le code source

2. **Workflow Replit**
   - Utilisez la fonctionnalité "Replit Deployments" pour déployer l'environnement de production
   - Configurez des workflows dédiés pour chaque environnement
   - Utilisez la fonctionnalité "Always On" pour les environnements critiques

3. **Collaboration dans Replit**
   - Utilisez les fonctionnalités de collaboration pour les revues de code avant migration
   - Partagez les environnements avec les membres de l'équipe pour validation
   - Utilisez les commentaires et les discussions pour documenter les décisions

4. **Résilience**
   - Configurez des sauvegardes automatiques dans Replit
   - Utilisez la fonctionnalité de versionnage pour revenir à des états précédents
   - Documentez clairement les URL et accès pour chaque environnement

En suivant ce workflow structuré et ces bonnes pratiques, vous pourrez maintenir efficacement les différents environnements de l'application Kora tout en minimisant les risques lors des migrations et déploiements.
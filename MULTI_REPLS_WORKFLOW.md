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
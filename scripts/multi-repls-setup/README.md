# Guide de configuration multi-environnements pour Kora

Ce dossier contient tous les scripts et guides nécessaires pour configurer et maintenir vos différents environnements de Kora (développement, test et production).

## Architecture des environnements

Nous utilisons une approche basée sur 3 Repls distincts:

1. **Environnement de développement** (`kora-dev`)
   - Où vous développez et testez initialement vos fonctionnalités
   - Base de données de développement
   - URL: `https://kora-dev.VOTRE_USERNAME.repl.co`

2. **Environnement de test** (`kora-test`)
   - Pour les tests plus approfondis avant mise en production
   - Base de données de test séparée
   - URL: `https://kora-test.VOTRE_USERNAME.repl.co`

3. **Environnement de production** (`kora-prod`)
   - Version stable et publique de l'application
   - Base de données de production
   - URL: `https://kora-prod.VOTRE_USERNAME.repl.co` (ou domaine personnalisé)

## Guides détaillés

- [Guide de configuration Git](./git-setup.md) - Comment configurer Git pour la synchronisation entre environnements
- [Guide de configuration des Repls](./repl-setup.md) - Comment configurer chaque Repl pour les différents environnements

## Scripts disponibles

### Configuration

- `configure-git-auth.sh` - Configure l'authentification Git pour accéder à GitHub

### Synchronisation Dev → Test

- `sync-to-test.sh` - À exécuter dans l'environnement de développement pour préparer la synchronisation
- `pull-from-dev.sh` - À exécuter dans l'environnement de test pour récupérer les changements

### Synchronisation Test → Production

- `sync-to-prod.sh` - À exécuter dans l'environnement de test pour créer une version à déployer
- `pull-from-test.sh` - À exécuter dans l'environnement de production pour déployer une version

### Gestion des données

- `export-data.sh` - Exporte les données d'une table spécifique
- `import-data.sh` - Importe des données dans un environnement

## Flux de travail typique

1. **Développement**
   ```
   # Dans l'environnement de développement
   # Développez, testez, et committez vos changements
   # Quand vous êtes prêt à tester plus en profondeur:
   ./scripts/multi-repls-setup/sync-to-test.sh
   ```

2. **Test**
   ```
   # Dans l'environnement de test
   ./scripts/multi-repls-setup/pull-from-dev.sh
   # Testez l'application
   # Si tout est OK, préparez pour production:
   ./scripts/multi-repls-setup/sync-to-prod.sh
   ```

3. **Production**
   ```
   # Dans l'environnement de production
   ./scripts/multi-repls-setup/pull-from-test.sh v1.0.0
   # Vérifiez l'application
   # Cliquez sur "Deploy" dans Replit
   ```

## Mise en place initiale

Si vous n'avez pas encore configuré vos environnements, suivez ces étapes:

1. Configurez Git dans votre Repl de développement actuel en suivant le [guide Git](./git-setup.md)
2. Créez vos Repls de test et production en suivant le [guide de configuration des Repls](./repl-setup.md)
3. Rendez tous les scripts exécutables dans chaque Repl:
   ```bash
   chmod +x scripts/multi-repls-setup/*.sh
   ```

## Conseils pour la gestion des environnements

- **Variables d'environnement**: Utilisez différentes valeurs pour chaque environnement
- **Debugging**: Activez les logs détaillés en dev/test, désactivez-les en production
- **Base de données**: Ne partagez jamais les bases de données entre environnements
- **API Keys**: Utilisez des clés API différentes pour chaque environnement si possible
- **Branches Git**: Envisagez d'utiliser des branches différentes pour isoler les fonctionnalités en développement
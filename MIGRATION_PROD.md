# Guide de migration de l'environnement de test vers la production

Ce document décrit la procédure complète pour migrer l'application de l'environnement de test vers l'environnement de production.

## Contexte du problème

Le processus standard de build (`npm run build`) peut échouer en environnement de production avec l'erreur :
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from /node_modules/.vite-temp/vite.config.ts
```

Cette erreur survient car Node.js en environnement de production gère différemment la résolution des modules ESM, ce qui cause des problèmes avec la configuration de Vite.

## Solutions proposées

### Solution 1 : Script de migration automatisé (recommandé)

Un script spécial a été créé pour faciliter la migration : `scripts/migrate-to-prod.sh`

Ce script :
1. Prépare l'environnement de production
2. Compile séparément le backend avec esbuild
3. Tente différentes approches pour compiler le frontend
4. Synchronise les répertoires pour assurer la cohérence

#### Utilisation

```bash
# Exécuter le script de migration
./scripts/migrate-to-prod.sh

# Démarrer l'application en production
NODE_ENV=production node dist/index.js
```

### Solution 2 : Approche manuelle de migration

Si le script automatisé échoue, vous pouvez suivre ces étapes manuelles :

1. **Compiler l'application en environnement de test**
   ```bash
   npm run dev  # Démarrez l'application en mode développement
   # Attendez que l'application soit chargée et fonctionnelle
   ```

2. **Sauvegarder les fichiers compilés de l'environnement de test**
   ```bash
   # Créer une archive des fichiers frontend compilés
   tar -czf frontend-build.tar.gz server/public
   ```

3. **Compiler uniquement le backend en environnement de production**
   ```bash
   # Définir l'environnement de production
   export NODE_ENV=production
   
   # Compiler le backend uniquement
   npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
   ```

4. **Restaurer les fichiers frontend compilés en environnement de test**
   ```bash
   # Extraire les fichiers frontend sauvegardés
   mkdir -p dist/public
   tar -xzf frontend-build.tar.gz
   cp -r server/public/* dist/public/
   ```

5. **Démarrer l'application en production**
   ```bash
   NODE_ENV=production node dist/index.js
   ```

## Bonnes pratiques pour les futures migrations

1. **Toujours tester le build complet avant la migration en production**
   ```bash
   # En environnement de test
   npm run build
   ```

2. **Sauvegarder régulièrement les builds fonctionnels**
   ```bash
   # Créer une archive datée des builds fonctionnels
   tar -czf build-$(date +%Y%m%d).tar.gz dist/ server/public/
   ```

3. **Conserver des journaux détaillés des opérations de migration**
   ```bash
   # Exécuter la migration avec journalisation
   ./scripts/migrate-to-prod.sh | tee migration-$(date +%Y%m%d).log
   ```

## Dépannage

### Problème : Erreur de module introuvable pour vite

**Symptôme :** Erreur `Cannot find package 'vite'` pendant le build.

**Solution :**
1. Vérifiez que vite est correctement installé : `npm install --save-dev vite`
2. Utilisez le script de migration : `./scripts/migrate-to-prod.sh`
3. Si l'erreur persiste, utilisez l'approche manuelle décrite ci-dessus

### Problème : Fichiers manquants dans le build de production

**Symptôme :** L'application ne s'affiche pas correctement en production.

**Solution :**
1. Vérifiez que les répertoires `dist/public` et `server/public` contiennent des fichiers
2. Assurez-vous que les chemins dans l'application pointent vers les bons répertoires
3. Synchronisez manuellement les répertoires : `cp -r dist/public/* server/public/`

## Contacts

Pour toute question concernant le processus de migration, contactez l'équipe de développement.
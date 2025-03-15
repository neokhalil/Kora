#!/usr/bin/env node

/**
 * Script post-build pour synchroniser les répertoires dist/public et server/public
 * 
 * Ce script s'exécute automatiquement après chaque build via le hook "postbuild" dans package.json
 * Il crée un lien symbolique de server/public vers dist/public
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distPublicDir = path.join(rootDir, 'dist', 'public');
const serverPublicDir = path.join(rootDir, 'server', 'public');

console.log('=== Script post-build ===');
console.log(`Vérification des répertoires de build...`);

// Vérifier si le répertoire dist/public existe et contient des fichiers
if (fs.existsSync(distPublicDir)) {
  try {
    const files = fs.readdirSync(distPublicDir);
    
    if (files.length > 0) {
      console.log(`✅ Le répertoire dist/public existe et contient ${files.length} fichiers.`);
      
      // Supprimer server/public s'il existe déjà
      if (fs.existsSync(serverPublicDir)) {
        // Vérifier si c'est un lien symbolique
        const stats = fs.lstatSync(serverPublicDir);
        
        if (stats.isSymbolicLink()) {
          console.log('Suppression du lien symbolique existant...');
          fs.unlinkSync(serverPublicDir);
        } else {
          console.log('Suppression du répertoire server/public existant...');
          fs.rmSync(serverPublicDir, { recursive: true, force: true });
        }
      }
      
      // Créer le répertoire parent si nécessaire
      if (!fs.existsSync(path.dirname(serverPublicDir))) {
        console.log('Création du répertoire parent server/...');
        fs.mkdirSync(path.dirname(serverPublicDir));
      }
      
      // Créer un lien symbolique
      console.log('Création du lien symbolique server/public → dist/public...');
      const relativePath = path.relative(path.dirname(serverPublicDir), distPublicDir);
      fs.symlinkSync(relativePath, serverPublicDir, 'dir');
      
      console.log('✅ Lien symbolique créé avec succès!');
    } else {
      console.log('⚠️ Le répertoire dist/public existe mais est vide. Impossible de créer le lien symbolique.');
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la synchronisation des répertoires:`, error);
    process.exit(1);
  }
} else {
  console.log('⚠️ Le répertoire dist/public n\'existe pas encore. Aucune synchronisation nécessaire.');
}

console.log('=== Script post-build terminé ===');
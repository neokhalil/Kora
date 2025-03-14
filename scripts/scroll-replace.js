import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin du fichier à modifier
const filePath = path.join(__dirname, '../client/src/components/layout/WebHomeView.tsx');

// Lire le contenu du fichier
let content = fs.readFileSync(filePath, 'utf8');

// Pattern à remplacer (avec espaces et ligne de commentaire)
const pattern = /\/\/ Force un défilement supplémentaire après le rendu pour assurer la visibilité\s+requestAnimationFrame\(\(\) => \{\s+if \(messagesEndRef\.current\) \{\s+messagesEndRef\.current\.scrollIntoView\(\{ \s+behavior: 'smooth',\s+block: 'end'\s+\}\);\s+\}\s+\}\);/g;

// Remplacer toutes les occurrences
const replacement = "// Utiliser notre fonction optimisée de défilement\n      scrollAfterRender();";
content = content.replace(pattern, replacement);

// Sauvegarder le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('Remplacement terminé !');
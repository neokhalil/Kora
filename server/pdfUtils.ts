/**
 * Utilitaires pour l'extraction et le traitement de contenu PDF
 */

import pdfParse from 'pdf-parse';

/**
 * Extrait le texte d'un fichier PDF à partir des données brutes/binaires
 * 
 * @param pdfBuffer - Buffer contenant les données binaires du PDF
 * @returns Promesse avec le texte extrait
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    const options = {
      // Options par défaut de pdf-parse
      // pagerender: Fonction personnalisée pour le rendu de page (optionnel)
      // max: Nombre maximum de pages à traiter (optionnel)
    };

    const data = await pdfParse(pdfBuffer, options);
    
    // Ajouter des méta-informations au texte extrait
    const metaInfo = `[PDF Info - Pages: ${data.numpages}, Version: ${data.info?.PDFFormatVersion || 'N/A'}]\n\n`;
    
    return metaInfo + data.text;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte PDF:', error);
    return "Impossible d'extraire le texte de ce PDF. Le fichier pourrait être corrompu, protégé par mot de passe, ou dans un format non pris en charge.";
  }
}

/**
 * Fonction simple pour détecter la langue probable du texte extrait
 * Cette implémentation est basique et pourrait être améliorée
 * 
 * @param text - Texte à analyser
 * @returns Code ISO de la langue détectée (fr, en, etc.)
 */
export function detectLanguage(text: string): string {
  // Liste simplifiée de mots courants dans différentes langues
  const frenchWords = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'pour', 'dans', 'avec', 'sur', 'est', 'sont'];
  const englishWords = ['the', 'a', 'an', 'and', 'for', 'in', 'with', 'on', 'is', 'are', 'to', 'of', 'that'];

  // Compter les occurrences
  let frenchCount = 0;
  let englishCount = 0;
  
  // Nettoyer et préparer le texte
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/);
  
  // Compter les mots typiques de chaque langue
  for (const word of words) {
    if (frenchWords.includes(word)) frenchCount++;
    if (englishWords.includes(word)) englishCount++;
  }
  
  // Déterminer la langue probable
  if (frenchCount > englishCount) return 'fr';
  if (englishCount > frenchCount) return 'en';
  
  // Par défaut, retourner français (l'application est en français)
  return 'fr';
}

/**
 * Extrait et prépare le contenu d'un PDF pour l'analyse par l'IA
 * 
 * @param pdfBuffer - Buffer contenant les données binaires du PDF
 * @returns Promesse avec les informations traitées du PDF
 */
export async function processPdfForAI(pdfBuffer: Buffer): Promise<{
  text: string;
  language: string;
  pageCount: number;
}> {
  try {
    const options = {
      // Limiter le nombre de pages traitées pour les très grands documents
      max: 20
    };

    const data = await pdfParse(pdfBuffer, options);
    const extractedText = data.text;
    
    return {
      text: extractedText,
      language: detectLanguage(extractedText),
      pageCount: data.numpages
    };
  } catch (error) {
    console.error('Erreur lors du traitement du PDF pour l\'IA:', error);
    throw error;
  }
}
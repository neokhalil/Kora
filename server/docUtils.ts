/**
 * Utilitaires pour l'extraction et le traitement de contenu des documents Word
 */

import mammoth from 'mammoth';

/**
 * Extrait le texte d'un fichier Word à partir des données binaires
 * 
 * @param docBuffer - Buffer contenant les données binaires du document Word
 * @returns Promesse avec le texte extrait
 */
export async function extractDocText(docBuffer: Buffer): Promise<string> {
  try {
    // Options pour l'extraction du texte
    const options = {
      // Options additionnelles de Mammoth peuvent être ajoutées ici
    };

    // Convertir le document Word en texte brut
    const result = await mammoth.extractRawText({ buffer: docBuffer });
    
    // Ajouter des méta-informations au texte extrait
    const metaInfo = `[Document Word Info]\n\n`;
    
    return metaInfo + result.value;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte du document Word:', error);
    return "Impossible d'extraire le texte de ce document Word. Le fichier pourrait être corrompu ou dans un format non pris en charge.";
  }
}

/**
 * Extrait à la fois le texte et le HTML d'un fichier Word
 * Cela peut être utile pour conserver une partie du formatage
 * 
 * @param docBuffer - Buffer contenant les données binaires du document Word
 * @returns Promesse avec le texte et le HTML extrait
 */
export async function extractDocTextAndHtml(docBuffer: Buffer): Promise<{
  text: string;
  html: string;
}> {
  try {
    // Extraction du texte brut
    const textResult = await mammoth.extractRawText({ buffer: docBuffer });
    
    // Extraction du HTML
    const htmlResult = await mammoth.convertToHtml({ buffer: docBuffer });
    
    return {
      text: textResult.value,
      html: htmlResult.value
    };
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte et HTML du document Word:', error);
    throw error;
  }
}

/**
 * Convertit un document Word en texte formaté pour l'analyse par l'IA
 * 
 * @param docBuffer - Buffer contenant les données binaires du document Word
 * @returns Promesse avec le texte formaté
 */
export async function processDocForAI(docBuffer: Buffer): Promise<string> {
  try {
    // Extraire le texte et le HTML
    const { text, html } = await extractDocTextAndHtml(docBuffer);
    
    // Construction d'une représentation enrichie pour l'IA
    let aiReadyContent = `[DOCUMENT WORD - CONTENU EXTRAIT]\n\n`;
    
    // Ajouter le texte brut pour l'analyse
    aiReadyContent += `=== CONTENU TEXTUEL ===\n${text}\n\n`;
    
    // On pourrait ajouter d'autres métadonnées ici au besoin
    
    return aiReadyContent;
  } catch (error) {
    console.error('Erreur lors du traitement du document Word pour l\'IA:', error);
    return "Impossible de traiter ce document Word. Le fichier pourrait être corrompu ou dans un format non pris en charge.";
  }
}
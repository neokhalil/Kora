/**
 * Module pour traiter les transcriptions audio avec l'API OpenAI Whisper
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'stream/promises';

// Le dossier où les fichiers audio temporaires seront stockés
const TEMP_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'temp');

// S'assurer que le dossier existe
if (!fs.existsSync(TEMP_UPLOADS_DIR)) {
  fs.mkdirSync(TEMP_UPLOADS_DIR, { recursive: true });
}

// Initialiser le client OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Options pour la transcription
interface TranscriptionOptions {
  language?: string;
  prompt?: string;
}

/**
 * Vérifie si l'extension du fichier est compatible avec l'API Whisper
 * 
 * @param filePath Chemin du fichier à vérifier
 * @returns Boolean indiquant si le format est supporté
 */
function isWhisperCompatibleFormat(filePath: string): boolean {
  // Liste des extensions de fichiers supportées par l'API Whisper
  const supportedExtensions = ['.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm'];
  const extension = path.extname(filePath).toLowerCase();
  return supportedExtensions.includes(extension);
}

/**
 * Transcrit un fichier audio en texte en utilisant l'API OpenAI Whisper.
 * 
 * @param audioFilePath Chemin vers le fichier audio à transcrire
 * @param options Options de transcription (langue, prompt, etc.)
 * @returns Objet contenant le texte transcrit et les métadonnées
 */
export async function transcribeAudio(
  audioFilePath: string,
  options: TranscriptionOptions = {}
) {
  try {
    // Valider que le fichier existe
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Le fichier audio n'existe pas: ${audioFilePath}`);
    }
    
    // Vérifier si le format est supporté
    const fileExt = path.extname(audioFilePath).toLowerCase();
    if (!isWhisperCompatibleFormat(audioFilePath)) {
      throw new Error(`Format de fichier non supporté: ${fileExt}. Formats supportés: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm`);
    }
    
    // Vérifier la taille du fichier
    const fileStats = fs.statSync(audioFilePath);
    const fileSizeInMB = fileStats.size / (1024 * 1024);
    console.log(`Taille du fichier: ${fileSizeInMB.toFixed(2)} MB`);
    
    if (fileStats.size === 0) {
      throw new Error('Le fichier audio est vide');
    }
    
    if (fileSizeInMB > 25) {
      throw new Error(`Fichier trop volumineux: ${fileSizeInMB.toFixed(2)} MB. La limite est de 25 MB.`);
    }
    
    console.log(`Transcription du fichier: ${audioFilePath} (${fileExt})`);
    console.log(`Options de transcription:`, options);
    
    // Créer un stream de lecture pour le fichier
    const audioReadStream = fs.createReadStream(audioFilePath);
    
    // Appeler l'API OpenAI pour la transcription
    // Les options sont: prompt, language, response_format, temperature
    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      language: options.language || 'fr',
      prompt: options.prompt,
      response_format: 'json'
    });
    
    console.log('Transcription réussie:', { 
      text_length: response.text.length
    });
    
    // Retourner les résultats
    return {
      text: response.text,
      duration: 0, // Whisper API ne renvoie pas toujours la durée, donc on utilise 0 par défaut
      language: options.language || 'fr'
    };
  } catch (error) {
    console.error('Erreur lors de la transcription:', error);
    throw error;
  }
}

/**
 * Sauvegarde un fichier audio depuis un flux multipart vers le système de fichiers.
 * 
 * @param multerFile Objet fichier de Multer
 * @returns Chemin vers le fichier sauvegardé
 */
export async function saveAudioFile(multerFile: Express.Multer.File): Promise<string> {
  // Déterminer l'extension correcte selon le type MIME
  let fileExtension = path.extname(multerFile.originalname).toLowerCase();
  
  // Si pas d'extension ou extension non reconnue, déduire du type MIME
  if (!fileExtension || !isWhisperCompatibleFormat(fileExtension)) {
    const mimeExtMap: Record<string, string> = {
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/mp3': '.mp3',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.mp4',
      'audio/ogg': '.ogg',
      'audio/webm': '.webm',
      'audio/flac': '.flac',
      'audio/x-m4a': '.m4a'
    };
    
    fileExtension = mimeExtMap[multerFile.mimetype] || '.mp3'; // '.mp3' comme fallback
  }
  
  console.log(`Type MIME détecté: ${multerFile.mimetype}, extension utilisée: ${fileExtension}`);
  
  const fileName = `audio_${uuidv4()}${fileExtension}`;
  const filePath = path.join(TEMP_UPLOADS_DIR, fileName);
  
  try {
    // Si le fichier est déjà sur le disque (comme avec multer.diskStorage)
    if (multerFile.path) {
      // Renommer simplement le fichier au bon endroit
      await fs.promises.rename(multerFile.path, filePath);
    } else {
      // Sinon, écrire le buffer dans un nouveau fichier
      await fs.promises.writeFile(filePath, multerFile.buffer);
    }
    
    console.log(`Fichier audio sauvegardé: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier audio:', error);
    throw error;
  }
}

/**
 * Nettoie les fichiers temporaires après utilisation.
 * 
 * @param filePath Chemin du fichier à supprimer
 */
export async function cleanupAudioFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`Fichier audio supprimé: ${filePath}`);
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage du fichier audio:', error);
    // On ne relance pas d'erreur ici pour ne pas perturber le flux principal
  }
}

/**
 * Gère tout le processus de transcription, y compris la sauvegarde et le nettoyage.
 * 
 * @param multerFile Fichier audio de Multer
 * @param options Options de transcription
 * @returns Résultat de la transcription
 */
export async function handleAudioTranscription(
  multerFile: Express.Multer.File,
  options: TranscriptionOptions = {}
) {
  let filePath = '';
  
  try {
    // Sauvegarder le fichier
    filePath = await saveAudioFile(multerFile);
    
    // Transcrire le fichier
    const result = await transcribeAudio(filePath, options);
    
    return result;
  } catch (error) {
    console.error('Erreur lors du traitement de la transcription:', error);
    throw error;
  } finally {
    // Nettoyer le fichier temporaire
    if (filePath) {
      await cleanupAudioFile(filePath).catch(console.error);
    }
  }
}
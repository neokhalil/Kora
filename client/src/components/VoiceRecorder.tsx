import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type RecorderState = 'inactive' | 'recording' | 'processing' | 'error';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  maxRecordingTimeMs?: number; // Durée maximale d'enregistrement en ms (défaut: 60 secondes)
  language?: string; // Langue pour la transcription (défaut: fr)
}

interface AudioVisualizerConfig {
  width: number;
  height: number;
  barWidth: number;
  barGap: number;
  sensitivity: number;
}

interface UsageCounter {
  increment: () => void;
  getCount: () => number;
  resetCount: () => void;
}

// Compteur d'utilisation pour limiter l'usage
const createUsageCounter = (): UsageCounter => {
  let count = 0;
  
  return {
    increment: () => { count++; },
    getCount: () => count,
    resetCount: () => { count = 0; }
  };
};

// Singleton pour garder le compteur entre les rendus
const usageCounter = createUsageCounter();

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  disabled = false,
  maxRecordingTimeMs = 60000, // 60 secondes par défaut
  language = 'fr' // Français par défaut
}) => {
  const { toast } = useToast();
  
  // Références
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // États
  const [recorderState, setRecorderState] = useState<RecorderState>('inactive');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(44).fill(1));
  
  // Configuration du visualiseur audio - style WhatsApp avec des barres plus fines
  const visualizerConfig: AudioVisualizerConfig = {
    width: 300, // Largeur du canvas (sera ajustée par CSS)
    height: 24,  // Hauteur du canvas style WhatsApp
    barWidth: 2,  // Barres plus fines
    barGap: 1,    // Espace entre les barres
    sensitivity: 5.0 // Sensibilité extrêmement élevée pour mieux voir les variations minimes
  };
  
  // Nettoyer les ressources lors du démontage du composant
  useEffect(() => {
    return () => {
      // Arrêter le flux audio
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Annuler l'animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Fermer le contexte audio
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Nettoyer le timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);
  
  // Formater la durée mm:ss
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Visualiseur audio optimisé avec détection active du volume
  const setupAudioVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    // Créer le contexte audio avec la méthode moderne
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    // Créer un analyser avec une taille FFT plus grande pour une meilleure précision
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 512; // Plus précis pour la détection vocale
    analyser.smoothingTimeConstant = 0.2; // Réduire le lissage pour une réactivité maximale
    
    // Connecter le flux audio à l'analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Préparer les données pour l'analyse
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Configuration du canvas pour le débogage si nécessaire
    const canvas = canvasRef.current;
    canvas.width = visualizerConfig.width;
    canvas.height = visualizerConfig.height;
    
    // Nombre de barres à afficher
    const totalBars = 44; // Correspond au nombre dans le rendu
    
    // Fonction pour mettre à jour les niveaux audio en temps réel
    const updateAudioLevels = () => {
      // Vérifier si nous sommes toujours en enregistrement
      if (recorderState !== 'recording') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }
      
      // Planifier la prochaine frame d'animation 
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      
      // Obtenir les données de fréquence audio avec une meilleure sensibilité aux variations
      analyser.getByteFrequencyData(dataArray);
      
      // Simuler un peu de bruit aléatoire pour un effet plus vivant quand il n'y a pas de son
      let hasSound = false;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > 10) { // Détection de son au-dessus du seuil de bruit
          hasSound = true;
          break;
        }
      }
      
      // Calculer le pas pour répartir les fréquences sur toutes les barres
      // Se concentrer sur les fréquences vocales (200-3500 Hz)
      const vocalRange = Math.floor(bufferLength * 0.7); // Approximation des fréquences vocales
      const step = Math.max(1, Math.floor(vocalRange / totalBars));
      
      // Nouvelle approche - récupérer les niveaux d'amplitude pour chaque barre
      const newLevels = Array(totalBars).fill(0);
      
      // Parcourir les données de fréquence pour calculer les hauteurs des barres
      for (let i = 0; i < totalBars; i++) {
        // Trouver la plage de fréquences pour cette barre
        const startIdx = Math.min(bufferLength - 1, i * step);
        const endIdx = Math.min(bufferLength - 1, startIdx + step - 1);
        
        // Calculer la valeur moyenne pour cette plage
        let sum = 0;
        for (let j = startIdx; j <= endIdx; j++) {
          sum += dataArray[j];
        }
        const avgValue = sum / (endIdx - startIdx + 1);
        
        // Appliquer une sensibilité beaucoup plus élevée pour mieux voir les variations
        const sensitivity = visualizerConfig.sensitivity;
        const amplifiedValue = avgValue * sensitivity;
        
        // Convertir en hauteur de barre avec une valeur minimum et maximum
        const minHeight = 1;  // Hauteur minimum (jamais à zéro)
        const maxHeight = 14; // Hauteur maximum
        
        const barHeight = minHeight + Math.min(
          maxHeight - minHeight, 
          Math.floor((amplifiedValue / 255.0) * (maxHeight - minHeight))
        );
        
        newLevels[i] = barHeight;
      }
      
      // Modifier légèrement la distribution pour obtenir un effet plus naturel
      // Appliquer une légère courbe sinusoïdale pour éviter l'aspect trop uniforme
      const finalLevels = newLevels.map((height, i) => {
        // Ajouter un effet d'onde pour un aspect plus naturel
        const waveFactor = 1 + 0.15 * Math.sin(i * 0.3);
        return Math.max(1, Math.round(height * waveFactor));
      });
      
      // Mettre à jour l'état avec les nouvelles hauteurs
      setAudioLevels(finalLevels);
    };
    
    // Démarrer la mise à jour des niveaux audio immédiatement
    updateAudioLevels();
  };
  
  // Fonction pour démarrer l'enregistrement
  const startRecording = async () => {
    try {
      // Vérifier le support du navigateur
      if (!navigator.mediaDevices || !MediaRecorder) {
        setErrorMessage("Votre navigateur ne prend pas en charge l'enregistrement audio.");
        setRecorderState('error');
        return;
      }
      
      // Réinitialiser les erreurs
      setErrorMessage(null);
      
      // Demander l'accès au microphone avec la configuration audio optimale
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });
      
      // Stocker le flux pour pouvoir l'arrêter plus tard
      mediaStreamRef.current = stream;
      
      // Réinitialiser les morceaux audio
      audioChunksRef.current = [];
      
      // Configurer le MediaRecorder avec un format audio optimal
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // Configurer le gestionnaire d'événements pour les données
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Configurer le gestionnaire d'événements pour l'arrêt
      mediaRecorderRef.current.onstop = async () => {
        try {
          setRecorderState('processing');
          
          // Créer un blob à partir des morceaux audio
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Traitement supplémentaire pour s'assurer que le blob est valide
          if (audioBlob.size === 0) {
            throw new Error("Aucun audio n'a été enregistré.");
          }
          
          // Afficher le toast de traitement
          toast({
            title: "Traitement en cours",
            description: "Votre enregistrement est en cours de traitement...",
          });
          
          // Traiter l'audio et obtenir la transcription
          await processAudioForTranscription(audioBlob);
          
        } catch (error) {
          console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
          setErrorMessage("Une erreur s'est produite lors du traitement audio. Veuillez réessayer.");
          setRecorderState('error');
          
          toast({
            title: "Erreur de traitement",
            description: "Une erreur s'est produite lors du traitement de l'audio. Veuillez réessayer.",
            variant: "destructive"
          });
        } finally {
          // Nettoyer le flux
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          }
        }
      };
      
      // Démarrer le MediaRecorder
      mediaRecorderRef.current.start();
      
      // Mettre à jour l'état
      setRecorderState('recording');
      setRecordingDuration(0);
      
      // Configurer le visualiseur audio
      setupAudioVisualizer(stream);
      
      // Configurer un timer pour mettre à jour la durée d'enregistrement
      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingDuration(elapsed);
        
        // Arrêter automatiquement si la durée maximale est atteinte
        if (elapsed >= maxRecordingTimeMs) {
          stopRecording();
        }
      }, 100);
      
      // Incrémenter le compteur d'utilisation
      usageCounter.increment();
      
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      
      // Gestion des erreurs d'autorisation
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setErrorMessage("L'accès au microphone a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
      } else {
        setErrorMessage("Une erreur s'est produite lors de l'initialisation de l'enregistreur. Veuillez réessayer.");
      }
      
      setRecorderState('error');
      
      toast({
        title: "Erreur d'enregistrement",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      });
    }
  };
  
  // Fonction pour arrêter l'enregistrement
  const stopRecording = () => {
    // Nettoyer le timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    // Arrêter le MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Traiter l'audio pour la transcription
  const processAudioForTranscription = async (audioBlob: Blob) => {
    try {
      // Créer un formulaire pour envoyer l'audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Ajouter le paramètre de langue si spécifié
      if (language) {
        formData.append('language', language);
      }
      
      // Envoyer l'audio au serveur pour la transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur du serveur: ${response.status} ${errorText}`);
      }
      
      // Extraire les données de la réponse
      const data = await response.json();
      
      // Vérifier si la transcription est disponible
      if (!data || !data.text) {
        throw new Error("Aucune transcription n'a été générée.");
      }
      
      // Afficher le toast de succès
      toast({
        title: "Transcription réussie",
        description: "Votre message a été transcrit avec succès.",
      });
      
      // Appeler le callback avec le texte transcrit
      onTranscriptionComplete(data.text);
      
      // Réinitialiser l'état
      setRecorderState('inactive');
      
    } catch (error) {
      console.error("Erreur lors de la transcription:", error);
      
      // Mettre à jour l'état d'erreur
      setErrorMessage(error instanceof Error ? error.message : "Une erreur s'est produite lors de la transcription.");
      setRecorderState('error');
      
      // Afficher le toast d'erreur
      toast({
        title: "Échec de la transcription",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la transcription.",
        variant: "destructive"
      });
    }
  };
  
  // Calculer le pourcentage de progression
  const recordingProgressPercent = Math.min(100, (recordingDuration / maxRecordingTimeMs) * 100);
  
  // Retourner le composant
  return (
    <div className="relative flex items-center justify-center">
      {/* Version inactive - juste un bouton mic */}
      {recorderState === 'inactive' && (
        <Button
          size="icon"
          variant="outline"
          disabled={disabled}
          onClick={startRecording}
          aria-label="Enregistrer votre voix"
          className="relative hover:bg-primary/10 hover:text-primary transition-colors 
                     h-10 w-10 rounded-full
                     active:scale-95 transform transition-transform
                     touch-manipulation"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
      
      {/* Version en cours de traitement - spinner */}
      {recorderState === 'processing' && (
        <Button
          size="icon"
          variant="outline"
          disabled={true}
          aria-label="Traitement en cours"
          className="relative h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
      )}
      
      {/* Version enregistrement - style compact pour mobile */}
      {recorderState === 'recording' && (
        <div className="flex items-center w-full bg-white dark:bg-slate-900 rounded-full shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 max-w-[170px]">
          {/* Bouton pour annuler l'enregistrement */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              // Annuler l'enregistrement sans traiter l'audio
              if (mediaRecorderRef.current) {
                mediaRecorderRef.current.onstop = null;
                audioChunksRef.current = [];
                mediaRecorderRef.current.stop();
                
                if (mediaStreamRef.current) {
                  mediaStreamRef.current.getTracks().forEach(track => track.stop());
                }
                
                setRecorderState('inactive');
                
                toast({
                  title: "Enregistrement annulé",
                  description: "L'enregistrement a été annulé",
                });
              }
            }}
            className="h-8 w-8 text-gray-500 hover:text-red-500 rounded-l-full flex-shrink-0 p-0"
            aria-label="Annuler l'enregistrement"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Contenu central plus compact */}
          <div className="flex-1 flex items-center justify-center overflow-hidden px-1">
            {/* Cercle rouge d'enregistrement */}
            <div className="flex-shrink-0 mr-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            </div>
            
            {/* Compteur uniquement */}
            <span className="text-sm font-mono font-semibold">
              {formatDuration(recordingDuration)}
            </span>
            
            {/* Canvas caché pour le traitement audio */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {/* Bouton pour envoyer */}
          <Button
            size="icon"
            variant="ghost"
            onClick={stopRecording}
            className="h-8 w-8 bg-[#00A884] hover:bg-[#009670] text-white rounded-r-full flex-shrink-0 p-0"
            aria-label="Envoyer l'enregistrement"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 5 5 9-9"></path>
            </svg>
          </Button>
        </div>
      )}
      
      {/* État d'erreur */}
      {recorderState === 'error' && errorMessage && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md p-2 w-64 text-xs">
          <p className="font-medium">Erreur d'enregistrement</p>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Loader2, X, Lock, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

type RecorderState = 'inactive' | 'recording' | 'locked' | 'processing' | 'error';

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

// Vibration pattern helpers for haptic feedback
const vibrateShort = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const vibrateMedium = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(25);
  }
};

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
  
  // Référence aux éléments et interaction
  const containerRef = useRef<HTMLDivElement>(null);
  const [cancelPosition, setCancelPosition] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDraggingUp, setIsDraggingUp] = useState<boolean>(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  
  // Référence aux fonctions et états pour le lock
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Handler pour le début du toucher/clic
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (recorderState !== 'recording') return;
    
    const touch = 'touches' in e ? e.touches[0] : e;
    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    setIsDragging(false);
    setIsDraggingUp(false);
    
    // Configurer un timeout pour le mode lock après un appui long (1.5s)
    if (isMobile) {
      lockTimeoutRef.current = setTimeout(() => {
        if (recorderState === 'recording') {
          vibrateShort(); // Feedback haptique
          setRecorderState('locked');
        }
      }, 1500);
    }
  };
  
  // Handler pour le mouvement en cours de toucher/clic
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (recorderState !== 'recording') return;
    
    const touch = 'touches' in e ? e.touches[0] : e;
    
    if (touchStartYRef.current !== null && touchStartXRef.current !== null) {
      const deltaY = touchStartYRef.current - touch.clientY;
      const deltaX = touch.clientX - touchStartXRef.current;
      
      // Détection de glissement vertical (vers le haut) pour verrouiller l'enregistrement
      if (deltaY > 50 && Math.abs(deltaX) < 30) {
        setIsDraggingUp(true);
        setIsDragging(false);
        
        // Annuler le timeout de verrouillage car l'utilisateur utilise le glissement vers le haut
        if (lockTimeoutRef.current) {
          clearTimeout(lockTimeoutRef.current);
          lockTimeoutRef.current = null;
        }
        
        return;
      }
      
      // Détection de glissement horizontal (vers la gauche) pour annuler
      if (deltaX < -30 && Math.abs(deltaY) < 50) {
        setIsDragging(true);
        setIsDraggingUp(false);
        
        // Calculer la position de glissement (0 à 100)
        // Limiter le mouvement entre 0 et 100
        const maxSwipeDistance = 150; // Distance pour annuler
        const swipePercent = Math.min(100, Math.max(0, Math.abs(deltaX) / maxSwipeDistance * 100));
        setCancelPosition(swipePercent);
        
        // Annuler le timeout de verrouillage car l'utilisateur fait glisser pour annuler
        if (lockTimeoutRef.current) {
          clearTimeout(lockTimeoutRef.current);
          lockTimeoutRef.current = null;
        }
        
        // Si l'utilisateur a glissé suffisamment loin, annuler l'enregistrement
        if (swipePercent >= 70) {
          // Vibration haptique pour confirmer l'annulation
          vibrateMedium();
          
          // Nettoyer le flux audio sans traiter l'enregistrement
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          }
          
          // Nettoyer le timer
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
          }
          
          // Réinitialiser l'état
          setRecorderState('inactive');
          return;
        }
      }
    }
  };
  
  // Handler pour la fin du toucher/clic
  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    // Annuler le timeout de verrouillage
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }
    
    // Si en mode enregistrement et que l'utilisateur fait glisser vers le haut assez loin
    if (recorderState === 'recording' && isDraggingUp) {
      vibrateShort(); // Feedback haptique
      setRecorderState('locked');
      return;
    }
    
    // Réinitialiser les états de glissement
    setIsDragging(false);
    setIsDraggingUp(false);
    setCancelPosition(0);
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    
    // Si on est en mode enregistrement (pas verrouillé) et qu'on relâche sans glisser, arrêter l'enregistrement
    if (recorderState === 'recording') {
      stopRecording();
    }
  };
  
  // Verrouiller l'enregistrement (passer en mode "locked")
  const lockRecording = () => {
    if (recorderState === 'recording') {
      vibrateShort();
      setRecorderState('locked');
    }
  };
  
  // Retourner le composant
  return (
    <div className="relative flex items-center justify-center" ref={containerRef}>
      {/* Version inactive - bouton mic stylisé */}
      {recorderState === 'inactive' && (
        <Button
          size="icon"
          variant="ghost"
          disabled={disabled}
          onClick={startRecording}
          aria-label="Enregistrer votre voix"
          className="relative bg-black hover:bg-gray-800 text-white transition-colors 
                     h-12 w-12 rounded-full
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
          variant="ghost"
          disabled={true}
          aria-label="Traitement en cours"
          className="relative h-12 w-12 rounded-full bg-black text-white"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
      )}
      
      {/* Interface d'enregistrement style WhatsApp */}
      {recorderState === 'recording' && (
        <div 
          className="relative flex items-center bg-black text-white rounded-full h-12 transition-all duration-300 touch-manipulation"
          style={{ 
            width: isDragging ? `${Math.max(48, 150 - cancelPosition * 1.5)}px` : '150px',
            opacity: isDragging ? 1 - (cancelPosition / 100) * 0.7 : 1 
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={isMobile ? undefined : handleTouchStart}
          onMouseMove={isMobile ? undefined : handleTouchMove}
          onMouseUp={isMobile ? undefined : handleTouchEnd}
          onMouseLeave={isMobile ? undefined : handleTouchEnd}
        >
          {/* Indicateur de "glisser pour annuler" */}
          <div 
            className={`absolute inset-y-0 left-0 flex items-center justify-start pl-3
                        transition-opacity duration-300 ${isDragging ? 'opacity-10' : 'opacity-70'}`}
          >
            <div className="mr-2 flex-shrink-0">
              <StopCircle className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-xs whitespace-nowrap">
              {isMobile ? "← Glisser pour annuler" : "Relâcher pour envoyer"}
            </span>
          </div>
          
          {/* Durée d'enregistrement */}
          <div className="absolute right-3 text-xs font-mono">
            {formatDuration(recordingDuration)}
          </div>
          
          {/* Indicateur de "glisser vers le haut pour verrouiller" - uniquement sur mobile */}
          {isMobile && (
            <div 
              className={`absolute -top-10 left-1/2 transform -translate-x-1/2 
                        bg-gray-900 text-white text-xs py-1 px-3 rounded-full
                        flex items-center justify-center gap-1
                        transition-opacity duration-300 ${isDraggingUp ? 'opacity-100' : 'opacity-70'}`}
            >
              <ChevronUp className="h-3 w-3" />
              <span>Glisser pour verrouiller</span>
            </div>
          )}
          
          {/* Visualisation audio - forme d'onde */}
          <div 
            className={`absolute inset-x-0 -bottom-6 h-6 flex items-center justify-center
                       transition-opacity duration-300 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="flex items-end h-6 space-x-[1px]">
              {audioLevels.map((level, index) => (
                <div
                  key={index}
                  className="w-[2px] bg-white rounded-full"
                  style={{ 
                    height: `${level}px`,
                    opacity: isDragging ? 0.5 : 0.8 
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Canvas caché pour le traitement audio */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      {/* Mode verrouillé (lock) pour enregistrements plus longs */}
      {recorderState === 'locked' && (
        <div className="bg-black text-white rounded-lg p-3 flex flex-col items-center gap-2 min-w-[200px]">
          <div className="w-full flex justify-between items-center">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono">{formatDuration(recordingDuration)}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={stopRecording}
              className="h-7 w-7 rounded-full bg-red-500 p-0 flex items-center justify-center hover:bg-red-600"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-full mt-1">
            <div className="flex items-end h-6 space-x-[1px] justify-center">
              {audioLevels.map((level, index) => (
                <div
                  key={index}
                  className="w-[2px] bg-white rounded-full"
                  style={{ height: `${level}px`, opacity: 0.8 }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="w-full bg-gray-800 h-1 rounded-full mt-1 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${recordingProgressPercent}%` }}
            ></div>
          </div>
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
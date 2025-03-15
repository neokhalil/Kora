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
  
  // Visualiseur audio optimisé pour une expérience WhatsApp-like
  const setupAudioVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    try {
      // Créer le contexte audio avec la méthode moderne
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Créer un analyser avec une taille FFT optimisée pour le style WhatsApp
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256; // Valeur plus faible pour de meilleures performances et suffisante pour visualiser la voix
      analyser.smoothingTimeConstant = 0.4; // Lissage moyen pour un effet visuel agréable comme WhatsApp
      
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
      
      // Nombre de barres à afficher (moins de barres, style WhatsApp)
      const totalBars = 28; // Style WhatsApp avec moins de barres mais plus d'espace
      
      // Variables pour l'animation fluide
      let prevLevels = Array(totalBars).fill(1);
      
      // Fonction pour mettre à jour les niveaux audio en temps réel
      const updateAudioLevels = () => {
        // Vérifier si nous sommes toujours en enregistrement ou en mode verrouillé
        if (recorderState !== 'recording' && recorderState !== 'locked') {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          return;
        }
        
        // Planifier la prochaine frame d'animation 
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
        
        // Obtenir les données de fréquence audio
        analyser.getByteFrequencyData(dataArray);
        
        // Détection de silence pour animation idle
        let isSilent = true;
        const silenceThreshold = 5;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > silenceThreshold) {
            isSilent = false;
            break;
          }
        }
        
        // Nouvelle approche - récupérer les niveaux d'amplitude pour chaque barre
        const newLevels = Array(totalBars).fill(0);
        
        // Style WhatsApp: Concentrons-nous sur les fréquences basses et moyennes (voix humaine)
        // Plage approximative des fréquences vocales dans le spectre
        const voiceStartIdx = Math.floor(bufferLength * 0.05); // ~100Hz
        const voiceEndIdx = Math.floor(bufferLength * 0.6);    // ~3000Hz
        const voiceRange = voiceEndIdx - voiceStartIdx;
        
        // Calculer le pas pour répartir les fréquences sur toutes les barres
        const step = Math.max(1, Math.floor(voiceRange / totalBars));
        
        // Parcourir les données de fréquence pour calculer les hauteurs des barres
        for (let i = 0; i < totalBars; i++) {
          // Trouver la plage de fréquences pour cette barre
          const startIdx = Math.min(bufferLength - 1, voiceStartIdx + (i * step));
          const endIdx = Math.min(bufferLength - 1, startIdx + step - 1);
          
          // Calculer la valeur moyenne pour cette plage
          let sum = 0;
          for (let j = startIdx; j <= endIdx; j++) {
            sum += dataArray[j];
          }
          const avgValue = sum / (endIdx - startIdx + 1);
          
          // Appliquer une courbe de réponse pour privilégier les fréquences vocales
          // et avoir un rendu plus naturel
          let amplifiedValue = avgValue;
          
          // Facteur de sensibilité variable selon la position dans le spectre
          // Plus de sensibilité dans les fréquences vocales
          const positionFactor = 1 - Math.abs(i - totalBars / 2) / (totalBars / 2);
          const frequencySensitivity = visualizerConfig.sensitivity * (0.7 + 0.5 * positionFactor);
          
          amplifiedValue *= frequencySensitivity;
          
          // Si silence détecté, ajouter un léger mouvement aléatoire pour éviter l'aspect figé
          if (isSilent) {
            // Animation subtile de type "idle" inspirée de WhatsApp
            amplifiedValue = Math.max(amplifiedValue, Math.random() * 15);
          }
          
          // Convertir en hauteur de barre avec une valeur minimum et maximum
          // Style WhatsApp: des barres plus hautes au centre
          const minHeight = 2; // Hauteur minimum légèrement plus grande que WhatsApp
          const maxHeight = 18; // Hauteur maximum
          
          // Appliquer une distribution en cloche pour obtenir l'effet WhatsApp (plus haut au centre)
          const centerEffect = 0.5 + 0.5 * Math.cos(((i / totalBars) * 2 - 1) * Math.PI);
          const maxPossibleHeight = minHeight + (maxHeight - minHeight) * centerEffect;
          
          const barHeight = minHeight + Math.min(
            maxPossibleHeight - minHeight,
            Math.floor((amplifiedValue / 255.0) * (maxPossibleHeight - minHeight))
          );
          
          newLevels[i] = barHeight;
        }
        
        // Animation fluide: interpolation entre les valeurs précédentes et nouvelles
        // Style WhatsApp: transition douce entre les niveaux
        const smoothedLevels = newLevels.map((height, i) => {
          // Facteur de lissage entre les frames (0.3 = 30% nouvelle valeur, 70% ancienne)
          const smoothFactor = 0.3;
          const smoothedHeight = prevLevels[i] * (1 - smoothFactor) + height * smoothFactor;
          
          // Ajouter un effet de vague subtil
          const time = Date.now() / 1000;
          const waveOffset = Math.sin(time * 2 + i * 0.2) * 0.5;
          
          // Combiner l'effet de vague avec la hauteur lissée
          return Math.max(1, Math.round(smoothedHeight + waveOffset));
        });
        
        // Mise à jour des niveaux précédents pour la prochaine frame
        prevLevels = [...smoothedLevels];
        
        // Mettre à jour l'état avec les nouvelles hauteurs
        setAudioLevels(smoothedLevels);
      };
      
      // Démarrer la mise à jour des niveaux audio immédiatement
      updateAudioLevels();
      
    } catch (error) {
      console.error("Erreur lors de l'initialisation du visualiseur audio:", error);
      // En cas d'erreur, on met des barres statiques pour un rendu minimal
      setAudioLevels(Array(28).fill(5).map(() => 2 + Math.floor(Math.random() * 5)));
    }
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
    <div 
      className="relative flex items-center justify-center" 
      ref={containerRef}
      style={{ minHeight: '60px' }} // Garantir un espace minimum
    >
      {/* Version inactive - bouton mic stylisé façon WhatsApp */}
      {recorderState === 'inactive' && (
        <Button
          size="icon"
          variant="ghost"
          disabled={disabled}
          onClick={startRecording}
          aria-label="Enregistrer votre voix"
          className="relative bg-black hover:bg-gray-800 text-white transition-all duration-200
                     h-12 w-12 rounded-full
                     active:scale-95 transform hover:shadow-md
                     touch-manipulation outline-none border-none focus:ring-2 focus:ring-blue-400"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
      
      {/* Version en cours de traitement - spinner style WhatsApp */}
      {recorderState === 'processing' && (
        <div className="relative h-12 w-12 rounded-full bg-black text-white flex items-center justify-center shadow-md">
          <div className="absolute inset-0 bg-blue-500 opacity-10 rounded-full animate-pulse"></div>
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      
      {/* Interface d'enregistrement style WhatsApp - Adapté pour l'affichage mobile */}
      {recorderState === 'recording' && (
        <div 
          className="relative flex items-center bg-gradient-to-r from-black to-gray-900 text-white rounded-full 
                      h-12 z-10 transition-all duration-300 touch-manipulation shadow-md"
          style={{ 
            width: isDragging ? `${Math.max(48, 160 - cancelPosition * 1.5)}px` : '160px',
            opacity: isDragging ? 1 - (cancelPosition / 100) * 0.7 : 1,
            transform: isDraggingUp ? 'translateY(-8px)' : 'translateY(0)'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={isMobile ? undefined : handleTouchStart}
          onMouseMove={isMobile ? undefined : handleTouchMove}
          onMouseUp={isMobile ? undefined : handleTouchEnd}
          onMouseLeave={isMobile ? undefined : handleTouchEnd}
        >
          {/* Fond animé pour le mode enregistrement */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-400/10"></div>
            <div
              className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent 
                        animate-shimmer" 
              style={{ animationDuration: '2s' }}
            ></div>
          </div>
          
          {/* Indicateur de "glisser pour annuler" */}
          <div 
            className={`absolute inset-y-0 left-0 flex items-center justify-start pl-3
                        transition-opacity duration-300 ${isDragging ? 'opacity-10' : 'opacity-100'}`}
          >
            <div className="mr-2 flex-shrink-0">
              <StopCircle className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-xs whitespace-nowrap font-medium">
              {isMobile ? "← Glisser pour annuler" : "Relâcher pour envoyer"}
            </span>
          </div>
          
          {/* Durée d'enregistrement avec effet de pulse */}
          <div className="absolute right-3 text-xs font-mono bg-black/30 px-1.5 py-0.5 rounded-full">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
              {formatDuration(recordingDuration)}
            </div>
          </div>
          
          {/* Indicateur de "glisser vers le haut pour verrouiller" - Repositionné pour mobile */}
          {isMobile && (
            <div 
              className={`absolute -top-10 left-1/2 transform -translate-x-1/2 
                        bg-black text-white text-xs py-1.5 px-3 rounded-full shadow-lg
                        flex items-center justify-center gap-1.5 z-20
                        transition-all duration-300 ${isDraggingUp ? 'opacity-100 -translate-y-1' : 'opacity-80'}`}
              style={{ maxWidth: '90%' }}
            >
              <ChevronUp className={`h-3.5 w-3.5 ${isDraggingUp ? 'animate-bounce' : ''}`} />
              <span>Glisser pour verrouiller</span>
            </div>
          )}
          
          {/* Visualisation audio - forme d'onde style WhatsApp repositionnée */}
          <div 
            className={`absolute left-0 right-0 bottom-0 h-6 flex items-center justify-center overflow-visible
                       transition-opacity duration-300 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
            style={{ transform: 'translateY(100%)' }}
          >
            <div className="flex items-end h-6 space-x-[2px] mt-1">
              {audioLevels.map((level, index) => (
                <div
                  key={index}
                  className="w-[3px] bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-full"
                  style={{ 
                    height: `${level}px`,
                    opacity: isDragging ? 0.5 : 0.85,
                    transform: `translateY(${Math.sin(index * 0.2) * 1.5}px)`
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Canvas caché pour le traitement audio */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      {/* Mode verrouillé (lock) pour enregistrements plus longs - style WhatsApp adapté pour mobile */}
      {recorderState === 'locked' && (
        <div className="bg-black text-white rounded-lg p-3 flex flex-col items-center gap-2 max-w-[90%] w-[230px] shadow-lg relative z-10">
          {/* Indicateur verrouillé */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-black rounded-full p-1 shadow-md z-20">
            <Lock className="h-3.5 w-3.5 text-gray-400" />
          </div>
          
          <div className="w-full flex justify-between items-center mt-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-xs text-gray-300">ENREGISTREMENT</span>
            </div>
            <span className="text-sm font-mono">{formatDuration(recordingDuration)}</span>
          </div>
          
          {/* Visualisation style WhatsApp - forme d'onde animée optimisée */}
          <div className="w-full mt-2 overflow-hidden">
            <div className="flex items-end h-6 space-x-[2px] justify-center">
              {audioLevels.slice(0, 20).map((level, index) => ( // Réduire le nombre de barres pour mobile
                <div
                  key={index}
                  className="w-[3px] bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-full"
                  style={{ 
                    height: `${level}px`, 
                    opacity: 0.9,
                    transform: `translateY(${Math.sin(index * 0.2) * 1.5}px)`
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Barre de progression avec animation de pulsation */}
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all"
              style={{ width: `${recordingProgressPercent}%` }}
            ></div>
          </div>
          
          {/* Bouton d'arrêt d'enregistrement style WhatsApp */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={stopRecording}
            className="h-10 w-10 rounded-full bg-red-500 p-0 flex items-center justify-center 
                      hover:bg-red-600 mt-1.5 transform hover:scale-105 transition-all
                      shadow-md"
            aria-label="Arrêter l'enregistrement"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      {/* État d'erreur style WhatsApp optimisé pour mobile */}
      {recorderState === 'error' && errorMessage && (
        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2
                       bg-black/95 border border-red-500/20 text-white rounded-lg p-3 
                       max-w-[90%] w-[280px] text-xs shadow-lg backdrop-blur-sm z-50">
          <div className="flex items-start gap-2">
            <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-red-300 mb-0.5">Erreur d'enregistrement</p>
              <p className="text-gray-300 leading-tight">{errorMessage}</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => setRecorderState('inactive')}
                  className="h-8 text-xs text-blue-400 hover:text-blue-300 px-3 rounded-full bg-blue-900/20"
                >
                  Réessayer
                </Button>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => setErrorMessage(null)}
                  className="h-8 text-xs text-gray-400 hover:text-gray-300 px-3 rounded-full"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
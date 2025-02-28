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
  
  // Configuration du visualiseur audio - style WhatsApp avec des barres plus fines
  const visualizerConfig: AudioVisualizerConfig = {
    width: 300, // Largeur du canvas (sera ajustée par CSS)
    height: 24,  // Hauteur du canvas style WhatsApp
    barWidth: 2,  // Barres plus fines
    barGap: 1,    // Espace entre les barres
    sensitivity: 1.8 // Sensibilité plus élevée pour mieux voir les variations
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
  
  // Visualiseur audio
  const setupAudioVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    // Créer le contexte audio
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Créer un analyser
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;
    
    // Connecter le flux audio à l'analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Préparer les données pour l'analyse
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Configuration du canvas
    canvas.width = visualizerConfig.width;
    canvas.height = visualizerConfig.height;
    
    // Nombre de barres basé sur la largeur du canvas et la largeur des barres + espace
    const barCount = Math.floor(canvas.width / (visualizerConfig.barWidth + visualizerConfig.barGap));
    
    // Fonction de dessin qui sera appelée récursivement
    const draw = () => {
      // Continuer l'animation si le state est toujours 'recording'
      if (recorderState !== 'recording') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }
      
      // Planifier la prochaine frame
      animationFrameRef.current = requestAnimationFrame(draw);
      
      // Obtenir les données audio
      analyser.getByteFrequencyData(dataArray);
      
      // Effacer le canvas
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Boucle pour dessiner les barres de fréquence façon WhatsApp
      for (let i = 0; i < barCount; i++) {
        // Calculer l'index dans le dataArray pour cette barre
        const dataIndex = Math.floor(i * (bufferLength / barCount));
        
        // Obtenir la valeur d'amplitude pour cette fréquence (0-255)
        const value = dataArray[dataIndex];
        
        // Calculer la hauteur de la barre avec sensibilité
        // Dans WhatsApp, les barres partent du milieu et ont une hauteur minimale
        const minHeight = canvas.height * 0.2; // Hauteur minimale des barres
        const maxVariation = canvas.height * 0.6; // Variation maximale de hauteur
        
        // Calculer la hauteur réelle en fonction du volume
        const barHeight = minHeight + ((value / 255) * maxVariation * visualizerConfig.sensitivity);
        
        // Calculer la position x pour cette barre
        const x = i * (visualizerConfig.barWidth + visualizerConfig.barGap);
        
        // Positionner la barre au milieu du canvas
        const y = (canvas.height - barHeight) / 2;
        
        // Couleur unique en bleu-vert (teinte WhatsApp)
        canvasCtx.fillStyle = '#00A884'; // Couleur de WhatsApp
        
        // Pour mode sombre
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          canvasCtx.fillStyle = '#00CF9D'; // Version plus claire pour le mode sombre
        }
        
        // Vérifier si roundRect est disponible (navigateurs récents)
        if (canvasCtx.roundRect) {
          canvasCtx.beginPath();
          // @ts-ignore - La méthode roundRect existe mais TypeScript peut ne pas la reconnaître
          canvasCtx.roundRect(x, y, visualizerConfig.barWidth, barHeight, [1]);
          canvasCtx.fill();
        } else {
          // Alternative pour les navigateurs qui ne supportent pas roundRect
          canvasCtx.fillRect(x, y, visualizerConfig.barWidth, barHeight);
        }
      }
    };
    
    // Démarrer l'animation
    draw();
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
      
      {/* Version enregistrement - style WhatsApp */}
      {recorderState === 'recording' && (
        <div className="flex items-center w-full max-w-xl bg-gray-100 dark:bg-gray-800 rounded-full shadow-md overflow-hidden">
          {/* Bouton pour annuler l'enregistrement */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              // Annuler l'enregistrement sans traiter l'audio
              if (mediaRecorderRef.current) {
                // Arrêter le mediaRecorder sans traiter les données
                mediaRecorderRef.current.onstop = null;
                
                // Vider les chunks audio
                audioChunksRef.current = [];
                
                // Arrêter l'enregistrement
                mediaRecorderRef.current.stop();
                
                // Fermer le flux
                if (mediaStreamRef.current) {
                  mediaStreamRef.current.getTracks().forEach(track => track.stop());
                }
                
                // Réinitialiser l'état
                setRecorderState('inactive');
                
                // Afficher un toast pour informer l'utilisateur
                toast({
                  title: "Enregistrement annulé",
                  description: "L'enregistrement a été annulé",
                });
              }
            }}
            className="h-12 w-12 text-gray-500 hover:text-red-500 rounded-l-full flex-shrink-0"
            aria-label="Annuler l'enregistrement"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 5v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
          </Button>
          
          {/* Indicateur de durée et visualiseur audio */}
          <div className="flex-1 px-2 flex items-center overflow-hidden">
            {/* Cercle rouge d'enregistrement avec animation pulse */}
            <div className="flex-shrink-0 mr-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            </div>
            
            {/* Durée d'enregistrement */}
            <span className="text-sm font-mono flex-shrink-0 mr-2 font-semibold">
              {formatDuration(recordingDuration)}
            </span>
            
            {/* Visualiseur audio custom - points qui bougent */}
            <div className="flex-1 mx-2 h-6 flex items-center gap-[2px] overflow-hidden">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full"
                style={{ height: '24px' }}
              />
            </div>
            
            {/* Durée restante (optionnel) */}
            <span className="text-xs text-gray-500 font-mono flex-shrink-0 mr-1 hidden sm:block">
              {formatDuration(maxRecordingTimeMs - recordingDuration)}
            </span>
          </div>
          
          {/* Bouton pour envoyer l'enregistrement */}
          <Button
            size="icon"
            variant="ghost"
            onClick={stopRecording}
            className="h-12 w-12 bg-green-500 hover:bg-green-600 text-white rounded-r-full flex-shrink-0"
            aria-label="Envoyer l'enregistrement"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
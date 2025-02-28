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
  
  // Configuration du visualiseur audio
  const visualizerConfig: AudioVisualizerConfig = {
    width: 280, // Largeur du canvas
    height: 60,  // Hauteur du canvas
    barWidth: 3,  // Largeur des barres
    barGap: 1,    // Espace entre les barres
    sensitivity: 1.5 // Sensibilité du visualiseur (plus c'est haut, plus les barres sont hautes)
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
      
      // Boucle pour dessiner les barres de fréquence
      for (let i = 0; i < barCount; i++) {
        // Calculer l'index dans le dataArray pour cette barre
        const dataIndex = Math.floor(i * (bufferLength / barCount));
        
        // Obtenir la valeur d'amplitude pour cette fréquence (0-255)
        const value = dataArray[dataIndex];
        
        // Calculer la hauteur de la barre avec sensibilité
        const barHeight = (value / 255) * canvas.height * visualizerConfig.sensitivity;
        
        // Calculer la position x pour cette barre
        const x = i * (visualizerConfig.barWidth + visualizerConfig.barGap);
        
        // Positionner la barre en bas du canvas
        const y = canvas.height - barHeight;
        
        // Calculer une couleur en fonction de l'amplitude
        const hue = ((i / barCount) * 180) + 180; // 180-360 pour les tons bleus/violets
        
        // Dessiner la barre
        canvasCtx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
        canvasCtx.fillRect(x, y, visualizerConfig.barWidth, barHeight);
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
      <div className="tooltip-container relative group">
        {/* Bouton d'enregistrement - plus grand sur mobile pour une meilleure expérience tactile */}
        <Button
          size="icon"
          variant={recorderState === 'recording' ? "destructive" : "outline"}
          disabled={disabled || recorderState === 'processing'}
          onClick={recorderState === 'recording' ? stopRecording : startRecording}
          aria-label={recorderState === 'recording' ? "Arrêter l'enregistrement" : "Enregistrer votre voix"}
          className={`
            relative hover:bg-primary/10 hover:text-primary transition-colors 
            sm:h-10 sm:w-10 h-12 w-12 rounded-full
            active:scale-95 transform transition-transform
            touch-manipulation
            ${recorderState === 'recording' ? 'shadow-md bg-red-50 dark:bg-red-900/20' : ''}
          `}
        >
          {recorderState === 'processing' ? (
            <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
          ) : recorderState === 'recording' ? (
            <StopCircle className="h-6 w-6 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
          ) : (
            <Mic className="h-6 w-6 sm:h-5 sm:w-5" />
          )}
          
          {/* Indicateur de progression circulaire */}
          {recorderState === 'recording' && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-gray-300 opacity-25 dark:text-gray-600"
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
              />
              <circle
                className="text-red-500 dark:text-red-400"
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8" 
                fill="none"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * recordingProgressPercent) / 100}
              />
            </svg>
          )}
        </Button>
        
        {/* Infobulle - visible sur desktop, cachée sur mobile pour laisser place au visualiseur */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity w-max max-w-[200px] pointer-events-none hidden sm:block">
          {recorderState === 'recording' 
            ? "Cliquez pour arrêter l'enregistrement" 
            : recorderState === 'processing'
            ? "Traitement en cours..."
            : recorderState === 'error'
            ? "Une erreur s'est produite, cliquez pour réessayer"
            : "Cliquez pour enregistrer votre question"
          }
        </div>
      </div>
      
      {/* Visualiseur audio */}
      {recorderState === 'recording' && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/10 dark:bg-white/10 rounded-md p-2 w-80 max-w-[90vw] z-50 shadow-lg">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono font-bold">{formatDuration(recordingDuration)}</span>
              <div className="flex items-center">
                <span className="text-xs text-center font-medium mr-1">Enregistrement</span>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <span className="text-xs font-mono">{formatDuration(maxRecordingTimeMs)}</span>
            </div>
            
            {/* Barre de progression */}
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-100"
                style={{ width: `${recordingProgressPercent}%` }}
              />
            </div>
          
            <canvas 
              ref={canvasRef} 
              className="mx-auto rounded"
              style={{ 
                width: visualizerConfig.width, 
                height: visualizerConfig.height 
              }}
            />
            
            <div className="mt-1 flex justify-between px-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Annuler l'enregistrement sans traiter l'audio
                  if (mediaRecorderRef.current) {
                    // Arrêter le mediaRecorder sans traiter les données
                    const oldStop = mediaRecorderRef.current.onstop;
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
                className="px-2 py-1 h-8 text-xs touch-manipulation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                Annuler
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={stopRecording}
                className="px-2 py-1 h-8 text-xs touch-manipulation"
              >
                <StopCircle className="h-3 w-3 mr-1" />
                Arrêter
              </Button>
            </div>
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
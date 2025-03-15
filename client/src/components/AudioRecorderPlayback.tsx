import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Play, Pause, Send, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type RecorderState = 'inactive' | 'recording' | 'paused' | 'playback' | 'processing' | 'error';

interface AudioRecorderPlaybackProps {
  onTranscriptionComplete: (text: string) => void;
  onAudioSend?: (audioBlob: Blob) => Promise<void>;
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

const AudioRecorderPlayback: React.FC<AudioRecorderPlaybackProps> = ({
  onTranscriptionComplete,
  onAudioSend,
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // États
  const [recorderState, setRecorderState] = useState<RecorderState>('inactive');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(44).fill(3));
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Configuration du visualiseur audio
  const visualizerConfig: AudioVisualizerConfig = {
    width: 200, // Largeur du canvas ajustable
    height: 30,  // Hauteur des barres réduite pour une meilleure intégration
    barWidth: 2,  // Barres fines
    barGap: 2,    // Espace entre les barres
    sensitivity: 2.5 // Sensibilité pour la visualisation
  };
  
  // Nettoyer les ressources lors du démontage du composant
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
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

    // Nettoyer l'URL de l'objet Blob
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
  };
  
  // Formater la durée mm:ss
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Visualiseur audio optimisé
  const setupAudioVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    // Créer le contexte audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    // Créer un analyser
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.3;
    
    // Connecter le flux audio à l'analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Préparer les données pour l'analyse
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Configuration du canvas
    const canvas = canvasRef.current;
    canvas.width = visualizerConfig.width;
    canvas.height = visualizerConfig.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Nombre de barres à afficher
    const totalBars = Math.floor(canvas.width / (visualizerConfig.barWidth + visualizerConfig.barGap));
    
    // Fonction pour dessiner la forme d'onde
    const draw = () => {
      // Vérifier si nous sommes toujours en enregistrement ou en pause
      if (recorderState !== 'recording' && recorderState !== 'paused') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }
      
      // Planifier la prochaine frame
      animationFrameRef.current = requestAnimationFrame(draw);
      
      // Obtenir les données de fréquence
      analyser.getByteFrequencyData(dataArray);
      
      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Couleur pour les barres en mode enregistrement et pause
      ctx.fillStyle = recorderState === 'recording' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(150, 150, 150, 0.5)';
      
      // Calculer le pas pour répartir les fréquences
      const step = Math.ceil(bufferLength / totalBars);
      
      // Dessiner chaque barre
      for (let i = 0; i < totalBars; i++) {
        const dataIndex = Math.min(bufferLength - 1, i * step);
        
        // Calculer la hauteur de la barre
        let barHeight = 0;
        
        if (recorderState === 'paused') {
          // Générer une hauteur statique pour le mode pause
          barHeight = audioLevels[i % audioLevels.length];
        } else {
          // Utiliser les données audio réelles en mode enregistrement
          const value = dataArray[dataIndex];
          barHeight = Math.max(3, (value / 255) * canvas.height * visualizerConfig.sensitivity);
        }
        
        // Position X de la barre
        const x = i * (visualizerConfig.barWidth + visualizerConfig.barGap);
        
        // Dessiner la barre depuis le centre
        const centerY = canvas.height / 2;
        ctx.fillRect(
          x, 
          centerY - barHeight / 2, 
          visualizerConfig.barWidth, 
          barHeight
        );
      }
      
      // Stocker les niveaux actuels pour les utiliser en mode pause
      if (recorderState === 'recording') {
        const newLevels = Array(totalBars).fill(0).map((_, i) => {
          const dataIndex = Math.min(bufferLength - 1, i * step);
          return Math.max(3, (dataArray[dataIndex] / 255) * canvas.height * visualizerConfig.sensitivity);
        });
        setAudioLevels(newLevels);
      }
    };
    
    // Démarrer le dessin
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
      
      // Nettoyer les ressources existantes
      cleanupResources();
      
      // Réinitialiser les erreurs
      setErrorMessage(null);
      
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });
      
      // Stocker le flux
      mediaStreamRef.current = stream;
      
      // Réinitialiser les morceaux audio
      audioChunksRef.current = [];
      
      // Configurer le MediaRecorder
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // Configurer le gestionnaire d'événements pour les données
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Configurer le gestionnaire d'événements pour l'arrêt
      mediaRecorderRef.current.onstop = () => {
        // Créer un blob à partir des morceaux audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Créer une URL pour le blob
        const url = URL.createObjectURL(audioBlob);
        
        // Stocker le blob et l'URL
        setAudioBlob(audioBlob);
        setAudioBlobUrl(url);
        
        // Passer en mode playback
        setRecorderState('playback');
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
  
  // Fonction pour mettre en pause l'enregistrement
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecorderState('paused');
      
      // Pause le timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };
  
  // Fonction pour reprendre l'enregistrement
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecorderState('recording');
      
      // Reprendre le timer
      const startTime = Date.now() - recordingDuration;
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingDuration(elapsed);
        
        // Arrêter automatiquement si la durée maximale est atteinte
        if (elapsed >= maxRecordingTimeMs) {
          stopRecording();
        }
      }, 100);
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
  
  // Fonction pour supprimer l'enregistrement
  const deleteRecording = () => {
    // Nettoyer l'URL du blob
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    
    // Réinitialiser l'état
    setAudioBlob(null);
    setAudioBlobUrl(null);
    setRecorderState('inactive');
    setRecordingDuration(0);
  };
  
  // Fonction pour lire l'enregistrement
  const playRecording = () => {
    if (audioRef.current && audioBlobUrl) {
      audioRef.current.play();
    }
  };
  
  // Fonction pour mettre en pause la lecture
  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  // Fonction pour envoyer l'enregistrement
  const sendRecording = async () => {
    try {
      if (!audioBlob) return;
      
      setRecorderState('processing');
      
      // Afficher le toast de traitement
      toast({
        title: "Traitement en cours",
        description: "Votre enregistrement est en cours de traitement...",
      });
      
      // Si une fonction personnalisée est fournie, l'utiliser
      if (onAudioSend) {
        await onAudioSend(audioBlob);
      } else {
        // Sinon, utiliser la méthode par défaut pour la transcription
        await processAudioForTranscription(audioBlob);
      }
      
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'enregistrement:", error);
      setErrorMessage("Une erreur s'est produite lors du traitement audio. Veuillez réessayer.");
      setRecorderState('error');
      
      toast({
        title: "Erreur de traitement",
        description: "Une erreur s'est produite lors du traitement de l'audio. Veuillez réessayer.",
        variant: "destructive"
      });
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
      deleteRecording();
      
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
  
  // Gérer les événements de l'élément audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => {
      // Aucune action spéciale nécessaire quand la lecture se termine
    };
    
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef.current]);
  
  // Rendu du composant
  return (
    <div className="relative">
      {/* Audio element pour la lecture */}
      <audio ref={audioRef} src={audioBlobUrl || undefined} className="hidden" />
      
      {/* Afficher le contrôleur d'enregistrement complet quand on enregistre ou lit */}
      {(recorderState === 'recording' || recorderState === 'paused' || recorderState === 'playback') && (
        <div className="bg-transparent flex items-center justify-between w-full max-w-md">
          {/* Bouton supprimer */}
          <button 
            onClick={deleteRecording}
            className="p-1 text-gray-600 hover:text-red-500 transition-colors"
            aria-label="Supprimer l'enregistrement"
          >
            <Trash2 size={18} />
          </button>
          
          {/* Compteur de temps */}
          <div className="text-gray-700 font-medium mx-1 min-w-12 text-center text-sm">
            {formatDuration(recordingDuration)}
          </div>
          
          {/* Visualiseur audio */}
          <div className="flex-grow mx-2 flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              className="w-full h-8"
            />
          </div>
          
          {/* Bouton pause/play */}
          {recorderState === 'recording' ? (
            <button 
              onClick={pauseRecording}
              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              aria-label="Mettre en pause l'enregistrement"
            >
              <Pause size={16} />
            </button>
          ) : recorderState === 'paused' ? (
            <button 
              onClick={resumeRecording}
              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              aria-label="Reprendre l'enregistrement"
            >
              <Play size={16} />
            </button>
          ) : (
            <button 
              onClick={audioRef.current?.paused ? playRecording : pausePlayback}
              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              aria-label={audioRef.current?.paused ? "Lire l'enregistrement" : "Mettre en pause la lecture"}
            >
              {audioRef.current?.paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          
          {/* Bouton envoyer (uniquement en mode playback) */}
          {recorderState === 'playback' && (
            <button 
              onClick={sendRecording}
              className="p-1.5 ml-1 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
              aria-label="Envoyer l'enregistrement"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      )}
      
      {/* Bouton d'enregistrement initial */}
      {recorderState === 'inactive' && (
        <Button
          size="icon"
          variant="ghost"
          disabled={disabled}
          onClick={startRecording}
          aria-label="Enregistrer votre voix"
          className="relative bg-black hover:bg-gray-800 text-white transition-colors 
                   h-10 w-10 rounded-full
                   active:scale-95 transform transition-transform"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
      
      {/* Traitement en cours */}
      {recorderState === 'processing' && (
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
          <span className="ml-2 text-sm text-gray-700">Traitement en cours...</span>
        </div>
      )}
      
      {/* Afficher les erreurs */}
      {recorderState === 'error' && errorMessage && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-50 border border-red-200 text-red-600 rounded-md p-2 w-64 text-xs">
          <p className="font-medium">Erreur d'enregistrement</p>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorderPlayback;
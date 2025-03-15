import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Play, Pause, Send, Mic, X } from 'lucide-react';
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
  
  // Configuration du visualiseur audio - ajusté pour correspondre parfaitement au screenshot
  const visualizerConfig: AudioVisualizerConfig = {
    width: 300, // Largeur ajustée pour s'adapter à la zone dans l'interface
    height: 24,  // Hauteur réduite comme dans le screenshot
    barWidth: 1,  // Barres fines comme dans le screenshot
    barGap: 1,    // Espacement minimal
    sensitivity: 2.5 // Sensibilité ajustée pour avoir un rendu similaire au screenshot
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
      
      // Couleur noire pour les barres, exactement comme dans le screenshot
      ctx.fillStyle = 'rgb(0, 0, 0)';
      
      // Calculer le pas pour répartir les fréquences
      const step = Math.ceil(bufferLength / totalBars);
      
      // Dessiner chaque barre - style très similaire au screenshot
      for (let i = 0; i < totalBars; i++) {
        const dataIndex = Math.min(bufferLength - 1, i * step);
        
        // Calculer la hauteur de la barre
        let barHeight = 0;
        
        if (recorderState === 'paused') {
          // Générer une hauteur statique pour le mode pause, avec une variation légère
          barHeight = Math.max(2, Math.min(canvas.height, audioLevels[i % audioLevels.length]));
        } else {
          // Utiliser les données audio réelles en mode enregistrement
          const value = dataArray[dataIndex];
          
          // Ajuster les valeurs pour qu'elles varient davantage comme dans le screenshot
          // Les valeurs plus faibles sont augmentées légèrement, les valeurs élevées sont accentuées
          let normalizedValue = value / 255;
          
          // Appliquer une courbe pour accentuer les différences
          normalizedValue = Math.pow(normalizedValue, 0.7);
          
          // Calculer la hauteur avec un minimum plus visible
          barHeight = Math.max(2, normalizedValue * canvas.height * visualizerConfig.sensitivity);
          
          // S'assurer que certaines barres sont plus hautes pour avoir le même effet visuel que le screenshot
          if (i % 4 === 0 && Math.random() > 0.5) {
            barHeight = Math.max(barHeight, canvas.height * 0.6 * Math.random());
          }
        }
        
        // Position X de la barre
        const x = i * (visualizerConfig.barWidth + visualizerConfig.barGap);
        
        // Dessiner la barre depuis le bas (comme dans le screenshot)
        ctx.fillRect(
          x, 
          canvas.height - barHeight, 
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
  
  // Démarrer automatiquement l'enregistrement
  useEffect(() => {
    // Lorsque le composant est monté, démarrer immédiatement l'enregistrement
    if (recorderState === 'inactive') {
      startRecording();
    }
    
    // Nettoyer lors du démontage
    return () => {
      cleanupResources();
    };
  }, []); // Exécuté une seule fois au montage

  // Rendu du composant
  return (
    <div className="relative">
      {/* Audio element pour la lecture */}
      <audio ref={audioRef} src={audioBlobUrl || undefined} className="hidden" />
      
      {/* Nouveau design de l'interface d'enregistrement selon le screenshot */}
      {(recorderState === 'recording' || recorderState === 'paused' || recorderState === 'playback') && (
        <div className="bg-white flex items-center justify-between w-full p-2 px-4 rounded-full shadow-md" style={{ height: '56px' }}>
          {recorderState === 'recording' && (
            <>
              {/* Partie gauche - boutons photo et caméra */}
              <div className="flex items-center gap-3">
                <button 
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  aria-label="Joindre une photo"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="#555" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="#555" strokeWidth="2"/>
                  </svg>
                </button>
                <button 
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  aria-label="Prendre une photo"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9C3 7.89543 3.89543 7 5 7H5.5C6.12951 7 6.72229 6.70361 7.1 6.2L8.9 4.8C9.27771 4.29639 9.87049 4 10.5 4H13.5C14.1295 4 14.7223 4.29639 15.1 4.8L16.9 6.2C17.2777 6.70361 17.8705 7 18.5 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="#555" strokeWidth="2"/>
                    <circle cx="12" cy="13" r="4" stroke="#555" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
              
              {/* Partie centrale - poubelle et compteur de temps */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={deleteRecording}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Supprimer l'enregistrement"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3H15M3 6H21M19 6L18.133 19.142C18.0971 19.6466 17.8713 20.1188 17.5011 20.4636C17.1309 20.8083 16.6439 21 16.138 21H7.862C7.35614 21 6.86907 20.8083 6.49889 20.4636C6.1287 20.1188 5.90288 19.6466 5.867 19.142L5 6M10 10V17M14 10V17" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="text-gray-800 font-medium">
                  {formatDuration(recordingDuration)}
                </div>
              </div>
              
              {/* Partie droite - visualiseur audio et bouton pause */}
              <div className="flex items-center gap-3">
                {/* Visualiseur audio */}
                <div className="w-36 h-6">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-full"
                  />
                </div>
                
                {/* Bouton pause rouge */}
                <Button
                  onClick={pauseRecording}
                  className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white border-none shadow-none
                          h-10 w-10 flex items-center justify-center flex-shrink-0"
                  aria-label="Mettre en pause l'enregistrement"
                >
                  <Pause size={18} />
                </Button>
              </div>
            </>
          )}
          
          {recorderState === 'paused' && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button 
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  aria-label="Joindre une photo"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="#555" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="#555" strokeWidth="2"/>
                  </svg>
                </button>
                <button 
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  aria-label="Prendre une photo"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9C3 7.89543 3.89543 7 5 7H5.5C6.12951 7 6.72229 6.70361 7.1 6.2L8.9 4.8C9.27771 4.29639 9.87049 4 10.5 4H13.5C14.1295 4 14.7223 4.29639 15.1 4.8L16.9 6.2C17.2777 6.70361 17.8705 7 18.5 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="#555" strokeWidth="2"/>
                    <circle cx="12" cy="13" r="4" stroke="#555" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={deleteRecording}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Supprimer l'enregistrement"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3H15M3 6H21M19 6L18.133 19.142C18.0971 19.6466 17.8713 20.1188 17.5011 20.4636C17.1309 20.8083 16.6439 21 16.138 21H7.862C7.35614 21 6.86907 20.8083 6.49889 20.4636C6.1287 20.1188 5.90288 19.6466 5.867 19.142L5 6M10 10V17M14 10V17" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="text-gray-800 font-medium">
                  {formatDuration(recordingDuration)}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={resumeRecording}
                  className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 
                           border-none shadow-none w-10 h-10 flex items-center justify-center"
                  aria-label="Reprendre l'enregistrement"
                >
                  <Play size={18} />
                </Button>
                <Button
                  onClick={stopRecording}
                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white 
                           border-none shadow-none w-10 h-10 flex items-center justify-center"
                  aria-label="Arrêter l'enregistrement"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          )}
          
          {recorderState === 'playback' && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button 
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  aria-label="Joindre une photo"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="#555" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="#555" strokeWidth="2"/>
                  </svg>
                </button>
                <button 
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  aria-label="Prendre une photo"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9C3 7.89543 3.89543 7 5 7H5.5C6.12951 7 6.72229 6.70361 7.1 6.2L8.9 4.8C9.27771 4.29639 9.87049 4 10.5 4H13.5C14.1295 4 14.7223 4.29639 15.1 4.8L16.9 6.2C17.2777 6.70361 17.8705 7 18.5 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="#555" strokeWidth="2"/>
                    <circle cx="12" cy="13" r="4" stroke="#555" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={deleteRecording}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Supprimer l'enregistrement"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3H15M3 6H21M19 6L18.133 19.142C18.0971 19.6466 17.8713 20.1188 17.5011 20.4636C17.1309 20.8083 16.6439 21 16.138 21H7.862C7.35614 21 6.86907 20.8083 6.49889 20.4636C6.1287 20.1188 5.90288 19.6466 5.867 19.142L5 6M10 10V17M14 10V17" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="text-gray-800 font-medium">
                  {formatDuration(recordingDuration)}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={audioRef.current?.paused ? playRecording : pausePlayback}
                  className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 
                          border-none shadow-none w-10 h-10 flex items-center justify-center"
                  aria-label={audioRef.current?.paused ? "Lire l'enregistrement" : "Mettre en pause la lecture"}
                >
                  {audioRef.current?.paused ? <Play size={18} /> : <Pause size={18} />}
                </Button>
                <Button
                  onClick={sendRecording}
                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white 
                          border-none shadow-none w-10 h-10 flex items-center justify-center"
                  aria-label="Envoyer l'enregistrement"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Bouton d'enregistrement initial (microphone avec fond noir) */}
      {recorderState === 'inactive' && (
        <Button
          size="icon"
          variant="outline" 
          disabled={disabled}
          onClick={startRecording}
          aria-label="Enregistrer votre voix"
          className="relative bg-black hover:bg-gray-900 text-white border-none
                   h-12 w-12 rounded-full
                   active:scale-95 transform transition-transform shadow
                   flex items-center justify-center"
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
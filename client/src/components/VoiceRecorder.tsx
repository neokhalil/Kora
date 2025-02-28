import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Types d'états possibles pour l'enregistreur vocal
type RecorderState = 'inactive' | 'recording' | 'processing' | 'error';

// Props du composant VoiceRecorder
interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  maxRecordingTimeMs?: number; // Durée maximale d'enregistrement en ms (défaut: 60 secondes)
  language?: string; // Langue pour la transcription (défaut: fr)
}

// Configuration pour le visualiseur audio
interface AudioVisualizerConfig {
  width: number;
  height: number;
  barWidth: number;
  barGap: number;
  sensitivity: number;
}

// Compteur d'usage pour suivre l'utilisation de l'API
interface UsageCounter {
  increment: () => void;
  getCount: () => number;
  resetCount: () => void;
}

// Singleton pour suivre l'utilisation de l'API
const createUsageCounter = (): UsageCounter => {
  // Essayer de charger la valeur depuis localStorage
  let count = parseInt(localStorage.getItem('voice_api_usage_count') || '0', 10);
  
  return {
    increment: () => {
      count++;
      localStorage.setItem('voice_api_usage_count', count.toString());
    },
    getCount: () => count,
    resetCount: () => {
      count = 0;
      localStorage.setItem('voice_api_usage_count', '0');
    }
  };
};

// Instance de singleton pour le compteur d'usage
const usageCounter = createUsageCounter();

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  disabled = false,
  maxRecordingTimeMs = 60000, // 60 secondes par défaut
  language = 'fr',
}) => {
  // État
  const [state, setState] = useState<RecorderState>('inactive');
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<number[]>(Array(20).fill(0));
  
  // Références
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Configuration du visualiseur audio
  const visualizerConfig: AudioVisualizerConfig = {
    width: 200,
    height: 60,
    barWidth: 4,
    barGap: 2,
    sensitivity: 1.5, // Ajuste la sensibilité de la visualisation
  };
  
  // Cleanup des ressources
  const cleanupResources = () => {
    // Arrêter la boucle d'animation si elle est en cours
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Arrêter le timer s'il est en cours
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Arrêter et nettoyer le MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Nettoyer WebAudio API
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    
    // Réinitialiser les chunks audio
    audioChunksRef.current = [];
    
    // Réinitialiser les données de visualisation
    setAnimationData(Array(20).fill(0));
  };
  
  // Effet de nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);
  
  // Fonction pour dessiner la visualisation audio
  const drawAudioVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height, barWidth, barGap, sensitivity } = visualizerConfig;
    
    // S'assurer que le canvas a la bonne taille
    canvas.width = width;
    canvas.height = height;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculer combien de barres peuvent tenir dans la largeur du canvas
    const numBars = Math.floor(width / (barWidth + barGap));
    
    // Tableau pour stocker les données audio
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    // Fonction de dessin
    const draw = () => {
      if (!analyserRef.current) return;
      
      // Récupérer les données audio
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Effacer le canvas
      ctx.clearRect(0, 0, width, height);
      
      // Convertir les données audio en hauteurs de barres
      const barData = [];
      const step = Math.floor(dataArray.length / numBars);
      
      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        // Normaliser entre 0 et 1, puis appliquer la sensibilité
        const normalizedValue = (sum / step / 255) * sensitivity;
        // Limiter à 1
        barData.push(Math.min(normalizedValue, 1));
      }
      
      // Mise à jour de l'état pour les animations CSS
      setAnimationData(barData);
      
      // Dessiner les barres
      ctx.fillStyle = 'rgb(79, 70, 229)'; // Couleur indigo
      
      barData.forEach((value, i) => {
        const barHeight = value * height;
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        
        // Dessiner la barre avec coins arrondis
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      });
      
      // Continuer l'animation
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    
    // Démarrer l'animation
    draw();
  };
  
  // Fonction pour démarrer l'enregistrement
  const startRecording = async () => {
    try {
      // Vérifier si le navigateur supporte l'API MediaRecorder
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Votre navigateur ne supporte pas l'enregistrement audio.");
      }
      
      // Nettoyer les ressources précédentes
      cleanupResources();
      
      // Réinitialiser les états
      setRecordingTime(0);
      setErrorMessage(null);
      setState('recording');
      
      // Demander l'autorisation d'accéder au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Créer le contexte audio pour la visualisation
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Connecter la source audio à l'analyseur
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      // Initialiser le MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Collecter les chunks audio
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Quand l'enregistrement est terminé
      mediaRecorderRef.current.onstop = async () => {
        // Arrêter les timers et l'animation
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Si nous avons des données audio, traiter l'enregistrement
        if (audioChunksRef.current.length > 0) {
          try {
            setState('processing');
            
            // Créer un blob à partir des chunks audio
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // Traiter l'audio pour obtenir la transcription
            await processAudioForTranscription(audioBlob);
          } catch (error) {
            console.error('Erreur lors du traitement de l\'audio:', error);
            setState('error');
            setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue lors du traitement de l'audio.");
            
            toast({
              title: 'Erreur de transcription',
              description: "Impossible de traiter l'enregistrement audio. Veuillez réessayer.",
              variant: 'destructive',
            });
          }
        } else {
          setState('inactive');
        }
        
        // Arrêter toutes les pistes dans le stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Démarrer l'enregistrement
      mediaRecorderRef.current.start();
      recordingStartTimeRef.current = Date.now();
      
      // Démarrer le timer pour suivre la durée de l'enregistrement
      recordingTimerRef.current = setInterval(() => {
        const elapsedTime = Date.now() - (recordingStartTimeRef.current || Date.now());
        setRecordingTime(elapsedTime);
        
        // Arrêter automatiquement si on dépasse le temps maximum
        if (elapsedTime >= maxRecordingTimeMs) {
          stopRecording();
        }
      }, 100);
      
      // Démarrer la visualisation audio
      drawAudioVisualization();
      
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue lors du démarrage de l'enregistrement.");
      
      toast({
        title: 'Erreur d\'accès au microphone',
        description: "Impossible d'accéder au microphone. Veuillez vérifier les permissions de votre navigateur.",
        variant: 'destructive',
      });
    }
  };
  
  // Fonction pour arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Fonction pour annuler l'enregistrement
  const cancelRecording = () => {
    cleanupResources();
    setState('inactive');
    setErrorMessage(null);
  };
  
  // Fonction pour traiter l'audio et obtenir une transcription
  const processAudioForTranscription = async (audioBlob: Blob) => {
    try {
      // Créer un formulaire pour envoyer l'audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      // Incrémenter le compteur d'utilisation
      usageCounter.increment();
      console.log(`Utilisation de l'API vocale: ${usageCounter.getCount()} requêtes`);
      
      // Envoyer la requête au serveur
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur lors de la transcription: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.text) {
        // Appeler le callback avec le texte transcrit
        onTranscriptionComplete(data.text);
        
        // Réinitialiser à l'état inactif
        setState('inactive');
      } else {
        throw new Error('Aucun texte n\'a été détecté dans l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur de transcription:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue lors de la transcription.");
      
      toast({
        title: 'Échec de la transcription',
        description: error instanceof Error ? error.message : "Impossible de transcrire l'audio. Veuillez réessayer.",
        variant: 'destructive',
      });
    }
  };
  
  // Fonction formatant le temps d'enregistrement
  const formatRecordingTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calcul du pourcentage de temps écoulé
  const recordingProgress = (recordingTime / maxRecordingTimeMs) * 100;
  
  // Fonction pour réessayer après une erreur
  const handleRetry = () => {
    setState('inactive');
    setErrorMessage(null);
  };
  
  // Rendu du composant en fonction de l'état
  return (
    <div className="voice-recorder relative">
      {/* État inactif: Afficher un simple bouton de microphone */}
      {state === 'inactive' && (
        <Button
          size="icon"
          variant="outline"
          className="voice-recorder-btn"
          disabled={disabled}
          onClick={startRecording}
          title="Enregistrer un message vocal"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
      
      {/* État d'enregistrement: Afficher le visualiseur et les contrôles */}
      {state === 'recording' && (
        <div className="voice-recorder-active flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
          {/* Visualiseur audio */}
          <div className="voice-recorder-visualizer flex-1 h-10 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full"></canvas>
            
            {/* Fallback pour le visualiseur si le canvas ne fonctionne pas */}
            <div className="flex items-center justify-center h-full gap-1">
              {animationData.map((value, index) => (
                <div
                  key={index}
                  className="voice-recorder-bar w-1 bg-indigo-500 dark:bg-indigo-400"
                  style={{
                    height: `${Math.max(4, value * 100)}%`,
                    transform: 'scaleY(1)',
                    transition: 'height 0.1s ease'
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Timer et contrôles */}
          <div className="voice-recorder-controls flex flex-col items-center gap-1">
            <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              {formatRecordingTime(recordingTime)}
            </div>
            
            {/* Barre de progression */}
            <Progress value={recordingProgress} className="w-24 h-1" />
            
            {/* Boutons d'action */}
            <div className="flex items-center gap-1 mt-1">
              <Button 
                size="icon" 
                variant="destructive" 
                className="h-7 w-7" 
                onClick={cancelRecording}
                title="Annuler l'enregistrement"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-7 w-7" 
                onClick={stopRecording}
                title="Arrêter l'enregistrement"
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* État de traitement: Afficher un indicateur de chargement */}
      {state === 'processing' && (
        <div className="voice-recorder-processing flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-sm text-blue-700 dark:text-blue-300">Transcription en cours...</span>
        </div>
      )}
      
      {/* État d'erreur: Afficher un message d'erreur et un bouton pour réessayer */}
      {state === 'error' && (
        <div className="voice-recorder-error flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">Erreur</span>
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-auto h-7" 
            onClick={handleRetry}
          >
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
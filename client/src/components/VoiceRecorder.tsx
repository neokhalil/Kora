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

// Utilisation d'un compteur pour limiter l'usage de l'API
interface UsageCounter {
  increment: () => void;
  getCount: () => number;
  resetCount: () => void;
}

// Singleton pour suivre l'utilisation de la transcription
const createUsageCounter = (): UsageCounter => {
  // Initialiser avec la valeur depuis localStorage ou 0
  let count = parseInt(localStorage.getItem('voice_transcription_count') || '0', 10);
  
  return {
    increment: () => {
      count++;
      localStorage.setItem('voice_transcription_count', count.toString());
    },
    getCount: () => count,
    resetCount: () => {
      count = 0;
      localStorage.setItem('voice_transcription_count', '0');
    }
  };
};

// Singleton pour le compteur d'utilisation
const usageCounter = createUsageCounter();

// Limite d'utilisation par jour (à ajuster selon besoins)
const DAILY_USAGE_LIMIT = 50;

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscriptionComplete, 
  disabled = false,
  maxRecordingTimeMs = 60000, // 60 secondes par défaut
  language = 'fr' // Français par défaut
}) => {
  const [recorderState, setRecorderState] = useState<RecorderState>('inactive');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  
  const { toast } = useToast();
  
  // Configuration du visualiseur audio
  const visualizerConfig: AudioVisualizerConfig = {
    width: 200,
    height: 60,
    barWidth: 4,
    barGap: 2,
    sensitivity: 1.2
  };
  
  // Initialiser le visualiseur audio
  const setupAudioVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    // Nettoyer l'ancien contexte si nécessaire
    if (audioContextRef.current) {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    }
    
    // Créer un nouveau contexte audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    // Créer un nœud d'analyse pour les données audio
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    
    // Connecter le flux audio à l'analyseur
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    source.connect(analyser);
    
    // Configurer le canvas
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    if (!canvasCtx) return;
    
    // Configuration initiale du canvas
    canvas.width = visualizerConfig.width;
    canvas.height = visualizerConfig.height;
    
    // Fonction pour dessiner le visualiseur
    const draw = () => {
      if (recorderState !== 'recording') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Obtenir les données de fréquence
      analyser.getByteFrequencyData(dataArray);
      
      // Effacer le canvas
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner les barres de fréquence
      const barCount = Math.floor(canvas.width / (visualizerConfig.barWidth + visualizerConfig.barGap));
      const barWidth = visualizerConfig.barWidth;
      const barGap = visualizerConfig.barGap;
      const sensitivity = visualizerConfig.sensitivity;
      
      for (let i = 0; i < barCount; i++) {
        // Échantillonner les données de manière uniforme
        const dataIndex = Math.floor(i * bufferLength / barCount);
        let value = dataArray[dataIndex] * sensitivity;
        value = Math.min(value, canvas.height);
        
        // Calculer la hauteur de la barre
        const barHeight = value;
        const x = i * (barWidth + barGap);
        const y = canvas.height - barHeight;
        
        // Couleur dégradée basée sur la hauteur
        const hue = (i / barCount) * 240; // Dégradé du bleu au rouge
        canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        // Dessiner la barre
        canvasCtx.fillRect(x, y, barWidth, barHeight);
      }
      
      // Continuer l'animation
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    
    // Démarrer l'animation
    animationFrameRef.current = requestAnimationFrame(draw);
  };
  
  // Fonction pour traiter l'audio et l'envoyer pour transcription
  const processAudioForTranscription = async (audioBlob: Blob) => {
    try {
      // Vérifier si nous avons dépassé la limite d'utilisation
      if (usageCounter.getCount() >= DAILY_USAGE_LIMIT) {
        throw new Error(`Limite d'utilisation journalière atteinte (${DAILY_USAGE_LIMIT} enregistrements)`);
      }
      
      // Créer un FormData pour l'envoi
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      // Envoi de l'audio au serveur pour transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la transcription: ${response.status} ${response.statusText}`);
      }
      
      // Analyser la réponse
      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Aucun texte transcrit reçu du serveur');
      }
      
      // Incrémenter le compteur d'utilisation
      usageCounter.increment();
      
      // Appeler le callback avec le texte transcrit
      onTranscriptionComplete(data.text);
      
      // Retourner à l'état inactif
      setRecorderState('inactive');
      
    } catch (error) {
      console.error('Erreur de transcription:', error);
      setErrorMessage((error as Error).message);
      setRecorderState('error');
      
      toast({
        variant: "destructive",
        title: "Erreur de transcription",
        description: (error as Error).message,
      });
    }
  };
  
  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      // Réinitialiser les états
      setErrorMessage(null);
      setRecordingDuration(0);
      audioChunksRef.current = [];
      
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Sauvegarder le flux pour pouvoir le fermer plus tard
      mediaStreamRef.current = stream;
      
      // Configurer le MediaRecorder avec des options spécifiques pour un format compatible
      const options = { mimeType: 'audio/wav' };
      
      // Vérifier si le format est supporté, sinon utiliser les options par défaut
      let mediaRecorder: MediaRecorder;
      try {
        if (MediaRecorder.isTypeSupported('audio/wav')) {
          mediaRecorder = new MediaRecorder(stream, options);
          console.log('Enregistrement audio au format WAV');
        } else if (MediaRecorder.isTypeSupported('audio/mp3')) {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp3' });
          console.log('Enregistrement audio au format MP3');
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          console.log('Enregistrement audio au format WEBM');
        } else {
          // Fallback si aucun des formats préférés n'est supporté
          mediaRecorder = new MediaRecorder(stream);
          console.log('Enregistrement audio au format par défaut:', mediaRecorder.mimeType);
        }
      } catch (e) {
        console.warn('Format audio non supporté, utilisation du format par défaut');
        mediaRecorder = new MediaRecorder(stream);
        console.log('Format d\'enregistrement:', mediaRecorder.mimeType);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Configurer le visualiseur audio
      setupAudioVisualizer(stream);
      
      // Listener pour les données audio
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      // Listener pour la fin de l'enregistrement
      mediaRecorder.addEventListener('stop', () => {
        // Arrêter le timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // Arrêter le flux du microphone
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Créer un blob audio à partir des chunks avec le même type MIME que le recorder
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        console.log('Création du blob audio avec le type MIME:', mimeType);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Passer à l'état de traitement
        setRecorderState('processing');
        
        // Traiter l'audio pour transcription
        processAudioForTranscription(audioBlob);
      });
      
      // Démarrer l'enregistrement
      mediaRecorder.start();
      setRecorderState('recording');
      recordingStartTimeRef.current = Date.now();
      
      // Configurer un timer pour mettre à jour la durée d'enregistrement
      recordingTimerRef.current = setInterval(() => {
        const currentDuration = Date.now() - recordingStartTimeRef.current;
        setRecordingDuration(currentDuration);
        
        // Arrêter automatiquement si on dépasse la durée maximale
        if (currentDuration >= maxRecordingTimeMs) {
          stopRecording();
        }
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      setErrorMessage((error as Error).message);
      setRecorderState('error');
      
      toast({
        variant: "destructive",
        title: "Erreur d'enregistrement",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions de votre navigateur.",
      });
    }
  };
  
  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Arrêter l'animation du visualiseur
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Arrêter le contexte audio
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    }
  };
  
  // Nettoyer les ressources quand le composant est démonté
  useEffect(() => {
    return () => {
      // Arrêter l'enregistrement si actif
      if (recorderState === 'recording') {
        stopRecording();
      }
      
      // Arrêter le timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Arrêter l'animation du visualiseur
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Fermer le contexte audio
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      
      // Arrêter le flux du microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [recorderState]);
  
  // Formater la durée d'enregistrement en MM:SS
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculer le pourcentage de progression
  const recordingProgressPercent = Math.min(100, (recordingDuration / maxRecordingTimeMs) * 100);
  
  // Retourner le composant
  return (
    <div className="relative flex items-center justify-center">
      {/* Bouton d'enregistrement */}
      <Button
        size="icon"
        variant={recorderState === 'recording' ? "destructive" : "outline"}
        disabled={disabled || recorderState === 'processing'}
        onClick={recorderState === 'recording' ? stopRecording : startRecording}
        title={recorderState === 'recording' ? "Arrêter l'enregistrement" : "Enregistrer"}
        className="relative"
      >
        {recorderState === 'processing' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : recorderState === 'recording' ? (
          <StopCircle className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        
        {/* Indicateur de progression circulaire */}
        {recorderState === 'recording' && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              className="text-gray-300 opacity-25"
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
            />
            <circle
              className="text-red-600"
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * recordingProgressPercent) / 100}
            />
          </svg>
        )}
      </Button>
      
      {/* Visualiseur audio */}
      {recorderState === 'recording' && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/5 dark:bg-white/5 rounded-md p-2 w-64">
          <div className="text-xs text-center mb-1 font-mono">
            {formatDuration(recordingDuration)} / {formatDuration(maxRecordingTimeMs)}
          </div>
          <canvas 
            ref={canvasRef} 
            className="mx-auto"
            style={{ 
              width: visualizerConfig.width, 
              height: visualizerConfig.height 
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
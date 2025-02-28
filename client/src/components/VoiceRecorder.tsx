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
      
      // Obtenir l'extension appropriée à partir du type MIME
      const mimeType = audioBlob.type;
      let fileExtension = '.webm'; // Par défaut
      
      if (mimeType.includes('audio/wav') || mimeType.includes('audio/x-wav')) {
        fileExtension = '.wav';
      } else if (mimeType.includes('audio/mp3') || mimeType.includes('audio/mpeg')) {
        fileExtension = '.mp3';
      } else if (mimeType.includes('audio/mp4')) {
        fileExtension = '.mp4';
      } else if (mimeType.includes('audio/ogg')) {
        fileExtension = '.ogg';
      } else if (mimeType.includes('audio/webm')) {
        fileExtension = '.webm';
      }
      
      console.log(`Envoi du fichier audio avec le type MIME ${mimeType} et l'extension ${fileExtension}`);
      
      // Créer un FormData pour l'envoi
      const formData = new FormData();
      
      // Utiliser un nom de fichier avec l'extension appropriée pour aider le serveur à détecter le format
      formData.append('audio', audioBlob, `recording${fileExtension}`);
      formData.append('language', language);
      
      // Ajouter des informations de débogage au serveur
      formData.append('debugInfo', JSON.stringify({
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        fileExtension: fileExtension,
        language: language,
        browser: navigator.userAgent
      }));
      
      // Envoi de l'audio au serveur pour transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Erreur lors de la transcription (${response.status}): ${
            errorData.error || errorData.message || response.statusText
          }`
        );
      }
      
      // Analyser la réponse
      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Aucun texte transcrit reçu du serveur');
      }
      
      // Incrémenter le compteur d'utilisation
      usageCounter.increment();
      
      // Afficher un toast de succès
      toast({
        title: "Transcription réussie",
        description: "Votre message a été transcrit avec succès.",
      });
      
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
  
  // Vérifie si l'API MediaRecorder est disponible
  const isMediaRecorderSupported = () => {
    return typeof window !== 'undefined' && 
           typeof window.MediaRecorder !== 'undefined' &&
           typeof navigator !== 'undefined' && 
           typeof navigator.mediaDevices !== 'undefined' &&
           typeof navigator.mediaDevices.getUserMedia !== 'undefined';
  };

  // Vérifie si le navigateur a accès au microphone
  const checkMicrophoneAccess = async (): Promise<boolean> => {
    try {
      // Vérifier si les permissions sont déjà accordées
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissions.state === 'granted') {
        return true;
      } else if (permissions.state === 'prompt') {
        // Afficher un toast pour informer l'utilisateur qu'il devra accepter les permissions
        toast({
          title: "Permission requise",
          description: "Merci d'autoriser l'accès au microphone quand demandé.",
        });
      } else if (permissions.state === 'denied') {
        throw new Error("L'accès au microphone a été bloqué. Veuillez modifier les permissions dans les paramètres de votre navigateur.");
      }
      
      return false;
    } catch (error) {
      console.warn('Impossible de vérifier les permissions du microphone:', error);
      return false;
    }
  };
  
  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      // Vérifier si MediaRecorder est supporté
      if (!isMediaRecorderSupported()) {
        throw new Error("Votre navigateur ne supporte pas l'enregistrement audio.");
      }
      
      // Vérifier les permissions du microphone
      await checkMicrophoneAccess();
      
      // Réinitialiser les états
      setErrorMessage(null);
      setRecordingDuration(0);
      audioChunksRef.current = [];
      
      // Demander l'accès au microphone avec des contraintes audio optimisées
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };
      
      // Demander l'accès au microphone avec un timeout
      const streamPromise = navigator.mediaDevices.getUserMedia(constraints);
      
      // Ajouter un timeout pour éviter d'attendre indéfiniment
      const timeoutPromise = new Promise<MediaStream>((_, reject) => {
        setTimeout(() => reject(new Error("Délai d'attente dépassé pour l'accès au microphone")), 10000);
      });
      
      // Utiliser la première promesse résolue (stream ou timeout)
      const stream = await Promise.race([streamPromise, timeoutPromise]);
      
      // Sauvegarder le flux pour pouvoir le fermer plus tard
      mediaStreamRef.current = stream;
      
      // S'assurer que le flux a des pistes audio
      if (stream.getAudioTracks().length === 0) {
        throw new Error("Aucune piste audio détectée dans le flux du microphone");
      }
      
      console.log("Flux audio obtenu avec succès:", {
        tracks: stream.getAudioTracks().length,
        track0: stream.getAudioTracks()[0]?.label || 'Piste sans nom'
      });
      
      // Configurer le MediaRecorder avec des options spécifiques pour un format compatible
      const options = { mimeType: 'audio/wav' };
      
      // Essayer les formats dans l'ordre de préférence pour l'API OpenAI Whisper
      let mediaRecorder: MediaRecorder;
      try {
        // Formats supportés par Whisper en ordre de préférence pour la compatibilité navigateur
        const preferredFormats = [
          'audio/webm',         // Bonne compatibilité avec Chrome
          'audio/wav',          // Compatible avec certains navigateurs
          'audio/mp3',          // Peut ne pas être supporté directement
          'audio/ogg;codecs=opus', // Bonne compatibilité avec Firefox
          'audio/mp4'           // Peut être supporté sur Safari
        ];
        
        // Chercher le premier format supporté
        let selectedFormat = '';
        for (const format of preferredFormats) {
          if (MediaRecorder.isTypeSupported(format)) {
            selectedFormat = format;
            break;
          }
        }
        
        if (selectedFormat) {
          mediaRecorder = new MediaRecorder(stream, { mimeType: selectedFormat });
          console.log(`Enregistrement audio au format ${selectedFormat}`);
        } else {
          // Fallback si aucun des formats préférés n'est supporté
          mediaRecorder = new MediaRecorder(stream);
          console.log('Enregistrement audio au format par défaut:', mediaRecorder.mimeType);
        }
      } catch (e) {
        console.warn('Format audio non supporté, utilisation du format par défaut');
        mediaRecorder = new MediaRecorder(stream);
        console.log('Format d\'enregistrement par défaut:', mediaRecorder.mimeType);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Configurer le visualiseur audio
      setupAudioVisualizer(stream);
      
      // Listener pour les données audio
      mediaRecorder.addEventListener('dataavailable', (event) => {
        console.log('Chunk audio reçu, taille:', event.data.size, 'type:', event.data.type);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      // Listener pour la fin de l'enregistrement
      mediaRecorder.addEventListener('stop', () => {
        console.log('Enregistrement terminé, nombre de chunks:', audioChunksRef.current.length);
        
        // Arrêter le timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // Arrêter le flux du microphone
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Vérifier si nous avons des données
        if (audioChunksRef.current.length === 0) {
          console.error('Aucune donnée audio capturée');
          setErrorMessage('Aucune donnée audio capturée');
          setRecorderState('error');
          
          toast({
            variant: "destructive",
            title: "Erreur d'enregistrement",
            description: "Aucune donnée audio n'a été capturée. Veuillez réessayer.",
          });
          return;
        }
        
        // Créer un blob audio à partir des chunks avec le même type MIME que le recorder
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/mp3';
        console.log('Création du blob audio avec le type MIME:', mimeType);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Taille du blob audio:', audioBlob.size);
        
        if (audioBlob.size === 0) {
          console.error('Blob audio vide');
          setErrorMessage('Blob audio vide');
          setRecorderState('error');
          
          toast({
            variant: "destructive",
            title: "Erreur d'enregistrement",
            description: "L'enregistrement audio est vide. Veuillez réessayer.",
          });
          return;
        }
        
        // Passer à l'état de traitement
        setRecorderState('processing');
        
        // Traiter l'audio pour transcription
        processAudioForTranscription(audioBlob);
      });
      
      // Démarrer l'enregistrement avec des timeslices pour obtenir des données régulièrement
      // Ce paramètre est crucial pour s'assurer que dataavailable est déclenché régulièrement
      mediaRecorder.start(1000); // Obtenir un chunk toutes les secondes
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
      <div className="tooltip-container relative group">
        {/* Bouton d'enregistrement */}
        <Button
          size="icon"
          variant={recorderState === 'recording' ? "destructive" : "outline"}
          disabled={disabled || recorderState === 'processing'}
          onClick={recorderState === 'recording' ? stopRecording : startRecording}
          aria-label={recorderState === 'recording' ? "Arrêter l'enregistrement" : "Enregistrer votre voix"}
          className="relative hover:bg-primary/10 hover:text-primary transition-colors"
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
        
        {/* Infobulle */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity w-max max-w-[200px] pointer-events-none">
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
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/10 dark:bg-white/10 rounded-md p-2 w-64 z-50 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-mono">{formatDuration(recordingDuration)}</span>
            <span className="text-xs text-center font-medium">Enregistrement en cours...</span>
            <span className="text-xs font-mono">{formatDuration(maxRecordingTimeMs)}</span>
          </div>
          <canvas 
            ref={canvasRef} 
            className="mx-auto rounded"
            style={{ 
              width: visualizerConfig.width, 
              height: visualizerConfig.height 
            }}
          />
          <div className="mt-1 flex justify-center">
            <Button
              size="sm"
              variant="destructive"
              onClick={stopRecording}
              className="px-2 py-1 h-8 text-xs"
            >
              <StopCircle className="h-3 w-3 mr-1" />
              Arrêter
            </Button>
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